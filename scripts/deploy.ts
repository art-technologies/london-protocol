import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const LondonTokenFactory = await ethers.getContractFactory(
    "LondonTokenFactory"
  );
  // const londonTokenFactory = LondonTokenFactory.attach("0x1c392680e2957237Abb172fD7A83C74A8E7E2D02")
  const londonTokenFactory = await LondonTokenFactory.deploy();
  await londonTokenFactory.deployed();
  const receiptFactory = await londonTokenFactory.deployTransaction.wait();

  const collectionTx = await londonTokenFactory.createCollection(
    "https://staging.dev.verse.works/metadata/a9f05897-3a0a-495b-b099-45a221dd1ef2",
    deployer.address,
    deployer.address,
    "[Collection Name] by [Artist Name]",
    "500",
    deployer.address
  );
  const newCollectionReceipt = await collectionTx.wait();

  if (
    newCollectionReceipt.events === undefined ||
    newCollectionReceipt.events.length === 0 ||
    newCollectionReceipt.events[0].args === undefined
  ) {
    throw new Error("NewCollection event not found");
  }

  const collectionAddress = newCollectionReceipt.events[0].args[0];

  const collection = (
    await ethers.getContractFactory("LondonTokenBase")
  ).attach(collectionAddress);

  console.log(await collection.name());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
