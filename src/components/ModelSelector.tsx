"use client"

import type React from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Settings, X } from "lucide-react"
import { cn } from "@/lib/utils"
import ApiKeyInput from "./ApiKeyInput"

interface ModelSelectorProps {
  useOpenAI: boolean
  onUseOpenAIChange: (value: boolean) => void
  showSettings: boolean
  onShowSettingsChange: (value: boolean) => void
  llamaEndpoint: string
  onLlamaEndpointChange: (value: string) => void
  openaiApiKey: string
  onOpenAIApiKeyChange: (value: string) => void
  replicateApiKey: string
  onReplicateApiKeyChange: (value: string) => void
  className?: string
  debugMode?: boolean
  onDebugModeChange?: (value: boolean) => void
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  useOpenAI,
  onUseOpenAIChange,
  showSettings,
  onShowSettingsChange,
  llamaEndpoint,
  onLlamaEndpointChange,
  openaiApiKey,
  onOpenAIApiKeyChange,
  replicateApiKey,
  onReplicateApiKeyChange,
  className,
  debugMode = false,
  onDebugModeChange,
}) => {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Switch id="model-toggle" checked={useOpenAI} onCheckedChange={onUseOpenAIChange} />
          <Label htmlFor="model-toggle" className="text-sm cursor-pointer select-none">
            {useOpenAI ? "OpenAI GPT-4o" : "Llama 3.2 (Local)"}
          </Label>
        </div>
        <Button variant="ghost" size="icon" onClick={() => onShowSettingsChange(!showSettings)} className="h-8 w-8">
          <Settings size={14} />
        </Button>
      </div>

      {showSettings && (
        <div className="p-3 border rounded-md bg-muted/40 space-y-3 relative">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 absolute top-2 right-2"
            onClick={() => onShowSettingsChange(false)}
          >
            <X size={12} />
          </Button>

          {useOpenAI ? (
            <div className="space-y-2">
              <ApiKeyInput
                label="OpenAI API Key"
                apiKey={openaiApiKey}
                onChange={onOpenAIApiKeyChange}
                placeholder="Enter your OpenAI API key"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="llama-endpoint" className="text-xs">
                Llama Endpoint
              </Label>
              <input
                id="llama-endpoint"
                placeholder="http://localhost:11434"
                value={llamaEndpoint}
                onChange={(e) => onLlamaEndpointChange(e.target.value)}
                className="w-full px-3 py-1 text-xs h-8 rounded-md border"
              />
            </div>
          )}

          <div className="space-y-2 pt-2 border-t">
            <ApiKeyInput
              label="Replicate API Key (for Web3 Functions)"
              apiKey={replicateApiKey}
              onChange={onReplicateApiKeyChange}
              placeholder="Enter your Replicate API key"
            />
            <div className="text-xs text-muted-foreground mt-2">
              <p>Note: The Replicate API key is required for Web3 function calling with the Flock Web3 model.</p>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center space-x-2">
              <Switch id="debug-mode" checked={debugMode} onCheckedChange={onDebugModeChange} />
              <Label htmlFor="debug-mode" className="text-sm cursor-pointer select-none">
                Troubleshooting Mode
              </Label>
            </div>
            <div className="text-xs text-muted-foreground">
              <p>Shows all data including function call responses for debugging purposes.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ModelSelector
