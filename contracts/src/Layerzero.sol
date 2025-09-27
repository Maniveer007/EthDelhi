// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import { OApp, Origin, MessagingFee } from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";
import { OAppOptionsType3 } from "@layerzerolabs/oapp-evm/contracts/oapp/libs/OAppOptionsType3.sol";
import { OptionsBuilder } from "@layerzerolabs/oapp-evm/contracts/oapp/libs/OptionsBuilder.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract MyOApp is OApp, OAppOptionsType3 {
    using OptionsBuilder for bytes;
    string public lastMessage;

    uint16 public constant SEND = 1;

    constructor(address _endpoint, address _owner) OApp(_endpoint, _owner) Ownable(_owner) {}


    function quoteSendString(
        uint32 _dstEid,
        string calldata _string,
        bytes calldata _options,
        bool _payInLzToken
    ) public view returns (MessagingFee memory fee) {
        bytes memory _message = abi.encode(_string);
        fee = _quote(_dstEid, _message, combineOptions(_dstEid, SEND, _options), _payInLzToken);
    }


    function sendString(uint32 _dstEid, string calldata _string, bytes calldata _options) external payable {
        bytes memory _message = abi.encode(_string);

       
        _lzSend(
            _dstEid,
            _message,
            combineOptions(_dstEid, SEND, _options),
            MessagingFee(msg.value, 0),
            payable(msg.sender)
        );
    }

    function getOptions() public pure returns (bytes memory options) {
        options = OptionsBuilder.newOptions().addExecutorLzReceiveOption(200000, 0);
    }



    function _lzReceive(
        Origin calldata /*_origin*/,
        bytes32 /*_guid*/,
        bytes calldata _message,
        address /*_executor*/,
        bytes calldata /*_extraData*/
    ) internal override {

        string memory _string = abi.decode(_message, (string));

        lastMessage = _string;

    }
}



