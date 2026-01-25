// This is a Vercel serverless function that mimics the behavior of your Flask proxy
// but uses Google's Gemini API instead of Replicate
export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Replicate-API-Token',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({
        error: 'Method not allowed'
      }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Get the API token from the headers
    const apiToken = req.headers.get('X-Replicate-API-Token') || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
    if (!apiToken) {
      return new Response(JSON.stringify({
        error: 'Gemini API token is required'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Parse the request body
    let requestData;
    try {
      requestData = await req.json();
    } catch (error) {
      return new Response(JSON.stringify({
        error: 'Failed to parse request body',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    if (!requestData) {
      return new Response(JSON.stringify({
        error: 'Request body is required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    console.log('Received request:', JSON.stringify(requestData).substring(0, 500) + '...');

    // Extract the input data from the Replicate-style request
    const input = requestData.input || {};
    const query = input.query || '';
    const tools = input.tools || '[]';
    const temperature = input.temperature || 0.7;
    const top_p = input.top_p || 0.9;
    const max_tokens = input.max_new_tokens || 3000;

    // Parse the tools JSON string to get the actual tools array
    let parsedTools = [];
    try {
      parsedTools = JSON.parse(tools);
    } catch (e) {
      console.error('Error parsing tools JSON:', e);
      return new Response(JSON.stringify({
        error: 'Invalid tools format'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Use direct fetch instead of OpenAI SDK for Edge compatibility
    const geminiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
    
    const response = await fetch(geminiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`
      },
      body: JSON.stringify({
        model: 'gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful Web3 assistant that can execute functions to help users with blockchain tasks.',
          },
          { role: 'user', content: query },
        ],
        tools: parsedTools,
        tool_choice: 'auto',
        temperature,
        max_tokens,
      })
    });

    if (!response.ok) {
      let errorText;
      try {
        errorText = await response.text();
        console.error(`Gemini API error (${response.status}):`, errorText);
      } catch (error) {
        errorText = 'Could not read error response';
      }

      return new Response(JSON.stringify({
        error: `Gemini API returned ${response.status}`,
        details: errorText
      }), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Get the response data
    let responseData;
    try {
      responseData = await response.json();
    } catch (error) {
      return new Response(JSON.stringify({
        error: 'Failed to parse Gemini API response',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    console.log('Gemini response:', JSON.stringify(responseData).substring(0, 500) + '...');

    // Process the response to match the format expected by the client
    let output;
    const message = responseData.choices?.[0]?.message;

    if (message?.tool_calls && message.tool_calls.length > 0) {
      // Format function calls to match the expected format
      output = message.tool_calls.map((toolCall: any) => {
        if (toolCall.type === 'function') {
          let args = {};
          try {
            args = typeof toolCall.function.arguments === 'string' 
              ? JSON.parse(toolCall.function.arguments)
              : toolCall.function.arguments;
          } catch (e) {
            console.error('Error parsing function arguments:', e);
          }

          return {
            type: 'function',
            function: {
              name: toolCall.function.name,
              arguments: args
            }
          };
        }
        return null;
      }).filter(Boolean);
    } else {
      // If no function calls, just return the text
      output = message?.content || '';
    }

    // Return the response in the format expected by the client
    // This mimics the Replicate API response format
    return new Response(JSON.stringify({
      id: `gemini-${Date.now()}`,
      status: 'succeeded',
      output,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Replicate-API-Token'
      }
    });
  } catch (error) {
    console.error('Error in replicate proxy:', error);
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
