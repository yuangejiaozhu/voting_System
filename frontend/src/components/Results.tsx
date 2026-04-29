import { useState, useEffect } from 'react'
import { ethers } from 'ethers'

const VOTING_ADDRESS = '0x81620fF38807e55c59E7d4ccC18657F8013F08fA'
const VOTING_ABI = [
  "function getProposal(uint256) view returns (uint256 id, address creator, string description, string[] options, uint256 endTime, uint256 groupId, uint256 voteCount)",
  "function getVotes(uint256 proposalId, uint256 optionIndex) view returns (uint256)"
]

export default function Results({ proposalId }: { proposalId: number }) {
  const [proposal, setProposal] = useState<any>(null)
  const [votes, setVotes] = useState<Array<{option: string, count: number}>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchResults()
  }, [proposalId])

  const fetchResults = async () => {
    if (!window.ethereum) return
    setLoading(true)
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const contract = new ethers.Contract(VOTING_ADDRESS, VOTING_ABI, provider)
      
      const result = await contract.getProposal(proposalId)
      setProposal({
        id: Number(result[0]),
        description: result[2],
        options: result[3],
        endTime: Number(result[4]),
        voteCount: Number(result[6])
      })

      const votesData = []
      for (let i = 0; i < result[3].length; i++) {
        const count = await contract.getVotes(proposalId, i)
        votesData.push({ option: result[3][i], count: Number(count) })
      }
      setVotes(votesData)
    } catch (err: any) {
      console.error('获取结果失败:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <p className="empty">加载中...</p>
  if (!proposal) return <p>提案不存在</p>

  const total = votes.reduce((a, v) => a + v.count, 0)

  return (
    <div className="sidebar-card">
      <h4 className="sidebar-card-h4">投票结果</h4>
      
      {votes.map((v, i) => {
        const pct = total > 0 ? Math.round(v.count / total * 100) : 0
        return (
          <div key={i} className="result-row">
            <div className="result-bar" style={{ width: pct + '%' }} />
            <div className="result-content">
              <span className="result-label">{v.option}</span>
              <span className="result-pct">{v.count} 票 ({pct}%)</span>
            </div>
          </div>
        )
      })}
      
      <div className="sidebar-stat">
        <span>总票数</span>
        <span className="sidebar-stat-val">{total}</span>
      </div>
      <div className="sidebar-stat">
        <span>结束时间</span>
        <span className="sidebar-stat-val">{new Date(proposal.endTime * 1000).toLocaleDateString()}</span>
      </div>
    </div>
  )
}
