const EthPipe = artifacts.require('../contracts/EthPipe.sol');

contract('EthPipe', function(accounts) {
    let ethPipeContract;
    let relayerAddress = accounts[1];

    beforeEach(async () => {
        ethPipeContract = await EthPipe.new(relayerAddress);
    });

    it('should sendFunds properly', async() => {
        const amount = 1000000000;
        const relayerFee = 100000000;
        const total = amount + relayerFee;
        const receiverBeamPubkey = '0x1d01bcc009f66575abedad75a50e4faa22755e01e93e4ebfe02ed14d86dbed2500';

        await ethPipeContract.sendFunds(amount, relayerFee, receiverBeamPubkey, {from: accounts[0], value: total});

        const contractBalance = await web3.eth.getBalance(ethPipeContract.address);

        assert.equal(contractBalance, total, 'output mismatch');
    });

    it('should processRemoteMessage properly', async() => {
        let receiver = accounts[2];

        // send some coins to pipe
        const amount = 1000000000;
        const relayerFee = 100000000;
        const total = amount + relayerFee;
        const receiverBeamPubkey = '0x1d01bcc009f66575abedad75a50e4faa22755e01e93e4ebfe02ed14d86dbed2500';

        await ethPipeContract.sendFunds(amount, relayerFee, receiverBeamPubkey, {from: accounts[0], value: total});
        let pipeBalance = await web3.eth.getBalance(ethPipeContract.address);
        assert.equal(pipeBalance.toString(), total, 'invalid balance of the pipe');

        // processRemoteMessage
        const msgId = 1;
        const amountOut = 800000000;
        const relayerFeeOut = 100000000;
        const totalOut = amountOut + relayerFeeOut;

        let receiverStartBalance = await web3.eth.getBalance(receiver);
        //let startRelayerBalance = await web3.eth.getBalance(relayerAddress);

        await ethPipeContract.processRemoteMessage(msgId, relayerFeeOut, amountOut, receiver, {from: relayerAddress, value: 0});

        const receiverBalance = await web3.eth.getBalance(receiver);
        console.log('receiverBalance = ', receiverBalance);
        console.log('receiverStartBalance = ', receiverStartBalance);
        assert.equal((BigInt(receiverBalance) - BigInt(receiverStartBalance)).toString(), amountOut.toString(), 'incorrect balance of the receiver');

        // TODO roman.strilets need to investigate this case
        //let relayerBalance = await web3.eth.getBalance(relayerAddress);
        //assert.deepEqual(relayerBalance - startRelayerBalance, relayerFeeOut, 'incorrect balance of the relayer');

        // check pipe balance
        pipeBalance = await web3.eth.getBalance(ethPipeContract.address);
        assert.equal(pipeBalance.toString(), total - totalOut, 'invalid balance of the pipe');
    });

    it('processRemoteMessage - should be called only by the relayer', async() => {
        const receiver = accounts[2];
        const msgId = 1;
        const amount = 800000000;
        const relayerFee = 100000000;
        const total = amount + relayerFee;
        const receiverBeamPubkey = '0x1d01bcc009f66575abedad75a50e4faa22755e01e93e4ebfe02ed14d86dbed2500';
        
        // send some coins to pipe for the test
        await ethPipeContract.sendFunds(amount, relayerFee, receiverBeamPubkey, {from: accounts[0], value: total});

        try {
            await ethPipeContract.processRemoteMessage(msgId, relayerFee, amount, receiver);

            assert(false, 'should be exception');
        }
        catch (error) {
        }

        await ethPipeContract.processRemoteMessage(msgId, relayerFee, amount, receiver, {from: relayerAddress, value: 0});
    });

    it('should not processRemoteMessage twice', async() => {
        const receiver = accounts[2];
        const msgId = 1;
        const amount = 800000000;
        const relayerFee = 100000000;
        const total = amount + relayerFee;
        const receiverBeamPubkey = '0x1d01bcc009f66575abedad75a50e4faa22755e01e93e4ebfe02ed14d86dbed2500';
        
        // send some coins to pipe for the test
        await ethPipeContract.sendFunds(amount, relayerFee, receiverBeamPubkey, {from: accounts[0], value: total});

        await ethPipeContract.processRemoteMessage(msgId, relayerFee, amount, receiver, {from: relayerAddress, value: 0});

        try {
            await ethPipeContract.processRemoteMessage(msgId, relayerFee, amount, receiver, {from: relayerAddress, value: 0});

            assert(false, 'should be exception');
        }
        catch (error) {
        }
    });
});