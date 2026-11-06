const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

if (!config.resolver.assetExts.includes("wasm")) {
  config.resolver.assetExts.push("wasm");
}

// expo-sqlite's web worker uses SharedArrayBuffer. Keep browser checkpoint
// transactions on the same durable repository as native during local testing.
const enhanceMiddleware = config.server.enhanceMiddleware;
config.server.enhanceMiddleware = (middleware, server) => {
  const next = enhanceMiddleware ? enhanceMiddleware(middleware, server) : middleware;
  return (request, response, done) => {
    response.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    response.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    next(request, response, done);
  };
};

module.exports = config;
