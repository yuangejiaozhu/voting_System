import { useReadContract } from 'wagmi'

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
  }
] as const

function Results({ proposalId }: { proposalId: number }) {
  const { data: proposal } = useReadContract({
    address: VOTING_ADDRESS,
    abi: VOTING_ABI,
    functionName: 'getProposal',
    args: [BigInt(proposalId)],
  })

  if (!proposal) return <p>加载中...</p>

  const [id, creator, description, options, endTime, groupId, voteCount] = proposal as any[]

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">{description}</h2>
      <div className="bg-gray-50 p-4 rounded">
        {options.map((opt: string, i: number) => (
          <div key={i} className="flex justify-between p-2">
            <span>{opt}</span>
            <span>0 票</span>
          </div>
        ))}
        <div className="mt-4 pt-4 border-t">
          <p>总票数: {voteCount?.toString()}</p>
        </div>
      </div>
    </div>
  )
}

export default Results
