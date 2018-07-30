const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

const compiledFactory = require('../ethereum/build/CampaignFactory.json');
const compiledCampaign = require('../ethereum/build/Campaign.json');

let accounts;
let factory;
let compaignAddress;
let campaign;

beforeEach(async () =>  {
    accounts = await web3.eth.getAccounts();
    factory = await new web3.eth.Contract(JSON.parse(compiledFactory.interface))
        .deploy({data:compiledFactory.bytecode})
        .send({from: accounts[0], gas: 1000000});

    await factory.methods.createCampaign('1000000').send({
        from: accounts[0],
        gas: '1000000'
    });

    [campaignAddress] = await factory.methods.getDeployedCampaigns().call();

    campaign = await new web3.eth.Contract(
                        JSON.parse(compiledCampaign.interface),
                        campaignAddress
    );
});

describe('Campaigns', () =>{
    it('deploys a factory and a campaign', ()=>{
        assert.ok(campaign.options.address);
        assert.ok(factory.options.address);
    });

    it('marks the caller as the manager for the created campaign', async ()=>{
        const manager = await campaign.methods.manager().call();
        assert.equal(manager, accounts[0]);

    });
    it('allows users to contribute and adds them as approvers', async ()=>{
        await campaign.methods.contribute().send({
            value: '2000000',
            from: accounts[1]
        });
        assert.ok(campaign.methods.approvers(accounts[1]).call());
    });
    it('requires a minimum contribution', async ()=>{
        try{
            await campaign.methods.contribute().send({
                value: '100',
                from: accounts[1]
            });
            assert(false);
        } catch(err){
            assert(err);
        }
    });
    it('allows manager to create a payment request', async () =>{
        await campaign.methods
        .createRequest("Pay for DApp development", '3000000', accounts[3])
        .send({
            from: accounts[0],
            gas: '1000000'
        });
        const request = await campaign.methods.requests(0).call();
        assert.equal('Pay for DApp development',request.description);
    });
    it('processes requests', async ()=>{

        let i=0;let Balance=0;
        console.log("\nAfter:\n");
        for(i=0;i<4;i++)    {
            Balance = await web3.eth.getBalance(accounts[i]);
            console.log("Player " + (i+1) + ": " + accounts[i] + " Balance: " + Balance);
        }

        await campaign.methods.contribute().send({
            from: accounts[0],
            value: web3.utils.toWei('5','ether') 
        });

        await campaign.methods
        .createRequest("Pay for DApp development", web3.utils.toWei('5', 'ether'), accounts[3])
        .send({
            from: accounts[0],
            gas: '1000000'
        });

        await campaign.methods.approveRequest(0).send({
            from: accounts[0],
            gas: '1000000'
        });

        await campaign.methods.finaliseRequest(0).send({
            from: accounts[0],
            gas: '1000000'
        });
        i=0;Balance=0;
        console.log("\nAfter:\n");
        for(i=0;i<4;i++)    {
            Balance = await web3.eth.getBalance(accounts[i]);
            console.log("Player " + (i+1) + ": " + accounts[i] + " Balance: " + Balance);
        }
        Balance = await web3.eth.getBalance(accounts[3]);
        
        assert(Balance > 104500000000000000000);
    });

});