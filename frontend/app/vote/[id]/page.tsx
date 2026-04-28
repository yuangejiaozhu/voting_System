'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { Identity } from '@semaphore-protocol/identity'
import { Group } from '@semaphore-protocol/group'
import { generateProof, packToSolidityProof } from '@semaphore-protocol/proof'
import Link from 'next/link'

const VOTING_ADDRESS = '0xD7075bf25F7650874b4f9bE3ee840cbbD4504Bf4'

const VOTING_ABI = [
  {
    "inputs": [{"name": "proposalId", "type": "uint256"}],
    "name": "getProposal",
    "outputs": [
      {"name": "id", "type": "uint256"},
      {"name": "creator", "type": "address"},
      {"name": "description", "type": "string"},
      {"name": "options", "type": "string[]"},
      {"name": "endTime", "type": "uint256"},
      {"name": "groupId", "type": "uint256"},
      {"name": "voteCount", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "_proposalId", "type": "uint256"},
      {"name": "_identityCommitment", "type": "uint256"}
    ],
    "name": "joinProposal",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "_proposalId", "type": "uint256"},
      {"name": "_optionIndex", "type": "uint256"},
      {"name": "_nullifier", "type": "uint256"},
      {"name": "_merkleTreeDepth", "type": "uint8"},
      {"name": "_merkleTreeRoot", "type": "uint256"},
      {"name": "_points", "type": "uint256[8]"}
    ],
    "name": "castVote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const

export default function VotePage({ params }: { params: { id: string } }) {
  const { isConnected } = useAccount()
  const [identity, setIdentity] = useState<Identity | null>(null)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [hasJoined, setHasJoined] = useState(false)
  const [isVoted, setIsVoted] = useState(false)

  const { data: proposal, refetch } = useReadContract({
    address: VOTING_ADDRESS,
    abi: VOTING_ABI,
    functionName: 'getProposal',
    args: [BigInt(params.id)],
  })

  const { writeContract: joinGroup, isPending: isJoining } = useWriteContract()
  const { writeContract: castVote, isPending: isVoting } = useWriteContract()

  // 初始化身份
  useEffect(() => {
    const stored = localStorage.getItem('semaphore-identity-' + params.id)
    if (stored) {
      setIdentity(new Identity(stored))
    } else {
      const newIdentity = new Identity()
      setIdentity(newIdentity)
      localStorage.setItem('semaphore-identity-' + params.id, newIdentity.toString())
    }
  }, [params.id])

  const handleJoinGroup = () => {
    if (!identity) return
    joinGroup({
      address: VOTING_ADDRESS,
      abi: VOTING_ABI,
      functionName: 'joinProposal',
      args: [BigInt(params.id), BigInt(identity.commitment.toString())],
    })
    setHasJoined(true)
  }

  const handleVote = async () => {
    if (!identity || selectedOption === null || !proposal) return

    try {
      // 创建组（这里简化，实际需要获取链上组成员）
      const group = new Group()
      group.addMember(identity.commitment)

      // 生成 zk 证明
      const proof = await generateProof(identity, {
        merkleTreeRoot: group.root,
        merkleTreeDepth: 20,
        message: selectedOption,
        scope: Number(params.id),
        merkleProof: group.generateMerkleProof(0)
      })

      // 提交投票
      castVote({
        address: VOTING_ADDRESS,
        abi: VOTING_ABI,
        functionName: 'castVote',
        args: [
          BigInt(params.id),
          BigInt(selectedOption),
          BigInt(proof.nullifier),
          proof.merkleTreeDepth,
          BigInt(proof.merkleTreeRoot.toString()),
          packToSolidityProof(proof)
        ],
      })
      setIsVoted(true)
    } catch (error) {
      console.error('投票失败:', error)
    }
  }

  if (!isConnected) {
    return (
      <main className="p-8 max-w-2xl mx-auto">
        <Link href="/" className="text-blue-500 hover:underline mb-4 inline-block">
          ← 返回首页
        </Link>
        <h1 className="text-2xl font-bold mb-4">投票</h1>
        <p className="text-gray-500">请先连接 MetaMask 钱包</p>
      </main>
    )
  }

  if (!proposal) {
    return <div className="p-8">加载中...</div>
  }

  const [id, creator, description, options, endTime, groupId, voteCount] = proposal as any[]

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <Link href="/" className="text-blue-500 hover:underline mb-4 inline-block">
        ← 返回首页
      </Link>

      <h1 className="text-2xl font-bold mb-2">{description}</h1>
      <p className="text-sm text-gray-500 mb-6">提案 #{id.toString()}</p>

      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h2 className="font-semibold mb-2">投票选项</h2>
        <div className="space-y-2">
          {options.map((option: string, index: number) => (
            <div
              key={index}
              onClick={() => setSelectedOption(index)}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedOption === index
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-100'
              }`}
            >
              {option}
            </div>
          ))}
        </div>
      </div>

      {!hasJoined ? (
        <button
          onClick={handleJoinGroup}
          disabled={isJoining}
          className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 mb-4"
        >
          {isJoining ? '加入中...' : '加入投票组'}
        </button>
      ) : !isVoted ? (
        <button
          onClick={handleVote}
          disabled={selectedOption === null || isVoting}
          className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 disabled:bg-gray-300"
        >
          {isVoting ? '投票中...' : '提交匿名投票'}
        </button>
      ) : (
        <div className="p-4 bg-green-50 text-green-700 rounded-lg">
          ✓ 投票成功！你的投票已匿名记录。
        </div>
      )}

      <div className="mt-6 text-sm text-gray-500">
        <p>投票截止时间: {new Date(Number(endTime) * 1000).toLocaleString()}</p>
        <p>当前总票数: {voteCount?.toString()}</p>
      </div>
    </main>
  )
}
