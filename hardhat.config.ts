import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    buildbear: { 
      url: process.env.ALCHEMY_URL,
      accounts: [process.env.PRIVATE_KEY!]
    }
  }
};

export default config;