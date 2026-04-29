import { useState, useEffect } from 'react'
import { ethers } from 'ethers'

declare global {
  interface Window {
    ethereum?: any
  }
}

const VOTING_ADDRESS = '0x6A2A8a76eCb4944A989E2F188A08110B5F670d29'
const VOTING_ABI = [
  "function getProposal(uint256) view returns (uint256 id, address creator, string description, string[] options, uint256 endTime, uint256 groupId, uint256 voteCount)",
  "function joinProposal(uint256 proposalId, uint256 identityCommitment) external",
  "function castVote(uint256 proposalId, uint256 optionIndex, uint256 nullifierHash, uint256 merkleTreeDepth, uint256 merkleTreeRoot, uint256[8] calldata points) external",
  "function getVotes(uint256 proposalId, uint256 optionIndex) view returns (uint256)",
  "function skipProofVerification() view returns (bool)",
  "function setSkipProofVerification(bool _skip) external",
  "function hasVoted(uint256 proposalId, uint256 nullifierHash) view returns (bool)"
]

export default function Vote({ proposalId }: { proposalId: number }) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [proposal, setProposal] = useState<any>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [voteCounts, setVoteCounts] = useState<number[]>([])

  // 直接用钱包地址作为标识
  const [walletAddr, setWalletAddr] = useState<string>('')

  // 获取钱包并立即检查是否已投票
  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum)
          const signer = await provider.getSigner()
          const addr = await signer.getAddress()
          setWalletAddr(addr)
          console.log('钱包:', addr)
          
          // 立即检查是否已投票
          const contract = new ethers.Contract(VOTING_ADDRESS, VOTING_ABI, provider)
          const alreadyVoted = await contract.hasVoted(proposalId, addr)
          setHasVoted(alreadyVoted)
          console.log('检查已投票:', alreadyVoted)
        } catch (err) {
          console.error('初始化失败:', err)
        }
      }
    }
    init()
  }, [proposalId])

  // 获取提案信息
  useEffect(() => {
    fetchProposal()
  }, [proposalId])

  const fetchProposal = async () => {
    if (!window.ethereum) {
      setMessage('Please install MetaMask!')
      return
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const contract = new ethers.Contract(VOTING_ADDRESS, VOTING_ABI, provider)
      const result = await contract.getProposal(proposalId)
      
      const options = result[3]
      const counts = await Promise.all(
        options.map((_: any, i: number) => contract.getVotes(proposalId, i))
      )
      
      setProposal({
        id: Number(result[0]),
        creator: result[1],
        description: result[2],
        options: options,
        endTime: Number(result[4]),
        groupId: Number(result[5]),
        voteCount: Number(result[6])
      })
      setVoteCounts(counts.map((c: any) => Number(c)))
    } catch (err: any) {
      console.error('获取提案失败:', err)
      setMessage('Failed to load proposal: ' + err.message)
    }
  }

