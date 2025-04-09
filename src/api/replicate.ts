
// This is a client-side proxy implementation for Vite
// In a real Next.js application, this would be in pages/api/replicate.js

export async function handler(req: Request) {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const apiToken = req.headers.get('X-Replicate-API-Token');
    if (!apiToken) {
      return new Response(JSON.stringify({ error: 'API token is required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse the request body
    const requestData = await req.json();

    // Forward the request to Replicate API
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${apiToken}`,
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return new Response(JSON.stringify({ 
        error: errorData.detail || `Replicate API error: ${response.status}`
      }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const prediction = await response.json();
    
    // For predictions that need polling
    if (prediction.status === "starting" || prediction.status === "processing") {
      let pollCount = 0;
      const maxPolls = 30;
      
      // Poll until we get a result or reach maximum polls
      while (pollCount < maxPolls) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between polls
        
        const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
          headers: {
            "Authorization": `Token ${apiToken}`,
          },
        });
        
        if (!pollResponse.ok) {
          const errorData = await pollResponse.json();
          return new Response(JSON.stringify({ 
            error: errorData.detail || `Polling error: ${pollResponse.status}`
          }), {
            status: pollResponse.status,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        const updatedPrediction = await pollResponse.json();
        
        if (updatedPrediction.status === "succeeded") {
          return new Response(JSON.stringify(updatedPrediction), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        } else if (updatedPrediction.status === "failed" || updatedPrediction.status === "canceled") {
          return new Response(JSON.stringify({ 
            error: updatedPrediction.error || "Prediction failed"
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        pollCount++;
      }
      
      return new Response(JSON.stringify({ 
        error: "Timed out waiting for prediction result"
      }), {
        status: 408,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Return the response
    return new Response(JSON.stringify(prediction), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in replicate API route:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
