export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle the Claude API proxy route
    if (url.pathname === "/api/claude") {
      if (request.method === "OPTIONS") {
        return new Response(null, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        });
      }

      if (request.method === "POST") {
        try {
          const body = await request.json();
          const apiKey = env.ANTHROPIC_API_KEY;

          if (!apiKey) {
            return new Response(
              JSON.stringify({ error: "Missing ANTHROPIC_API_KEY" }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }

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
    }

    // Everything else: serve the static site (index.html, fonts, etc.)
    return env.ASSETS.fetch(request);
  },
};
