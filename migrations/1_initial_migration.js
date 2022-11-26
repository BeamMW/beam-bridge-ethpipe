const ERC20Pipe = artifacts.require("ERC20Pipe");
const EthPipe = artifacts.require("EthPipe");

async function deployERC20Pipe(deployer, relayerAddress, ERC20TokenAddress) {
  await deployer.deploy(ERC20Pipe, ERC20TokenAddress, relayerAddress);
  const pipeInstance = await ERC20Pipe.deployed();

  console.log('relayer addess: ', relayerAddress);
  console.log('ERC20Token address: ', ERC20TokenAddress);
  console.log('Pipe address: ', pipeInstance.address);
}

async function deployPipe(deployer, relayerAddress) {
  await deployer.deploy(EthPipe, relayerAddress);
  const pipeInstance = await EthPipe.deployed();

  console.log('relayer addess: ', relayerAddress);
  console.log('pipe address: ', pipeInstance.address);
}

module.exports = async function (deployer, network, accounts) {
  let accountIndex = Number(config.deploy_config.relayer_account_index);

  if (!Number.isInteger(accountIndex) || accountIndex < 0) {
    throw Error("Unexpected relayer_account_index!");
  }

  if (('ERC20_token_address' in config.deploy_config) && config.deploy_config.ERC20_token_address) {
    if (!web3.utils.isAddress(config.deploy_config.ERC20_token_address)) {
      throw Error("Invalid ERC20 token address!");
    }
    await deployERC20Pipe(deployer, accounts[accountIndex], config.deploy_config.ERC20_token_address);
  } else {
    await deployPipe(deployer, accounts[accountIndex]);
  }
};
