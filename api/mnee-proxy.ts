import type { VercelRequest, VercelResponse } from '@vercel/node';

const MNEE_API_BASE = process.env.MNEE_API_URL || 'https://sandbox-proxy-api.mnee.net';
const MNEE_API_KEY = process.env.MNEE_API_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Get the path from the URL (e.g., /mnee-api/v2/balance -> /v2/balance)
    // Handle both /mnee-api and /api/mnee-proxy patterns
    const pathMatch = req.url?.match(/\/(?:mnee-api|api\/mnee-proxy)(\/.*)?/);
    const path = pathMatch?.[1] || '/';
    
    // Build target URL
    const targetUrl = new URL(path, MNEE_API_BASE);
    
    // Add auth token if available
    if (MNEE_API_KEY) {
      targetUrl.searchParams.set('auth_token', MNEE_API_KEY);
    }
    
    // Copy query params from original request
    const originalParams = new URL(req.url || '', `http://${req.headers.host}`).searchParams;
    originalParams.forEach((value, key) => {
      if (key !== 'auth_token') {
        targetUrl.searchParams.set(key, value);
      }
    });

    console.log(`[MNEE Proxy] ${req.method} ${targetUrl.toString()}`);

    // Forward the request to MNEE API
    const response = await fetch(targetUrl.toString(), {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: req.method !== 'GET' && req.body ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.text();
    
    // Try to parse as JSON
    try {
      const jsonData = JSON.parse(data);
      return res.status(response.status).json(jsonData);
    } catch {
      // Return as text if not JSON
      return res.status(response.status).send(data);
    }
  } catch (error) {
    console.error('[MNEE Proxy] Error:', error);
    return res.status(500).json({
      error: 'Failed to proxy request to MNEE API',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

