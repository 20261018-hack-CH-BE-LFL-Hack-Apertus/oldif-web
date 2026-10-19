import { createServer, request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import next from "next";
import { WebSocket, WebSocketServer } from "ws";
import { runtimeConfig } from "./runtime-config.mjs";

const { backendUrl: backend, port, hostname } = runtimeConfig;
if (!backend || !Number.isInteger(port) || port < 1 || !hostname)
  throw new Error("Configure BACKEND_URL, PORT and HOSTNAME");
const upstream = new URL(backend);
if (!["http:", "https:"].includes(upstream.protocol))
  throw new Error("BACKEND_URL must use HTTP(S)");
const app = next({
  dev: !runtimeConfig.production,
  hostname,
  port,
});
await app.prepare();
const handle = app.getRequestHandler();
const server = createServer((req, res) => {
  if (!req.url?.startsWith("/api/") || req.url.startsWith("/api/csp-report")) {
    handle(req, res);
    return;
  }
  const target = new URL(req.url, upstream);
  const proxy = (target.protocol === "https:" ? httpsRequest : httpRequest)(
    target,
    {
      method: req.method,
      headers: { ...req.headers, host: target.host },
      timeout: 180000,
    },
    (response) => {
      res.writeHead(response.statusCode ?? 502, {
        ...response.headers,
        "cache-control": "no-store",
      });
      response.pipe(res);
    },
  );
  proxy.on("error", () => {
    if (!res.headersSent)
      res.writeHead(502, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({ error: "Research service unavailable. Please retry." }),
    );
  });
  proxy.on("timeout", () => proxy.destroy());
  req.on("aborted", () => proxy.destroy());
  req.pipe(proxy);
});
const wss = new WebSocketServer({ noServer: true, maxPayload: 1048576 });
server.on("upgrade", (request, socket, head) => {
  if (!request.url?.startsWith("/api/realtime")) {
    socket.destroy();
    return;
  }
  const target = new URL(request.url, upstream);
  target.protocol = upstream.protocol === "https:" ? "wss:" : "ws:";
  const remote = new WebSocket(target, {
    headers: {
      cookie: request.headers.cookie ?? "",
      origin: request.headers.origin ?? "",
    },
    maxPayload: 1048576,
    handshakeTimeout: 10000,
  });
  remote.on("open", () =>
    wss.handleUpgrade(request, socket, head, (client) => {
      client.on("message", (data, isBinary) => {
        if (remote.readyState === WebSocket.OPEN)
          remote.send(data, { binary: isBinary });
      });
      remote.on("message", (data, isBinary) => {
        if (client.readyState === WebSocket.OPEN)
          client.send(data, { binary: isBinary });
      });
      client.on("close", () => remote.close());
      remote.on("close", () => client.close());
      client.on("error", () => remote.close());
    }),
  );
  remote.on("error", () => {
    socket.destroy();
    remote.close();
  });
  socket.on("close", () => remote.close());
});
server.listen(port, hostname, () => console.info("Oldif web ready"));
