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
  console.log(newCollectionReceipt);

  if (
    newCollectionReceipt.events === undefined ||
    newCollectionReceipt.events.length === 0
  ) {
    throw new Error("NewCollection event not found");
  }

  const newCollectionEvent = newCollectionReceipt.events.find(
    (e) => e.event === "NewCollection"
  );

  if (newCollectionEvent === undefined) {
    throw new Error("NewCollection event not found");
  }

  const collectionAddress = newCollectionEvent.args?.[0];

  if (collectionAddress === undefined) {
    throw new Error("Collection address not found");
  }

  const collection = (
    await ethers.getContractFactory("LondonTokenBase")
  ).attach(collectionAddress);

  console.log(await collection.name());

  // --------------------------------------------------------------------------
// NEW LINES: Demonstrate setting and reading contractURI in LondonTokenBase
// --------------------------------------------------------------------------
  const setURI = await collection.setContractURI("https://public-bucket-verse-dev.s3.eu-west-1.amazonaws.com/experiments/test_metadata.json");
  await setURI.wait();

  const currentURI = await collection.contractURI();
  console.log("Updated contractURI =>", currentURI);
}



main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
