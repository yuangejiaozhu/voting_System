'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import Link from 'next/link'

const VOTING_ADDRESS = '0xD7075bf25F7650874b4f9bE3ee840cbbD4504Bf4'
const VOTING_ABI = [
  {
    "inputs": [
      {"name": "_description", "type": "string"},
      {"name": "_options", "type": "string[]"},
      {"name": "_duration", "type": "uint256"}
    ],
    "name": "createProposal",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const

export default function CreateProposal() {
  const { isConnected } = useAccount()
  const [description, setDescription] = useState('')
  const [option, setOption] = useState('')
  const [options, setOptions] = useState<string[]>([])
  const [duration, setDuration] = useState('86400') // 默认1天

  const { data: hash, writeContract, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const addOption = () => {
    if (option.trim()) {
      setOptions([...options, option.trim()])
      setOption('')
    }
  }

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index))
  }

  const createProposal = () => {
    if (!description.trim() || options.length < 2) return
    
    writeContract({
      address: VOTING_ADDRESS,
      abi: VOTING_ABI,
      functionName: 'createProposal',
      args: [description, options, BigInt(duration)],
    })
  }

  if (!isConnected) {
    return (
      <main className="p-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">创建提案</h1>
        <p className="text-gray-500">请先连接 MetaMask 钱包</p>
        <Link href="/" className="text-blue-500 hover:underline mt-4 inline-block">
          返回首页
        </Link>
      </main>
    )
  }

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">创建新提案</h1>
        <Link href="/" className="text-blue-500 hover:underline">
          返回首页
        </Link>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">提案描述</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 border rounded-lg"
            rows={3}
            placeholder="输入提案描述..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">投票选项</label>
          <div className="flex gap-2 mb-2">
            <input
              value={option}
              onChange={(e) => setOption(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addOption()}
              className="flex-1 p-2 border rounded-lg"
              placeholder="输入选项..."
            />
            <button
              onClick={addOption}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              添加
            </button>
          </div>
          <div className="space-y-2">
            {options.map((opt, index) => (
              <div key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                <span>{opt}</span>
                <button
                  onClick={() => removeOption(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  删除
                </button>
              </div>
            ))}
          </div>
          {options.length < 2 && (
            <p className="text-sm text-red-500 mt-2">至少需要2个选项</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">投票期限（秒）</label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full p-2 border rounded-lg"
          />
          <p className="text-sm text-gray-500 mt-1">
            当前：{Number(duration) / 86400} 天
          </p>
        </div>

        <button
          onClick={createProposal}
          disabled={!description.trim() || options.length < 2 || isPending}
          className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 disabled:bg-gray-300"
        >
          {isPending ? '创建中...' : '创建提案'}
        </button>

        {hash && (
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <p className="text-sm">交易哈希: {hash.slice(0, 10)}...</p>
            {isConfirming && <p className="text-sm text-yellow-600">等待确认...</p>}
            {isSuccess && <p className="text-sm text-green-600">✓ 提案创建成功！</p>}
          </div>
        )}
      </div>
    </main>
  )
}
