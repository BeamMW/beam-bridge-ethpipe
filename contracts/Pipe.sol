// SPDX-License-Identifier: MIT
pragma solidity ^0.7.2;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/utils/Address.sol";
import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

import "./BeamHeader.sol";
import "./BeamUtils.sol";

contract Pipe {
    using SafeERC20 for IERC20;
    // config:
    // uint256 comissionPerMsg;
    // uint256 stakeForRemoteMsg;
    // uint64  disputePeriod;
    // uint64  contenderWaitPeriod;

    // incoming messages
    struct RemoteMessage {
        bool finalized;
        // index in array m_remoteMsgsKeys
        uint32 index;
        // header:
        uint32 msgId;
        // body
        uint64 amount;
        address receiver;
    }

    uint32 m_localMsgCounter;
    address m_tokenAddress;
    bytes32 m_remotePipeCid;
    mapping (bytes32 => RemoteMessage) m_remoteMessages;
    bytes32[] m_remoteMsgsKeys;

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

    constructor(address tokenAddress, bytes32 remotePipeCid)
    {
        m_tokenAddress = tokenAddress;
        m_remotePipeCid = remotePipeCid;
    }

    // TODO: remove after testing
    function setRemote(bytes32 remotePipeCid)
        public
    {
        m_remotePipeCid = remotePipeCid;
    }

    function pushRemoteMessage(uint msgId,
                               bytes32 msgContractSender,       // beam contract id
                               address msgContractReceiver,     // eth contract address
                               bytes memory messageBody)
        public
    {
        bytes32 key = getRemoteMsgKey(msgId);

        require(m_remoteMessages[key].receiver == address(0), "message is exist");
        require(msgContractSender == m_remotePipeCid, "unsupported sender of the message");
        require(msgContractReceiver == address(this), "invalid receiver of the message");

        m_remoteMsgsKeys.push(key);

        m_remoteMessages[key].index = uint32(m_remoteMsgsKeys.length - 1);
        m_remoteMessages[key].msgId = uint32(msgId);
        (m_remoteMessages[key].receiver, m_remoteMessages[key].amount) = parseRemoteMsgBody(messageBody);
        m_remoteMessages[key].finalized = false;
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
        bytes32 key = getRemoteMsgKey(msgId);
        require(!m_remoteMessages[key].finalized, "already finalized.");
        
        // validate block header & proof of msg
        // TODO: uncomment when stop using FakePow
        // require(BeamHeader.isValid(prev, chainWork, kernels, definition, height, timestamp, pow, rulesHash), 'invalid header.');

        bytes memory variableKey = getBeamVariableKey(msgId);
        bytes memory ecodedMsg = abi.encodePacked(m_remotePipeCid, address(this), m_remoteMessages[key].receiver, m_remoteMessages[key].amount);
        bytes32 variableHash = BeamUtils.getContractVariableHash(variableKey, ecodedMsg);
        bytes32 rootHash = BeamUtils.interpretMerkleProof(variableHash, proof);

        require(rootHash == definition, "invalid proof");
        m_remoteMessages[key].finalized = true;
    }

    function finalyzeRemoteMessage(uint msgId)
        public
    {
        // TODO: dispute or time

        bytes32 key = getRemoteMsgKey(msgId);
        require(!m_remoteMessages[key].finalized, "already finalized.");
        m_remoteMessages[key].finalized = true;
    }

    function receiveFunds(uint msgId)
        public
    {
        bytes32 key = getRemoteMsgKey(msgId);
        require(m_remoteMessages[key].finalized, "message should be finalized");

        RemoteMessage memory tmp = m_remoteMessages[key];

        // delete from keys
        if (tmp.index != m_remoteMsgsKeys.length - 1) {
            bytes32 lastKey = m_remoteMsgsKeys[m_remoteMsgsKeys.length - 1];
            m_remoteMsgsKeys[tmp.index] = lastKey;
            m_remoteMessages[lastKey].index = tmp.index;
        }
        delete m_remoteMessages[key];
        m_remoteMsgsKeys.pop();

        IERC20(m_tokenAddress).safeTransfer(tmp.receiver, tmp.amount);
    }

    function sendFunds(uint64 value, bytes memory receiverBeamPubkey)
        public
    {
        IERC20(m_tokenAddress).safeTransferFrom(msg.sender, address(this), value);

        emit NewLocalMessage(m_localMsgCounter++, address(this), m_remotePipeCid, abi.encodePacked(receiverBeamPubkey, value));
    }

    function viewIncoming()
        public
        view
        returns (uint32[] memory, uint64[] memory)
    {
        uint32[] memory msgIds = new uint32[](m_remoteMsgsKeys.length);
        uint64[] memory amounts = new uint64[](m_remoteMsgsKeys.length);
        uint j = 0;
        for (uint i = 0; i < m_remoteMsgsKeys.length; i++) {
            RemoteMessage memory tmp = m_remoteMessages[m_remoteMsgsKeys[i]];

            if (tmp.receiver != address(0) && tmp.finalized && msg.sender == tmp.receiver) {
                msgIds[j] = tmp.msgId;
                amounts[j++] = tmp.amount;
            }
        }

        return (msgIds, amounts);
    }

    function getRemoteMsgKey(uint msgId)
        private
        pure
        returns (bytes32 key)
    {
        key = keccak256(abi.encodePacked(uint32(msgId)));
    }

    function parseRemoteMsgBody(bytes memory value)
        private
        pure
        returns (address receiver, uint64 amount)
    {
        require(value.length == 28, "unexpected size of the MsgBody.");
        // parse msg: [address][uint64 value]
        bytes8 tmp;
        assembly {
            receiver := shr(96, mload(add(value, 32)))
            tmp := mload(add(value, 52))
        }
        amount = BeamUtils.reverse64(uint64(tmp));
    }

    function getBeamVariableKey(uint msgId)
        private
        view
        returns (bytes memory)
    {
        // [contract_id,KeyTag::Internal(uint8 0),KeyType::OutCheckpoint(uint8 2),index_BE(uint32 'packageId')]
        return abi.encodePacked(m_remotePipeCid, uint8(0), uint8(2), uint32(msgId));
    }   
}