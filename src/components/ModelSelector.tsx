
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Settings, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import ApiKeyInput from './ApiKeyInput';

interface ModelSelectorProps {
  useLocalAI: boolean;
  onUseLocalAIChange: (value: boolean) => void;
  showSettings: boolean;
  onShowSettingsChange: (value: boolean) => void;
  localEndpoint: string;
  onLocalEndpointChange: (value: string) => void;
  replicateApiKey: string;
  onReplicateApiKeyChange: (value: string) => void;
  className?: string;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  useLocalAI,
  onUseLocalAIChange,
  showSettings,
  onShowSettingsChange,
  localEndpoint,
  onLocalEndpointChange,
  replicateApiKey,
  onReplicateApiKeyChange,
  className
}) => {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="model-toggle"
            checked={useLocalAI}
            onCheckedChange={onUseLocalAIChange}
          />
          <Label htmlFor="model-toggle" className="text-sm cursor-pointer select-none">
            {useLocalAI ? "Llama 3.2 (Local)" : "Flock Web3 (Cloud)"}
          </Label>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => onShowSettingsChange(!showSettings)}
          className="h-8 w-8"
        >
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
          
          {useLocalAI ? (
            <div className="space-y-2">
              <Label htmlFor="local-endpoint" className="text-xs">Local Endpoint</Label>
              <input
                id="local-endpoint"
                placeholder="http://localhost:11434"
                value={localEndpoint}
                onChange={(e) => onLocalEndpointChange(e.target.value)}
                className="w-full px-3 py-1 text-xs h-8 rounded-md border"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <ApiKeyInput 
                label="Replicate API Key"
                apiKey={replicateApiKey}
                onChange={onReplicateApiKeyChange}
                placeholder="Enter your Replicate API key"
              />
              <div className="text-xs text-muted-foreground mt-2">
                <p>Note: Due to CORS restrictions, API calls may not work directly from the browser. 
                Consider using a backend service or Supabase Edge Function for production use.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ModelSelector;
