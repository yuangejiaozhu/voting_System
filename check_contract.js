const { ethers } = require("hardhat");

async function main() {
  const VOTING_ADDRESS = '0xab1618d247542e9841d121aac25d9dc5c75d3df5';
  const ABI = [
    "function proposalCounter() view returns (uint256)",
    "function getProposal(uint256) view returns (uint256 id, address creator, string description, string[] options, uint256 endTime, uint256 groupId, uint256 voteCount)",
    "function semaphore() view returns (address)"
  ];

  const provider = new ethers.JsonRpcProvider("https://eth-sepolia.public.blastapi.io");
  const contract = new ethers.Contract(VOTING_ADDRESS, ABI, provider);

  console.log("=== 合约状态检查 ===");
  
  try {
    const counter = await contract.proposalCounter();
    console.log("提案总数:", counter.toString());

    for (let i = 0; i < counter; i++) {
      const p = await contract.getProposal(i);
      console.log(`\n提案 #${i}:`);
      console.log("  描述:", p[2]);
      console.log("  选项:", p[3].join(", "));
      console.log("  结束时间:", new Date(Number(p[4]) * 1000).toLocaleString());
      console.log("  组ID:", p[5].toString());
      console.log("  票数:", p[6].toString());
    }

    const semAddr = await contract.semaphore();
    console.log("\nSemaphore 地址:", semAddr);

  } catch (err) {
    console.error("错误:", err.message);
  }
}

main();
