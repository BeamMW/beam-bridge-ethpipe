const TestToken = artifacts.require("TestToken")
const Pipe = artifacts.require("Pipe");
const EthPipe = artifacts.require("EthPipe");

async function deployPipeWithToken(deployer, options) {
  const supply = 2000000n * (10n ** BigInt(options.decimals));
  await deployer.deploy(TestToken, supply, options.decimals, options.tokenName, options.tokenSymbol);

  const tokenInstance = await TestToken.deployed();

  await deployer.deploy(Pipe, tokenInstance.address, options.relayerAddress);

  const pipeInstance = await Pipe.deployed();

  console.log(options.tokenName,' address: ', tokenInstance.address);
  console.log(options.tokenName, ' pipe address: ', pipeInstance.address);
}

async function deployPipe(deployer, relayerAddress) {
  await deployer.deploy(EthPipe, relayerAddress);

  const pipeInstance = await EthPipe.deployed();

  console.log('pipe address: ', pipeInstance.address);
}

module.exports = async function (deployer, network, accounts) {
  await deployPipeWithToken(deployer, {
    relayerAddress: accounts[0],
    decimals: 6,
    tokenName: 'USDT',
    tokenSymbol: 'USDT',
  });

  await deployPipeWithToken(deployer, {
    relayerAddress: accounts[1],
    decimals: 18,
    tokenName: 'DAI',
    tokenSymbol: 'DAI',
  });

  await deployPipeWithToken(deployer, {
    relayerAddress: accounts[2],
    decimals: 8,
    tokenName: 'WBTC',
    tokenSymbol: 'WBTC',
  });

  await deployPipe(deployer, accounts[3]);
};
