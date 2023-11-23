import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
const { expectRevert } = require("@openzeppelin/test-helpers");
import {
  FileDeployer,
  LondonTokenBase,
  LondonTokenFactory as LondonTokenFactoryType,
} from "../typechain";

// Reusable test t
const baseUri = "https://example.com/tokens/";
const collectionName = "Tests by Verse";
const royaltyValue = "500";

describe("Factory contract ERC721", function () {
  let londonTokenFactory: LondonTokenFactoryType;
  let accounts: SignerWithAddress[];
  let collection: LondonTokenBase;

  it("Deploy Factory contract", async function () {
    accounts = await ethers.getSigners();
    const LondonTokenFactoryFactory = await ethers.getContractFactory(
      "LondonTokenFactory"
    );
    londonTokenFactory = await LondonTokenFactoryFactory.connect(
      accounts[0]
    ).deploy();
    await londonTokenFactory.deployed();
  });

  it("should deploy LondonTokenFactory contract", async function () {
    expect(londonTokenFactory.address).to.not.be.undefined;
    expect(londonTokenFactory.address).to.not.be.null;
  });

  it("Deploy NFT Collection", async function () {
    const minter = await accounts[1].address;
    const gatewayManager = await accounts[1].address;
    const collectionTx = await londonTokenFactory
      .connect(accounts[1])
      .createCollection(
        baseUri,
        minter,
        gatewayManager,
        collectionName,
        royaltyValue,
        minter
      );

    const newCollectionReceipt = await collectionTx.wait();
    const newCollectionEvent = newCollectionReceipt.events?.filter(
      (e) => e.event === "NewCollection"
    );
    const collectionAddress =
      newCollectionEvent &&
      newCollectionEvent.length > 0 &&
      newCollectionEvent[0].args
        ? newCollectionEvent[0].args[0]
        : undefined;

    await expect(collectionTx, "New Collection event").to.emit(
      londonTokenFactory,
      "NewCollection"
    );

    collection = (await ethers.getContractFactory("LondonTokenBase")).attach(
      collectionAddress
    );

    expect(await collection.mintingManager()).to.equal(minter);
    expect(await collection.gatewayManager()).to.equal(gatewayManager);
    expect(await collection._baseUri()).to.equal(baseUri);
    expect(await collection.name()).to.equal(collectionName);
  });

  it("Test collection royalties", async function () {
    const royaltyInfo = await collection.royaltyInfo(1, 100);
    const royaltyRecipient = royaltyInfo[0];
    const royaltyPercentage = royaltyInfo[1];
    expect(royaltyPercentage).to.equal(Number(royaltyValue) / 100);
    expect(royaltyRecipient).to.equal(await accounts[1].address);
  });
});

let collection: LondonTokenBase;
let deployer: SignerWithAddress;

