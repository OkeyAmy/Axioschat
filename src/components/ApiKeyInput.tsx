
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Check, Copy, Eye, EyeOff } from "lucide-react";

interface ApiKeyInputProps {
  label: string;
  apiKey: string;
  onChange: (key: string) => void;
  placeholder?: string;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({
  label,
  apiKey,
  onChange,
  placeholder = "Enter API key..."
}) => {
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Reset copied state after 2 seconds
  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [copied]);

  const toggleShowKey = () => {
    setShowKey(prev => !prev);
  };

  const copyToClipboard = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setCopied(true);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={`${label.toLowerCase().replace(/\s/g, '-')}-key`}>{label}</Label>
      <div className="flex">
        <div className="relative flex-1">
          <Input
            id={`${label.toLowerCase().replace(/\s/g, '-')}-key`}
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="pr-20"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleShowKey}
              tabIndex={-1}
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={copyToClipboard}
              disabled={!apiKey}
              tabIndex={-1}
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyInput;
