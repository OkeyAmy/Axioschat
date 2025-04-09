
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FunctionCard } from "./FunctionCard";
import { Share2, ExternalLink, CheckCircle2 } from "lucide-react";
import { useWeb3 } from "@/hooks/useWeb3";
import { sendTransaction, getTxUrl } from "@/utils/blockchain";
import { toast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TransferSectionProps {
  currentChain: number;
}

type TransactionStatus = "pending" | "success" | "failed" | "none";

const isValidEthereumAddress = (address: string) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

const TransferSection: React.FC<TransferSectionProps> = ({ currentChain }) => {
  const { web3, address } = useWeb3();
  const [transferAmount, setTransferAmount] = useState("");
  const [transferAddress, setTransferAddress] = useState("");
  const [addressError, setAddressError] = useState("");
  const [transactionHash, setTransactionHash] = useState("");
  const [txStatus, setTxStatus] = useState<TransactionStatus>("none");
  const [selectedToken, setSelectedToken] = useState("eth");

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
    if (!web3 || !address) {
      toast({
        title: "Error",
        description: "Web3 not initialized or wallet not connected",
        variant: "destructive",
      });
      return;
    }

    try {
      setTxStatus("pending");
      toast({
        title: "Transaction Initiated",
        description: `Preparing to send ${transferAmount} ETH to ${transferAddress}`,
      });

      const txHash = await sendTransaction(web3, {
        from: address,
        to: transferAddress,
        value: transferAmount
      });

      setTransactionHash(txHash);
      setTxStatus("success");

      toast({
        title: "Transaction Sent",
        description: `Successfully sent ${transferAmount} ETH to ${transferAddress}`,
      });
    } catch (error: any) {
      console.error("Transfer error:", error);
      setTxStatus("failed");
      toast({
        title: "Error",
        description: error.message || "Failed to send transaction. Please try again.",
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
            <Select 
              defaultValue="eth" 
              value={selectedToken}
              onValueChange={setSelectedToken}
            >
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
          disabled={!transferAddress || !transferAmount || !!addressError || txStatus === "pending" || !web3}
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
                href={getTxUrl(currentChain, transactionHash)}
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

export default TransferSection;
