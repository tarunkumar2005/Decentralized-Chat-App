"use client";

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { toast } from '@/hooks/use-toast';

declare global {
  interface Window {
    ethereum?: any;
  }
}

async function checkAndSwitchNetwork(ethereum: any) {
  const chainIdDecimal = process.env.NEXT_PUBLIC_CHAIN_ID;
  if (!chainIdDecimal) throw new Error("Chain ID not configured");
  
  // Convert decimal chain ID to hex
  const chainIdHex = `0x${parseInt(chainIdDecimal).toString(16)}`;

  const currentChainId = await ethereum.request({ method: 'eth_chainId' });

  if (currentChainId !== chainIdHex) {
    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }]
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: chainIdHex,
            chainName: process.env.NEXT_PUBLIC_CHAIN_NAME,
            nativeCurrency: {
              name: process.env.NEXT_PUBLIC_NATIVE_CURRENCY_NAME,
              symbol: process.env.NEXT_PUBLIC_NATIVE_CURRENCY_SYMBOL,
              decimals: parseInt(process.env.NEXT_PUBLIC_NATIVE_CURRENCY_DECIMALS || '18', 10)
            },
            rpcUrls: [process.env.NEXT_PUBLIC_RPC_URL],
            blockExplorerUrls: [process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL]
          }]
        });
      } else {
        throw switchError;
      }
    }
  }
}

export const useWeb3 = () => {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) throw new Error("No crypto wallet found");
      
      await checkAndSwitchNetwork(window.ethereum);
      
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      const newProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(newProvider);
      setAccount(accounts[0]);
      toast({ title: "Wallet Connected", description: `Connected as ${accounts[0].slice(0, 6)}...` });

      // Chain changed handler
      const handleChainChanged = (chainId: string) => {
        if (chainId !== process.env.NEXT_PUBLIC_CHAIN_ID) {
          setProvider(null);
          setAccount(null);
          toast({
            title: "Network Changed",
            description: "Please connect using the correct network",
            variant: "destructive"
          });
        }
      };

      // Account changed handler
      const handleAccountsChanged = (accounts: string[]) => {
        setAccount(accounts[0] || null);
      };

      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('accountsChanged', handleAccountsChanged);

      return () => {
        window.ethereum?.removeListener('chainChanged', handleChainChanged);
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      };

    } catch (error) {
      toast({
        title: "Connection Error",
        description: error instanceof Error ? error.message : "Failed to connect wallet",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    const checkWallet = async () => {
      if (window.ethereum?.isMetaMask) {
        try {
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          if (chainId !== process.env.NEXT_PUBLIC_CHAIN_ID) {
            setLoading(false);
            return;
          }

          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            const provider = new ethers.BrowserProvider(window.ethereum);
            setProvider(provider);
            setAccount(accounts[0]);
          }
        } catch (error) {
          console.error("Error checking wallet:", error);
        }
      }
      setLoading(false);
    };

    checkWallet();
  }, []);

  return { provider, account, connectWallet, loading };
};