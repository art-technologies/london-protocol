import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const LondonTokenBaseFactory = await ethers.getContractFactory(
    "LondonTokenBase"
  );
  // const londonTokenFactory = LondonTokenFactory.attach("0x1c392680e2957237Abb172fD7A83C74A8E7E2D02")
  const londonTokenBaseFactory = await LondonTokenBaseFactory.deploy();
  await londonTokenBaseFactory.deployed();
  const receiptFactory = await londonTokenBaseFactory.deployTransaction.wait();
  console.log(receiptFactory)

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
