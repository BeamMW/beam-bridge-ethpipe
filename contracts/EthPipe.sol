// SPDX-License-Identifier: MIT
pragma solidity ^0.7.2;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/utils/Address.sol";

contract EthPipe {
    using SafeMath for uint;

    uint32 m_localMsgCounter;
    address m_relayerAddress;

    mapping (uint64 => bool) m_processedRemoteMsgs;

    // LocalMessage {
    //     // header:
    //     uint32 msgId;
    //     uint64 relayerFee;

    //     // msg body
    //     uint64 amount;
    //     bytes receiver; // beam pubKey - 33 bytes
    // }
    event NewLocalMessage(uint64 msgId, uint64 amount, uint64 relayerFee, bytes receiver);

    constructor(address relayerAddress)
    {
        m_relayerAddress = relayerAddress;
    }

    // only for test. delete it!!!
    function setRelayer(address relayerAddress)
        public
    {
        m_relayerAddress = relayerAddress;
        // TODO: mb add event
    }

    function processRemoteMessage(uint64 msgId, uint64 relayerFee, uint64 amount, address receiver)
        public
    {
        require(msg.sender == m_relayerAddress, "Invalid msg sender.");
        require(!m_processedRemoteMsgs[msgId], "Msg already processed.");
        m_processedRemoteMsgs[msgId] = true;

        (bool success, ) = payable(m_relayerAddress).call{value: relayerFee * 10 gwei}("");
        require(success, "Transfer failed.");

        (success, ) = payable(receiver).call{value: amount * 10 gwei}("");
        require(success, "Transfer failed.");
    }

    function sendFunds(uint64 value, uint64 relayerFee, bytes memory receiverBeamPubkey)
        public
        payable
    {
        require(receiverBeamPubkey.length == 33, "unexpected size of the receiverBeamPubkey.");
        uint total = (value + relayerFee) * 10 gwei;
        require(msg.value == total, "Invalid sent fund");

        emit NewLocalMessage(m_localMsgCounter++, value, relayerFee, receiverBeamPubkey);
    }  
}