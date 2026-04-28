import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const SEPOLIA_RPC_URL = "https://sepolia.infura.io/v3/a8c81c57aa69486babfe1c30edfcdf4e";
const PRIVATE_KEY = "f176fcbc6cb314d00fbc04f0598a370c7bb9c82a284b33d97c46c555d32747c1";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [PRIVATE_KEY],
    },
  },
};

export default config;