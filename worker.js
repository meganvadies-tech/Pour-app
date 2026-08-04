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

          const data = await anthropicResponse.json();
          console.log("Anthropic responded with status:", anthropicResponse.status);
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
