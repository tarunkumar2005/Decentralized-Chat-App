"use client";

import { useEffect } from 'react';
import { ethers } from 'ethers';
import ChatABI from '@/lib/abi.json';

export const useContractEvents = (provider: ethers.BrowserProvider | null, callback: () => void) => {
  useEffect(() => {
    if (!provider || !process.env.NEXT_PUBLIC_CONTRACT_ADDRESS) return;

    const contract = new ethers.Contract(
      process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
      ChatABI.abi,
      provider
    );

    contract.on("NewMessage", callback);

    return () => {
      contract.removeAllListeners("NewMessage");
    };
  }, [provider, callback]);
};