// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {AxelarExecutable} from "@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol";
import {IAxelarGateway} from "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol";
import {IAxelarGasService} from "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol";

import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";

    struct GasBalanceUpdate {
        address user;
        uint256 IncreasedPYUSD;
    }

contract DelegationStorage is AxelarExecutable, Ownable {
    // ======= Storage =======
    mapping(uint256 => bool) public nonceUsed;
    mapping(address => uint256) public userGasAmountInUSD;
    address public payMaster;

    error NonceAlreadyUsed();
    error InsufficientGasBalance();

    // Optional: keep a simple allowlist for known senders (chain, address) if you want stricter security.
    mapping(bytes32 => bool) public approvedSenders; // keccak256(abi.encodePacked(chain, address))

    constructor(address gateway_, address _payMaster)
        AxelarExecutable(gateway_)
        Ownable(msg.sender)
    {
        payMaster = _payMaster; // 0x478645622A0371921184Bbe0267f4ECbA536fD8C
    }

    // ========= Admin (optional security) =========
    function setApprovedSender(string calldata chain, string calldata addr, bool approved) external onlyOwner {
        approvedSenders[keccak256(abi.encodePacked(chain, addr))] = approved;
    }

    // ========= Axelar receive hook =========
    // Newer Axelar SDK uses commandId as the first arg
    function _execute(
        bytes32 /*commandId*/,
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload
    ) internal override {
        // If you enable allowlisting:
        // if (approvedSenders[keccak256(abi.encodePacked(sourceChain, sourceAddress))] == false) {
        //     // If you don't want strict checks, comment the next line out.
        //     revert("unauthorized sender");
        // }

        GasBalanceUpdate memory update = abi.decode(payload, (GasBalanceUpdate));
        userGasAmountInUSD[update.user] += update.IncreasedPYUSD;
    }

    // ========= Helper Functions =========
    function markNonceUsed(uint256 nonce) external {
        if (nonceUsed[nonce]) revert NonceAlreadyUsed();
        nonceUsed[nonce] = true;
    }

    /// @notice Calculate gas cost in PYUSD and deduct from user
    function deductGas(address user, uint USDAMOUNT)  external {
        require(msg.sender == payMaster,"only PayMaster can Call");

        userGasAmountInUSD[user] -= USDAMOUNT;
    }

    function mockIncrease(address user, uint256 amount) external {
        userGasAmountInUSD[user] += amount;
    }

    function mockDecrease(address user, uint256 amount) external {
        userGasAmountInUSD[user] -= amount;
    }

    receive() external payable {}
}
