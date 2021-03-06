const HDWalletProvider = require('truffle-hdwallet-provider');
const Web3 = require('web3');
const path = require('path');
const fs = require('fs-extra');
const compiledFactory = require('./build/CampaignFactory.json');

//const {interface, bytecode} = require('./compile');

const provider = new HDWalletProvider(
    'pull vintage tag universe cancel oval inner program mule praise strike tooth',
    'https://rinkeby.infura.io/L8Yx8J89L13yZbFG30ey'
);

const web3 = new Web3(provider);

const deploy = async () =>    {
    
    //get list of accounts from web3 eth
    const accounts = await web3.eth.getAccounts();
    //
    console.log("\nAttempting to deploy with: \n" + accounts[0]);
    
    const result = await new web3.eth.Contract(JSON.parse(compiledFactory.interface))
        .deploy({data: '0x' + compiledFactory.bytecode})
        .send({gas: '1000000', from: accounts[0]});
    
    console.log("\nContract deployed to: \n" + result.options.address);

};

deploy();