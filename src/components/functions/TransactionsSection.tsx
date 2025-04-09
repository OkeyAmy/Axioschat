import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowUpRight, Search } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { estimateGas, sendTransaction } from '@/utils/blockchain';
import useWeb3 from '@/hooks/useWeb3';
import { useTransactionQueue } from '@/hooks/useTransactionQueue';

const TransactionsSection: React.FC = () => {
  const { web3, isReady, address, chainId } = useWeb3();
  const { addTransaction } = useTransactionQueue();
  
  const [toAddress, setToAddress] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [gasPrice, setGasPrice] = useState<string>('');
  const [data, setData] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [estimatedGas, setEstimatedGas] = useState<string | null>(null);

  const handleEstimateGas = async () => {
    if (!web3 || !isReady || !address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to estimate gas.",
        variant: "destructive",
      });
      return;
    }

    if (!toAddress) {
      toast({
        title: "Missing recipient",
        description: "Please enter a recipient address.",
        variant: "destructive",
      });
      return;
    }

    try {
      const amountWei = amount ? web3.utils.toWei(amount, 'ether') : '0';
      
      const gas = await estimateGas(
        web3,
        address,
        toAddress,
        amountWei,
        data || '0x'
      );
      
      setEstimatedGas(gas);
      
      toast({
        title: "Gas Estimation",
        description: `Estimated gas: ${gas}`,
      });
    } catch (error) {
      console.error("Error estimating gas:", error);
      
      toast({
        title: "Gas Estimation Error",
        description: error instanceof Error ? error.message : "Failed to estimate gas",
        variant: "destructive",
      });
    }
  };

  const handleSendTransaction = async () => {
    if (!web3 || !isReady || !address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to send transactions.",
        variant: "destructive",
      });
      return;
    }

    if (!toAddress) {
      toast({
        title: "Missing recipient",
        description: "Please enter a recipient address.",
        variant: "destructive",
      });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount greater than 0.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      const amountWei = web3.utils.toWei(amount, 'ether');
      
      const receipt = await sendTransaction(
        web3,
        address,
        toAddress,
        amountWei,
        data || '0x'
      );

      if (receipt && receipt.transactionHash) {
        // Add transaction to the queue
        addTransaction({
          hash: receipt.transactionHash,
          from: address,
          to: toAddress,
          value: amountWei,
          chainId: String(chainId),
          type: "transfer",
          status: "confirmed",
          timestamp: Date.now()
        });
        
        toast({
          title: "Transaction Sent",
          description: `Successfully sent ${amount} ETH to ${toAddress.slice(0, 6)}...${toAddress.slice(-4)}`,
        });
        
        // Reset form
        setAmount('');
        setData('');
        setEstimatedGas(null);
      }
    } catch (error) {
      console.error("Error sending transaction:", error);
      
      toast({
        title: "Transaction Error",
        description: error instanceof Error ? error.message : "Failed to send transaction",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowUpRight className="h-5 w-5 text-primary" />
          Send Transaction
        </CardTitle>
        <CardDescription>
          Send native currency (ETH/MATIC) or execute contract calls
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="to-address">Recipient Address</Label>
          <Input
            id="to-address"
            placeholder="0x..."
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="amount">Amount ({chainId === 137 ? 'MATIC' : 'ETH'})</Label>
          <Input
            id="amount"
            type="number"
            min="0"
            step="0.000001"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="data">Transaction Data (Hex)</Label>
          <Textarea
            id="data"
            placeholder="0x..."
            value={data}
            onChange={(e) => setData(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Optional: Enter hex data for contract interactions
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="gas-price">Gas Price (Gwei)</Label>
          <Input
            id="gas-price"
            type="number"
            min="0"
            placeholder="Automatic"
            value={gasPrice}
            onChange={(e) => setGasPrice(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Optional: Leave empty for automatic gas price
          </p>
        </div>
        
        {estimatedGas && (
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm font-medium">Estimated Gas: {estimatedGas}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        <Button 
          variant="outline" 
          className="w-full sm:w-auto"
          onClick={handleEstimateGas}
          disabled={!isReady || !toAddress}
        >
          <Search className="mr-2 h-4 w-4" />
          Estimate Gas
        </Button>
        <Button 
          className="w-full sm:w-auto"
          onClick={handleSendTransaction}
          disabled={!isReady || isSending || !toAddress || !amount}
        >
          {isSending ? (
            <>
              <span className="animate-spin mr-2">⟳</span>
              Sending...
            </>
          ) : (
            <>
              <ArrowUpRight className="mr-2 h-4 w-4" />
              Send Transaction
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TransactionsSection;
