import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-ethers";
import "hardhat-deploy";
import "hardhat-gas-reporter";
import "./typechain.config";
require("dotenv").config();
require('@nomiclabs/hardhat-etherscan');

const settings = {
  optimizer: {
    enabled: true,
    runs: 200,
  },
};

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.13",
        settings,
      },
    ],
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },
  networks: {
    hardhat: {},
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    sepolia: {
      url: process.env.SEPOLIA_NODE,
      accounts: [process.env.PK || ""],
      gasPrice: 20000000000,
    },
    goerli: {
        url: process.env.GOERLI_NODE,
        accounts: [process.env.PK || ""],
        gasPrice: 200000000000,
    },
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
    // gasPrice: 100,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_TOKEN,
  }
};

export default config;
