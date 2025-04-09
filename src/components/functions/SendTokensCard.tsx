
import React, { useState } from "react";
import { Share2, ExternalLink, CheckCircle2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import FunctionCard from "./FunctionCard";
import { TransactionStatus, isValidEthereumAddress, getTxLink } from "./utils";

interface SendTokensCardProps {
  currentChain: number | undefined;
  addTransaction: (tx: any) => void;
}

const SendTokensCard = ({ currentChain, addTransaction }: SendTokensCardProps) => {
  const [transferAmount, setTransferAmount] = useState("");
  const [transferAddress, setTransferAddress] = useState("");
  const [addressError, setAddressError] = useState("");
  const [transactionHash, setTransactionHash] = useState("");
  const [txStatus, setTxStatus] = useState<TransactionStatus>("none");

  const validateAddress = (address: string) => {
    if (!address) {
      setAddressError("Address is required");
      return false;
    } 
    if (!isValidEthereumAddress(address)) {
      setAddressError("Invalid Ethereum address");
      return false;
    }
    setAddressError("");
    return true;
  };

  const handleTransfer = async () => {
    if (!validateAddress(transferAddress)) return;
    
    try {
      setTxStatus("pending");
      toast({
        title: "Transaction Initiated",
        description: `Preparing to send ${transferAmount} ETH to ${transferAddress}`,
      });
      
      setTimeout(() => {
        const fakeHash = `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
        setTransactionHash(fakeHash);
        setTxStatus("success");
        
        const newTx = {
          hash: fakeHash,
          type: "Transfer",
          value: `${transferAmount} ETH`,
          to: transferAddress,
          timestamp: new Date().toLocaleString(),
          status: "success" as TransactionStatus,
        };
        
        addTransaction(newTx);
        
        toast({
          title: "Transaction Sent",
          description: `Successfully sent ${transferAmount} ETH to ${transferAddress}`,
        });
      }, 2000);
    } catch (error) {
      console.error(error);
      setTxStatus("failed");
      toast({
        title: "Error",
        description: "Failed to send transaction. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <FunctionCard 
      title="Send Tokens" 
      description="Transfer tokens to another address" 
      icon={Share2}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="recipient">Recipient Address</Label>
          <Input 
            id="recipient" 
            placeholder="0x..." 
            value={transferAddress} 
            onChange={(e) => {
              setTransferAddress(e.target.value);
              validateAddress(e.target.value);
            }} 
          />
          {addressError && <p className="text-destructive text-xs">{addressError}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <div className="flex items-center gap-2">
            <Input 
              id="amount" 
              type="number" 
              placeholder="0.0" 
              value={transferAmount} 
              onChange={(e) => setTransferAmount(e.target.value)} 
            />
            <Select defaultValue="eth">
              <SelectTrigger className="w-28">
                <SelectValue placeholder="Token" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="eth">ETH</SelectItem>
                <SelectItem value="usdc">USDC</SelectItem>
                <SelectItem value="dai">DAI</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Button 
          className="w-full bg-primary hover:bg-primary/90"
          disabled={!transferAddress || !transferAmount || !!addressError || txStatus === "pending"}
          onClick={handleTransfer}
        >
          {txStatus === "pending" ? (
            <div className="flex items-center">
              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
              <span>Processing...</span>
            </div>
          ) : "Send Transaction"}
        </Button>
        
        {transactionHash && txStatus === "success" && (
          <div className="bg-primary/5 p-3 rounded-md border border-primary/10 mt-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Transaction Hash:</p>
                <p className="text-xs font-mono break-all">{transactionHash}</p>
              </div>
              <a 
                href={getTxLink(transactionHash, currentChain || 1)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 text-xs flex items-center"
              >
                View <ExternalLink size={12} className="ml-1" />
              </a>
            </div>
            <div className="flex items-center text-xs text-emerald-600 mt-2">
              <CheckCircle2 size={12} className="mr-1" />
              Transaction successful
            </div>
          </div>
        )}
      </div>
    </FunctionCard>
  );
};

export default SendTokensCard;
