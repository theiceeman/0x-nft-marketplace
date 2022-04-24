const { utils } = require("ethers");

require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("./tasks/PrintAccounts");
require("dotenv").config();

const PRV_KEY = process.env.PRV_KEY;
/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {},
    localhost: {
      url: `http://localhost:8545`,
      timeout: 150000,
      blockGasLimit: 9999999999999,
      gasPrice: parseInt(utils.parseUnits("132", "gwei")),
    },
    ropsten: {
      url: "https://speedy-nodes-nyc.moralis.io/6b34ee31fa58ed696d5d50f8/eth/ropsten",
      accounts: [PRV_KEY]
    }
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    // apiKey: BSCSCAN_API_KEY,
  },
  solidity: {
    compilers: [
      {
        version: "0.8.0",
      },
      {
        version: "0.8.1",
      },
    ],
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  mocha: {
    timeout: 150000,
  },
  blockGasLimit:12450000,
};
