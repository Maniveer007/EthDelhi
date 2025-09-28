// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./DelegationStorage.sol";

contract DelegationContract is ReentrancyGuard {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;
    uint public gasUsed;
    uint public gasPriceWei;

    DelegationStorage public storageContract;

    struct Call {
        bytes data;
        address to;
        uint256 value;
    }

    error InvalidSigner();
    error InsufficientETHBalance();
    error ExternalCallFailed();

    event info(address indexed, uint indexed gas,uint indexed price,uint);

    constructor(address storageAddress) {
        storageContract = DelegationStorage(payable(storageAddress));
    }

    function execute(
        Call memory userCall,
        address sponsor,
        uint256 nonce,
        bytes calldata signature
    ) external payable nonReentrant {

        // Verify signature
        bytes32 digest = keccak256(
            abi.encodePacked(
                block.chainid,
                userCall.to,
                userCall.value,
                keccak256(userCall.data),
                sponsor,
                nonce
            )
        );

        address recovered = digest.toEthSignedMessageHash().recover(signature);
        // if (recovered != address(this)) revert InvalidSigner();


        // Check contract balance
        // if (address(this).balance < userCall.value) revert InsufficientETHBalance();

        (bool success,) = userCall.to.call{value: userCall.value}(userCall.data);
        if (!success) revert ExternalCallFailed();

        // Refund sponsor
        if (msg.value > 0) {
            (bool refunded,) = msg.sender.call{value: msg.value}("");
            require(refunded, "Refund failed");
        }

}

    function userGasAmountInUSD(address user) public view returns (uint256) {
        return storageContract.userGasAmountInUSD(user);
    }

    receive() external payable {}
}




