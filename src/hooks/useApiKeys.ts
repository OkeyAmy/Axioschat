"use client"

import { useState, useEffect } from "react"

export interface ApiKeys {
  replicate: string
  openai: string // Keeping the key name "openai" for backward compatibility, but we're using it for Gemini
}

const useApiKeys = () => {
  const [apiKeys, setApiKeys] = useState<ApiKeys>({ replicate: "", openai: "" })
  const [isLoaded, setIsLoaded] = useState(false)

  // Load API keys from localStorage on mount
  useEffect(() => {
    const savedKeys = localStorage.getItem("apiKeys")
    if (savedKeys) {
      try {
        const parsedKeys = JSON.parse(savedKeys) as Partial<ApiKeys>
        setApiKeys({
          replicate: parsedKeys.replicate || "",
          openai: parsedKeys.openai || "", // This will be the Gemini API key
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
