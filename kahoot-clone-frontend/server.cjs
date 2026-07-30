const http = require("node:http");
const { spawn } = require("node:child_process");
const next = require("next");
const httpProxy = require("http-proxy");
const { runMigrations } = require("./scripts/migrate.cjs");

const publicPort = Number(process.env.PORT || 3000);
const backendPort = Number(process.env.BACKEND_PORT || 8000);
const backendBinary = process.env.BACKEND_BINARY || "/app/kahoot-server";
const backendTarget = `http://127.0.0.1:${backendPort}`;

async function main() {
  await runMigrations();
  let shuttingDown = false;

  const backend = spawn(backendBinary, [], {
    env: { ...process.env, BACKEND_PORT: String(backendPort) },
    stdio: "inherit",
  });
  backend.on("exit", (code, signal) => {
    if (!shuttingDown) {
      console.error(`Backend encerrou inesperadamente (${code || signal})`);
      process.exit(code || 1);
    }
  });

  const app = next({ dev: false, dir: __dirname });
  await app.prepare();
  const handle = app.getRequestHandler();
  const proxy = httpProxy.createProxyServer({
    target: backendTarget,
    ws: true,
    xfwd: true,
    timeout: 0,
    proxyTimeout: 0,
  });

  proxy.on("open", (proxySocket) => {
    proxySocket.setKeepAlive(true, 20_000);
    proxySocket.setNoDelay(true);
    proxySocket.setTimeout(0);
  });

  proxy.on("error", (error, _request, response) => {
    console.error("Falha no proxy WebSocket", error.message);
    if (response && "writeHead" in response && !response.headersSent) {
      response.writeHead(502);
      response.end("Backend indisponível");
    }
  });

  const server = http.createServer((request, response) => {
    if (request.url === "/backend-health") {
      request.url = "/health";
      proxy.web(request, response);
      return;
    }
    void handle(request, response);
  });
  server.on("upgrade", (request, socket, head) => {
    if (request.url?.startsWith("/ws")) {
      socket.setKeepAlive(true, 20_000);
      socket.setNoDelay(true);
      socket.setTimeout(0);
      proxy.ws(request, socket, head);
    } else {
      socket.destroy();
    }
  });
  server.keepAliveTimeout = 75_000;
  server.headersTimeout = 76_000;

  server.listen(publicPort, "0.0.0.0", () => {
    console.log(`Kahoot disponível na porta ${publicPort}`);
  });

  const shutdown = (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    server.close(() => {
      backend.kill(signal);
      process.exit(0);
    });
    setTimeout(() => {
      backend.kill("SIGKILL");
      process.exit(1);
    }, 10_000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((error) => {
  console.error("Não foi possível iniciar o sistema", error);
  process.exit(1);
});
