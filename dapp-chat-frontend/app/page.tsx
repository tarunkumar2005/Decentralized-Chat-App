import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl text-center space-y-8">
        <h1 className="text-4xl font-bold">Decentralized Chat</h1>
        <p className="text-muted-foreground text-lg">
          Secure, blockchain-powered messaging application
        </p>
        <Button asChild size="lg">
          <Link href="/chat">Start Chatting</Link>
        </Button>
      </div>
    </div>
  );
}