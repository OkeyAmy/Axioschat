"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Check, X, AlertCircle, Loader2 } from "lucide-react"
import type { FunctionCall } from "@/services/aiService"

interface FunctionQueueProps {
  functionCalls: FunctionCall[]
  onFunctionStatusChange: (id: string, status: "approved" | "rejected" | "executed", result?: any) => void
}

const FunctionQueue: React.FC<FunctionQueueProps> = ({ functionCalls, onFunctionStatusChange }) => {
  const pendingFunctions = functionCalls.filter((func) => func.status === "pending")
  const approvedFunctions = functionCalls.filter((func) => func.status === "approved")
  const executedFunctions = functionCalls.filter((func) => func.status === "executed")
  const rejectedFunctions = functionCalls.filter((func) => func.status === "rejected")

  const handleApprove = async (func: FunctionCall) => {
    onFunctionStatusChange(func.id, "approved")

    // Simulate function execution
    setTimeout(() => {
      let result
      switch (func.name) {
        case "get_token_balance":
          result = {
            balance: "42.38",
            token: func.arguments.token_address === "native" ? "BNB" : "TOKEN",
          }
          break
        case "get_token_price":
          result = {
            price: "276.45",
            change24h: "+2.3%",
          }
          break
        case "get_gas_price":
          result = {
            price: "25",
            unit: "Gwei",
          }
          break
        case "send_token":
          result = {
            txHash: "0x" + Math.random().toString(16).substring(2, 42),
            status: "confirmed",
          }
          break
        case "swap_tokens":
          result = {
            txHash: "0x" + Math.random().toString(16).substring(2, 42),
            status: "confirmed",
            amountOut: (Number.parseFloat(func.arguments.amount_in) * 276.45).toFixed(2),
          }
          break
        default:
          result = {
            status: "success",
            message: "Function executed successfully",
          }
      }

      onFunctionStatusChange(func.id, "executed", result)
    }, 2000)
  }

  const handleReject = (func: FunctionCall) => {
    onFunctionStatusChange(func.id, "rejected")
  }

  // Helper function to get a description for a function
  const getFunctionDescription = (name: string): string => {
    const descriptions: Record<string, string> = {
      get_token_balance: "Get token balance for an address",
      get_token_price: "Get the price of a token in USD",
      get_gas_price: "Get the current gas price in Gwei",
      send_token: "Send tokens to an address",
      swap_tokens: "Swap tokens on a decentralized exchange",
      add_liquidity: "Add liquidity to a DEX pool",
      explain_transaction: "Explain a blockchain transaction",
      estimate_gas: "Estimate gas cost for a transaction",
    }

    return descriptions[name] || `Execute ${name} function`
  }

  // Format arguments for display
  const formatArguments = (args: Record<string, any>) => {
    return Object.entries(args).map(([key, value]) => (
      <div key={key} className="text-xs">
        <span className="font-medium">{key}:</span> {String(value)}
      </div>
    ))
  }

  return (
    <div className="space-y-4">
      {pendingFunctions.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Pending Functions</h3>
          <div className="space-y-2">
            {pendingFunctions.map((func) => (
              <Card key={func.id} className="border-yellow-200 dark:border-yellow-900">
                <CardHeader className="py-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-sm font-medium">{func.name}</CardTitle>
                      <p className="text-muted-foreground mb-1">{getFunctionDescription(func.name)}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
                    >
                      Pending
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="py-0">
                  <div className="text-sm space-y-1">{formatArguments(func.arguments)}</div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 py-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-800 dark:hover:bg-red-950"
                    onClick={() => handleReject(func)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                  <Button size="sm" onClick={() => handleApprove(func)}>
                    <Check className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}

      {approvedFunctions.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Processing</h3>
          <div className="space-y-2">
            {approvedFunctions.map((func) => (
              <Card key={func.id} className="border-blue-200 dark:border-blue-900">
                <CardHeader className="py-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-sm font-medium">{func.name}</CardTitle>
                      <p className="text-muted-foreground mb-1">{getFunctionDescription(func.name)}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 flex items-center"
                    >
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Processing
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="py-0">
                  <div className="text-sm space-y-1">{formatArguments(func.arguments)}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {executedFunctions.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Completed</h3>
          <div className="space-y-2">
            {executedFunctions.map((func) => (
              <Card key={func.id} className="border-green-200 dark:border-green-900">
                <CardHeader className="py-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-sm font-medium">{func.name}</CardTitle>
                      <p className="text-muted-foreground mb-1">{getFunctionDescription(func.name)}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 flex items-center"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="py-0">
                  <div className="text-sm space-y-1">
                    {formatArguments(func.arguments)}
                    {func.result && (
                      <>
                        <Separator className="my-2" />
                        <div className="font-medium text-xs">Result:</div>
                        <div className="text-xs whitespace-pre-wrap">
                          {typeof func.result === "string" ? func.result : JSON.stringify(func.result, null, 2)}
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {rejectedFunctions.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Rejected</h3>
          <div className="space-y-2">
            {rejectedFunctions.map((func) => (
              <Card key={func.id} className="border-red-200 dark:border-red-900">
                <CardHeader className="py-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-sm font-medium">{func.name}</CardTitle>
                      <p className="text-muted-foreground mb-1">{getFunctionDescription(func.name)}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 flex items-center"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Rejected
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="py-0">
                  <div className="text-sm space-y-1">{formatArguments(func.arguments)}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {functionCalls.length === 0 && (
        <div className="text-center py-4 text-muted-foreground">
          <AlertCircle className="h-5 w-5 mx-auto mb-2" />
          <p>No function calls in queue</p>
        </div>
      )}
    </div>
  )
}

export default FunctionQueue
