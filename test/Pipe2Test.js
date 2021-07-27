const Pipe = artifacts.require('../contracts/Pipe.sol');
const PipeUser = artifacts.require('../contracts/PipeUser.sol');
const TestToken = artifacts.require('../contracts/TestToken.sol');

contract('Pipe2', function(accounts) {
    let testToken;
    let pipeA;
    let pipeB;
    let userA;
    let userB;
    let supply = BigInt(200000000000000000000); // 100 TEST coins
    let toContract = BigInt(100000000000000000000); // 100 TEST coins

    beforeEach(async () => {
        testToken = await TestToken.new(supply);
        
        pipeA = await Pipe.new();
        pipeB = await Pipe.new();
        userA = await PipeUser.new(pipeA.address, testToken.address);
        userB = await PipeUser.new(pipeB.address, testToken.address);

        await testToken.transfer(userB.address, toContract);
    })

    // TODO: fix ?
    // it('two pipe', async() => {
    //     let receiver = accounts[1];
    //     let value = 5000;

    //     await testToken.approve(userA.address, value);
    //     await userA.sendFunds(receiver, value);

    //     let msg = await pipeA.getLocalMessageToSend();

    //     /*console.log('r', msg.receiver);
    //     console.log('v', msg.value);*/

    //     let r = msg.receiver;
    //     let v = msg.value;

    //     await pipeB.pushRemoteMessage(r, v);
    //     await pipeB.validateRemoteMessage(r);
    //     await userB.receiveFunds(r);

    //     let receiverBalance = await testToken.balanceOf(receiver);

    //     console.log('balance = ', receiverBalance.toString());
    // })
})