import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";

describe("LondonTokenBase (EIP-7572 contractURI tests)", function () {
    let owner: Signer;
    let addr1: Signer;
    let token: Contract;

    const NAME = "London Token";
    const SYMBOL = "LNDN";
    const INITIAL_SUPPLY = ethers.utils.parseEther("1000"); // 1,000 tokens
    const INITIAL_URI = "https://public-bucket-verse-dev.s3.eu-west-1.amazonaws.com/experiments/test_metadata.json";

    beforeEach(async function () {
        [owner, addr1] = await ethers.getSigners();

        // Get the factory for LondonTokenBase
        const LondonTokenBaseFactory = await ethers.getContractFactory("LondonTokenBase");

        // Deploy the token with our desired constructor args
        token = await LondonTokenBaseFactory.deploy(
            NAME,
            SYMBOL,
            INITIAL_SUPPLY,
            INITIAL_URI
        );
        await token.deployed();
    });

    it("should have correct name, symbol, and initial contractURI", async function () {
        expect(await token.name()).to.equal(NAME);
        expect(await token.symbol()).to.equal(SYMBOL);

        const currentContractURI = await token.contractURI();
        expect(currentContractURI).to.equal(INITIAL_URI);
    });

    it("should allow the owner to update the contractURI", async function () {
        const NEW_URI = "ipfs://newuri123";

        // Owner calls setContractURI
        const tx = await token.setContractURI(NEW_URI);
        await tx.wait();

        // Check updated value
        expect(await token.contractURI()).to.equal(NEW_URI);
    });

    it("should emit ContractURIUpdated event when updating contractURI", async function () {
        const NEW_URI = "https://example.com/new-metadata.json";

        await expect(token.setContractURI(NEW_URI))
            .to.emit(token, "ContractURIUpdated")
            .withArgs(NEW_URI);
    });

    it("should revert if a non-owner tries to update the contractURI", async function () {
        const NEW_URI = "ipfs://anotherURI";

        // Connect the token contract to addr1 (non-owner)
        const tokenWithAddr1 = token.connect(addr1);

        await expect(tokenWithAddr1.setContractURI(NEW_URI)).to.be.revertedWith(
            "Ownable: caller is not the owner"
        );
    });
});
