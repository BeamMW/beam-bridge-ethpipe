/**
 * Use this file to configure your truffle project. It's seeded with some
 * common settings for different networks and features like migrations,
 * compilation and testing. Uncomment the ones you need or modify
 * them to suit your project as necessary.
 *
 * More information about configuration can be found at:
 *
 * trufflesuite.com/docs/advanced/configuration
 *
 * To deploy via Infura you'll need a wallet provider (like @truffle/hdwallet-provider)
 * to sign your transactions before they're sent to a remote public node. Infura accounts
 * are available for free at: infura.io/register.
 *
 * You'll also need a mnemonic - the twelve word phrase the wallet uses to generate
 * public/private key pairs. If you're publishing your code to GitHub make sure you load this
 * phrase from a file you've .gitignored so it doesn't accidentally become public.
 *
 */

 require('dotenv').config()
 const HDWalletProvider = require('@truffle/hdwallet-provider')
 
 module.exports = {
   /**
    * Networks define how you connect to your ethereum client and let you set the
    * defaults web3 uses to send transactions. If you don't specify one truffle
    * will spin up a development blockchain for you on port 9545 when you
    * run `develop` or `test`. You can ask a truffle command to use a specific
    * network from the command line, e.g
    *
    * $ truffle test --network <network-name>
    */
 
   networks: {
     development: {
       provider: () => new HDWalletProvider(process.env.MNEMONIC, 'http://localhost:8543/', 0, 6),
       network_id: '*'
     },
     kovan: {
       provider: () => new HDWalletProvider(process.env.MNEMONIC, 'https://kovan.infura.io/v3/0eebb147933542d5baad89258096fdd1'),
       network_id: '42'
     },
     ropsten: {
       provider: () => new HDWalletProvider(process.env.MNEMONIC, 'https://ropsten.infura.io/v3/' + process.env.INFURA_API_KEY),
       network_id: '3'
     }
   },
 
   // Set default mocha options here, use special reporters etc.
   mocha: {
     // timeout: 100000
   },
 
   // Configure your compilers
   compilers: {
     solc: {
       version: '0.7.2', // Fetch exact version from solc-bin (default: truffle's version)
       // docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
       settings: { // See the solidity docs for advice about optimization and evmVersion
         optimizer: {
           enabled: true,
           runs: 2000
         },
         evmVersion: 'petersburg'
       }
     }
   },

   plugins: [
    'truffle-plugin-verify'
  ],

  api_keys: {
    etherscan: process.env.ETHERSCAN_API_KEY
  }
 }
