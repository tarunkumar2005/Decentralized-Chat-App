"use client";

import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '@/hooks/use-web3';
import ChatABI from '@/lib/abi.json';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { useContractEvents } from '@/hooks/use-contract-events';
import { toast } from '@/hooks/use-toast';

interface Message {
  sender: string;
  content: string;
  timestamp: Date;
}

export default function ChatPage() {
  const { provider, account, connectWallet, loading } = useWeb3();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;

  const loadMessages = async () => {
    if (!provider) return;
    
    try {
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        contractAddress,
        ChatABI.abi,
        signer
      );
      
      const rawMessages = await contract.getAllMessages();
      const formatted = rawMessages.map((msg: any) => ({
        sender: msg.sender,
        content: msg.content,
        timestamp: new Date(Number(msg.timestamp) * 1000)
      }));
      
      setMessages(formatted.reverse());
    } catch (error) {
      toast({
        title: "Error Loading Messages",
        description: error instanceof Error ? error.message : "Failed to load messages",
        variant: "destructive"
      });
    }
  };

  const sendMessage = async () => {
    if (!provider || !newMessage.trim()) return;
    setSending(true);
    
    try {
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        contractAddress,
        ChatABI.abi,
        signer
      );
      
      const tx = await contract.sendMessage(newMessage.trim());
      await tx.wait();
      setNewMessage('');
      await loadMessages();
    } catch (error) {
      toast({
        title: "Error Sending Message",
        description: error instanceof Error ? error.message : "Transaction failed",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  useContractEvents(provider, loadMessages);

  {!provider && !loading && (
    <div className="text-center p-4">
      <Button onClick={connectWallet}>
        Connect to BuildBear Network
      </Button>
      <p className="mt-2 text-muted-foreground text-sm">
        Please connect to the BuildBear network to continue
      </p>
    </div>
  )}

  useEffect(() => {
    if (provider) {
      loadMessages();
      const interval = setInterval(loadMessages, 15000);
      return () => clearInterval(interval);
    }
  }, [provider]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <Skeleton className="h-[40px] w-full mb-4" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-[80px] w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Decentralized Chat</span>
            {!account ? (
              <Button onClick={connectWallet}>Connect Wallet</Button>
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">
                  Connected: {account.slice(0, 6)}...{account.slice(-4)}
                </span>
                <Avatar className="h-6 w-6">
                  <AvatarFallback>
                    {account.slice(2, 4).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 h-[60vh] overflow-y-auto">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No messages yet. Be the first to say something!
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className="flex gap-4">
                <Avatar>
                  <AvatarFallback>
                    {msg.sender.slice(2, 4).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {msg.sender === account ? 'You' : msg.sender.slice(0, 8)}...
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(msg.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                  <p className="mt-1 text-foreground">{msg.content}</p>
                </div>
              </div>
            ))
          )}
        </CardContent>

        <CardFooter>
          <div className="flex w-full gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={!account || sending}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
            <Button 
              onClick={sendMessage}
              disabled={!account || sending || !newMessage.trim()}
            >
              {sending ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}