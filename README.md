# beam-bridge-ethpipe
Fill up the **.env** configuration, modify **truffle-config.js** if necessary

+ npx truffle --network mainnet deploy

An example of verification (code uploading) of a contract to Etherscan:
***.env must contains a valid ETHERSCAN_API_KEY***

+ npx truffle run verify EthPipe@0xB1d7FF9D3aCaf30e282c5F6eb1F2A6503f516a96 --network mainnet
+ npx truffle run verify ERC20Pipe@0x7C3Fe09E86b0d8661d261a49Bfa385536b7077f9 --network mainnet
