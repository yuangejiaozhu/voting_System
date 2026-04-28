const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

async function main() {
    const SEPOLIA_RPC_URL = "https://sepolia.infura.io/v3/a8c81c57aa69486babfe1c30edfcdf4e";
    const PRIVATE_KEY = "f176fcbc6cb314d00fbc04f0598a370c7bb9c82a284b33d97c46c555d32747c1";
    const SEMAPHORE_ADDRESS = "0x33884885f7de6c62b1cdf4cd5ac7c6e40aceeaa"; // 全小写
    
    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    console.log("部署账户:", wallet.address);
    
    const artifactPath = path.join(__dirname, "../artifacts/contracts/Voting.sol/Voting.json");
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    
    // 手动编码地址参数
    const addressHex = SEMAPHORE_ADDRESS.slice(2).padStart(64, '0'); // 移除0x并补齐64位
    const deployBytecode = artifact.bytecode + addressHex;
    
    console.log("发送部署交易...");
    const tx = await wallet.sendTransaction({
        data: deployBytecode,
        gasLimit: 3000000
    });
    
    console.log("交易已发送:", tx.hash);
    console.log("等待确认...");
    
    const receipt = await tx.wait();
    const address = receipt.contractAddress;
    
    console.log("✅ Voting 合约已部署到:", address);
    console.log("🔗 Etherscan: https://sepolia.etherscan.io/address/" + address);
}

main().catch(console.error);
