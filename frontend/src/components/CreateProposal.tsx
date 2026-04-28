import { useState } from 'react'
import { useWriteContract } from 'wagmi'

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

export default function CreateProposal({ onSuccess }: { onSuccess: () => void }) {
  const [description, setDescription] = useState('')
  const [option, setOption] = useState('')
  const [options, setOptions] = useState<string[]>([])
  const [duration, setDuration] = useState('86400')
  const [isCreated, setIsCreated] = useState(false)

  const { writeContract, isPending } = useWriteContract()

  const addOption = () => {
    if (option.trim()) {
      setOptions([...options, option.trim()])
      setOption('')
    }
  }

  const createProposal = () => {
    if (!description.trim() || options.length < 2) return
    writeContract({
      address: VOTING_ADDRESS,
      abi: VOTING_ABI,
      functionName: 'createProposal',
      args: [description, options, BigInt(duration)],
    })
    setIsCreated(true)
    setTimeout(() => {
      onSuccess()
    }, 2000)
  }

  if (isCreated) {
    return <p style={{ color: '#16a34a' }}>提案创建成功！</p>
  }

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <div>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>提案描述</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
          rows={3}
        />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>选项</label>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <input
            value={option}
            onChange={(e) => setOption(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addOption()}
            style={{ flex: '1', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
          />
          <button onClick={addOption} style={{ backgroundColor: '#3b82f6', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem' }}>
            添加
          </button>
        </div>
        {options.map((opt, i) => (
          <div key={i} style={{ padding: '0.5rem', backgroundColor: '#f9fafb', borderRadius: '0.25rem' }}>{opt}</div>
        ))}
      </div>
      <button
        onClick={createProposal}
        disabled={isPending}
        style={{ width: '100%', backgroundColor: '#22c55e', color: 'white', padding: '0.75rem', borderRadius: '0.25rem', opacity: isPending ? '0.5' : '1' }}
      >
        {isPending ? '创建中...' : '创建提案'}
      </button>
    </div>
  )
}
