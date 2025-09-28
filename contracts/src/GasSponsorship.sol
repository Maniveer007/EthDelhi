// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {AxelarExecutable} from "@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol";
import {IAxelarGateway} from "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol";
import {IAxelarGasService} from "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol";

import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
// import "@pythnetwork/pyth-crosschain/target_chains/ethereum/sdk/solidity/PythUtils.sol;
import "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";
import "@pythnetwork/pyth-sdk-solidity/PythErrors.sol";

contract GasSponsorshipAxelar is AxelarExecutable, ReentrancyGuard, Ownable {
    // ======= External services =======
    IAxelarGasService public immutable gasService;
    IPyth public pyth;

    // ======= Config =======
    // token => Pyth priceId
    mapping(address => bytes32) public tokenPriceFeeds;
    mapping(address => bool) public supportedTokens;
    mapping(address => uint8) public tokenDecimals;

    // ======= Events/Errors =======
    event TokenDeposited(address indexed user, address indexed token, uint256 amount, uint256 pyusdValue);
    event GasBalanceUpdated(address indexed user, uint256 newBalance);
    event TokenAdded(address indexed token, bytes32 priceId, uint8 decimals);

    error TokenNotSupported();
    error InvalidAmount();
    error TransferFailed();

    // The payload struct shared with the receiver
    struct GasBalanceUpdate {
        address user;
        uint256 IncreasedPYUSD;
    }

    constructor(
        address gateway_,
        address gasService_,
        address _pyth
    ) AxelarExecutable(gateway_) Ownable(msg.sender) {
        gasService = IAxelarGasService(gasService_);
        pyth = IPyth(_pyth);
    }

    // ======= Admin =======
    function addSupportedToken(address token, bytes32 priceId, uint8 decimals) external onlyOwner {
        supportedTokens[token] = true;
        tokenPriceFeeds[token] = priceId;
        tokenDecimals[token] = decimals;
        emit TokenAdded(token, priceId, decimals);
    }

    function removeSupportedToken(address token) external onlyOwner {
        supportedTokens[token] = false;
        delete tokenPriceFeeds[token];
        delete tokenDecimals[token];
    }

    // ======= User flow =======
    /**
     * @param token        ERC20 token to deposit (must be supported)
     * @param amount       Amount to deposit
     * @param destinationChain   Axelar chain name (e.g., "arbitrum", "ethereum", "polygon")
     * @param destinationAddress Destination contract address (Axelar receiver) as a string
     * @param priceUpdate  Pyth price update blobs (optional but recommended for freshness)
     * @dev    Send ETH with the tx to cover Axelar destination gas via gasService
     */
    function depositToken(
        address token,
        uint256 amount,
        string calldata destinationChain,
        string calldata destinationAddress,
        bytes[] calldata priceUpdate
    ) external payable nonReentrant {
        if (!supportedTokens[token]) revert TokenNotSupported();
        if (amount == 0) revert InvalidAmount();

        IERC20(token).transferFrom(msg.sender, address(this), amount);

        // 2) Optionally refresh Pyth prices (sender chain)
        uint256 fee = pyth.getUpdateFee(priceUpdate);
        pyth.updatePriceFeeds{value: fee}(priceUpdate);
        // Remaining msg.value (if any) is used for Axelar gas below

        // 3) Value in PYUSD (6 decimals)
        uint256 pyusdValue = getTokenValueInPYUSD(token, amount);
        emit TokenDeposited(msg.sender, token, amount, pyusdValue);

        // 4) Encode payload
        bytes memory payload = abi.encode(GasBalanceUpdate({
            user: msg.sender,
            IncreasedPYUSD: pyusdValue
        }));



        gasService.payNativeGasForContractCall{value: msg.value - fee}(
            address(this),
            destinationChain,
            destinationAddress,
            payload,
            msg.sender
        );

        

        // 6) Send the message
        gateway().callContract(destinationChain, destinationAddress, payload);
    }



    // ======= Helpers =======

    function getTokenValueInPYUSD(address token, uint256 amount) public view returns (uint256) {
        if (!supportedTokens[token]) revert TokenNotSupported();

        bytes32 priceId = tokenPriceFeeds[token];
        PythStructs.Price memory price = pyth.getPriceNoOlderThan(priceId, 300);

        // Use convertToUint to normalize price → 18 decimals
        uint256 normalizedPrice = convertToUint(price.price, price.expo, 6);

        // Compute value in 18 decimals using mulDiv for precision
        uint256 valueInUSD_6 = (amount * normalizedPrice) / (10 ** tokenDecimals[token]);

        // Convert from 18 decimals → 6 decimals (PYUSD standard)
        return valueInUSD_6;
    }

    function test(int64 price , int32 expo, uint8 targetDecimals, uint amount) public pure returns (uint256){
        uint256 normalizedPrice = convertToUint(price, expo, 6);

        // Compute value in 18 decimals using mulDiv for precision
        uint256 valueInUSD_6 = (amount * normalizedPrice) / (10 ** targetDecimals);

        // Convert from 18 decimals → 6 decimals (PYUSD standard)
        return valueInUSD_6;
    }

    

    function convertToUint(
        int64 price,
        int32 expo,
        uint8 targetDecimals
    ) public pure returns (uint256) {
        if (price < 0) {
            revert PythErrors.NegativeInputPrice();
        }
        if (expo < -255) {
            revert PythErrors.InvalidInputExpo();
        }

        // If targetDecimals is 6, we want to multiply the final price by 10 ** -6
        // So the delta exponent is targetDecimals + currentExpo
        int32 deltaExponent = int32(uint32(targetDecimals)) + expo;

        // Bounds check: prevent overflow/underflow with base 10 exponentiation
        // Calculation: 10 ** n <= (2 ** 256 - 63) - 1
        //              n <= log10((2 ** 193) - 1)
        //              n <= 58.2
        if (deltaExponent > 58 || deltaExponent < -58)
            revert PythErrors.ExponentOverflow();

        // We can safely cast the price to uint256 because the above condition will revert if the price is negative
        uint256 unsignedPrice = uint256(uint64(price));

        if (deltaExponent > 0) {
            (bool success, uint256 result) = Math.tryMul(
                unsignedPrice,
                10 ** uint32(deltaExponent)
            );
            // This condition is unreachable since we validated deltaExponent bounds above.
            // But keeping it here for safety.
            if (!success) {
                revert PythErrors.CombinedPriceOverflow();
            }
            return result;
        } else {
            (bool success, uint256 result) = Math.tryDiv(
                unsignedPrice,
                10 ** uint(abs(deltaExponent))
            );
            // This condition is unreachable since we validated deltaExponent bounds above.
            // But keeping it here for safety.
            if (!success) {
                revert PythErrors.CombinedPriceOverflow();
            }
            return result;
        }
    }


    function getPriceUpdateFee(bytes[] calldata priceUpdate) external view returns (uint256) {
        return pyth.getUpdateFee(priceUpdate);
    }

    function abs(int256 n) internal pure returns (uint256) {
        unchecked {
            // Formula from the "Bit Twiddling Hacks" by Sean Eron Anderson.
            // Since `n` is a signed integer, the generated bytecode will use the SAR opcode to perform the right shift,
            // taking advantage of the most significant (or "sign" bit) in two's complement representation.
            // This opcode adds new most significant bits set to the value of the previous most significant bit. As a result,
            // the mask will either be `bytes32(0)` (if n is positive) or `~bytes32(0)` (if n is negative).
            int256 mask = n >> 255;

            // A `bytes32(0)` mask leaves the input unchanged, while a `~bytes32(0)` mask complements it.
            return uint256((n + mask) ^ mask);
        }
    }

    // ======= Axelar receive (optional round-trip use) =======
    function _execute(
        bytes32 /*commandId*/,
        string calldata /*sourceChain*/,
        string calldata /*sourceAddress*/,
        bytes calldata /*payload*/
    ) internal override {
        // This sender contract doesn't need to receive messages.
        // Implement if you want a 2-way flow.
    }

    receive() external payable {}
}


