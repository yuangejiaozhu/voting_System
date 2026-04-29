import { useState } from 'react'
import { ethers } from 'ethers'

const VOTING_ADDRESS = '0x81620fF38807e55c59E7d4ccC18657F8013F08fA'
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
]

export default function CreateProposal({ onSuccess }: { onSuccess: () => void }) {
  const [description, setDescription] = useState('')
  const [option, setOption] = useState('')
  const [options, setOptions] = useState<string[]>([])
  const [duration, setDuration] = useState('86400')
  const [error, setError] = useState<string>('')
  const [isPending, setIsPending] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const addOption = () => {
    if (option.trim() && !options.includes(option.trim())) {
      setOptions([...options, option.trim()])
      setOption('')
    }
  }

  const switchToSepolia = async () => {
    try {
      await window.ethereum?.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }],
      })
      return true
    } catch (err: any) {
      if (err.code === 4902) {
        setError('请在 MetaMask 中添加 Sepolia 测试网')
      } else if (err.code === 4001) {
        setError('请同意切换到 Sepolia 网络')
      } else {
        setError('请手动切换到 Sepolia 测试网')
      }
      return false
    }
  }

  const createProposal = async () => {
    setError('')
    
    let finalOptions = [...options]
    if (option.trim() && !options.includes(option.trim())) {
      finalOptions.push(option.trim())
    }
    
    if (!description.trim() || finalOptions.length < 2) {
      setError(`请填写描述并至少添加2个选项（当前已添加 ${finalOptions.length} 个）`)
      return
    }

    if (!window.ethereum) {
      setError('请安装 MetaMask！')
      return
    }

    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' })
      const chainIdNum = parseInt(chainId as string, 16)
      
      if (chainIdNum !== 11155111) {
        setError('正在切换到 Sepolia 网络...')
        const switched = await switchToSepolia()
        if (!switched) return
        await new Promise(r => setTimeout(r, 1500))
      }

      setIsPending(true)
      
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(VOTING_ADDRESS, VOTING_ABI, signer)

      console.log('发送交易:', { description, finalOptions, duration: Number(duration) })
      
      const tx = await contract.createProposal(
        description,
        finalOptions,
        Number(duration)
      )
      
      setError('')
      console.log('交易已提交:', tx.hash)
      
      const receipt = await tx.wait()
      console.log('交易已确认:', receipt)
      
      setIsSuccess(true)
      setTimeout(() => onSuccess(), 500)
      
    } catch (error: any) {
      console.error('创建提案失败:', error)
      if (error.code === 4001) {
        setError('已取消交易')
      } else {
        setError('创建失败: ' + (error.reason || error.message))
      }
    } finally {
      setIsPending(false)
    }
  }

  if (isSuccess) {
    return <p style={{ color: '#16a34a' }}>提案创建成功！</p>
  }

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {error && (
        <div style={{
          padding: '0.75rem',
          backgroundColor: error.includes('成功') ? '#dcfce7' : '#fee2e2',
          color: error.includes('成功') ? '#166534' : '#991b1b',
          borderRadius: '0.25rem'
        }}>
          {error}
        </div>
      )}
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
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>选项（已添加 {options.length} 个）</label>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <input
            value={option}
            onChange={(e) => setOption(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addOption()}
            style={{ flex: '1', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
            placeholder="输入选项后按Enter或点击添加"
          />
          <button onClick={addOption} style={{ backgroundColor: '#3b82f6', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem' }}>
            添加
          </button>
        </div>
        {options.map((opt, i) => (
          <div key={i} style={{ padding: '0.5rem', backgroundColor: '#f9fafb', borderRadius: '0.25rem' }}>{opt}</div>
        ))}
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>投票期限（秒）</label>
        <input
          type="number"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
        />
      </div>
      <button
        onClick={createProposal}
        disabled={isPending}
        style={{
          width: '100%',
          backgroundColor: isPending ? '#9ca3af' : '#22c55e',
          color: 'white',
          padding: '0.75rem',
          borderRadius: '0.25rem',
          border: 'none',
          cursor: isPending ? 'not-allowed' : 'pointer'
        }}
      >
        {isPending ? '交易中...' : '创建提案'}
      </button>
    </div>
  )
}
