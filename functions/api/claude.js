// Cloudflare Pages Function
// File location in your repo: functions/api/claude.js
// This replaces netlify/functions/claude.js
//
// Once deployed, your frontend calls this at: /api/claude
// (instead of /.netlify/functions/claude)

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();

    const apiKey = env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing ANTHROPIC_API_KEY environment variable" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Forward the request to the Anthropic API.
    // The frontend should send { model, max_tokens, messages, tools } etc.
    // just like it did with the Netlify function.
    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    const data = await anthropicResponse.json();

    return new Response(JSON.stringify(data), {
      status: anthropicResponse.status,
      headers: {
        "Content-Type": "application/json",
        // Allow your Pages site to call this function
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Function error", details: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// Handle preflight CORS requests
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
