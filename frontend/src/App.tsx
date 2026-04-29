import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import CreateProposal from './components/CreateProposal'
import Vote from './components/Vote'
import Results from './components/Results'

const VOTING_ADDRESS = '0x81620fF38807e55c59E7d4ccC18657F8013F08fA'
const VOTING_ABI = [
  "function proposalCounter() view returns (uint256)",
  "function getProposal(uint256) view returns (uint256, address, string, string[], uint256, uint256)"
]

function App() {
  const [address, setAddress] = useState<string>('')
  const [isConnected, setIsConnected] = useState(false)
  const [log, setLog] = useState('')
  const [page, setPage] = useState<'home' | 'create' | 'vote' | 'results'>('home')
  const [proposalId, setProposalId] = useState<number>(0)
  const [proposals, setProposals] = useState<Array<{id: number, description: string, hasVoted?: boolean}>>([])
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

  // 自动恢复钱包连接
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
        if (accounts.length > 0) {
          setAddress(accounts[0])
          setIsConnected(true)
          setLog('连接已恢复')
        }
      }).catch(() => {})
      
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          setAddress('')
          setIsConnected(false)
          setLog('已断开')
        } else {
          setAddress(accounts[0])
          setIsConnected(true)
        }
      })
    }
  }, [])

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
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 2rem' }}>
      <nav>
        <a href="#" className="nav-brand" onClick={(e) => { e.preventDefault(); setPage('home') }}>
          <div className="nav-brand-dot"></div>
          VoteChain
        </a>
        <ul className="nav-links">
          <li><a href="#" onClick={(e) => { e.preventDefault(); setPage('home') }} className={page === 'home' ? 'active' : ''}>Proposals</a></li>
          <li><a href="#" onClick={(e) => { e.preventDefault(); setPage('create') }} className={page === 'create' ? 'active' : ''}>Create</a></li>
        </ul>
        <div className="nav-right">
          <span className="wallet-addr" id="wallet-display" style={{ display: isConnected ? '' : 'none' }}>
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </span>
          <button 
            id="disconnect-btn" 
            onClick={disconnect} 
            className="btn"
            style={{ display: isConnected ? '' : 'none' }}
          >
            断开连接
          </button>
          <button
            id="connect-btn"
            onClick={connectMetaMask}
            className="btn btn-primary"
            style={{ display: !isConnected ? '' : 'none' }}
          >
            连接 MetaMask
          </button>
        </div>
      </nav>

      {log && (
        <div style={{
          padding: '0.75rem',
          backgroundColor: log.includes('成功') || log.includes('恢复') ? 'var(--success-light)' : 'var(--danger-light)', 
          color: log.includes('成功') || log.includes('恢复') ? 'var(--success-text)' : 'var(--danger-text)',
          borderRadius: '0.25rem',
          marginBottom: '1rem',
          fontSize: '0.875rem'
        }}>
          {log}
        </div>
      )}

      {page === 'home' && (
        <div>
          <div className="hero">
            <p className="hero-eyebrow">Decentralized governance</p>
            <h1 className="hero-h1">
              Vote on what<br/><em>matters most.</em>
            </h1>
            <p className="hero-sub">
              Create proposals, cast your vote with your wallet, and shape the future of your community — transparently on-chain.
            </p>
            <div className="hero-actions">
              <button
                onClick={() => setPage('create')}
                className="btn btn-primary"
              >
                创建新提案
              </button>
              <button
                onClick={() => document.getElementById('proposals-section')?.scrollIntoView({behavior:'smooth'})}
                className="btn"
              >
                浏览提案
              </button>
            </div>
          </div>

          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-val">{proposals.length}</div>
              <div className="stat-lbl">Total proposals</div>
            </div>
            <div className="stat-card">
              <div className="stat-val">--</div>
              <div className="stat-lbl">Open</div>
            </div>
            <div className="stat-card">
              <div className="stat-val">--</div>
              <div className="stat-lbl">Total votes cast</div>
            </div>
            <div className="stat-card">
              <div className="stat-val">--</div>
              <div className="stat-lbl">Unique voters</div>
            </div>
          </div>

          <div id="proposals-section">
            <div className="section-head">
              <div>
                <p className="section-eyebrow">All proposals</p>
                <h2>提案列表</h2>
              </div>
              <button onClick={fetchProposals} disabled={loading} className="btn btn-sm">
                {loading ? '刷新中...' : 'Refresh'}
              </button>
            </div>
            {proposals.length === 0 ? (
              <p className="empty">{loading ? '加载中...' : '暂无提案'}</p>
            ) : (
              <div className="proposals-grid">
                {proposals.map(p => (
                  <a 
                    key={p.id} 
                    className={`proposal-card ${p.hasVoted ? 'voted' : ''}`}
                    onClick={() => { setProposalId(p.id); setPage('vote') }}
                  >
                    <div className="card-head">
                      <div>
                        <span className="card-title">#{p.id}: {p.description}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        {p.hasVoted && (
                          <span className="pill pill-voted">已投票</span>
                        )}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
            <p style={{ fontSize: '0.875rem', color: 'var(--tag-text)', marginTop: '0.5rem' }}>
              合约地址: 0x81620fF38807e55c59E7d4ccC18657F8013F08fA
            </p>
          </div>
        </div>
      )}

      {page === 'create' && (
        <div className="create-wrap">
          <button onClick={() => setPage('home')} className="detail-back">
            ← 返回首页
          </button>
          <div style={{ marginBottom: '2rem' }}>
            <p className="section-eyebrow">New proposal</p>
            <h1 style={{ fontFamily: "'Crimson Pro', serif", fontSize: '2rem', fontWeight: 300 }}>创建提案</h1>
          </div>
          <CreateProposal onSuccess={() => setPage('home')} />
        </div>
      )}

      {page === 'vote' && (
        <div style={{ backgroundColor: 'var(--surface)', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <button onClick={() => setPage('home')} className="detail-back">
            ← 返回首页
          </button>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>投票 - 提案 #{proposalId}</h2>
          <Vote proposalId={proposalId} />
        </div>
      )}

      {page === 'results' && (
        <div style={{ backgroundColor: 'var(--surface)', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <button onClick={() => setPage('home')} className="detail-back">
            ← 返回首页
          </button>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>结果 - 提案 #{proposalId}</h2>
          <Results proposalId={proposalId} />
        </div>
      )}
    </div>
  )
}

export default App
