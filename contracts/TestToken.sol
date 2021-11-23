// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7.0;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20 {
    constructor(
        uint256 initialSupply, uint8 decimals,
        string memory tokenName, string memory tokenSymbol
        
    ) ERC20(tokenName, tokenSymbol) {
        _setupDecimals(decimals);
        _mint(msg.sender, initialSupply);
    }
}