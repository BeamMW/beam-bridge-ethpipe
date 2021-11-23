const Pipe = artifacts.require('../contracts/Pipe.sol');
const TestToken = artifacts.require('../contracts/TestToken.sol');

contract('Pipe', function(accounts) {
    const decimals = 6;
    const oneCoin = Math.pow(10, decimals);
    const supply = 1000 * oneCoin; // 1000 TEST coins
    const relayerAddress = accounts[1];

    let testToken;
    let pipeContract;

    beforeEach(async () => {
        testToken = await TestToken.new(supply, decimals, "TestToken", "USDT");
        pipeContract = await Pipe.new(testToken.address, relayerAddress);

        await testToken.transfer(accounts[0], supply);
    })

    it('should sendFunds properly', async() => {
        const amount = 10 * oneCoin;  // 10 coins
        const relayerFee = oneCoin; // 1 coin
        const receiverBeamPubkey = '0x1d01bcc009f66575abedad75a50e4faa22755e01e93e4ebfe02ed14d86dbed2500';

        await testToken.approve(pipeContract.address, amount + relayerFee);
        await pipeContract.sendFunds(amount, relayerFee, receiverBeamPubkey);

        let pipeEndBalance = await testToken.balanceOf(pipeContract.address);

        console.log('balance = ', pipeEndBalance.toString());

        assert.equal(pipeEndBalance.toString(), amount + relayerFee, 'output mismatch');
    })

    it('should processRemoteMessage properly', async() => {
        const receiver = accounts[2];

        let receiverStartBalance = await testToken.balanceOf(receiver);
        assert.equal(receiverStartBalance.toString(), 0, 'unexpected balance of the receiver');

        // send some tokens to pipe
        const amount = 10 * oneCoin;  // 10 coins
        const relayerFee = oneCoin; // 1 coin
        const receiverBeamPubkey = '0x1d01bcc009f66575abedad75a50e4faa22755e01e93e4ebfe02ed14d86dbed2500';

        await testToken.approve(pipeContract.address, amount + relayerFee);
        await pipeContract.sendFunds(amount, relayerFee, receiverBeamPubkey);
        let pipeBalance = await testToken.balanceOf(pipeContract.address);
        assert.equal(pipeBalance.toString(), amount + relayerFee, 'invalid balance of the pipe');

        // processRemoteMessage
        const msgId = 1;
        const amountOut = 8 * oneCoin;  // 8 coins
        const relayerFeeOut = oneCoin; // 1 coin

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
        const receiver = accounts[2];
        const msgId = 1;
        const amount = 8 * oneCoin;  // 8 coins
        const relayerFee = oneCoin; // 1 coin
        
        // send some tokens to pipe for the test
        await testToken.transfer(pipeContract.address, amount + relayerFee);

        try {
            await pipeContract.processRemoteMessage(msgId, relayerFee, amount, receiver);

            assert(false, 'should be exception');
        }
        catch (error) {
        }

        await pipeContract.processRemoteMessage(msgId, relayerFee, amount, receiver, {from: relayerAddress, value: 0});
    })

    it('should not processRemoteMessage twice', async() => {
        const receiver = accounts[2];
        const msgId = 1;
        const amount = 8 * oneCoin;  // 8 coins
        const relayerFee = oneCoin; // 1 coin
        
        // send some tokens to pipe for the test
        await testToken.transfer(pipeContract.address, amount + relayerFee);

        await pipeContract.processRemoteMessage(msgId, relayerFee, amount, receiver, {from: relayerAddress, value: 0});

        try {
            await pipeContract.processRemoteMessage(msgId, relayerFee, amount, receiver, {from: relayerAddress, value: 0});

            assert(false, 'should be exception');
        }
        catch (error) {
        }
    })
})