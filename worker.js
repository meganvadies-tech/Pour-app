export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle server-side page fetching (avoids unreliable public CORS proxies)
    if (url.pathname === "/api/fetch-page") {
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
          const { url: targetUrl } = await request.json();
          if (!targetUrl) {
            return new Response(
              JSON.stringify({ error: "Missing url" }),
              { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
            );
          }

          const pageResponse = await fetch(targetUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
            },
          });

          if (!pageResponse.ok) {
            return new Response(
              JSON.stringify({ error: `Page returned status ${pageResponse.status}` }),
              { status: 502, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
            );
          }

          const html = await pageResponse.text();
          return new Response(JSON.stringify({ html }), {
            status: 200,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          });
        } catch (err) {
          return new Response(
            JSON.stringify({ error: "Fetch failed", details: err.message }),
            { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
          );
        }
      }
    }

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

          console.log("Has API key:", !!apiKey, "Key length:", apiKey ? apiKey.length : 0);

          if (!apiKey) {
            console.log("ERROR: ANTHROPIC_API_KEY is missing from env");
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

          console.log("Anthropic responded with status:", anthropicResponse.status);

          let data;
          const rawText = await anthropicResponse.text();
          try {
            data = JSON.parse(rawText);
          } catch (parseErr) {
            console.log("Anthropic returned non-JSON body:", rawText.slice(0, 200));
            return new Response(
              JSON.stringify({ error: `Request to Anthropic failed or timed out (status ${anthropicResponse.status}). Please try again.` }),
              { status: 502, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
            );
          }

          if (anthropicResponse.status !== 200) {
            console.log("Anthropic error body:", JSON.stringify(data));
          }

          return new Response(JSON.stringify(data), {
            status: anthropicResponse.status,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          });
        } catch (err) {
          console.log("CAUGHT EXCEPTION:", err.message, err.stack);
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
