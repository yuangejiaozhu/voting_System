import { useState, useEffect } from 'react'

const VOTING_ADDRESS = '0xD7075bf25F7650874b4f9bE3ee840cbbD4504Bf4'

export default function Vote({ proposalId }: { proposalId: number }) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [hasJoined, setHasJoined] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [proposal, setProposal] = useState<any>(null)

  useEffect(() => {
    // 模拟提案数据
    setProposal({
      id: proposalId,
      description: '提案 #' + proposalId,
      options: ['支持', '反对', '弃权']
    })
  }, [proposalId])

  const handleJoinGroup = async () => {
    if (typeof window.ethereum === 'undefined') {
      setMessage('请安装 MetaMask！')
      return
    }

    setIsLoading(true)
    try {
      // 简化：只发送加入请求，不生成真实证明
      await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: (await window.ethereum.request({ method: 'eth_accounts' }))[0],
          to: VOTING_ADDRESS,
          data: '0xa6d4b84e' + // joinProposal 函数选择器
                proposalId.toString(16).padStart(64, '0') +
                '1'.padStart(64, '0') // 简化的 commitment
        }]
      })
      
      setHasJoined(true)
      setMessage('成功加入投票组！')
    } catch (error: any) {
      setMessage('加入失败: ' + error.message)
    }
    setIsLoading(false)
  }

  const handleVote = async () => {
    if (selectedOption === null) return
    
    setIsLoading(true)
    try {
      // 简化投票：不生成真实 zk 证明，只测试交易流程
      await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: (await window.ethereum.request({ method: 'eth_accounts' }))[0],
          to: VOTING_ADDRESS,
          data: '0x5a5f755a' + // castVote 函数选择器
                proposalId.toString(16).padStart(64, '0') +
                selectedOption.toString(16).padStart(64, '0') +
                '0'.padStart(64, '0') // 简化的 nullifier
        }]
      })

      setMessage('投票成功！（模拟zk证明）')
    } catch (error: any) {
      setMessage('投票失败: ' + error.message)
    }
    setIsLoading(false)
  }

  if (!proposal) return <p style={{ padding: '2rem' }}>加载中...</p>

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>{proposal.description}</h2>
      
      <div style={{ display: 'grid', gap: '0.5rem' }}>
        {proposal.options.map((opt: string, i: number) => (
          <div
            key={i}
            onClick={() => setSelectedOption(i)}
            style={{
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              backgroundColor: selectedOption === i ? '#eff6ff' : 'white'
            }}
          >
            {opt}
          </div>
        ))}
      </div>

      {message && (
        <div style={{
          padding: '0.75rem',
          borderRadius: '0.25rem',
          backgroundColor: message.includes('成功') ? '#dcfce7' : '#fee2e2',
          color: message.includes('成功') ? '#166534' : '#991b1b'
        }}>
          {message}
        </div>
      )}

      {!hasJoined ? (
        <button
          onClick={handleJoinGroup}
          disabled={isLoading}
          style={{
            width: '100%',
            backgroundColor: isLoading ? '#9ca3af' : '#3b82f6',
            color: 'white',
            padding: '0.75rem',
            borderRadius: '0.25rem',
            border: 'none',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? '加入中...' : '加入投票组'}
        </button>
      ) : (
        <button
          onClick={handleVote}
          disabled={selectedOption === null || isLoading}
          style={{
            width: '100%',
            backgroundColor: selectedOption === null ? '#9ca3af' : '#22c55e',
            color: 'white',
            padding: '0.75rem',
            borderRadius: '0.25rem',
            border: 'none',
            cursor: selectedOption === null ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? '投票中...' : '提交匿名投票'}
        </button>
      )}
    </div>
  )
}
