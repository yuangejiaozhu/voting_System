import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import CreateProposal from './components/CreateProposal'
import Vote from './components/Vote'
import Results from './components/Results'

const VOTING_ADDRESS = '0x4926480D2Fe02cEc8dbF3E9D98b3c2eF0A3a9278'
const VOTING_ABI = [
  "function proposalCounter() view returns (uint256)",
  "function getProposal(uint256) view returns (uint256, address, string, string[], uint256, uint256, uint256)"
]

function App() {
  const [address, setAddress] = useState<string>('')
  const [isConnected, setIsConnected] = useState(false)
  const [log, setLog] = useState('')
  const [page, setPage] = useState<'home' | 'create' | 'vote' | 'results'>('home')
  const [proposalId, setProposalId] = useState<number>(0)
  const [proposals, setProposals] = useState<Array<{id: number, description: string}>>([])
  const [loading, setLoading] = useState(false)

  const fetchProposals = async () => {
    if (!window.ethereum) return
    setLoading(true)
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const contract = new ethers.Contract(VOTING_ADDRESS, VOTING_ABI, provider)
      const counter = await contract.proposalCounter()
      const list = []
      for (let i = 0; i < Number(counter); i++) {
        try {
          const [id, , description] = await contract.getProposal(i)
          list.push({ id: Number(id), description })
        } catch (e) {
          // skip invalid proposals
        }
      }
      setProposals(list)
    } catch (err) {
      console.error('获取提案失败:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isConnected) {
      fetchProposals()
    }
  }, [isConnected])

  const connectMetaMask = async () => {
    setLog('正在连接...')
    try {
      if (typeof window.ethereum === 'undefined') {
        setLog('请安装 MetaMask！')
        return
      }
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      setAddress(accounts[0])
      setIsConnected(true)
      setLog('连接成功！')
    } catch (error: any) {
      setLog('连接失败: ' + error.message)
    }
  }

  const disconnect = () => {
    setAddress('')
    setIsConnected(false)
    setLog('已断开')
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Web3 匿名投票系统</h1>
        <div>
          {isConnected ? (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
              <button 
                onClick={disconnect} 
                style={{ 
                  backgroundColor: '#ef4444', 
                  color: 'white', 
                  padding: '0.5rem 1rem', 
                  borderRadius: '0.25rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                断开连接
              </button>
            </div>
          ) : (
            <button
              onClick={connectMetaMask}
              style={{ 
                backgroundColor: '#3b82f6', 
                color: 'white', 
                padding: '0.5rem 1rem', 
                borderRadius: '0.25rem',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              连接 MetaMask
            </button>
          )}
        </div>
      </div>

      {log && (
        <div style={{ 
          backgroundColor: log.includes('成功') ? '#dcfce7' : '#fee2e2', 
          color: log.includes('成功') ? '#166534' : '#991b1b',
          padding: '0.5rem', 
          borderRadius: '0.25rem', 
          marginBottom: '1rem',
          fontSize: '0.875rem'
        }}>
          {log}
        </div>
      )}

      {page === 'home' && (
        <div style={{ display: 'grid', gap: '1rem' }}>
          <button
            onClick={() => setPage('create')}
            style={{ 
              backgroundColor: '#22c55e', 
              color: 'white', 
              padding: '0.5rem 1rem', 
              borderRadius: '0.25rem',
              border: 'none',
              cursor: 'pointer',
              width: 'fit-content'
            }}
          >
            创建新提案
          </button>

          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>提案列表</h2>
              <button onClick={fetchProposals} disabled={loading} style={{ fontSize: '0.75rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>
                {loading ? '刷新中...' : '刷新'}
              </button>
            </div>
            {proposals.length === 0 ? (
              <p style={{ color: '#6b7280' }}>{loading ? '加载中...' : '暂无提案'}</p>
            ) : (
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {proposals.map(p => (
                  <div key={p.id} style={{ padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '0.25rem', cursor: 'pointer' }} onClick={() => { setProposalId(p.id); setPage('vote') }}>
                    <div style={{ fontWeight: '500' }}>#{p.id}: {p.description}</div>
                  </div>
                ))}
              </div>
            )}
            <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginTop: '0.5rem' }}>
              合约地址: 0x4926480D2Fe02cEc8dbF3E9D98b3c2eF0A3a9278
            </p>
          
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.25rem' }}>
              <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>测试投票（手动输入提案ID）:</p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="number" 
                  value={proposalId}
                  onChange={(e) => setProposalId(Number(e.target.value))}
                  style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
                />
                <button
                  onClick={() => setPage('vote')}
                  style={{ 
                    backgroundColor: '#3b82f6', 
                    color: 'white', 
                    padding: '0.5rem 1rem', 
                    borderRadius: '0.25rem',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  投票
                </button>
                <button
                  onClick={() => setPage('results')}
                  style={{ 
                    backgroundColor: '#8b5cf6', 
                    color: 'white', 
                    padding: '0.5rem 1rem', 
                    borderRadius: '0.25rem',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  结果
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {page === 'create' && (
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <button onClick={() => setPage('home')} style={{ color: '#3b82f6', marginBottom: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}>
            ← 返回首页
          </button>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>创建提案</h2>
          <CreateProposal onSuccess={() => setPage('home')} />
        </div>
      )}

      {page === 'vote' && (
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <button onClick={() => setPage('home')} style={{ color: '#3b82f6', marginBottom: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}>
            ← 返回首页
          </button>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>投票 - 提案 #{proposalId}</h2>
          <Vote proposalId={proposalId} />
        </div>
      )}

      {page === 'results' && (
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <button onClick={() => setPage('home')} style={{ color: '#3b82f6', marginBottom: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}>
            ← 返回首页
          </button>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>结果 - 提案 #{proposalId}</h2>
          <Results proposalId={proposalId} />
        </div>
      )}
    </div>
  )
}

export default App
