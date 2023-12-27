import { ethers } from "hardhat";
import { FileDeployer, LondonTokenBase } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import fs from "fs";
import path from "path";

import { inflate, deflate } from "pako";
import { arrayify, hexlify } from "ethers/lib/utils";

const MAX_FILE_CHUNK_SIZE_BYTES = 20000;
const MAX_CHUNKS_IN_TX = 4;

async function main() {
  const existingFdAddress = "";
  const existingNftAddress = "";

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // set up NFT collection contract
  const collection = await setupCollection(existingNftAddress, deployer);

  // set up file deployer
  const fd = await setupDeployer(existingFdAddress, deployer);

  // write data to storage contract
  const filesData = await readFiles("./scripts/sample_code");

  const deploymentChunks = await prepareDeploymentChunks(filesData);

  const txsPlan = await prepareTxPlan(deploymentChunks, fd);

  console.log("txsPlan", txsPlan.length);

  for (const plan of txsPlan) {
    const tx = await fd
      .connect(deployer)
      .deploy(plan.names, plan.contentBatches);
    await tx.wait();
  }

  const contentAddresses = await getFileAddresses(deploymentChunks, fd);
  console.log(contentAddresses);

  for (const name in contentAddresses) {
    await collection.addFile(name, contentAddresses[name]);
  }

  await fetchCollectionFiles(collection);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function setupCollection(
  colelctionAddress: string,
  deployer: SignerWithAddress
) {
  const collectionFactory = await ethers.getContractFactory("LondonTokenBase");
  let collection: LondonTokenBase;

  if (colelctionAddress === "") {
    const LondonTokenFactory = await ethers.getContractFactory(
      "LondonTokenFactory"
    );
    const londonTokenFactory = await LondonTokenFactory.deploy();
    await londonTokenFactory.deployed();
    londonTokenFactory.deployTransaction.wait();

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
    collection = collectionFactory.attach(collectionAddress);
  } else {
    collection = collectionFactory.attach(colelctionAddress);
  }
  return collection;
}

async function setupDeployer(address: string, deployer: SignerWithAddress) {
  const fdFactory = await ethers.getContractFactory("FileDeployer");
  let fd: FileDeployer;
  if (address === "") {
    return await fdFactory.connect(deployer).deploy();
  } else {
    return fdFactory.attach(address);
  }
}

async function fetchCollectionFiles(collection: LondonTokenBase) {
  const files = await collection.files();
  console.log(files);

  for (const name of files) {
    const content = await collection.fileContents(name);
    const arContent = arrayify(content);
    const decodedContent = await decodeFileContents([arContent]);

    // save to file
    await fs.promises.writeFile(
      path.join("./scripts/sample_code_fromchain", name),
      decodedContent
    );
  }
}

type TFilesData = {
  name: string;
  contents: string;
};

async function readFiles(directoryPath: string) {
  let filesData: TFilesData[] = [];

  try {
    const files = await fs.promises.readdir(directoryPath);

    for (const file of files) {
      const filePath = path.join(directoryPath, file);
      const content = await fs.promises.readFile(filePath, "utf-8");

      filesData.push({
        name: file,
        contents: content,
      });
    }
  } catch (err) {
    console.error("Could not list the directory.", err);
    process.exit(1);
  }

  return filesData;
}

type TTxPlan = {
  names: string[];
  contentBatches: string[];
};

type DeploymentChunk = {
  name: string;
  content: Uint8Array;
};

type DeployedFile = {
  name: string;
  addresses: string[];
};

async function prepareDeploymentChunks(filesData: TFilesData[]) {
  let deploymentChunks: DeploymentChunk[] = [];

  for (const fileData of filesData) {
    const encodedFileContents = await encodeFileContents(fileData.contents);
    for (const txContents of encodedFileContents) {
      deploymentChunks.push({
        name: fileData.name,
        content: txContents,
      });
    }
  }

  return deploymentChunks;
}

async function filterDeploymentChunksOnChain(
  deploymentChunks: DeploymentChunk[],
  fd: FileDeployer
) {
  let filteredDeploymentChunks: DeploymentChunk[] = [];

  for (const chunk of deploymentChunks) {
    const contentAddress = await fd.getBytesAddress(chunk.content);
    if (contentAddress === ethers.constants.AddressZero) {
      filteredDeploymentChunks.push(chunk);
    }
  }

  return filteredDeploymentChunks;
}

async function prepareTxPlan(
  deploymentChunks: DeploymentChunk[],
  fd: FileDeployer
) {
  const filteredDeploymentChunks = await filterDeploymentChunksOnChain(
    deploymentChunks,
    fd
  );

  const deploymentChunksBatched = unflatten(
    filteredDeploymentChunks,
    MAX_CHUNKS_IN_TX
  );

  let transactionsPlan: TTxPlan[] = [];
  for (const chunk of deploymentChunksBatched) {
    const chunkNames = chunk.map((e) => e.name);
    const chunkContents = chunk.map((e) => e.content);
    transactionsPlan.push({
      names: chunkNames,
      contentBatches: chunkContents.map((e) => hexlify(e)),
    });
  }

  return transactionsPlan;
}

async function getFileAddresses(
  deploymentChunks: DeploymentChunk[],
  fd: FileDeployer
) {
  let fileAddresses: { [name: string]: string[] } = {};
  let addressCount = 0;

  for (const chunk of deploymentChunks) {
    const contentAddress = await fd.getBytesAddress(chunk.content);
    if (contentAddress !== ethers.constants.AddressZero) {
      fileAddresses[chunk.name] = fileAddresses[chunk.name]
        ? [...fileAddresses[chunk.name], contentAddress]
        : [contentAddress];
      addressCount += 1;
    }
  }

  if (deploymentChunks.length !== addressCount) {
    throw new Error("Not all files were deployed");
  }

  return fileAddresses;
}

async function encodeFileContents(fileContents: string) {
  const compressed = deflate(fileContents);
  const chunks: Uint8Array[] = [];

  for (let i = 0; i < compressed.length; i += MAX_FILE_CHUNK_SIZE_BYTES) {
    const chunk = compressed.slice(i, i + MAX_FILE_CHUNK_SIZE_BYTES);
    chunks.push(chunk);
  }

  return chunks;
}

async function decodeFileContents(chunks: Uint8Array[]) {
  const data = chunks.reduce(
    (acc, curr) => new Uint8Array([...acc, ...curr]),
    new Uint8Array()
  );

  const decompressed = inflate(data, { to: "string" });
  return decompressed.toString();
}

function unflatten<T>(arr: T[], m: number) {
  let subarrays: T[][] = [];
  for (let i = 0; i < arr.length; i += m) {
    subarrays.push(arr.slice(i, i + m));
  }
  return subarrays;
}

async function safeAddFile(
  fileName: string,
  contents: string,
  fd: FileDeployer
) {
  const contentAddresses = await fd.getDataAddresses([contents]);
}
