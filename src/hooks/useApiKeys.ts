
import { useState, useEffect } from 'react';

interface ApiKeys {
  replicate: string;
}

const useApiKeys = () => {
  const [apiKeys, setApiKeys] = useState<ApiKeys>({ replicate: '' });
  const [isLoaded, setIsLoaded] = useState(false);

  // Load API keys from localStorage on mount
  useEffect(() => {
    const savedKeys = localStorage.getItem('apiKeys');
    if (savedKeys) {
      try {
        const parsedKeys = JSON.parse(savedKeys) as ApiKeys;
        setApiKeys(parsedKeys);
      } catch (error) {
        console.error('Failed to parse API keys from localStorage:', error);
      }
    }
    setIsLoaded(true);
  }, []);

  // Update API key and save to localStorage
  const updateApiKey = (key: keyof ApiKeys, value: string) => {
    setApiKeys(prev => {
      const newKeys = { ...prev, [key]: value };
      localStorage.setItem('apiKeys', JSON.stringify(newKeys));
      return newKeys;
    });
  };

  return {
    apiKeys,
    updateApiKey,
    isLoaded,
  };
};

export default useApiKeys;
