// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import { OAppSender, OAppCore, MessagingFee } from "@layerzerolabs/oapp-evm/contracts/oapp/OAppSender.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import { OAppOptionsType3 } from "@layerzerolabs/oapp-evm/contracts/oapp/libs/OAppOptionsType3.sol";
import { OptionsBuilder } from "@layerzerolabs/oapp-evm/contracts/oapp/libs/OptionsBuilder.sol";
import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";

contract GasSponcerShip is OAppSender, OAppOptionsType3, ReentrancyGuard {
    using OptionsBuilder for bytes;

    // ============ Storage ============
    IPyth public pyth;
    
    // Mapping from token address to Pyth price feed ID
    mapping(address => bytes32) public tokenPriceFeeds;
    
    // Supported tokens
    mapping(address => bool) public supportedTokens;
    
    // Token decimals mapping
    mapping(address => uint8) public tokenDecimals;

    uint16 public constant SEND = 1;

    // ============ Events ============
    event TokenDeposited(address indexed user, address indexed token, uint256 amount, uint256 pyusdValue);
    event GasBalanceUpdated(address indexed user, uint256 newBalance);
    event TokenAdded(address indexed token, bytes32 priceId, uint8 decimals);
    
    // ============ Errors ============
    error TokenNotSupported();
    error TransferFailed();
    error InsufficientBalance();
    error InvalidAmount();
    error InsufficientETHForCrossChain();

    // ============ Structs ============
    struct GasBalanceUpdate {
        address user;
        uint256 IncreasedPYUSD;
    }

    constructor(address _pythContract, address _endPoint) 
        Ownable(msg.sender) 
        OAppCore(_endPoint, msg.sender) 
    {
        pyth = IPyth(_pythContract);
    }

    // ============ Admin Functions ============
    
    /// @notice Add a supported token with its Pyth price feed ID
    /// @param token The token contract address
    /// @param priceId The Pyth price feed ID for this token
    /// @param decimals The token's decimal places
    function addSupportedToken(
        address token, 
        bytes32 priceId, 
        uint8 decimals
    ) external onlyOwner {
        supportedTokens[token] = true;
        tokenPriceFeeds[token] = priceId;
        tokenDecimals[token] = decimals;
        
        emit TokenAdded(token, priceId, decimals);
    }

    /// @notice Remove a supported token
    /// @param token The token contract address to remove
    function removeSupportedToken(address token) external onlyOwner {
        supportedTokens[token] = false;
        delete tokenPriceFeeds[token];
        delete tokenDecimals[token];
    }

    // ============ User Functions ============
    
    /// @notice Deposit tokens to sponsor gas fees and automatically update delegation contract
    /// @param token The token contract address
    /// @param amount The amount of tokens to deposit
    /// @param _dstEid Destination endpoint ID for the delegation contract
    function depositToken(
        address token, 
        uint256 amount, 
        bytes calldata options,
        bytes[] calldata priceUpdate,
        uint32 _dstEid
    ) external payable nonReentrant {
        if (!supportedTokens[token]) revert TokenNotSupported();
        if (amount == 0) revert InvalidAmount();
        

        
        // Transfer tokens from user to contract
        IERC20 tokenContract = IERC20(token);
        tokenContract.transferFrom(msg.sender, address(this), amount);

        
        // Get token price from Pyth (now with fresh price data)
        uint256 pyusdValue = getTokenValueInPYUSD(token, amount);
        
        
        emit TokenDeposited(msg.sender, token, amount, pyusdValue);

            GasBalanceUpdate memory update = GasBalanceUpdate({
                user: msg.sender,
                IncreasedPYUSD: pyusdValue
            });
            
            bytes memory message = abi.encode(update);
            
            // Use OptionsBuilder to set proper gas limits
            
            _lzSend(
                _dstEid,
                message,
                combineOptions(_dstEid, SEND, options),
                MessagingFee(msg.value, 0),
                payable(msg.sender)
            );
            
    }

    function testFunction(bytes calldata options, bytes[] calldata priceUpdate) public payable {
        setPeer(40161, bytes32(uint256(uint160(address(123)))));

        uint fee = pyth.getUpdateFee(priceUpdate);
        pyth.updatePriceFeeds{ value: fee }(priceUpdate);
    
        // Read the current price from a price feed if it is less than 60 seconds old.
        // Each price feed (e.g., ETH/USD) is identified by a price feed ID.
        // The complete list of feed IDs is available at https://docs.pyth.network/price-feeds/price-feeds
        bytes32 priceFeedId = 0xc1da1b73d7f01e7ddd54b3766cf7fcd644395ad14f70aa706ec5384c59e76692; // ETH/USD
        PythStructs.Price memory price = pyth.getPriceNoOlderThan(priceFeedId, 60);

        _lzSend(
                40161,
                "message",
                combineOptions(40161, SEND, options),
                MessagingFee(msg.value - fee, 0),
                payable(msg.sender)
            );
    }

    function updatePrize(bytes[] calldata priceUpdate) external payable {
        // Update Pyth price feeds
        uint fee = pyth.getUpdateFee(priceUpdate);
        pyth.updatePriceFeeds{ value: fee }(priceUpdate);
    }

    function testLZ(uint amount, uint32 _dstEid, bytes calldata options) external payable{
        GasBalanceUpdate memory update = GasBalanceUpdate({
                user: msg.sender,
                IncreasedPYUSD: amount
            });
            
            bytes memory message = abi.encode(update);
            
            // Use OptionsBuilder to set proper gas limits
            
            _lzSend(
                _dstEid,
                message,
                combineOptions(_dstEid, SEND, options),
                MessagingFee(msg.value, 0),
                payable(msg.sender)
            );
    }





    // ============ View Functions ============
    
    /// @notice Get the PYUSD equivalent value of a token amount using fresh price data
    /// @param token The token address
    /// @param amount The token amount
    /// @return The value in PYUSD (6 decimals)
    function getTokenValueInPYUSD(address token, uint256 amount) public view returns (uint256) {
        if (!supportedTokens[token]) revert TokenNotSupported();
        
        bytes32 priceId = tokenPriceFeeds[token];
        // Get price that is no older than 1 hr for Hackathon Demo
        PythStructs.Price memory price = pyth.getPriceUnsafe(priceId);
        
        // Get token decimals
        uint8 decimals = tokenDecimals[token];
        
        // Calculate scaling factor for price
        int32 expo = price.expo;
        uint256 priceScale;
        
        if (expo < 0) {
            // Price has negative exponent (e.g., -8)
            priceScale = 10 ** uint32(-expo);
        } else {
            // Price has positive exponent
            priceScale = 1;
            for (uint32 i = 0; i < uint32(expo); i++) {
                priceScale *= 10;
            }
        }
        
        // Convert token amount to 18 decimals for calculation
        uint256 normalizedAmount;
        if (decimals <= 18) {
            normalizedAmount = amount * (10 ** (18 - decimals));
        } else {
            normalizedAmount = amount / (10 ** (decimals - 18));
        }
        
        // Calculate value: (amount * price) / priceScale
        // Price is in USD, we want PYUSD (6 decimals)
        uint256 valueInUSD = (normalizedAmount * uint256(int256(price.price))) / priceScale;
        
        // Convert from 18 decimals to 6 decimals (PYUSD format)
        uint256 valueInPYUSD = valueInUSD / 1e12;
        
        return valueInPYUSD;
    }

    /// @notice Get price update fee for given price update data
    /// @param priceUpdate The price update data
    /// @return The required fee in wei
    function getPriceUpdateFee(bytes[] calldata priceUpdate) external view returns (uint256) {
        return pyth.getUpdateFee(priceUpdate);
    }

    function getOptions() public view returns(bytes memory ){
        return OptionsBuilder.newOptions().addExecutorLzReceiveOption(3000000, 0);

    }

    function quote(
        uint32 _dstEid,
        bytes calldata options
    ) external view returns (MessagingFee memory fee) {
        // Create a dummy update
        GasBalanceUpdate memory update = GasBalanceUpdate({
            user : address(0),
            IncreasedPYUSD : 0
        });
        bytes memory message = abi.encode(update);

        // Use the OAppSender internal _quote to calculate fees
        fee = _quote(
            _dstEid,
            message,
            combineOptions(_dstEid, SEND, options),
            false // payInZRO (false = pay in native token/ETH)
        );
    }



    /// @notice Receive ETH
    receive() external payable {}
}

