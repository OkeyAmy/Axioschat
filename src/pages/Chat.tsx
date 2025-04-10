"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { v4 as uuidv4 } from "uuid"
import Header from "@/components/Header"
import ChatHistory from "@/components/ChatHistory"
import ChatMessages from "@/components/ChatMessages"
import SuggestedPromptsPanel from "@/components/SuggestedPromptsPanel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { useAccount } from "wagmi"
import WalletRequired from "@/components/WalletRequired"
import { ArrowRight, Bot, MessageSquare, RotateCcw } from "lucide-react"
import TransactionQueue from "@/components/TransactionQueue"
import useApiKeys from "@/hooks/useApiKeys"
import ModelSelector from "@/components/ModelSelector"
import { useLocation } from "react-router-dom"
import {
  callLlama,
  callOpenAI,
  isReadOnlyFunction,
  executeFunctionCall,
  callFlockWeb3,
  createDefaultWeb3Tools,
  type ChatMessage,
  type FunctionCall,
} from "@/services/aiService"

type Message = {
  role: "user" | "assistant" | "system" | "function"
  content: string
  id: string
  functionCalls?: FunctionCall[]
  name?: string
}

const Chat = () => {
  const { isConnected, address } = useAccount()
  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [functionCalls, setFunctionCalls] = useState<FunctionCall[]>([])
  const [useOpenAI, setUseOpenAI] = useState(false)
  const [activeChat, setActiveChat] = useState<number | null>(null)
  const [isHistoryPanelCollapsed, setIsHistoryPanelCollapsed] = useState(window.innerWidth < 1200)
  const [isPromptsPanelCollapsed, setIsPromptsPanelCollapsed] = useState(window.innerWidth < 1400)
  const [currentChain, setCurrentChain] = useState(1) // Ethereum mainnet
  const [processingMessageId, setProcessingMessageId] = useState<string | null>(null)
  const [executingFunction, setExecutingFunction] = useState(false)
  const [debugMode, setDebugMode] = useState(false)

  const [llamaEndpoint, setLlamaEndpoint] = useState("http://localhost:11434")
  const [showEndpointSettings, setShowEndpointSettings] = useState(false)
  const { apiKeys, updateApiKey, isLoaded } = useApiKeys()

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1400) {
        setIsPromptsPanelCollapsed(true)
      }
      if (window.innerWidth < 1200) {
        setIsHistoryPanelCollapsed(true)
      }
    }

    handleResize()

    window.addEventListener("resize", handleResize)

    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Check for question parameter in URL and auto-submit
  const location = useLocation()
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search)
    const questionParam = queryParams.get("question")

    if (questionParam && messages.length === 0 && !loading) {
      // Set the input and trigger submission
      setInput(questionParam)

      // Use setTimeout to ensure the input is set before submitting
      setTimeout(() => {
        const submitEvent = new Event("submit", { cancelable: true })
        const formElement = document.querySelector("form")
        if (formElement) {
          formElement.dispatchEvent(submitEvent)
        }
      }, 100)

      // Clean up the URL to remove the question parameter
      window.history.replaceState({}, document.title, "/chat")
    }
  }, [location.search, messages.length, loading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage: Message = {
      role: "user",
      content: input,
      id: uuidv4(),
    }

    setMessages((prevMessages) => [...prevMessages, userMessage])
    setInput("")
    setLoading(true)

    try {
      // Prepare messages for the Llama model
      const conversationalMessages: ChatMessage[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
        functionCalls: m.functionCalls,
        name: m.name,
      }))

      // Add the new user message
      conversationalMessages.push({
        role: "user",
        content: userMessage.content,
      })

      // Add system message to guide the Llama model to ONLY identify if a function call is needed
      conversationalMessages.unshift({
        role: "system",
        content: `You are NovachatV2, a specialized Web3 assistant with deep knowledge of blockchain, cryptocurrencies, DeFi, NFTs, and smart contracts.

Your ONLY job is to determine if the user's request requires calling a blockchain function.

If the user asks for information that requires accessing blockchain data (like balances, prices, etc.), respond with:
1. A brief message indicating you need to check that information
2. Include the tag [FUNCTION_NEEDED] at the end of your message

Available functions:
- get_token_balance - For checking token balances
- get_token_price - For checking token prices
- get_gas_price - For checking gas prices
- send_token - For sending tokens
- swap_tokens - For swapping tokens
- add_liquidity - For adding liquidity

Example:
User: "What's my BNB balance?"
You: "Let me check your BNB balance for you. [FUNCTION_NEEDED]"

User: "Tell me about Ethereum"
You: "Ethereum is a decentralized blockchain platform that enables the creation of smart contracts and decentralized applications (dApps)..."

DO NOT try to execute functions yourself. DO NOT include any specific function names in your response.
DO NOT make up any blockchain data. ONLY identify if a function call is needed.`,
      })

      // Call the Llama model to determine if a function call is needed
      let llamaResponse: string

      if (useOpenAI) {
        // Use OpenAI
        if (!apiKeys.openai) {
          llamaResponse = "Please provide an OpenAI API key in the settings to use GPT-4o."
        } else {
          llamaResponse = await callOpenAI({
            model: "gpt-4o",
            messages: conversationalMessages,
            temperature: 0.7,
            top_p: 0.9,
            max_tokens: 2000,
          })
        }
      } else {
        // Use Llama
        llamaResponse = await callLlama(
          {
            messages: conversationalMessages,
            temperature: 0.7,
            top_p: 0.9,
            max_tokens: 2000,
          },
          llamaEndpoint,
        )
      }

      console.log("Llama response:", llamaResponse)

      // Check if Llama identified a function call is needed
      const functionNeeded = llamaResponse.includes("[FUNCTION_NEEDED]")

      // Clean up the response by removing the tag
      const cleanResponse = llamaResponse.replace("[FUNCTION_NEEDED]", "").trim()

      // Add the assistant's message
      const assistantMessage: Message = {
        role: "assistant",
        content: cleanResponse,
        id: uuidv4(),
      }
      setMessages((prevMessages) => [...prevMessages, assistantMessage])

      // If a function call is needed
      if (functionNeeded) {
        console.log("Function call needed according to Llama")

        // Set a processing message ID to track this operation
        const processingId = uuidv4()
        setProcessingMessageId(processingId)

        // Add a processing message
        const processingMessage: Message = {
          role: "assistant",
          content: "I'm checking that information for you...",
          id: processingId,
        }
        setMessages((prevMessages) => [...prevMessages, processingMessage])

        // Now forward the request to the Flock Web3 model
        try {
          setExecutingFunction(true)

          // Check if Replicate API key is available
          if (!apiKeys.replicate) {
            throw new Error("Replicate API key is required to use the Flock Web3 model")
          }

          // Get the tools JSON
          const tools = createDefaultWeb3Tools()

          console.log("Calling Flock Web3 model with query:", userMessage.content)

          // Call the Flock Web3 model to determine the specific function and parameters
          const flockResponse = await callFlockWeb3({
            query: userMessage.content,
            tools: tools,
            temperature: 0.7,
            top_p: 0.9,
            max_new_tokens: 2000,
          })

          console.log("Flock Web3 response:", flockResponse)

          if (typeof flockResponse === "string") {
            throw new Error("Unexpected string response from Flock Web3")
          }

          if (flockResponse.error) {
            throw new Error(flockResponse.error)
          }

          if (flockResponse.functionCalls && flockResponse.functionCalls.length > 0) {
            // We got function calls from Flock Web3
            const functionCall = flockResponse.functionCalls[0]
            console.log("Function call from Flock Web3:", functionCall)

            // Add to function calls state
            setFunctionCalls((prev) => [...prev, functionCall])

            // If it's a read-only function, execute it directly
            if (isReadOnlyFunction(functionCall.name)) {
              console.log("Auto-executing read-only function")

              try {
                const result = await executeFunctionCall(functionCall)
                console.log("Function execution result:", result)

                // Add the function result as a function message
                const functionMessage: Message = {
                  role: "function",
                  name: functionCall.name,
                  content: JSON.stringify(
                    {
                      function_name: functionCall.name,
                      arguments: functionCall.arguments,
                      result: result,
                      timestamp: new Date().toISOString(),
                    },
                    null,
                    2,
                  ),
                  id: uuidv4(),
                }
                setMessages((prev) => [...prev, functionMessage])

                // Update the function call status
                setFunctionCalls((prev) =>
                  prev.map((f) => (f.id === functionCall.id ? { ...f, status: "executed", result } : f)),
                )

                // Format the result for the Llama model
                const formattedResult = JSON.stringify(result)

                // Send the result back to the Llama model for interpretation
                // No need to look up the function, we already have it
                const interpretationMessages: ChatMessage[] = [
                  {
                    role: "system",
                    content: `You are NovachatV2, a specialized Web3 assistant. You've just received the result of a function call.
                    
Interpret the function result and respond in a natural, conversational way. Focus on explaining what the data means for the user in plain language.

Be concise and direct. Don't just repeat the raw data - explain its significance in a helpful way.

Function: ${functionCall.name}
Arguments: ${JSON.stringify(functionCall.arguments)}
Result: ${formattedResult}`,
                  },
                  {
                    role: "user",
                    content: `The user asked: "${userMessage.content}". Please interpret the function result in a helpful way.`,
                  },
                ]

                console.log("Sending function result to Llama for interpretation")

                // Call the Llama model again to interpret the result
                let interpretationResponse: string

                if (useOpenAI) {
                  if (!apiKeys.openai) {
                    // Generate a fallback response if no API key
                    interpretationResponse = generateFallbackResponse(functionCall, result)
                  } else {
                    interpretationResponse = await callOpenAI({
                      model: "gpt-4o",
                      messages: interpretationMessages,
                      temperature: 0.7,
                      top_p: 0.9,
                      max_tokens: 2000,
                    })
                  }
                } else {
                  interpretationResponse = await callLlama(
                    {
                      messages: interpretationMessages,
                      temperature: 0.7,
                      top_p: 0.9,
                      max_tokens: 2000,
                    },
                    llamaEndpoint,
                  )
                }

                console.log("Interpretation response:", interpretationResponse)

                // Replace the processing message with the interpretation
                if (interpretationResponse && !interpretationResponse.includes("No valid response from")) {
                  setMessages((prevMessages) =>
                    prevMessages.map((msg) =>
                      msg.id === processingId
                        ? {
                            ...msg,
                            content: interpretationResponse,
                          }
                        : msg,
                    ),
                  )
                } else {
                  // Use fallback response if interpretation fails
                  const fallbackResponse = generateFallbackResponse(functionCall, result)
                  setMessages((prevMessages) =>
                    prevMessages.map((msg) =>
                      msg.id === processingId
                        ? {
                            ...msg,
                            content: fallbackResponse,
                          }
                        : msg,
                    ),
                  )
                }
              } catch (error) {
                console.error("Error executing function:", error)

                // Update the processing message with the error
                setMessages((prevMessages) =>
                  prevMessages.map((msg) =>
                    msg.id === processingId
                      ? {
                          ...msg,
                          content: `I encountered an error while checking that information: ${
                            error instanceof Error ? error.message : "Unknown error"
                          }`,
                        }
                      : msg,
                  ),
                )

                // Update the function call status
                setFunctionCalls((prev) =>
                  prev.map((f) =>
                    f.id === functionCall.id
                      ? {
                          ...f,
                          status: "rejected",
                          result: { error: error instanceof Error ? error.message : "Unknown error" },
                        }
                      : f,
                  ),
                )
              }
            } else {
              // For non-read-only functions, add to queue for approval
              console.log("Adding function to queue for approval")

              // Update the processing message
              setMessages((prevMessages) =>
                prevMessages.map((msg) =>
                  msg.id === processingId
                    ? {
                        ...msg,
                        content: `I need your approval to execute the ${functionCall.name} function. Please check the transaction queue.`,
                      }
                    : msg,
                ),
              )
            }
          } else if (flockResponse.text) {
            // We got a text response from Flock Web3
            setMessages((prevMessages) =>
              prevMessages.map((msg) =>
                msg.id === processingId
                  ? {
                      ...msg,
                      content: flockResponse.text,
                    }
                  : msg,
              ),
            )
          } else {
            throw new Error("No valid response from Flock Web3")
          }
        } catch (error) {
          console.error("Error processing with Flock Web3:", error)

          // Update the processing message with the error
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.id === processingId
                ? {
                    ...msg,
                    content: `I encountered an error while processing your request: ${
                      error instanceof Error ? error.message : "Unknown error"
                    }`,
                  }
                : msg,
            ),
          )
        } finally {
          setProcessingMessageId(null)
          setExecutingFunction(false)
        }
      }

      toast({
        title: "Response received",
        description: "The AI has responded to your message.",
      })
    } catch (error) {
      console.error("Error getting response:", error)

      const errorMessage: Message = {
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : "Failed to get a response from the AI."}`,
        id: uuidv4(),
      }

      setMessages((prevMessages) => [...prevMessages, errorMessage])

      toast({
        title: "Error",
        description: "Failed to get a response from the AI.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // New function to execute a function directly
  const generateFallbackResponse = (func: FunctionCall, result: any): string => {
    console.log("Generating fallback response for:", func.name)

    switch (func.name) {
      case "get_token_balance":
        return `Your ${result.token || "token"} balance is ${result.balance} ${
          func.arguments.token_address === "native" ? "BNB" : result.token || "tokens"
        }.`
      case "get_token_price":
        return `The current price of ${func.arguments.token_symbol} is ${result.price} USD.`
      case "send_token":
        return `Transaction sent! ${func.arguments.amount} ${
          func.arguments.token_address === "native" ? "BNB" : "tokens"
        } have been sent to ${func.arguments.to_address}. Transaction hash: ${result.txHash}`
      case "swap_tokens":
        return `Swap completed! You received ${result.amountOut} ${func.arguments.token_out}. Transaction hash: ${result.txHash}`
      case "get_gas_price":
        return `The current gas price is ${result.price} ${result.unit}.`
      default:
        return `Function ${func.name} executed successfully: ${JSON.stringify(result, null, 2)}`
    }
  }

  // Update the handleFunctionStatusChange function to use the new executeFunction
  const handleFunctionStatusChange = async (id: string, status: "approved" | "rejected" | "executed", result?: any) => {
    console.log(`Function status change: ${id} -> ${status}`, result ? "with result" : "no result")

    // Update the function call status
    setFunctionCalls((prev) =>
      prev.map((func) => (func.id === id ? { ...func, status, result: result || func.result } : func)),
    )

    // If function was approved, execute it
    if (status === "approved" && !executingFunction) {
      const func = functionCalls.find((f) => f.id === id)
      if (!func) {
        console.error("Function not found for ID:", id)
        return
      }

      console.log("Executing approved function:", func.name)

      // Set a processing message ID to track this operation
      const processingId = uuidv4()
      setProcessingMessageId(processingId)

      // Add a processing message
      const processingMessage: Message = {
        role: "assistant",
        content: "I'm processing your request...",
        id: processingId,
      }
      setMessages((prevMessages) => [...prevMessages, processingMessage])

      // Execute the function
      setExecutingFunction(true)
      try {
        const result = await executeFunctionCall(func)
        console.log("Function execution result:", result)

        // Update the function call status
        setFunctionCalls((prev) => prev.map((f) => (f.id === func.id ? { ...f, status: "executed", result } : f)))

        // Format the result for the Llama model
        const formattedResult = JSON.stringify(result)

        // Send the result back to the Llama model for interpretation
        const interpretationMessages: ChatMessage[] = [
          {
            role: "system",
            content: `You are NovachatV2, a specialized Web3 assistant. You've just received the result of a function call.
            
Interpret the function result and respond in a natural, conversational way. Focus on explaining what the data means for the user in plain language.

Be concise and direct. Don't just repeat the raw data - explain its significance in a helpful way.

Function: ${func.name}
Arguments: ${JSON.stringify(func.arguments)}
Result: ${formattedResult}`,
          },
          {
            role: "user",
            content: "Please interpret the function result in a helpful way.",
          },
        ]

        console.log("Sending function result to Llama for interpretation")

        // Call the Llama model again to interpret the result
        let interpretationResponse: string

        if (useOpenAI) {
          if (!apiKeys.openai) {
            // Generate a fallback response if no API key
            interpretationResponse = generateFallbackResponse(func, result)
          } else {
            interpretationResponse = await callOpenAI({
              model: "gpt-4o",
              messages: interpretationMessages,
              temperature: 0.7,
              top_p: 0.9,
              max_tokens: 2000,
            })
          }
        } else {
          interpretationResponse = await callLlama(
            {
              messages: interpretationMessages,
              temperature: 0.7,
              top_p: 0.9,
              max_tokens: 2000,
            },
            llamaEndpoint,
          )
        }

        console.log("Interpretation response:", interpretationResponse)

        // Replace the processing message with the interpretation
        if (interpretationResponse && !interpretationResponse.includes("No valid response from")) {
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.id === processingId
                ? {
                    ...msg,
                    content: interpretationResponse,
                  }
                : msg,
            ),
          )
        } else {
          // Use fallback response if interpretation fails
          const fallbackResponse = generateFallbackResponse(func, result)
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.id === processingId
                ? {
                    ...msg,
                    content: fallbackResponse,
                  }
                : msg,
            ),
          )
        }

        // Add the function result as a function message
        const functionMessage: Message = {
          role: "function",
          name: func.name,
          content: JSON.stringify(
            {
              function_name: func.name,
              arguments: func.arguments,
              result: result,
              timestamp: new Date().toISOString(),
            },
            null,
            2,
          ),
          id: uuidv4(),
        }

        setMessages((prev) => [...prev, functionMessage])

        // If the function generated a transaction, add it to the transaction queue
        if (result.txHash && window.transactionQueue) {
          window.transactionQueue.add({
            hash: result.txHash,
            from: address || "",
            to: func.arguments.to_address || "",
            value: func.arguments.amount || "0",
            chainId: String(currentChain),
            type: func.name,
            status: "confirmed",
            method: func.name,
            timestamp: Date.now(),
            description: `${func.name} - ${func.arguments.amount || ""} ${
              func.arguments.token_address === "native" ? "BNB" : "tokens"
            }`,
            execute: async () => {},
          })
        }
      } catch (error) {
        console.error("Error executing function:", error)

        // Update the processing message with the error
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === processingId
              ? {
                  ...msg,
                  content: `I encountered an error while processing your request: ${
                    error instanceof Error ? error.message : "Unknown error"
                  }`,
                }
              : msg,
          ),
        )

        // Update the function call status
        setFunctionCalls((prev) =>
          prev.map((f) =>
            f.id === func.id
              ? {
                  ...f,
                  status: "rejected",
                  result: { error: error instanceof Error ? error.message : "Unknown error" },
                }
              : f,
          ),
        )
      } finally {
        setProcessingMessageId(null)
        setExecutingFunction(false)
      }
    }
  }

  const handleSuggestedQuestion = (question: string) => {
    setInput(question)
  }

  const clearChat = () => {
    setMessages([])
    setFunctionCalls([])
    toast({
      title: "Chat cleared",
      description: "All chat messages have been removed.",
    })
  }

  const handleSelectChat = (chatId: number, chatMessages: Array<{ role: string; content: string }>) => {
    setActiveChat(chatId)
    const formattedMessages = chatMessages.map((msg, index) => ({
      role: msg.role as "user" | "assistant" | "system" | "function",
      content: msg.content,
      id: `history-${chatId}-${index}`,
    }))
    setMessages(formattedMessages)
    setFunctionCalls([])
  }

  const handleNewChat = () => {
    setActiveChat(null)
    setMessages([])
    setFunctionCalls([])
  }

  // Calculate content area width based on panel states
  const getContentWidth = () => {
    const baseClasses = "flex flex-col rounded-lg border h-full max-h-full overflow-hidden transition-all duration-300"

    // Both panels are expanded
    if (!isHistoryPanelCollapsed && !isPromptsPanelCollapsed) {
      return cn(baseClasses, "flex-1")
    }

    // Only history panel is collapsed
    if (isHistoryPanelCollapsed && !isPromptsPanelCollapsed) {
      return cn(baseClasses, "flex-[2]")
    }

    // Only prompts panel is collapsed
    if (!isHistoryPanelCollapsed && isPromptsPanelCollapsed) {
      return cn(baseClasses, "flex-[2]")
    }

    // Both panels are collapsed
    return cn(baseClasses, "flex-[4]")
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />

      <main className="flex-1 container px-0 md:px-4 py-4 flex flex-col max-h-[calc(100vh-4rem)] overflow-hidden">
        {!isConnected ? (
          <div className="flex-1 flex items-center justify-center">
            <WalletRequired />
          </div>
        ) : (
          <div className="grid grid-cols-[auto_1fr_auto] gap-0 md:gap-2 lg:gap-4 h-full max-h-full">
            {/* History Panel */}
            <div
              className={cn(
                "transition-all duration-300 h-full max-h-full overflow-hidden flex flex-col",
                isHistoryPanelCollapsed ? "w-10" : "w-[280px] md:w-[320px]",
              )}
            >
              <div className="flex-1 overflow-hidden">
                <ChatHistory
                  onSelectChat={handleSelectChat}
                  onNewChat={handleNewChat}
                  activeChat={activeChat}
                  currentChain={currentChain}
                  onCollapseChange={setIsHistoryPanelCollapsed}
                  defaultCollapsed={isHistoryPanelCollapsed}
                />
              </div>

              {!isHistoryPanelCollapsed && (
                <div className="border-t mt-auto p-2">
                  <TransactionQueue
                    chainId={currentChain}
                    inPanel={true}
                    functionCalls={functionCalls}
                    onFunctionStatusChange={handleFunctionStatusChange}
                  />
                </div>
              )}
            </div>

            {/* Main Chat Area */}
            <div className={getContentWidth()}>
              <div className="border-b px-4 py-2 flex justify-between items-center flex-shrink-0">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <h2 className="text-sm font-medium">{activeChat ? "Conversation" : "New Chat"}</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearChat}
                  className="text-xs h-8"
                  disabled={messages.length === 0}
                >
                  <RotateCcw size={14} className="mr-1" />
                  Clear
                </Button>
              </div>

              <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-2 md:p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 md:p-8">
                    <div className="bg-primary/10 p-3 rounded-full mb-4">
                      <Bot size={24} className="text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">How can I help you today?</h3>
                    <p className="text-muted-foreground text-sm mt-2 max-w-md">
                      Ask me anything about blockchain, smart contracts, or web3 development. I'm here to assist!
                    </p>
                  </div>
                ) : (
                  <ChatMessages
                    messages={messages
                      .filter((m) => m.role !== "function" || debugMode) // Show function messages only in debug mode
                      .map((m) => ({ role: m.role, content: m.content }))}
                  />
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t p-3 md:p-4 flex-shrink-0">
                <ModelSelector
                  useOpenAI={useOpenAI}
                  onUseOpenAIChange={setUseOpenAI}
                  showSettings={showEndpointSettings}
                  onShowSettingsChange={setShowEndpointSettings}
                  llamaEndpoint={llamaEndpoint}
                  onLlamaEndpointChange={setLlamaEndpoint}
                  openaiApiKey={apiKeys.openai || ""}
                  onOpenAIApiKeyChange={(key) => updateApiKey("openai", key)}
                  replicateApiKey={apiKeys.replicate || ""}
                  onReplicateApiKeyChange={(key) => updateApiKey("replicate", key)}
                  className="mb-3"
                  debugMode={debugMode}
                  onDebugModeChange={setDebugMode}
                />

                <form onSubmit={handleSubmit} className="flex space-x-2">
                  <div className="flex-1 flex border rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-ring">
                    <Input
                      placeholder="Ask anything..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className="flex-1 px-3 py-2 border-0 focus-visible:ring-0 focus-visible:ring-transparent h-10"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading || !input.trim() || executingFunction}
                    className="h-10 whitespace-nowrap"
                  >
                    {loading || executingFunction ? (
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    ) : (
                      <>
                        <span className="hidden sm:inline-block mr-2">Ask Now</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </div>

            {/* Suggested Prompts Panel */}
            <div
              className={cn(
                "transition-all duration-300 h-full max-h-full overflow-hidden",
                isPromptsPanelCollapsed ? "w-10" : "w-[260px] lg:w-[300px]",
              )}
            >
              <SuggestedPromptsPanel
                onSelectQuestion={handleSuggestedQuestion}
                onCollapseChange={setIsPromptsPanelCollapsed}
                defaultCollapsed={isPromptsPanelCollapsed}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default Chat
