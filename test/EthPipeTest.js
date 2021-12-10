const EthPipe = artifacts.require('../contracts/EthPipe.sol');

contract('EthPipe', function(accounts) {
    let ethPipeContract;
    let relayerAddress = accounts[1];

    beforeEach(async () => {
        ethPipeContract = await EthPipe.new(relayerAddress);
    });

    it('should sendFunds properly', async() => {
        const amount = BigInt(web3.utils.toWei('1', 'ether'));
        const relayerFee = BigInt(web3.utils.toWei('1', 'gwei'));
        const total = amount + relayerFee;
        const receiverBeamPubkey = '0x1d01bcc009f66575abedad75a50e4faa22755e01e93e4ebfe02ed14d86dbed2500';

        await ethPipeContract.sendFunds(amount.toString(), relayerFee.toString(), receiverBeamPubkey, {from: accounts[0], value: total.toString()});

        const contractBalance = await web3.eth.getBalance(ethPipeContract.address);

        assert.equal(contractBalance.toString(), total.toString(), 'output mismatch');
    });

    it('should processRemoteMessage properly', async() => {
        let receiver = accounts[2];

        // send some coins to pipe
        const amount = BigInt(web3.utils.toWei('1', 'ether'));
        const relayerFee = BigInt(web3.utils.toWei('1', 'gwei'));
        const total = amount + relayerFee;
        const receiverBeamPubkey = '0x1d01bcc009f66575abedad75a50e4faa22755e01e93e4ebfe02ed14d86dbed2500';

        await ethPipeContract.sendFunds(amount.toString(), relayerFee.toString(), receiverBeamPubkey, {from: accounts[0], value: total.toString()});
        let pipeBalance = await web3.eth.getBalance(ethPipeContract.address);
        assert.equal(pipeBalance.toString(), total.toString(), 'invalid balance of the pipe');

        // processRemoteMessage
        const msgId = 1;
        const amountOut = BigInt(web3.utils.toWei('1', 'ether'));
        const relayerFeeOut = BigInt(web3.utils.toWei('1', 'gwei'));
        const totalOut = amountOut + relayerFeeOut;

        let receiverStartBalance = await web3.eth.getBalance(receiver);
        //let startRelayerBalance = await web3.eth.getBalance(relayerAddress);

        await ethPipeContract.processRemoteMessage(msgId, relayerFeeOut.toString(), amountOut.toString(), receiver, {from: relayerAddress, value: 0});

        const receiverBalance = await web3.eth.getBalance(receiver);
        assert.equal((BigInt(receiverBalance) - BigInt(receiverStartBalance)).toString(), amountOut.toString(), 'incorrect balance of the receiver');

        // TODO roman.strilets need to investigate this case
        //let relayerBalance = await web3.eth.getBalance(relayerAddress);
        //assert.deepEqual(relayerBalance - startRelayerBalance, relayerFeeOut, 'incorrect balance of the relayer');

        // check pipe balance
        pipeBalance = await web3.eth.getBalance(ethPipeContract.address);
        assert.equal(pipeBalance.toString(), (total - totalOut).toString(), 'invalid balance of the pipe');
    });

    it('processRemoteMessage - should be called only by the relayer', async() => {
        const receiver = accounts[2];
        const msgId = 1;
        const amount = BigInt(web3.utils.toWei('1', 'ether'));
        const relayerFee = BigInt(web3.utils.toWei('1', 'gwei'));
        const total = amount + relayerFee;
        const receiverBeamPubkey = '0x1d01bcc009f66575abedad75a50e4faa22755e01e93e4ebfe02ed14d86dbed2500';
        
        // send some coins to pipe for the test
        await ethPipeContract.sendFunds(amount.toString(), relayerFee.toString(), receiverBeamPubkey, {from: accounts[0], value: total.toString()});

        try {
            await ethPipeContract.processRemoteMessage(msgId, relayerFee.toString(), amount.toString(), receiver);

            assert(false, 'should be exception');
        }
        catch (error) {
        }

        await ethPipeContract.processRemoteMessage(msgId, relayerFee.toString(), amount.toString(), receiver, {from: relayerAddress, value: 0});
    });

    it('should not processRemoteMessage twice', async() => {
        const receiver = accounts[2];
        const msgId = 1;
        const amount = BigInt(web3.utils.toWei('1', 'ether'));
        const relayerFee = BigInt(web3.utils.toWei('1', 'gwei'));
        const total = amount + relayerFee;
        const receiverBeamPubkey = '0x1d01bcc009f66575abedad75a50e4faa22755e01e93e4ebfe02ed14d86dbed2500';
        
        // send some coins to pipe for the test
        await ethPipeContract.sendFunds(amount.toString(), relayerFee.toString(), receiverBeamPubkey, {from: accounts[0], value: total.toString()});

        await ethPipeContract.processRemoteMessage(msgId, relayerFee.toString(), amount.toString(), receiver, {from: relayerAddress, value: 0});

        try {
            await ethPipeContract.processRemoteMessage(msgId, relayerFee.toString(), amount.toString(), receiver, {from: relayerAddress, value: 0});

            assert(false, 'should be exception');
        }
        catch (error) {
        }
    });

    it('should receive ETH', async() => {
        const value = BigInt(web3.utils.toWei('1', 'ether'));

        await ethPipeContract.sendTransaction({from: accounts[0], value: value.toString()});
        let pipeBalance = await web3.eth.getBalance(ethPipeContract.address);

        assert.equal(pipeBalance.toString(), value.toString(), 'invalid balance of the pipe');
    });
});