describe("Test NFT collection", function () {
  let mintingManager: SignerWithAddress;
  let gatewayManager: SignerWithAddress;
  let collector: SignerWithAddress;

  it("Deploy collection", async function () {
    const accounts = await ethers.getSigners();
    deployer = accounts[1];
    mintingManager = accounts[1];
    gatewayManager = accounts[1];
    collector = accounts[2];

    // deploy factory
    const LondonTokenFactoryFactory = await ethers.getContractFactory(
      "LondonTokenFactory"
    );
    const londonTokenFactory = await LondonTokenFactoryFactory.deploy();
    await londonTokenFactory.deployed();

    // deploy collection
    const collectionTx = await londonTokenFactory
      .connect(deployer)
      .createCollection(
        baseUri,
        mintingManager.address,
        gatewayManager.address,
        collectionName,
        royaltyValue,
        mintingManager.address
      );

    const newCollectionReceipt = await collectionTx.wait();
    if (
      newCollectionReceipt.events === undefined ||
      newCollectionReceipt.events.length === 0
    ) {
      throw new Error("NewCollection event not found");
    }

    const newCollectionEvents = newCollectionReceipt.events.filter(
      (e) => e?.event === "NewCollection"
    );

    if (
      newCollectionEvents.length === 0 ||
      newCollectionEvents[0].args === undefined ||
      newCollectionEvents[0].args.length === 0
    ) {
      throw new Error("NewCollection event not found");
    }

    const collectionAddress = newCollectionEvents[0].args[0];

    await expect(collectionTx, "New Collection event").to.emit(
      londonTokenFactory,
      "NewCollection"
    );

    collection = (await ethers.getContractFactory("LondonTokenBase")).attach(
      collectionAddress
    );
  });

  it("Should not be able to initialise again", async function () {
    await expectRevert(
      collection
        .connect(collector)
        .initialize(
          "uri",
          mintingManager.address,
          mintingManager.address,
          "ur",
          500,
          mintingManager.address
        ),
      "Already initialized"
    );
  });

  it("Owner is contract deployer", async function () {
    expect(await collection.owner()).to.equal(deployer.address);
  });

  it("Minter should mint NFT", async function () {
    const mintTx = await collection
      .connect(mintingManager)
      .mint(collector.address, "1", "");
    await expect(mintTx, "New transfer event").to.emit(collection, "Transfer");
  });

  it("Collector should not mint NFT", async function () {
    await expectRevert(
      collection.connect(collector).mint(collector.address, "2", ""),
      "Permission denied"
    );
  });

  it("Mint batch of 50", async function () {
    const addresses = Array(50)
      .fill(0)
      .map((_) => ethers.Wallet.createRandom().address);
    const tokenIds = Array.from({ length: 50 }, (_, i) => String(i + 10000));
    const payloads = Array(50).fill("");
    const mintTx = await collection
      .connect(mintingManager)
      .mintBatch(addresses, tokenIds, payloads);
    await expect(mintTx, "New transfer event").to.emit(collection, "Transfer");
  });

  it("GatewayManager should change baseURI", async function () {
    const mintTx = await collection
      .connect(mintingManager)
      .setURI(`${baseUri}v2`);
    await mintTx.wait();

    expect(await collection._baseUri()).to.equal(`${baseUri}v2`);
  });

  it("Collector should not change baseURI", async function () {
    await expectRevert(
      collection.connect(collector).setURI(`${baseUri}v2`),
      "Permission denied"
    );
  });

  it("Collector should be able to transfer owned NFT", async function () {
    const transferTx = await collection
      .connect(collector)
      .transferFrom(collector.address, mintingManager.address, "1");
    await expect(transferTx, "New transfer event").to.emit(
      collection,
      "Transfer"
    );
  });

  it("Collector should not be able to transfer not owned NFT", async function () {
    await expectRevert(
      collection
        .connect(collector)
        .transferFrom(collector.address, mintingManager.address, "1"),
      "VM Exception while processing transaction: reverted with reason string 'ERC721: caller is not token owner or approved"
    );
  });

  it("Admin should be able to change minting manager", async function () {
    const tx = await collection
      .connect(deployer)
      .setMintingManager(deployer.address);
    await tx.wait();
  });

  it("Collector should not be able to change minting manager", async function () {
    await expectRevert(
      collection.connect(collector).setMintingManager(collector.address),
      "VM Exception while processing transaction: reverted with reason string 'Ownable: caller is not the owner"
    );
  });

  it("Admin should be able to change gateway manager", async function () {
    const tx = await collection
      .connect(deployer)
      .setGatewayManager(deployer.address);
    await tx.wait();
  });

  it("Collector should not be able to change minting manager", async function () {
    await expectRevert(
      collection.connect(collector).setGatewayManager(collector.address),
      "VM Exception while processing transaction: reverted with reason string 'Ownable: caller is not the owner"
    );
  });
});

describe("Test NFT collection on-chain", function () {
  let fileDeployer: FileDeployer;
  const name = "index.js";
  const content = "console.log('hello world')";
  let contentAddress: string[] = [];

  it("Bootstrap FileDeployer", async function () {
    const FileDeployerFactory = await ethers.getContractFactory("FileDeployer");
    fileDeployer = await FileDeployerFactory.connect(deployer).deploy();
    await fileDeployer.deployed();
  });

  it("Deploy code on FileDeployer", async function () {
    const tx = await fileDeployer.connect(deployer).deploy([name], [content]);
    const receipt = await tx.wait();

    receipt.events?.forEach((event) => {
      const argName = event.args?.["name"];
      expect(name).to.equal(argName);

      const address = event.args?.["contentAddress"];
      contentAddress.push(address);
    });
  });

  it("Associate code with collection", async function () {
    const tx = await collection.connect(deployer).addFile(name, contentAddress);
    await tx.wait();
  });

  it("List of files matches", async function () {
    const files = await collection.files();
    expect(files).to.contain(name);
  });

  it("File storage contract matches", async function () {
    const address = await collection.fileStorage(name);
    for (let i = 0; i < contentAddress.length; i++) {
      expect(address).to.contain(contentAddress[i]);
    }
  });

  it("File storage content matches", async function () {
    const fileContents = await collection.fileContents(name);
    expect(fileContents).to.equal(content);
  });
});
