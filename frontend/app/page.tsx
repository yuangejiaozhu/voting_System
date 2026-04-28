'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { metaMask } from 'wagmi/connectors'
import Link from 'next/link'

export default function Home() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Web3 匿名投票系统</h1>
        <div>
          {isConnected ? (
            <div className="flex gap-4 items-center">
              <span className="text-sm text-gray-600">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
              <button 
                onClick={() => disconnect()} 
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
              >
                断开连接
              </button>
            </div>
          ) : (
            <button
              onClick={() => connect({ connector: metaMask() })}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              连接 MetaMask
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4">
        <Link 
          href="/create" 
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded w-fit"
        >
          创建新提案
        </Link>
        
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">提案列表</h2>
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-gray-500">暂无提案</p>
            <p className="text-sm text-gray-400 mt-2">
              合约地址: 0xD7075bf25F7650874b4f9bE3ee840cbbD4504Bf4
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
