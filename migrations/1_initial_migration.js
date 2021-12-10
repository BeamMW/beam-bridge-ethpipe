const TestToken = artifacts.require("TestToken")
const ERC20Pipe = artifacts.require("ERC20Pipe");
const EthPipe = artifacts.require("EthPipe");

async function deployERC20PipeWithToken(deployer, options) {
  const supply = 2000000n * (10n ** BigInt(options.decimals));
  await deployer.deploy(TestToken, supply, options.decimals, options.tokenName, options.tokenSymbol);

  const tokenInstance = await TestToken.deployed();

  await deployer.deploy(ERC20Pipe, tokenInstance.address, options.relayerAddress);

  const pipeInstance = await ERC20Pipe.deployed();

  console.log('relayer addess: ', options.relayerAddress);
  console.log(options.tokenName,' address: ', tokenInstance.address);
  console.log(options.tokenName, ' pipe address: ', pipeInstance.address);
}

async function deployPipe(deployer, relayerAddress) {
  await deployer.deploy(EthPipe, relayerAddress);

  const pipeInstance = await EthPipe.deployed();

  console.log('relayer addess: ', relayerAddress);
  console.log('pipe address: ', pipeInstance.address);
}

module.exports = async function (deployer, network, accounts) {
  await deployERC20PipeWithToken(deployer, {
    relayerAddress: accounts[2],
    decimals: 6,
    tokenName: 'USDT',
    tokenSymbol: 'USDT',
  });

  await deployERC20PipeWithToken(deployer, {
    relayerAddress: accounts[3],
    decimals: 18,
    tokenName: 'DAI',
    tokenSymbol: 'DAI',
  });

  await deployERC20PipeWithToken(deployer, {
    relayerAddress: accounts[4],
    decimals: 8,
    tokenName: 'WBTC',
    tokenSymbol: 'WBTC',
  });

  await deployPipe(deployer, accounts[5]);
};
