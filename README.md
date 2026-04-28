# Web3 匿名投票系统

基于 zk-SNARK 技术的匿名投票 DApp，使用 Semaphore 协议实现隐私保护。

## 技术栈

- **智能合约**: Solidity + Hardhat + Semaphore (zk)
- **前端**: Vite + React + TypeScript + MetaMask
- **网络**: Ethereum Sepolia 测试网

## 部署的合约

- **Voting 合约地址**: `0xD7075bf25F7650874b4f9bE3ee840cbbD4504Bf4`
- **网络**: Sepolia 测试网
- **Etherscan**: https://sepolia.etherscan.io/address/0xD7075bf25F7650874b4f9bE3ee840cbbD4504Bf4

## 功能

- 任意钱包创建提案（无需权限）
- 匿名投票（zk 证明，不泄露投票者身份）
- 防重复投票（nullifier 机制）
- 投票期限控制

## 本地开发

```bash
# 安装依赖
cd web3-voting
npm install
cd frontend
npm install

# 前端开发
cd frontend
npm run dev
```

## 投票流程

1. 连接 MetaMask（Sepolia 测试网）
2. 创建提案（填写描述、选项、期限）
3. 加入投票组（提交 identity commitment）
4. 投票（生成 zk 证明 → 提交交易）
5. 查看结果

## 注意事项

- 私钥和 API 密钥存储在 `hardhat.config.ts`
- 部署前确保账户有足够的测试 ETH（Sepolia faucet）