const TestToken = artifacts.require("TestToken")
const Pipe = artifacts.require("Pipe");

module.exports = async function (deployer) {
  const relayerAddress = "0xf17f52151EbEF6C7334FAD080c5704D77216b732";
  const supply = BigInt(200000000000000); // 2'000'000 coins

  await deployer.deploy(TestToken, supply);

  const testTokenInstance = await TestToken.deployed();

  await deployer.deploy(Pipe, testTokenInstance.address, relayerAddress);
};
