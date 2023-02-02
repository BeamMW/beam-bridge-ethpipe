const ERC20Pipe = artifacts.require("ERC20Pipe");
const EthPipe = artifacts.require("EthPipe");

async function deployERC20Pipe(deployer, relayerAddress, ERC20TokenAddress, deployerAddress) {
  await deployer.deploy(ERC20Pipe, ERC20TokenAddress, relayerAddress, {gas: 535000, from: deployerAddress});
  const pipeInstance = await ERC20Pipe.deployed();

  console.log('relayer addess: ', relayerAddress);
  console.log('ERC20Token address: ', ERC20TokenAddress);
  console.log('Pipe address: ', pipeInstance.address);
}

async function deployPipe(deployer, relayerAddress, deployerAddress) {
  await deployer.deploy(EthPipe, relayerAddress, {gas: 370000, from: deployerAddress});
  const pipeInstance = await EthPipe.deployed();

  console.log('relayer addess: ', relayerAddress);
  console.log('pipe address: ', pipeInstance.address);
}

module.exports = async function (deployer, network, accounts) { 
  let relayerAddress = null;

  if ('relayer_account_index' in config.deploy_config && config.deploy_config.relayer_account_index != null) {
    let accountIndex = Number(config.deploy_config.relayer_account_index);
    if (!Number.isInteger(accountIndex) || accountIndex < 0) {
      throw Error("Unexpected relayer_account_index!");
    }
    console.log('Used relayer_account_index = ' + accountIndex);
    relayerAddress = accounts[accountIndex]
  } else if ('relayer_account_address' in config.deploy_config && config.deploy_config.relayer_account_address != null) {
    if (!web3.utils.isAddress(config.deploy_config.relayer_account_address)) {
      throw Error("Invalid relayer_account_address token address!");
    }
    console.log('Used relayer_account_address = ' + config.deploy_config.relayer_account_address);
    relayerAddress = config.deploy_config.relayer_account_address;
  } else {
    throw Error("Please provide RELAYER_ACCOUNT_INDEX or RELAYER_ACCOUNT_ADDRESS")
  }

  if (('ERC20_token_address' in config.deploy_config) && config.deploy_config.ERC20_token_address) {
    if (!web3.utils.isAddress(config.deploy_config.ERC20_token_address)) {
      throw Error("Invalid ERC20 token address!");
    }
    await deployERC20Pipe(deployer, relayerAddress, config.deploy_config.ERC20_token_address, accounts[0]);
  } else {
    await deployPipe(deployer, relayerAddress, accounts[0]);
  }
};
