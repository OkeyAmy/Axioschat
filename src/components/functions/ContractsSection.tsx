
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FunctionCard } from "./FunctionCard";
import { FileCode, ExternalLink, Settings, CheckCircle2, Upload } from "lucide-react";
import { useWeb3 } from "@/hooks/useWeb3";
import { 
  getContractInfo, 
  getContractUrl, 
  callContractFunction, 
  getRecommendedGasPrice,
  getContractABI
} from "@/utils/blockchain";
import { toast } from "@/components/ui/use-toast";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";

interface ContractsSectionProps {
  currentChain: number;
}

type TransactionStatus = "pending" | "success" | "failed" | "none";

const isValidEthereumAddress = (address: string) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

const ContractsSection: React.FC<ContractsSectionProps> = ({ currentChain }) => {
  const { web3, address } = useWeb3();
  const [contractAddress, setContractAddress] = useState("");
  const [addressError, setAddressError] = useState("");
  const [contractData, setContractData] = useState<any>(null);
  const [isContractLoading, setIsContractLoading] = useState(false);
  const [selectedFunction, setSelectedFunction] = useState<any>(null);
  
  // Contract interaction
  const [functionInputs, setFunctionInputs] = useState<Record<string, string>>({});
  const [functionValue, setFunctionValue] = useState("");
  const [txStatus, setTxStatus] = useState<TransactionStatus>("none");
  const [txHash, setTxHash] = useState("");
  const [functionResult, setFunctionResult] = useState<any>(null);

  // Gas settings
  const [gasPrice, setGasPrice] = useState<string>("");
  const [gasPriceGwei, setGasPriceGwei] = useState<number>(20);
  const [recommendedGasPrice, setRecommendedGasPrice] = useState<string>("");

  // Source code
  const [contractSourceTab, setContractSourceTab] = useState<"read" | "write">("read");
  const [sourceCode, setSourceCode] = useState(`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleStorage {
    uint256 private value;
    
    function set(uint256 newValue) public {
        value = newValue;
    }
    
    function get() public view returns (uint256) {
        return value;
    }
}`);

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

  const loadRecommendedGasPrice = async () => {
    if (!web3) return;
    
    try {
      const recommended = await getRecommendedGasPrice(web3, currentChain);
      setRecommendedGasPrice(recommended);
      
      // Convert to Gwei for UI
      const gweiValue = parseFloat(web3.utils.fromWei(recommended, 'gwei'));
      setGasPriceGwei(gweiValue);
      setGasPrice(recommended);
    } catch (error) {
      console.error("Error getting recommended gas price:", error);
    }
  };

  const searchContract = async () => {
    if (!validateAddress(contractAddress)) return;
    if (!web3) {
      toast({
        title: "Error",
        description: "Web3 not initialized",
        variant: "destructive",
      });
      return;
    }

    setIsContractLoading(true);
    setSelectedFunction(null);
    setFunctionInputs({});
    setFunctionValue("");
    setFunctionResult(null);

    try {
      const info = await getContractInfo(web3, contractAddress);
      
      // Try to get more detailed ABI from explorer
      try {
        const abi = await getContractABI(currentChain, contractAddress);
        if (abi && abi.length > 0) {
          // Extract functions from ABI for better interaction
          const functions = abi
            .filter(item => item.type === "function")
            .map(func => ({
              name: func.name,
              inputs: func.inputs?.map((input: any) => `${input.type} ${input.name}`),
              outputs: func.outputs?.map((output: any) => output.type),
              stateMutability: func.stateMutability
            }));
          
          info.functions = functions;
        }
      } catch (error) {
        console.warn("Could not get detailed ABI:", error);
        // Continue with basic ABI
      }
      
      setContractData(info);
      await loadRecommendedGasPrice();
    } catch (error: any) {
      console.error("Error fetching contract:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch contract information",
        variant: "destructive",
      });
    } finally {
      setIsContractLoading(false);
    }
  };

  const callFunction = async () => {
    if (!web3 || !address || !selectedFunction || !contractData) {
      toast({
        title: "Error",
        description: "Web3 not initialized or contract not loaded",
        variant: "destructive",
      });
      return;
    }

    try {
      setTxStatus("pending");
      
      // Convert inputs to array
      const inputArray = selectedFunction.inputs.map((input: string, index: number) => {
        return functionInputs[`input_${index}`] || "";
      });
      
      // Call the function
      const result = await callContractFunction(
        web3,
        contractAddress,
        selectedFunction.name,
        inputArray,
        address,
        functionValue,
        gasPrice
      );
      
      // Check if result is a transaction hash
      if (typeof result === 'string' && result.startsWith('0x')) {
        setTxHash(result);
        setTxStatus("success");
        toast({
          title: "Transaction Sent",
          description: `Function ${selectedFunction.name} executed successfully`,
        });
      } else {
        // It's a read result
        setFunctionResult(result);
        setTxStatus("success");
        toast({
          title: "Function Call Successful",
          description: `Function ${selectedFunction.name} returned a result`,
        });
      }
    } catch (error: any) {
      console.error("Function call error:", error);
      setTxStatus("failed");
      toast({
        title: "Error",
        description: error.message || "Failed to call contract function",
        variant: "destructive",
      });
    }
  };

  const handleGasPriceChange = (value: number[]) => {
    if (!web3) return;
    
    setGasPriceGwei(value[0]);
    const newGasPrice = web3.utils.toWei(value[0].toString(), 'gwei');
    setGasPrice(newGasPrice);
  };

  const GasSettings = () => (
    <div className="space-y-4 p-2">
      <div className="flex justify-between">
        <h3 className="text-sm font-medium">Gas Settings</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={loadRecommendedGasPrice}
          className="h-7 text-xs"
        >
          <Upload className="h-3 w-3 mr-1" />
          Update
        </Button>
      </div>
      
      <div className="p-3 bg-muted/50 rounded-md text-xs">
        <p>Current network: {
          currentChain === 1 ? "Ethereum" :
          currentChain === 137 ? "Polygon" :
          currentChain === 10 ? "Optimism" :
          currentChain === 42161 ? "Arbitrum" :
          currentChain === 8453 ? "Base" :
          currentChain === 7777777 ? "Zora" : "Unknown"
        }</p>
        <p className="mt-1">Recommended gas price: {
          web3 ? parseFloat(web3.utils.fromWei(recommendedGasPrice, 'gwei')).toFixed(2) : "0"
        } Gwei</p>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label htmlFor="gas-price" className="text-xs">Gas Price (Gwei)</Label>
          <div className="text-xs font-mono">{gasPriceGwei.toFixed(2)}</div>
        </div>
        <div className="pt-2">
          <Slider
            defaultValue={[gasPriceGwei]}
            min={1}
            max={200}
            step={0.1}
            onValueChange={handleGasPriceChange}
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Slow</span>
            <span>Fast</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <FunctionCard
        title="Contract Explorer"
        description="Interact with deployed smart contracts"
        icon={FileCode}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contract-address">Contract Address</Label>
            <div className="flex items-center gap-2">
              <Input
                id="contract-address"
                placeholder="0x..."
                value={contractAddress}
                onChange={(e) => {
                  setContractAddress(e.target.value);
                  validateAddress(e.target.value);
                }}
              />
              <Button
                variant="outline"
                disabled={!contractAddress || !!addressError || isContractLoading || !web3}
                onClick={searchContract}
              >
                {isContractLoading ?
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" /> :
                  "Search"
                }
              </Button>
            </div>
            {addressError && <p className="text-destructive text-xs">{addressError}</p>}
          </div>

          {contractData && (
            <div className="space-y-4 border rounded-md p-4">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <h3 className="font-medium">{contractData.name}</h3>
                  <span className="text-sm">{contractData.symbol}</span>
                </div>
                <div className="text-xs text-muted-foreground break-all">
                  {contractData.address}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Total Supply</p>
                  <p>{contractData.totalSupply}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Decimals</p>
                  <p>{contractData.decimals}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Contract Functions</h4>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {contractData.functions.map((fn: any, idx: number) => (
                    <div 
                      key={idx} 
                      className={cn(
                        "border rounded p-2 text-xs cursor-pointer hover:border-primary/50 transition-colors",
                        selectedFunction?.name === fn.name ? "bg-primary/5 border-primary/50" : ""
                      )}
                      onClick={() => {
                        setSelectedFunction(fn);
                        setFunctionInputs({});
                        setFunctionValue("");
                        setFunctionResult(null);
                      }}
                    >
                      <p className="font-medium">{fn.name}</p>
                      <p className="text-muted-foreground mt-1">
                        Inputs: {fn.inputs?.join(", ") || "none"}
                      </p>
                      <p className="text-muted-foreground">
                        Outputs: {fn.outputs?.join(", ") || "none"}
                      </p>
                      {fn.stateMutability && (
                        <p className={cn(
                          "text-xs mt-1 inline-block px-1.5 py-0.5 rounded",
                          fn.stateMutability === "view" || fn.stateMutability === "pure" 
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                        )}>
                          {fn.stateMutability}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {selectedFunction && (
                <div className="space-y-3 bg-muted/30 p-3 rounded-md border">
                  <h4 className="text-sm font-medium">Call Function: {selectedFunction.name}</h4>
                  
                  {selectedFunction.inputs?.length > 0 && selectedFunction.inputs.map((input: string, idx: number) => (
                    <div key={idx} className="space-y-1">
                      <Label htmlFor={`input_${idx}`} className="text-xs">{input}</Label>
                      <Input
                        id={`input_${idx}`}
                        type="text"
                        placeholder={`Enter ${input.split(' ')[1] || 'value'}`}
                        value={functionInputs[`input_${idx}`] || ""}
                        onChange={(e) => setFunctionInputs({
                          ...functionInputs, 
                          [`input_${idx}`]: e.target.value
                        })}
                        className="h-8 text-xs"
                      />
                    </div>
                  ))}
                  
                  {!selectedFunction.stateMutability || 
                   (selectedFunction.stateMutability !== "view" && 
                    selectedFunction.stateMutability !== "pure") && (
                    <div className="space-y-1">
                      <Label htmlFor="function-value" className="text-xs">Value to Send (ETH)</Label>
                      <Input
                        id="function-value"
                        type="text"
                        placeholder="0.0"
                        value={functionValue}
                        onChange={(e) => setFunctionValue(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center pt-2">
                    {!selectedFunction.stateMutability || 
                    (selectedFunction.stateMutability !== "view" && 
                     selectedFunction.stateMutability !== "pure") ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-xs h-7">
                            <Settings className="h-3 w-3 mr-1" />
                            Gas Settings
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Gas Settings</DialogTitle>
                          </DialogHeader>
                          <GasSettings />
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <div></div> // Empty div to maintain flex layout
                    )}
                    
                    <Button 
                      size="sm"
                      onClick={callFunction}
                      disabled={txStatus === "pending" || !web3 || !address}
                      className="h-7 text-xs"
                    >
                      {txStatus === "pending" ? (
                        <div className="flex items-center">
                          <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full mr-1" />
                          <span>Processing...</span>
                        </div>
                      ) : `Call ${selectedFunction.name}`}
                    </Button>
                  </div>

                  {functionResult !== null && (
                    <div className="text-xs bg-primary/5 p-2 rounded-md mt-2">
                      <p className="font-medium">Result:</p>
                      <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-all mt-1">
                        {typeof functionResult === 'object' 
                          ? JSON.stringify(functionResult, null, 2) 
                          : functionResult.toString()}
                      </pre>
                    </div>
                  )}
                  
                  {txHash && txStatus === "success" && (
                    <div className="text-xs bg-primary/5 p-2 rounded-md mt-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">Transaction Hash:</p>
                        <a
                          href={getContractUrl(currentChain, txHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80 flex items-center"
                        >
                          View <ExternalLink size={10} className="ml-1" />
                        </a>
                      </div>
                      <p className="font-mono text-xs break-all">{txHash}</p>
                      <div className="flex items-center text-emerald-600">
                        <CheckCircle2 size={10} className="mr-1" />
                        Transaction sent
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 border-t">
                <a
                  href={getContractUrl(currentChain, contractData.address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 text-xs flex items-center"
                >
                  View on Explorer <ExternalLink size={12} className="ml-1" />
                </a>
              </div>
            </div>
          )}
        </div>
      </FunctionCard>

      <FunctionCard
        title="Contract Development"
        description="View and deploy smart contracts"
        icon={FileCode}
      >
        <Tabs 
          defaultValue="read" 
          onValueChange={(value) => setContractSourceTab(value as "read" | "write")}
          className="space-y-4"
        >
          <TabsList className="w-full">
            <TabsTrigger value="read" className="flex-1">Read Contract</TabsTrigger>
            <TabsTrigger value="write" className="flex-1">Write Contract</TabsTrigger>
          </TabsList>
          
          <TabsContent value="read" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contract-source">Contract Source Code (Solidity)</Label>
              <Textarea
                id="contract-source"
                placeholder="// SPDX-License-Identifier: MIT..."
                className="min-h-[200px] font-mono text-xs"
                value={sourceCode}
                onChange={(e) => setSourceCode(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Compiler Settings</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="solidity-version" className="text-xs">Solidity Version</Label>
                  <Select defaultValue="0.8.20">
                    <SelectTrigger id="solidity-version">
                      <SelectValue placeholder="Select version" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.8.20">0.8.20</SelectItem>
                      <SelectItem value="0.8.19">0.8.19</SelectItem>
                      <SelectItem value="0.8.17">0.8.17</SelectItem>
                      <SelectItem value="0.8.0">0.8.0</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="optimization" className="text-xs">Optimization</Label>
                  <Select defaultValue="enabled">
                    <SelectTrigger id="optimization">
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enabled">Enabled</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={() => {
                toast({
                  title: "Contract Analysis",
                  description: "Contract analysis feature requires a Solidity compiler. Please use Remix IDE for full compilation functionality.",
                });
              }}
            >
              Analyze Contract
            </Button>
          </TabsContent>
          
          <TabsContent value="write" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deploy-source">Contract Source Code</Label>
              <Textarea
                id="deploy-source"
                placeholder="// SPDX-License-Identifier: MIT..."
                className="min-h-[200px] font-mono text-xs"
                value={sourceCode}
                onChange={(e) => setSourceCode(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="constructor-args">Constructor Arguments (JSON array)</Label>
              <Input
                id="constructor-args"
                placeholder='["0x...", "100"]'
                className="font-mono text-xs"
              />
            </div>
            
            <div className="flex justify-between items-center">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-1" />
                    Gas Settings
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Gas Settings</DialogTitle>
                  </DialogHeader>
                  <GasSettings />
                </DialogContent>
              </Dialog>
              
              <div className="text-xs text-right">
                <div className="text-muted-foreground">Gas Price: {gasPriceGwei.toFixed(2)} Gwei</div>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={() => {
                toast({
                  title: "Contract Deployment",
                  description: "Contract deployment requires a Solidity compiler. Please use Remix IDE for full deployment functionality.",
                });
              }}
            >
              Compile & Deploy
            </Button>
          </TabsContent>
        </Tabs>

        <div className="bg-muted p-3 rounded-md mt-4">
          <p className="text-xs text-muted-foreground">
            Note: Contract deployment requires gas fees. Make sure you have enough ETH in your wallet.
          </p>
        </div>
      </FunctionCard>
    </div>
  );
};

export default ContractsSection;
