import { useState, useRef, useEffect } from 'react'
import { ethers } from 'ethers'

const VOTING_ADDRESS = '0x6A2A8a76eCb4944A989E2F188A08110B5F670d29'
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const durationOptions = [
    { value: '86400', label: '1 day' },
    { value: '259200', label: '3 days' },
    { value: '604800', label: '7 days' },
    { value: '1209600', label: '14 days' },
    { value: '2592000', label: '30 days' },
  ]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
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
        setError('Please add Sepolia network to MetaMask')
      } else if (err.code === 4001) {
        setError('Please approve switching to Sepolia')
      } else {
        setError('Please switch to Sepolia testnet manually')
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
      setError(`Please fill in description and add at least 2 options (currently ${finalOptions.length})`)
      return
    }

    if (!window.ethereum) {
      setError('Please install MetaMask!')
      return
    }

    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' })
      const chainIdNum = parseInt(chainId as string, 16)
      
      if (chainIdNum !== 11155111) {
        setError('Switching to Sepolia network...')
        const switched = await switchToSepolia()
        if (!switched) return
        await new Promise(r => setTimeout(r, 1500))
      }

      setIsPending(true)
      
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(VOTING_ADDRESS, VOTING_ABI, signer)

      console.log('Sending transaction:', { description, finalOptions, duration: Number(duration) })
      
      const tx = await contract.createProposal(
        description,
        finalOptions,
        Number(duration)
      )
      
      setError('')
      console.log('Transaction submitted:', tx.hash)
      
      const receipt = await tx.wait()
      console.log('Transaction confirmed:', receipt)
      
      setIsSuccess(true)
      setTimeout(() => onSuccess(), 500)
      
    } catch (error: any) {
      console.error('Failed to create proposal:', error)
      if (error.code === 4001) {
        setError('Transaction cancelled')
      } else {
        setError('Failed: ' + (error.reason || error.message))
      }
    } finally {
      setIsPending(false)
    }
  }

  if (isSuccess) {
    return <p style={{ color: '#16a34a' }}>Proposal created successfully!</p>
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
      <h2 style={{ fontFamily: 'Lora, serif', fontSize: '1.75rem', fontWeight: 400, marginBottom: '0.5rem', color: '#1a1915' }}>
        Create Proposal
      </h2>
      <p style={{ fontSize: '0.9375rem', color: '#6b6860', marginBottom: '2rem', lineHeight: 1.6 }}>
        Create a new proposal for the community to vote on.
      </p>

      {error && (
        <div style={{
          padding: '1rem 1.25rem',
          backgroundColor: error.includes('Proposal created') ? '#e6f4ea' : '#fbeae7',
          color: error.includes('Proposal created') ? '#145c2c' : '#8c2518',
          borderRadius: '12px',
          fontSize: '0.875rem',
          marginBottom: '1.5rem'
        }}>
          {error}
        </div>
      )}

      <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '2rem', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
        
        <div style={{ marginBottom: '1.75rem' }}>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#1a1915', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Question / Title</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ 
              width: '90%', 
              padding: '1rem', 
              border: '1px solid #e5e5e0', 
              borderRadius: '12px',
              fontSize: '1rem',
              fontFamily: 'DM Sans, sans-serif',
              resize: 'vertical',
              minHeight: '100px',
              outline: 'none',
              transition: 'border-color 0.15s ease',
              marginLeft: '2.5%'
            }}
            placeholder="What would you like the community to decide on?"
          />
        </div>

        <div style={{ marginBottom: '1.75rem' }}>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#1a1915', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Answer Options <span style={{ color: '#6b6860', fontWeight: 400 }}>({options.length} added)</span>
          </label>
          
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
            <input
              value={option}
              onChange={(e) => setOption(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addOption()}
              style={{ 
                flex: '1', 
                padding: '0.875rem 1rem', 
                border: '1px solid #e5e5e0', 
                borderRadius: '10px',
                fontSize: '0.9375rem',
                outline: 'none',
                transition: 'border-color 0.15s ease',
                marginLeft: '2.5%'
              }}
              placeholder="Type an option..."
            />
            <button 
              onClick={addOption} 
              style={{ 
                backgroundColor: '#f5ede4', 
                color: '#c8631a', 
                padding: '0.875rem 1.25rem', 
                borderRadius: '10px',
                border: '1px solid #f5ede4',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '0.875rem',
                transition: 'all 0.15s ease'
              }}>
              Add
            </button>
          </div>
          
          {options.map((opt, i) => (
            <div key={i} style={{ 
              padding: '0.875rem 1rem', 
              backgroundColor: '#f4f2ee', 
              borderRadius: '10px',
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ color: '#1a1915', fontSize: '0.9375rem' }}>{opt}</span>
              <button 
                onClick={() => setOptions(options.filter((_, idx) => idx !== i))}
                style={{ 
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#c8631a',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  padding: '0 0.5rem',
                  fontWeight: 300
                }}>
                ×
              </button>
            </div>
          ))}
          
          {options.length < 2 && (
            <p style={{ fontSize: '0.8125rem', color: '#9b9890', marginTop: '0.5rem' }}>Add at least 2 options</p>
          )}
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#1a1915', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Duration</label>
          <div ref={dropdownRef} style={{ position: 'relative', width: '87%', marginLeft: '2.5%' }}>
            <div
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              style={{ 
                width: '100%', 
                padding: '0.875rem 2rem 0.875rem 1rem', 
                border: '1px solid #e5e5e0', 
                borderRadius: '10px',
                fontSize: '0.9375rem',
                fontFamily: 'DM Sans, sans-serif',
                backgroundColor: '#fff',
                cursor: 'pointer',
                color: '#1a1915',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.2s ease'
              }}
            >
              <span>{durationOptions.find(o => o.value === duration)?.label}</span>
              <span style={{ color: '#c8631a', fontSize: '0.75rem', fontWeight: 500 }}>▼</span>
            </div>
            
            {isDropdownOpen && (
              <div style={{ 
                position: 'absolute', 
                top: '100%', 
                left: 0, 
                right: 0, 
                marginTop: '0.5rem',
                backgroundColor: '#fff',
                border: '1px solid #e5e5e0',
                borderRadius: '10px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                overflow: 'hidden',
                zIndex: 100
              }}>
                {durationOptions.map((option) => (
                  <div
                    key={option.value}
                    onClick={() => {
                      setDuration(option.value)
                      setIsDropdownOpen(false)
                    }}
                    style={{ 
                      padding: '0.75rem 1rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      color: duration === option.value ? '#c8631a' : '#1a1915',
                      backgroundColor: duration === option.value ? '#f5ede4' : '#fff',
                      fontWeight: duration === option.value ? 500 : 400
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f5ede4'
                      e.currentTarget.style.color = '#c8631a'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = duration === option.value ? '#f5ede4' : '#fff'
                      e.currentTarget.style.color = duration === option.value ? '#c8631a' : '#1a1915'
                    }}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={createProposal}
          disabled={isPending}
          style={{
            width: '95%',
            backgroundColor: isPending ? '#d1d1cd' : '#f5ede4',
            color: isPending ? '#fff' : '#c8631a',
            padding: '1rem',
            marginLeft: '2.5%',
            borderRadius: '10px',
            border: '1px solid #f5ede4',
            cursor: isPending ? 'not-allowed' : 'pointer',
            fontWeight: 500,
            fontSize: '0.9375rem',
            transition: 'all 0.2s ease'
          }}
        >
          {isPending ? 'Creating Proposal...' : 'Publish Proposal'}
        </button>
      </div>
    </div>
  )
}