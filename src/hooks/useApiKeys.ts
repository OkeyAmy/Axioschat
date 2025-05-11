"use client"

import { useState, useEffect } from "react"

export interface ApiKeys {
  replicate: string
  openai: string // For backwards compatibility
  gemini: string // New explicit Gemini key
}

const useApiKeys = () => {
  const [apiKeys, setApiKeys] = useState<ApiKeys>({ 
    replicate: "", 
    openai: "", 
    gemini: "" 
  })
  const [isLoaded, setIsLoaded] = useState(false)

  // Load API keys from localStorage on mount
  useEffect(() => {
    const savedKeys = localStorage.getItem("apiKeys")
    if (savedKeys) {
      try {
        const parsedKeys = JSON.parse(savedKeys) as Partial<ApiKeys>
        
        // Handle both gemini and openai keys for backward compatibility
        const geminiKey = parsedKeys.gemini || parsedKeys.openai || ""
        
        setApiKeys({
          replicate: parsedKeys.replicate || "",
          openai: parsedKeys.openai || "",
          gemini: geminiKey, // Use either explicit gemini key or fall back to openai key
        })
      } catch (error) {
        console.error("Failed to parse API keys from localStorage:", error)
      }
    }
    setIsLoaded(true)
  }, [])

  // Update API key and save to localStorage
  const updateApiKey = (key: keyof ApiKeys, value: string) => {
    setApiKeys((prev) => {
      const newKeys = { ...prev, [key]: value }
      
      // If updating the Gemini key, also update openai key for backward compatibility
      if (key === 'gemini') {
        newKeys.openai = value
      }
      
      localStorage.setItem("apiKeys", JSON.stringify(newKeys))
      return newKeys
    })
  }

  return {
    apiKeys,
    updateApiKey,
    isLoaded,
  }
}

export default useApiKeys
