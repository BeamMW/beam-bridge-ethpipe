const TestToken = artifacts.require("TestToken")
const Pipe = artifacts.require("Pipe");

module.exports = async function (deployer) {
  const beamPipeUserCid = "0xc86ba121b745a4200e067a782cbc5d7bce576d0e57512e030094ef09bdafe087";
  const supply = BigInt(200000000000000000000);

  await deployer.deploy(TestToken, supply);

  const testTokenInstance = await TestToken.deployed();

  await deployer.deploy(Pipe, testTokenInstance.address, beamPipeUserCid);
};
