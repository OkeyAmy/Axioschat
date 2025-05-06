import { NextRequest, NextResponse } from 'next/server';

// This is a Vercel serverless function that acts as a proxy for Gemini API
// to avoid CORS issues with browser-based requests
export const config = {
  runtime: 'edge',
  regions: ['iad1'], // Use your preferred region
};

export default async function handler(req: NextRequest) {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
      );
    }

    // Get the API token from the headers
    const apiToken = req.headers.get('X-Gemini-API-Key');
    if (!apiToken) {
      return NextResponse.json(
        { error: 'Gemini API token is required' },
        { status: 401 }
      );
    }

    // Parse the request body
    const requestData = await req.json();
    if (!requestData) {
      return NextResponse.json(
        { error: 'Request body is required' },
        { status: 400 }
      );
    }

    console.log('Proxying request to Gemini API');

    // Forward the request to the Gemini API
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`
      },
      body: JSON.stringify(requestData)
    });

    // Get the response data
    const responseData = await response.json();
    console.log('Received response from Gemini API');

    // Return the response
    return new Response(JSON.stringify(responseData), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Gemini-API-Key'
      }
    });
  } catch (error) {
    console.error('Error in proxy-gemini:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        detail: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 