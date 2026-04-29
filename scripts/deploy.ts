import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";

async function main() {
    const SEPOLIA_RPC_URL = "https://sepolia.infura.io/v3/a8c81c57aa69486babfe1c30edfcdf4e";
    const PRIVATE_KEY = "f176fcbc6cb314d00fbc04f0598a370c7bb9c82a284b33d97c46c555d32747c1";
    const SEMAPHORE_ADDRESS = "0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D";
    
    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    console.log("部署账户:", wallet.address);
    
    // 读取 ABI 和 bytecode
    const artifactPath = path.join(__dirname, "../artifacts/contracts/Voting.sol/Voting.json");
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    
    // 直接部署，不校验地址
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
    console.log("部署中...");
    
    const voting = await factory.deploy(SEMAPHORE_ADDRESS);
    console.log("等待确认...");
    
    await voting.waitForDeployment();
    const address = await voting.getAddress();
    
    console.log("✅ Voting 合约已部署到:", address);
    console.log("🔗 Etherscan: https://sepolia.etherscan.io/address/" + address);
}

main().catch(console.error);