const handleVote = async () => {
    if (selectedOption === null || !walletAddr || !proposal) return
    
    setIsLoading(true)
    setMessage('')
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(VOTING_ADDRESS, VOTING_ABI, signer)
      
      // 直接用钱包地址检查
      const alreadyVoted = await contract.hasVoted(proposalId, walletAddr)
      console.log('投前检查:', alreadyVoted)
      if (alreadyVoted) {
        setMessage('You have already voted!')
        setHasVoted(true)
        setIsLoading(false)
        return
      }

      // 1. 加入投票组
      setMessage('Joining group...')
      let joined = false
      try {
        const tx1 = await contract.joinProposal(proposalId, walletAddr)
        const receipt = await tx1.wait()
        joined = true
        console.log('已加入投票组, tx:', receipt.hash)
      } catch (e: any) {
        const errorMsg = e.message || ''
        if (errorMsg.includes('Already') || (e.data && e.data.includes('258a195a'))) {
          console.log('用户已在组中，继续投票')
          joined = true
        } else {
          console.log('加入组错误:', errorMsg)
        }
      }

      if (!joined) {
        setMessage('Failed to join group, please retry')
        setIsLoading(false)
        return
      }

      // 2. 提交投票（跳过模式）
      setMessage('Submitting vote...')
      
      const tx2 = await contract.castVote(
        proposalId,
        selectedOption,
        walletAddr,
        20,
        BigInt(0),
        [BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0)]
      )
      
      await tx2.wait()
      
      setHasVoted(true)
      setMessage('Vote successful!')
    } catch (error: any) {
      console.error('投票失败:', error)
      setMessage('Vote failed: ' + (error.reason || error.message))
    }
    setIsLoading(false)
  }

  if (!proposal) return <p style={{ padding: '2rem' }}>Loading...</p>

  const isEnded = Date.now() / 1000 > proposal.endTime

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2.5rem', alignItems: 'start' }}>
      {/* 左边：投票区域 */}
      <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <h2 style={{ fontFamily: "'Lora', serif", fontSize: '1.75rem', fontWeight: 400, marginBottom: '0.5rem', color: '#1a1915' }}>
          {proposal.description}
        </h2>
        
        <div style={{ fontSize: '0.8125rem', color: '#6b6860', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <span>{proposal.creator?.slice(0, 6)}...{proposal.creator?.slice(-4)}</span>
          <span>{new Date(proposal.endTime * 1000 - 86400000 * 3).toLocaleDateString()}</span>
          <span style={{ color: isEnded ? '#6b6860' : '#c8631a', fontWeight: 500 }}>
            {isEnded ? 'Ended' : 'Active'} · {proposal.voteCount} votes
          </span>
        </div>

        {message && (
          <div style={{
            padding: '0.875rem 1rem',
            borderRadius: '10px',
            backgroundColor: message.includes('success') || message.includes('Vote successful') ? '#e6f4ea' : '#fbeae7',
            color: message.includes('success') || message.includes('Vote successful') ? '#145c2c' : '#8c2518',
            marginBottom: '1.25rem',
            fontSize: '0.875rem'
          }}>
            {message}
          </div>
        )}

        <h3 style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#6b6860', marginBottom: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Choose your answer
        </h3>

        {hasVoted ? (
          <div style={{ padding: '1.25rem', backgroundColor: '#e6f4ea', borderRadius: '12px', border: '1px solid #22c55e' }}>
            <p style={{ color: '#145c2c', fontWeight: 500, fontSize: '1rem' }}>✓ You have voted</p>
          </div>
        ) : isEnded ? (
          <div style={{ padding: '1.25rem', backgroundColor: '#ece9e3', borderRadius: '12px' }}>
            <p style={{ color: '#6b6860', fontSize: '0.9375rem' }}>Voting has ended</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
              {proposal.options.map((opt: string, i: number) => {
                const count = voteCounts[i] || 0
                const total = voteCounts.reduce((a: number, b: number) => a + b, 0)
                const pct = total > 0 ? Math.round(count / total * 100) : 0
                return (
                  <div
                    key={i}
                    onClick={() => setSelectedOption(i)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '14px 16px',
                      border: '1px solid',
                      borderColor: selectedOption === i ? '#c8631a' : '#e5e5e0',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                      backgroundColor: selectedOption === i ? '#f5ede4' : '#ffffff',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      height: '100%',
                      width: pct + '%',
                      background: '#f5ede4',
                      zIndex: 0
                    }} />
                    <div style={{
                      width: '17px',
                      height: '17px',
                      borderRadius: '50%',
                      border: '1px solid',
                      borderColor: selectedOption === i ? '#c8631a' : '#d1d1cd',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: selectedOption === i ? '#c8631a' : 'transparent',
                      zIndex: 1
                    }}>
                      {selectedOption === i && (
                        <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#fff' }} />
                      )}
                    </div>
                    <span style={{ flex: 1, zIndex: 1 }}>{opt}</span>
                    <span style={{ fontSize: '0.8125rem', color: '#6b6860', zIndex: 1 }}>
                      {total > 0 ? pct + '%' : ''}
                    </span>
                  </div>
                )
              })}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={handleVote}
                disabled={selectedOption === null || isLoading || !walletAddr}
                style={{
                  padding: '14px 24px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: selectedOption === null ? '#d1d1cd' : '#c8631a',
                  color: '#fff',
                  cursor: selectedOption === null ? 'not-allowed' : 'pointer',
                  fontWeight: 500,
                  fontSize: '0.9375rem',
                  transition: 'all 0.15s ease'
                }}
              >
                {isLoading ? 'Processing...' : 'Submit Vote'}
              </button>
              {!walletAddr && (
                <span style={{ fontSize: '0.75rem', color: '#6b6860' }}>Please connect wallet first</span>
              )}
            </div>
          </>
        )}
      </div>

{/* 右边：结果 */}
      <div style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ backgroundColor: '#fff', border: '1px solid #e5e5e0', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <h4 style={{ fontSize: '0.6875rem', fontWeight: 500, color: '#6b6860', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1rem' }}>
          Results
          </h4>
          <div style={{ display: 'grid', gap: '0.625rem' }}>
            {proposal.options.map((opt: string, i: number) => {
              const count = voteCounts[i] || 0
              const total = voteCounts.reduce((a: number, b: number) => a + b, 0) || 1
              const pct = Math.round(count / total * 100)
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8125rem' }}>
                  <span style={{ width: '110px', color: '#1a1915', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {opt}
                  </span>
                  <div style={{ flex: 1, height: '6px', background: '#ece9e3', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: pct + '%', height: '100%', background: '#c8631a', borderRadius: '3px', transition: 'width 0.4s ease' }} />
                  </div>
                  <span style={{ width: '36px', textAlign: 'right', color: '#6b6860', fontWeight: 500 }}>{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', border: '1px solid #e5e5e0', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <h4 style={{ fontSize: '0.6875rem', fontWeight: 500, color: '#6b6860', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1rem' }}>
          Info
          </h4>
          <div style={{ display: 'grid', gap: '0.375rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #ece9e3' }}>
              <span style={{ color: '#6b6860' }}>Status</span>
              <span style={{ fontWeight: 500, color: isEnded ? '#6b6860' : '#c8631a' }}>{isEnded ? 'Ended' : 'Active'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #ece9e3' }}>
              <span style={{ color: '#6b6860' }}>Total Votes</span>
              <span style={{ fontWeight: 500 }}>{proposal.voteCount}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #ece9e3' }}>
              <span style={{ color: '#6b6860' }}>Options</span>
              <span style={{ fontWeight: 500 }}>{proposal.options.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
              <span style={{ color: '#6b6860' }}>Deadline</span>
              <span style={{ fontWeight: 500 }}>{new Date(proposal.endTime * 1000).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
