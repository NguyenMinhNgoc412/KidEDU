const { createServer } = require("node:http");
const { generateKeyPairSync, sign } = require("node:crypto");

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const jwk = publicKey.export({ format: "jwk" });
Object.assign(jwk, { kid: "local-test-key", alg: "RS256", use: "sig" });
const issuer = "http://identity:3011";
const accounts = new Map([
  ["parent@local.kidedu.test", { password: "LocalTest123!", subject: "local-synthetic-parent" }],
  [
    "fullaccess@local.kidedu.test",
    { password: "FullAccess123!", subject: "local-full-access-parent" }
  ]
]);

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

createServer((request, response) => {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Content-Type", "application/json");
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (request.method === "OPTIONS") {
    response.writeHead(204).end();
    return;
  }
  if (request.method === "POST" && request.url === "/login") {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 2048) request.destroy();
    });
    request.on("end", () => {
      let credentials;
      try {
        credentials = JSON.parse(body);
      } catch {
        credentials = null;
      }
      const account = accounts.get(credentials?.email);
      if (!account || credentials?.password !== account.password) {
        response.writeHead(401).end(JSON.stringify({ error: "invalid_credentials" }));
        return;
      }
      response.end(JSON.stringify(issueToken(account.subject)));
    });
    return;
  }
  if (request.method !== "GET") {
    response.writeHead(405).end(JSON.stringify({ error: "method_not_allowed" }));
    return;
  }
  if (request.url === "/jwks") {
    response.end(JSON.stringify({ keys: [jwk] }));
    return;
  }
  response.writeHead(404).end(JSON.stringify({ error: "not_found" }));
}).listen(3011, "0.0.0.0");

function issueToken(subject) {
  const now = Math.floor(Date.now() / 1000);
  const header = encode({ alg: "RS256", typ: "JWT", kid: jwk.kid });
  const payload = encode({
    iss: issuer,
    aud: "authenticated",
    role: "authenticated",
    sub: subject,
    iat: now,
    exp: now + 3600
  });
  const input = `${header}.${payload}`;
  const signature = sign("RSA-SHA256", Buffer.from(input), privateKey).toString("base64url");
  return {
    accessToken: `${input}.${signature}`,
    expiresAt: new Date((now + 3600) * 1000).toISOString()
  };
}
