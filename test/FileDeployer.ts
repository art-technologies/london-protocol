import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { FileDeployer } from "../typechain";

describe("FileDeployer contract", function () {
  let accounts: SignerWithAddress[];
  let fileDeployer: FileDeployer;
  let contentAddresses: { [name: string]: string } = {};

  const names = ["index.html", "index.js"];
  const contents = ["Hello World", "console.log"];
  const zeroAddress = "0x0000000000000000000000000000000000000000";

  it("Deploy FileDeployer contract", async function () {
    accounts = await ethers.getSigners();
    const FileDeployerFactory = await ethers.getContractFactory("FileDeployer");
    fileDeployer = await FileDeployerFactory.connect(accounts[0]).deploy();
    await fileDeployer.deployed();
  });

  it("should deploy LondonTokenFactory contract", async function () {
    expect(fileDeployer.address).to.not.be.undefined;
    expect(fileDeployer.address).to.not.be.null;
  });

  it("Write some content", async function () {
    const tx = await fileDeployer.connect(accounts[0]).deploy(names, contents);
    const receipt = await tx.wait();

    receipt.events?.forEach((event) => {
      const name = event.args?.["name"];
      expect(names).to.include(name);

      const contentAddress = event.args?.["contentAddress"];
      contentAddresses[name] = contentAddress;
    });
  });

  it("Written content should exist", async function () {
    const addresses = await fileDeployer.getDataAddresses(contents);

    for (let i = 0; i < addresses.length; i++) {
      expect(addresses[i]).to.equal(contentAddresses[names[i]]);
    }
  });

  it("Not written content should not exist", async function () {
    const addresses = await fileDeployer.getDataAddresses([
      "Unseen content 1",
      "Unseen content 2",
    ]);

    for (let i = 0; i < addresses.length; i++) {
      expect(addresses[i]).to.equal(zeroAddress);
    }
  });
});
