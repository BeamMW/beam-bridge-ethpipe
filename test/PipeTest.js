const Pipe = artifacts.require('../contracts/Pipe.sol');
const PipeUser = artifacts.require('../contracts/PipeUser.sol');
const BeamToken = artifacts.require('../contracts/BeamToken.sol');

contract('Pipe', function(accounts) {
    let beamToken;
    let pipeContract;
    let userContract;
    let supply = BigInt(100000000000); // 1000 TEST coins

    beforeEach(async () => {
        beamToken = await BeamToken.new(supply);
        
        pipeContract = await Pipe.new();
        let beamContractReceiver = Buffer.from('2427be2ac9e1b8dc1cb6b40949153818f7a8e8aeb49f453cf8e07d58e65b097b', 'hex');
        userContract = await PipeUser.new(pipeContract.address, beamToken.address, beamContractReceiver);

        await beamToken.transfer(userContract.address, supply);
    })

    it('stadard case', async() => {
        let receiver = accounts[1];
        let beamPipeContractId = Buffer.from('bd35a70a749cd0f63d1c059c30ffce82f18f4ee1b198b99f34b36f50ccff180a', 'hex');

        let msgId = 3;
        let msgContractSender = Buffer.from('2427be2ac9e1b8dc1cb6b40949153818f7a8e8aeb49f453cf8e07d58e65b097b', 'hex');
        let msgContractReceiver = '0x51815CEbeF59b88DAfD1a5f24095eee1236ffCDd';
        let messageBody = Buffer.from('f17f52151ebef6c7334fad080c5704d77216b732c800000000000000', 'hex')

        await pipeContract.setRemote(beamPipeContractId);

        await pipeContract.pushRemoteMessage(msgId, msgContractSender, msgContractReceiver, messageBody);

        const height = 27149;
        const prevHash = Buffer.from('2429b56535508c6a288edb1da064a6b2a3c76cca8517ce1edd1e590072ba73af', 'hex');
        const chainWork = Buffer.from('0000000000000000000037648ee867337896e820fabc3e01e6b2d537b492bf00', 'hex');
        const kernels = Buffer.from('7424608374b4bdd655529a925b9e5027a29d923d0d5c3829f2951ab3100a0d02', 'hex');
        const definition = Buffer.from('29a09f3433c4cbb8e129dbf04649ee18795eccc504e56032de21ab9d16e643ff', 'hex');
        const timestamp = 1625593741;
        const pow = Buffer.from('0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000fc787884592d7cd5aa252e8d', 'hex');
        const rulesHash = Buffer.from('ca54100d0112f2b3b6512836bdf7df848767b858bdec90b05fc3ca12e4f609c7', 'hex');

        const proof = Buffer.from('00d564f54e02ac4582dd995868eb918de6a2e3badc192ccca1b9f3b68f860b499f01d6fc5e8c51473dc0aa40b9e449c03e1b6afc05e1c17f524753950ed688375637005acb50379e1c9d161f7fdce2cb9b249bb18d5d7d301bbd1b7f93ea8fdf72e3c70140bf46ccea80826c4f2882791853d1c8e34c628700bd4c6a20f8fda22c340ce500d74db77a03ec21cbe28ab53714704690e4d19af56c49e1859e1bafdb724f827401f83d50b04f31c064178adbea2716d9be0fa6085cc1b5f532c98f6a7286afefdc00431b05c9277165defb464e39578797e682561a0ac79a7af99b2978b072b6e912006e10b6764a9383098b77cb81a377347f53af480d496a0fb82c106050429021320185bae0173296d9309ac923563aded5ec2745596c5c27eb1a16d04621650710fc0016f45c229601000d1d807a69ed60251f262cee4c131bb17a6682a3a94c0028e80085698587c37dfa6c5ac381bd85082c74b85d9275ee6b2858205d7f5b9133b292', 'hex');

        await pipeContract.validateRemoteMessage(msgId, prevHash, chainWork, kernels, definition, height, timestamp, pow, rulesHash, proof);
        await userContract.receiveFunds(msgId);

        let receiverBalance = await beamToken.balanceOf(receiver);

        console.log('balance = ', receiverBalance.toString());

        assert.equal(receiverBalance.toString(), 200, 'output mismatch');
    })

})