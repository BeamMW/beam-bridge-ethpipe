// SPDX-License-Identifier: MIT
pragma solidity ^0.7.2;

import "./BeamHeader.sol";
import "./BeamUtils.sol";

contract Pipe {
    // config:
    // remote cfg:
    // uint32 packageMaxMsgs;
    // uint64 packageMaxDiffHeightToClose;
    // local cfg:
    // bytes32 rulesRemote; // ?
    // uint256 comissionPerMsg;
    // uint256 stakeForRemoteMsg;
    // uint64  disputePeriod;
    // uint64  contenderWaitPeriod;

    // incoming messages
    struct RemoteMessage {
        // header:
        uint32 msgId;
        // eth contract address 
        address msgContractReceiver;
        // beam contract id
        bytes32 msgContractSender;

        // body
        bytes value;
        bool validated;
    }

    bytes32 m_remotePipeId;
    mapping (bytes32 => RemoteMessage) m_remoteMessages;
    uint32 m_localMsgCounter;

    // LocalMessage {
    //     // header:
    //     uint32 msgId;
    //     address msgContractSender; // eth contract address
    //     bytes32 msgContractReceiver; // beam contract id

    //     // msg body
    //     uint64 value;
    //     bytes receiver; // beam pubKey - 33 bytes
    // }
    event NewLocalMessage(uint32 msgId, address msgContractSender, bytes32 msgContractReceiver, bytes msgBody);

    function setRemote(bytes32 remoteContractId)
        public
    {
        m_remotePipeId = remoteContractId;
    }

    function getMsgKey(uint msgId)
        private
        pure
        returns (bytes32 key)
    {
        key = keccak256(abi.encodePacked(uint32(msgId)));
    }

    // TODO: add support multiple msgs
    function pushRemoteMessage(uint msgId,
                               bytes32 msgContractSender,       // beam contract id
                               address msgContractReceiver,     // eth contract address
                               bytes memory messageBody)
        public
    {
        bytes32 key = getMsgKey(msgId);

        require(m_remoteMessages[key].value.length == 0, "message is exist");

        m_remoteMessages[key].msgId = uint32(msgId);
        m_remoteMessages[key].msgContractReceiver = msgContractReceiver;
        m_remoteMessages[key].msgContractSender = msgContractSender;
        m_remoteMessages[key].value = messageBody;
        m_remoteMessages[key].validated = false;
    }

    function getBeamVariableKey(uint msgId)
        private
        view
        returns (bytes memory)
    {
        // [contract_id,KeyTag::Internal(uint8 0),KeyType::OutCheckpoint(uint8 2),index_BE(uint32 'packageId')]
        return abi.encodePacked(m_remotePipeId, uint8(0), uint8(2), uint32(msgId));
    }

    function getMsgHash(bytes32 previousHash, RemoteMessage memory message)
        private
        pure
        returns (bytes32)
    {
        return sha256(abi.encodePacked("b.msg\x00",
                      previousHash,
                      // full msg size
                      BeamUtils.encodeUint(20 + message.msgContractSender.length + message.value.length),
                      // msgHdr: sender/receiver
                      message.msgContractSender,
                      message.msgContractReceiver,
                      // msg body
                      message.value));
    }

    function validateRemoteMessage(uint msgId, 
                                   // params of block
                                   bytes32 prev,
                                   bytes32 chainWork,
                                   bytes32 kernels,
                                   bytes32 definition,
                                   uint64 height,
                                   uint64 timestamp,
                                   bytes memory pow,
                                   bytes32 rulesHash,
                                   bytes memory proof)
        public
    {
        bytes32 key = getMsgKey(msgId);
        require(!m_remoteMessages[key].validated, "already verified.");
        
        // validate block header & proof of msg
        // TODO: uncomment when stop using FakePow
        // require(BeamHeader.isValid(prev, chainWork, kernels, definition, height, timestamp, pow, rulesHash), 'invalid header.');

        bytes memory variableKey = getBeamVariableKey(msgId);
        bytes memory ecodedMsg = abi.encodePacked(m_remoteMessages[key].msgContractSender, m_remoteMessages[key].msgContractReceiver, m_remoteMessages[key].value);
        bytes32 variableHash = BeamUtils.getContractVariableHash(variableKey, ecodedMsg);
        bytes32 rootHash = BeamUtils.interpretMerkleProof(variableHash, proof);

        require(rootHash == definition, "invalid proof");
        m_remoteMessages[key].validated = true;
    }

    function getRemoteMessage(uint msgId)
        public
        returns (bytes memory)
    {
        bytes32 key = getMsgKey(msgId);
        require(m_remoteMessages[key].validated, "message should be validated");

        RemoteMessage memory tmp = m_remoteMessages[key];

        delete m_remoteMessages[key];

        return tmp.value;
    }

    function pushLocalMessage(bytes32 contractReceiver, bytes memory msgBody)
        public
    {
        // TODO: pckgId
        emit NewLocalMessage(m_localMsgCounter++, msg.sender, contractReceiver, msgBody);
    }
}