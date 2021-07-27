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

    function receiveFunds(uint msgId)
        public
    {
        bytes memory value = Pipe(m_pipeAddress).getRemoteMessage(msgId);

        // parse msg: [address][uint64 value]
        address receiver;
        bytes8 tmp;
        assembly {
            receiver := shr(96, mload(add(value, 32)))
            tmp := mload(add(value, 52))
        }
        uint64 amount = BeamUtils.reverse64(uint64(tmp));

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
}