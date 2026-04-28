import { createConfig } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { metaMask } from 'wagmi/connectors'
import { http } from 'wagmi'

export const config = createConfig({
  chains: [sepolia],
  connectors: [metaMask()],
  transports: {
    [sepolia.id]: http('https://sepolia.infura.io/v3/a8c81c57aa69486babfe1c30edfcdf4e'),
  },
})
