// SPDX-License-Identifier: MIT
pragma solidity ^0.7.2;

import "./Pipe.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/utils/Address.sol";
import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

contract DummyUser {
    using SafeERC20 for IERC20;
    address m_beamToken;

    event lockEvent(address sender, uint256 value, bytes pubKey);

    constructor(address beamToken) {
        m_beamToken = beamToken;
    }

    function lock(uint256 value, bytes memory pubKey) public {
        IERC20(m_beamToken).safeTransferFrom(msg.sender, address(this), value);

        emit lockEvent(msg.sender, value, pubKey);
    }
}