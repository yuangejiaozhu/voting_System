'use client'

import { useState, useEffect } from 'react'
import { useReadContract } from 'wagmi'
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
      {"name": "proposalId", "type": "uint256"},
      {"name": "optionIndex", "type": "uint256"}
    ],
    "name": "getVotes",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const

export default function ResultPage({ params }: { params: { id: string } }) {
  const { data: proposal } = useReadContract({
    address: VOTING_ADDRESS,
    abi: VOTING_ABI,
    functionName: 'getProposal',
    args: [BigInt(params.id)],
  })

  const [optionVotes, setOptionVotes] = useState<number[]>([])

  useEffect(() => {
    if (proposal) {
      const [id, creator, description, options, endTime, groupId, voteCount] = proposal as any[]
      // 获取每个选项的票数
      options.forEach(async (option: string, index: number) => {
        // 这里需要调用 getVotes，简化先显示总数
      })
      setOptionVotes(new Array(options.length).fill(0))
    }
  }, [proposal])

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

      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">投票结果</h2>
        <div className="space-y-3">
          {options.map((option: string, index: number) => (
            <div key={index} className="flex justify-between items-center">
              <span>{option}</span>
              <span className="font-semibold">{optionVotes[index] || 0} 票</span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t">
          <p className="font-semibold">总票数: {voteCount?.toString()}</p>
        </div>
      </div>

      <div className="text-sm text-gray-500">
        <p>创建者: {creator.slice(0, 6)}...{creator.slice(-4)}</p>
        <p>投票截止: {new Date(Number(endTime) * 1000).toLocaleString()}</p>
        <p className="mt-2">提示: 投票是匿名的，无法查看具体投票者地址。</p>
      </div>
    </main>
  )
}
