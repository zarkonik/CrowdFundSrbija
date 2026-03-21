import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect();

  console.log("Deploying CrowdFunding...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  const CrowdFunding = await ethers.getContractFactory("CrowdFunding");
  const crowdFunding = await CrowdFunding.deploy();

  await crowdFunding.waitForDeployment();
  console.log("✅ CrowdFunding deployed to:", await crowdFunding.getAddress());
}

main().catch(console.error);
