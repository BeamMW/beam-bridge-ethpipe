// SPDX-License-Identifier: MIT
pragma solidity ^0.7.2;

import "./Pipe.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/utils/Address.sol";
import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

contract PipeUser {
    using SafeERC20 for IERC20;
    address m_pipeAddress;
    address m_tokenAddress;
    bytes32 m_beamPipeUserCid;

    constructor(address pipeAddress, address tokenAddress, bytes32 beamPipeUserCid)
    {
        m_pipeAddress = pipeAddress;
        m_tokenAddress = tokenAddress;
        m_beamPipeUserCid = beamPipeUserCid;
    }

    function parseRemoteMsgBody(bytes memory value)
        private
        pure
        returns (address receiver, uint64 amount)
    {
        // parse msg: [address][uint64 value]
        bytes8 tmp;
        assembly {
            receiver := shr(96, mload(add(value, 32)))
            tmp := mload(add(value, 52))
        }
        amount = BeamUtils.reverse64(uint64(tmp));
    }

    function receiveFunds(uint msgId)
        public
    {
        bytes memory value = Pipe(m_pipeAddress).getRemoteMessage(msgId);
        (address receiver, uint64 amount) = parseRemoteMsgBody(value);

        IERC20(m_tokenAddress).safeTransfer(receiver, amount);
    }

    function sendFunds(uint64 value, bytes memory receiverBeamPubkey)
        public
    {
        IERC20(m_tokenAddress).safeTransferFrom(msg.sender, address(this), value);

        Pipe(m_pipeAddress).pushLocalMessage(m_beamPipeUserCid, abi.encodePacked(receiverBeamPubkey, value));
    }

    function setRemote(bytes32 remoteContractId)
        public
    {
        m_beamPipeUserCid = remoteContractId;
    }

    function viewIncoming()
        public
        view
        returns (uint32[] memory, uint64[] memory)
    {
        bytes32[] memory keys = Pipe(m_pipeAddress).getRemoteMsgKeys();
        uint32[] memory msgIds = new uint32[](keys.length);
        uint64[] memory amounts = new uint64[](keys.length);
        uint j = 0;
        for (uint i = 0; i < keys.length; i++) {
            (uint32 msgId, bytes32 contractSender, bytes memory value) = Pipe(m_pipeAddress).getRemoteMsgByKey(keys[i]);
            if (contractSender == "" || contractSender != m_beamPipeUserCid) {
                continue;
            }
            
            (address receiver, uint64 amount) = parseRemoteMsgBody(value);
            if (msg.sender == receiver) {
                msgIds[j] = msgId;
                amounts[j++] = amount;
            }
        }

        return (msgIds, amounts);
    }
}