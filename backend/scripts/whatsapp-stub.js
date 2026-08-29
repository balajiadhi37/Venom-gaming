/**
 * Local stand-in for the WhatsApp Cloud API. Development only.
 *
 *   node scripts/whatsapp-stub.js
 *   WHATSAPP_API_BASE_URL=http://127.0.0.1:5099 npm run dev
 *
 * STUB_MODE (or ?mode= on the request) drives the failure modes:
 *   ok     200 + message id                (default)
 *   slow   sleeps 30s then 200             (proves non-blocking + the timeout)
 *   error  401 + Graph error envelope
 *   soft   200 + error envelope            (the ok-but-not-ok case)
 *   html   200 + non-JSON body
 */

const http = require("node:http");

const MODE = process.env.STUB_MODE || "ok";
const PORT = Number(process.env.STUB_PORT || 5099);

// Exactly what Meta rejects in a template parameter.
const ILLEGAL = /[\n\t]|\s{5,}/;

http
  .createServer((req, res) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", async () => {
      console.log(`\n--- ${req.method} ${req.url}`);
      console.log("auth:", req.headers.authorization ? "Bearer <present>" : "MISSING");

      try {
        const body = JSON.parse(raw);
        console.log("to:", JSON.stringify(body.to));
        console.log("template:", body.template?.name, body.template?.language?.code);
        body.template?.components?.[0]?.parameters?.forEach((p, i) => {
          const bad = ILLEGAL.test(p.text) || p.text === "";
          console.log(
            `  {{${i + 1}}} ${bad ? "REJECTED BY META" : "ok"} len=${p.text.length} ${JSON.stringify(p.text)}`
          );
        });
      } catch {
        console.log("unparseable body:", raw.slice(0, 200));
      }

      const mode = new URL(req.url, "http://x").searchParams.get("mode") || MODE;
      if (mode === "slow") await new Promise((r) => setTimeout(r, 30000));

      const send = (code, payload, type = "application/json") => {
        res.writeHead(code, { "content-type": type });
        res.end(typeof payload === "string" ? payload : JSON.stringify(payload));
      };

      if (mode === "error") {
        return send(401, {
          error: { message: "Invalid OAuth access token.", type: "OAuthException", code: 190, fbtrace_id: "STUB" },
        });
      }
      if (mode === "soft") {
        return send(200, {
          error: { message: "Template name does not exist", type: "OAuthException", code: 132001, fbtrace_id: "STUB" },
        });
      }
      if (mode === "html") {
        return send(200, "<html>Sorry, something went wrong</html>", "text/html");
      }
      return send(200, {
        messaging_product: "whatsapp",
        contacts: [{ input: "919876543210", wa_id: "919876543210" }],
        messages: [{ id: "wamid.STUB", message_status: "accepted" }],
      });
    });
  })
  .listen(PORT, () => console.log(`WhatsApp stub on http://127.0.0.1:${PORT} (mode=${MODE})`));
