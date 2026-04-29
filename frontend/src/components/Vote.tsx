import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { Identity } from '@semaphore-protocol/identity'

const VOTING_ADDRESS = '0x81620fF38807e55c59E7d4ccC18657F8013F08fA'
const VOTING_ABI = [
  "function getProposal(uint256) view returns (uint256 id, address creator, string description, string[] options, uint256 endTime, uint256 groupId, uint256 voteCount)",
  "function joinProposal(uint256 proposalId, uint256 identityCommitment) external",
  "function castVote(uint256 proposalId, uint256 optionIndex, uint256 nullifier, uint256 merkleTreeDepth, uint256 merkleTreeRoot, uint256[8] calldata points) external",
  "function getVotes(uint256 proposalId, uint256 optionIndex) view returns (uint256)"
]

export default function Vote({ proposalId }: { proposalId: number }) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [proposal, setProposal] = useState<any>(null)
  const [identity, setIdentity] = useState<Identity | null>(null)
  const [hasVoted, setHasVoted] = useState(false)

  // 初始化身份
  useEffect(() => {
    let stored = localStorage.getItem('voting_identity')
    if (!stored) {
      const newIdentity = new Identity()
      localStorage.setItem('voting_identity', newIdentity.toString())
      setIdentity(newIdentity)
    } else {
      try {
        const id = Identity.import(stored)
        setIdentity(id)
      } catch (e) {
        const newIdentity = new Identity()
        localStorage.setItem('voting_identity', newIdentity.toString())
        setIdentity(newIdentity)
      }
    }
  }, [])

  // 检查是否已投票（localStorage）
  useEffect(() => {
    if (proposalId && identity) {
      const votedKey = `voted_${proposalId}_${identity.commitment.toString()}`
      const hasVotedBefore = localStorage.getItem(votedKey) === 'true'
      setHasVoted(hasVotedBefore)
    }
  }, [proposalId, identity])

  // 获取提案信息
  useEffect(() => {
    fetchProposal()
  }, [proposalId])

  const fetchProposal = async () => {
    if (!window.ethereum) {
      setMessage('请安装 MetaMask！')
      return
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const contract = new ethers.Contract(VOTING_ADDRESS, VOTING_ABI, provider)
      const result = await contract.getProposal(proposalId)
      
      setProposal({
        id: Number(result[0]),
        creator: result[1],
        description: result[2],
        options: result[3],
        endTime: Number(result[4]),
        groupId: Number(result[5]),
        voteCount: Number(result[6])
      })

      // 获取各选项票数
      const votes = []
      for (let i = 0; i < result[3].length; i++) {
        const voteCount = await contract.getVotes(proposalId, i)
        votes.push({ option: result[3][i], count: Number(voteCount) })
      }
      setProposal((prev: any) => ({ ...prev, votes }))
    } catch (err: any) {
      console.error('获取提案失败:', err)
      setMessage('获取提案失败: ' + err.message)
    }
  }

  const handleVote = async () => {
    if (selectedOption === null || !identity || !proposal) return
    
    setIsLoading(true)
    setMessage('')
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(VOTING_ADDRESS, VOTING_ABI, signer)

      // 0. 检查是否已投票（localStorage）
      const votedKey = `voted_${proposalId}_${identity.commitment.toString()}`
      if (localStorage.getItem(votedKey) === 'true') {
        setMessage('您已经投过票了！')
        setHasVoted(true)
        setIsLoading(false)
        return
      }

      // 1. 加入投票组
      setMessage('正在加入投票组...')
      try {
        const tx1 = await contract.joinProposal(proposalId, identity.commitment.toString())
        await tx1.wait()
        console.log('已加入投票组')
      } catch (e: any) {
        if (!e.message.includes('already')) {
          console.log('加入组:', e.message)
        }
      }

      // 2. 提交投票（简化版，跳过 ZK 证明）
      setMessage('正在提交投票...')
      
      // 用 identity commitment 作为 nullifier（防止重复投票）
      const nullifier = identity.commitment.toString()
      
      const tx2 = await contract.castVote(
        proposalId,
        selectedOption,
        nullifier, // 使用 identity commitment
        3, // merkleTreeDepth (简化)
        12345, // merkleTreeRoot (简化)
        [1, 2, 3, 4, 5, 6, 7, 8] // points (简化)
      )
      
      await tx2.wait()
      
      // 记录已投票（localStorage）
      localStorage.setItem(votedKey, 'true')
      
      setHasVoted(true)
      setMessage('投票成功！（简化版，已跳过 ZK 证明）')
      fetchProposal() // 刷新票数
    } catch (error: any) {
      console.error('投票失败:', error)
      setMessage('投票失败: ' + (error.reason || error.message))
    }
    setIsLoading(false)
  }

  if (!proposal) return <p className="empty">加载中...</p>

  const isEnded = Date.now() / 1000 > proposal.endTime

  return (
    <div className="vote-section">
      <h2 className="vote-section-h3">#{proposal.id}: {proposal.description}</h2>
      
      {proposal.votes && (
        <div className="vote-options">
          <p className="vote-section-h3">实时票数：</p>
          {proposal.votes.map((v: any, i: number) => {
            const total = proposal.votes.reduce((a: number, b: any) => a + b.count, 0)
            const pct = total > 0 ? Math.round(v.count / total * 100) : 0
            return (
              <div key={i} className="vote-option">
                <div className="vo-bar" style={{ width: pct + '%' }} />
                <div className="vo-content">
                  <span className="vo-label">{v.option}</span>
                  <span className="vo-pct">{v.count} 票 ({pct}%)</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {message && (
        <div className={`toast ${message.includes('成功') ? 'toast-success' : 'toast-error'}`}>
          <span className="toast-icon">{message.includes('成功') ? '✓' : '✕'}</span>
          <span>{message}</span>
        </div>
      )}

      {hasVoted ? (
        <p style={{ color: '#16a34a', fontWeight: 500 }}>✓ 您已完成投票</p>
      ) : isEnded ? (
        <p className="vote-hint">投票已结束</p>
      ) : (
        <>
          <div className="vote-options">
            <p className="vote-section-h3">选择选项：</p>
            {proposal.options.map((opt: string, i: number) => (
              <div
                key={i}
                onClick={() => setSelectedOption(i)}
                className={`vote-option ${selectedOption === i ? 'selected' : ''}`}
              >
                <div className="vo-radio">
                  <div className="vo-dot"></div>
                </div>
                <span className="vo-label">{opt}</span>
              </div>
            ))}
          </div>

          <div className="vote-actions">
            <div className="vote-hint">
              <span>ⓘ</span>
              <span>连接钱包以投票</span>
            </div>
            <button
              onClick={handleVote}
              disabled={selectedOption === null || isLoading || !identity}
              className="btn btn-primary"
            >
              {isLoading ? '处理中...' : '提交匿名投票（简化版）'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}