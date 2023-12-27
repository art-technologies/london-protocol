import { ethers } from "hardhat";
import { FileDeployer } from "../typechain";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const fdFactory = await ethers.getContractFactory("FileDeployer");
  const fd: FileDeployer = await fdFactory.deploy();
  await fd.deployed();
  const receiptFactory = await fd.deployTransaction.wait();
  console.log(receiptFactory);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
