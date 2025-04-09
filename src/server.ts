
import { handler as replicateHandler } from './api/replicate';

// Set up routes for client-side API simulation
const setupClientProxy = () => {
  // Handle API routes
  if (typeof window !== 'undefined') {
    const originalFetch = window.fetch;
    
    window.fetch = async function(input, init) {
      const url = input instanceof Request ? input.url : input.toString();
      
      // Handle replicate API proxy
      if (url === '/api/replicate') {
        console.log('Intercepting API call to /api/replicate');
        const req = input instanceof Request ? input : new Request(url, init);
        return replicateHandler(req);
      }
      
      // Default to original fetch for other requests
      return originalFetch.apply(this, [input, init as RequestInit]);
    };
    
    console.log('Client-side API proxy set up successfully');
  }
};

export default setupClientProxy;
