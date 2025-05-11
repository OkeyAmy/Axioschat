import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// This is a Vercel serverless function that acts as a proxy for Gemini API
// to avoid CORS issues with browser-based requests
export const config = {
  runtime: 'edge',
};

export default async function handler(req: NextRequest) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Gemini-API-Key',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  try {
    // Only allow POST requests for actual API calls
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

    console.log('Received request to Gemini proxy');

    // Initialize OpenAI client with Gemini configuration
    const openai = new OpenAI({
      apiKey: apiToken,
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/'
    });

    // Extract parameters from the request
    const {
      model = 'gemini-2.5-flash-preview-04-17',
      messages,
      temperature = 0.7,
      max_tokens = 2000,
      reasoning_effort = 'low'
    } = requestData;

    // Call Gemini API through OpenAI SDK
    const response = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens,
      reasoning_effort
    });

    console.log('Received response from Gemini API');

    // Return the response with proper CORS headers
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Gemini-API-Key'
      }
    });
  } catch (error) {
    console.error('Error in Gemini proxy:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      detail: error instanceof Error ? error.stack : undefined
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
} 