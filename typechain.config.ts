import { HardhatUserConfig } from "hardhat/types";
import "@typechain/hardhat";

const config: HardhatUserConfig = {
    typechain: {
        outDir: "typechain",
        target: "ethers-v5",
    },
};

export default config;