import { ethers } from "hardhat";

async function main() {
    const provider = new ethers.JsonRpcProvider("https://sepolia.infura.io/v3/a8c81c57aa69486babfe1c30edfcdf4e");
    const wallet = new ethers.Wallet("f176fcbc6cb314d00fbc04f0598a370c7bb9c82a284b33d97c46c555d32747c1", provider);
    
    const VOTING_ADDRESS = "0x6A2A8a76eCb4944A989E2F188A08110B5F670d29";
    const abi = ["function setSkipProofVerification(bool _skip) external"];
    
    const contract = new ethers.Contract(VOTING_ADDRESS, abi, wallet);
    
    console.log("启用 skipProofVerification...");
    const tx = await contract.setSkipProofVerification(true);
    await tx.wait();
    
    console.log("✅ 已启用 skipProofVerification!");
}

main().catch(console.error);