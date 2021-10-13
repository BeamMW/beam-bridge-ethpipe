const Pipe = artifacts.require('../contracts/Pipe.sol');
const TestToken = artifacts.require('../contracts/TestToken.sol');

contract('Pipe', function(accounts) {
    let testToken;
    let pipeContract;

    let supply = BigInt(100000000000); // 1000 TEST coins
    let relayerAddress = accounts[1];

    beforeEach(async () => {
        testToken = await TestToken.new(supply);
        pipeContract = await Pipe.new(testToken.address, relayerAddress);

        await testToken.transfer(accounts[0], supply);
    })

    it('should sendFunds properly', async() => {
        let amount = 1000000000;  // 10 coins
        let relayerFee = 100000000; // 1 coin
        let receiverBeamPubkey = '0x1d01bcc009f66575abedad75a50e4faa22755e01e93e4ebfe02ed14d86dbed2500';

        await testToken.approve(pipeContract.address, amount + relayerFee);
        await pipeContract.sendFunds(amount, relayerFee, receiverBeamPubkey);

        let pipeEndBalance = await testToken.balanceOf(pipeContract.address);

        console.log('balance = ', pipeEndBalance.toString());

        assert.equal(pipeEndBalance.toString(), amount + relayerFee, 'output mismatch');
    })

    it('should processRemoteMessage properly', async() => {
        let receiver = accounts[2];

        let receiverStartBalance = await testToken.balanceOf(receiver);
        assert.equal(receiverStartBalance.toString(), 0, 'unexpected balance of the receiver');

        // send some tokens to pipe
        let amount = 1000000000;  // 10 coins
        let relayerFee = 100000000; // 1 coin
        let receiverBeamPubkey = '0x1d01bcc009f66575abedad75a50e4faa22755e01e93e4ebfe02ed14d86dbed2500';
        await testToken.approve(pipeContract.address, amount + relayerFee);
        await pipeContract.sendFunds(amount, relayerFee, receiverBeamPubkey);
        let pipeBalance = await testToken.balanceOf(pipeContract.address);
        assert.equal(pipeBalance.toString(), amount + relayerFee, 'invalid balance of the pipe');

        // processRemoteMessage
        let msgId = 1;
        let amountOut = 800000000;  // 8 coins
        let relayerFeeOut = 100000000; // 1 coin

        await pipeContract.processRemoteMessage(msgId, relayerFeeOut, amountOut, receiver, {from: relayerAddress, value: 0});

        let receiverBalance = await testToken.balanceOf(receiver);
        assert.equal(receiverBalance.toString(), amountOut, 'incorrect balance of the receiver');

        let relayerBalance = await testToken.balanceOf(relayerAddress);
        assert.equal(relayerBalance.toString(), relayerFeeOut, 'incorrect balance of the relayer');

        // check pipe balance
        pipeBalance = await testToken.balanceOf(pipeContract.address);
        assert.equal(pipeBalance.toString(), amount + relayerFee - amountOut - relayerFeeOut, 'invalid balance of the pipe');
    })

    it('processRemoteMessage - should be called only by the relayer', async() => {
        let receiver = accounts[2];
        let msgId = 1;
        let amount = 800000000;  // 8 coins
        let relayerFee = 100000000; // 1 coin
        
        // send some tokens to pipe for the test
        await testToken.transfer(pipeContract.address, amount + relayerFee);

        try {
            await pipeContract.processRemoteMessage(msgId, relayerFee, amount, receiver);
        }
        catch (error) {
            assert(error.message.indexOf('Invalid msg sender.') >= 0);
        }

        await pipeContract.processRemoteMessage(msgId, relayerFee, amount, receiver, {from: relayerAddress, value: 0});
    })

    it('should not processRemoteMessage twice', async() => {
        let receiver = accounts[2];
        let msgId = 1;
        let amount = 800000000;  // 8 coins
        let relayerFee = 100000000; // 1 coin
        
        // send some tokens to pipe for the test
        await testToken.transfer(pipeContract.address, amount + relayerFee);

        await pipeContract.processRemoteMessage(msgId, relayerFee, amount, receiver, {from: relayerAddress, value: 0});

        try {
            await pipeContract.processRemoteMessage(msgId, relayerFee, amount, receiver, {from: relayerAddress, value: 0});
        }
        catch (error) {
            assert(error.message.indexOf('Msg already processed.') >= 0);
        }
    })
})