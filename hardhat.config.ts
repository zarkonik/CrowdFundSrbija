import { defineConfig } from "hardhat/config";
import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { configVariable } from "hardhat/config";

export default defineConfig({
  plugins: [hardhatToolboxMochaEthers],
  solidity: {
    profiles: {
      default: { version: "0.8.28" },
      production: {
        version: "0.8.28",
        settings: { optimizer: { enabled: true, runs: 200 } },
      },
    },
  },
  networks: {
    sepolia: {
      type: "http",
      url: "https://ethereum-sepolia-rpc.publicnode.com",
      accounts: [configVariable("PRIVATE_KEY")],
    },
  },
  verify: {
    etherscan: {
      apiKey: configVariable("ETHERSCAN_API_KEY"),
    },
  },
});
