import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import CreateProposal from './components/CreateProposal'
import Vote from './components/Vote'
import Results from './components/Results'

const VOTING_ADDRESS = '0x6A2A8a76eCb4944A989E2F188A08110B5F670d29'
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
  const [proposals, setProposals] = useState<Array<{id: number, description: string, hasVoted?: boolean}>>([])
  const [loading, setLoading] = useState(false)

  // 自动恢复钱包连接
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
        if (accounts.length > 0) {
          setAddress(accounts[0])
          setIsConnected(true)
          setLog('Connection Restored')
        }
      }).catch(() => {})
      
      // 监听账户变化
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          setAddress('')
          setIsConnected(false)
          setLog('Wallet disconnected')
        } else {
          setAddress(accounts[0])
          setIsConnected(true)
        }
      })
    }
  }, [])

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
      console.error('Failed to fetch proposals:', err)
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
    setLog('Connecting...')
    try {
      if (typeof window.ethereum === 'undefined') {
        setLog('Please install MetaMask!')
        return
      }
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      setAddress(accounts[0])
      setIsConnected(true)
      setLog('Connected!')
    } catch (error: any) {
      setLog('Connection failed: ' + error.message)
    }
  }

  const disconnect = () => {
    setAddress('')
    setIsConnected(false)
    setLog('Wallet disconnected')
  }

  return (
    <div style={{ padding: '3rem 2rem', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ fontFamily: "'Lora', serif", fontSize: '1.75rem', fontWeight: 400, color: '#1a1915' }}>VoteChain</h1>
        <div>
          {isConnected ? (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
              <button 
                onClick={disconnect} 
                style={{ 
                  backgroundColor: '#fbeae7', 
                  color: '#8c2518', 
                  padding: '0.625rem 1.25rem', 
                  borderRadius: '8px',
                  border: '1px solid #fbeae7',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '0.8125rem',
                  transition: 'all 0.15s ease'
                }}
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={connectMetaMask}
              style={{ 
                backgroundColor: '#c8631a', 
                color: 'white', 
                padding: '0.625rem 1.5rem', 
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '0.875rem',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(200, 99, 26, 0.25)'
              }}
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>

      {log && (
        <div style={{ 
          backgroundColor: log.includes('success') ? '#dcfce7' : '#fee2e2', 
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
              backgroundColor: '#f5ede4', 
              color: '#c8631a', 
              padding: '0.75rem 1.5rem', 
              borderRadius: '10px',
              border: '1px solid #f5ede4',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '0.9375rem',
              width: 'fit-content',
              transition: 'all 0.2s ease'
            }}
          >
            Create New Proposal
          </button>

          <div style={{ backgroundColor: 'white', padding: '1.75rem', borderRadius: '16px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontFamily: "'Lora', serif", fontSize: '1.25rem', fontWeight: 400 }}>Proposals</h2>
              <button onClick={fetchProposals} disabled={loading} style={{ fontSize: '0.75rem', color: '#c8631a', background: 'none', border: 'none', cursor: 'pointer' }}>
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            {proposals.length === 0 ? (
              <p style={{ color: '#6b6860' }}>{loading ? 'Loading...' : 'No proposals yet'}</p>
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
              Contract: 0x6A2A8a76eCb4944A989E2F188A08110B5F670d29
            </p>
          </div>
        </div>
      )}

      {page === 'create' && (
        <div style={{ padding: '2rem' }}>
          <button onClick={() => setPage('home')} style={{ 
              backgroundColor: '#f5ede4', 
              color: '#c8631a', 
              padding: '0.625rem 1rem', 
              borderRadius: '10px',
              border: '1px solid #f5ede4',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '0.875rem',
              transition: 'all 0.2s ease',
              marginBottom: '1rem'
            }}>
            ← Home
          </button>
          <CreateProposal onSuccess={() => setPage('home')} />
        </div>
      )}

      {page === 'vote' && (
        <div style={{ padding: '2rem' }}>
          <button onClick={() => setPage('home')} style={{ 
              backgroundColor: '#f5ede4', 
              color: '#c8631a', 
              padding: '0.625rem 1rem', 
              borderRadius: '10px',
              border: '1px solid #f5ede4',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '0.875rem',
              transition: 'all 0.2s ease',
              marginBottom: '1rem'
            }}>
            ← Home
          </button>
          <Vote proposalId={proposalId} />
        </div>
      )}

      {page === 'results' && (
        <div style={{ padding: '2rem' }}>
          <button onClick={() => setPage('home')} style={{ 
              backgroundColor: '#f5ede4', 
              color: '#c8631a', 
              padding: '0.625rem 1rem', 
              borderRadius: '10px',
              border: '1px solid #f5ede4',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '0.875rem',
              transition: 'all 0.2s ease',
              marginBottom: '1rem'
            }}>
            ← Home
          </button>
          <Results proposalId={proposalId} />
        </div>
      )}
    </div>
  )
}

export default App
