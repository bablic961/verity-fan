#!/usr/bin/env node
/**
 * ВЕРИТИ.fan — маленький статический сервер без зависимостей.
 *
 * Запуск:  node server.js
 * Порт:    PORT=3000 (по умолчанию)
 * Хост:    HOST=0.0.0.0 (доступен с телефона в той же Wi-Fi)
 */

"use strict";

const http = require("node:http");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const zlib = require("node:zlib");
const os = require("node:os");

const ROOT = path.join(__dirname, "public");
const PORT = Number(process.env.SITE_PORT || process.env.VERITY_PORT) || 3000;
const HOST = process.env.HOST || "0.0.0.0";

const MIME = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain",
  ".map": "application/json",
};

const TEXT_TYPES = /^(text\/|application\/(javascript|json|manifest\+json|xml)|image\/svg\+xml)/;

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "DENY",
  "Content-Security-Policy":
    "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src https://fonts.gstatic.com; img-src 'self' data: blob:; script-src 'self'; " +
    "connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
};

function logRequest(req, res, startedAt) {
  const ms = Date.now() - startedAt;
  const stamp = new Date().toISOString().slice(11, 19);
  console.log(`${stamp}  ${req.method.padEnd(4)} ${String(res.statusCode).padEnd(3)} ${ms}ms  ${req.url}`);
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
    ...SECURITY_HEADERS,
  });
  res.end(res.req && res.req.method === "HEAD" ? undefined : body);
}

function notFound(res, method) {
  const body = `<!DOCTYPE html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>404 — Верити не нашёл эту страницу</title>
<style>
  :root{color-scheme:dark}
  *{box-sizing:border-box}
  body{margin:0;min-height:100svh;display:grid;place-items:center;padding:24px;background:#0a0a0b;color:#f4f1e8;font-family:system-ui,-apple-system,sans-serif;text-align:center}
  .face{width:120px;height:120px;margin:0 auto 24px;border-radius:50%;background:#ffd60a;position:relative;box-shadow:0 0 60px rgba(255,214,10,.25)}
  .face::before,.face::after{content:"";position:absolute;top:38%;width:12px;height:19px;border-radius:50%;background:#0a0a0b}
  .face::before{left:30%}.face::after{right:30%}
  .smile{position:absolute;left:50%;top:60%;width:52px;height:22px;transform:translateX(-50%);border-radius:0 0 52px 52px;background:#0a0a0b}
  h1{font-size:clamp(28px,8vw,48px);line-height:1.05;margin:0 0 12px;letter-spacing:-.03em}
  p{color:#a3a099;max-width:42ch;margin:0 auto 26px;line-height:1.6}
  a{display:inline-block;padding:14px 22px;border-radius:999px;background:#ffd60a;color:#0a0a0b;font-weight:700;text-decoration:none}
  a:active{transform:scale(.97)}
  code{color:#ffd60a}
</style></head>
<body><main>
  <div class="face" aria-hidden="true"><span class="smile"></span></div>
  <h1>404. Здесь пусто</h1>
  <p>Верити говорит, что такой страницы нет. А он знает всё. Вернись на главную, пока он не начал считать дни.</p>
  <a href="/">На главную</a>
</main></body></html>`;

  res.writeHead(404, {
    "Content-Type": "text/html; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
    ...SECURITY_HEADERS,
  });
  res.end(method === "HEAD" ? undefined : body);
}

function resolveFilePath(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  if (decoded.includes("\0")) return null;

  const relative = decoded === "/" ? "/index.html" : decoded;
  const resolved = path.resolve(ROOT, "." + relative);

  if (resolved !== ROOT && !resolved.startsWith(ROOT + path.sep)) return null;
  return resolved;
}

function isFresh(req, stat) {
  const header = req.headers["if-modified-since"];
  if (!header) return false;
  const since = Date.parse(header);
  if (Number.isNaN(since)) return false;
  // mtime округляется до секунд в HTTP-дате
  return Math.floor(stat.mtimeMs / 1000) * 1000 <= since;
}

const server = http.createServer(async (req, res) => {
  const startedAt = Date.now();
  res.on("finish", () => logRequest(req, res, startedAt));

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return sendJson(res, 405, { error: "method_not_allowed" });
  }

  let url;
  try {
    url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  } catch {
    return sendJson(res, 400, { error: "bad_request" });
  }

  if (url.pathname === "/health") {
    return sendJson(res, 200, {
      status: "ok",
      uptime: Math.round(process.uptime()),
      site: "verity.fan",
      time: new Date().toISOString(),
    });
  }

  const filePath = resolveFilePath(url.pathname);
  if (!filePath) return notFound(res, req.method);

  let stat;
  try {
    stat = await fsp.stat(filePath);
    if (stat.isDirectory()) {
      const indexPath = path.join(filePath, "index.html");
      stat = await fsp.stat(indexPath);
      return serveFile(req, res, indexPath, stat);
    }
  } catch {
    return notFound(res, req.method);
  }

  return serveFile(req, res, filePath, stat);
});

async function serveFile(req, res, filePath, stat) {
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || "application/octet-stream";
  const isHtml = ext === ".html";
  const headers = {
    "Content-Type": TEXT_TYPES.test(type) ? `${type}; charset=utf-8` : type,
    "Last-Modified": stat.mtime.toUTCString(),
    "Cache-Control": isHtml ? "no-cache" : "public, max-age=3600",
    ...SECURITY_HEADERS,
  };

  if (isFresh(req, stat)) {
    res.writeHead(304, headers);
    return res.end();
  }

  const acceptsGzip = /\bgzip\b/.test(req.headers["accept-encoding"] || "");
  const useGzip = acceptsGzip && TEXT_TYPES.test(type) && stat.size > 1024;

  if (useGzip) {
    headers["Content-Encoding"] = "gzip";
    headers["Vary"] = "Accept-Encoding";
  } else {
    headers["Content-Length"] = stat.size;
  }

  res.writeHead(200, headers);
  if (req.method === "HEAD") return res.end();

  const stream = fs.createReadStream(filePath);
  stream.on("error", () => res.destroy());
  res.on("close", () => stream.destroy());

  if (useGzip) {
    stream.pipe(zlib.createGzip()).pipe(res);
  } else {
    stream.pipe(res);
  }
}

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`\n  Порт ${PORT} уже занят. Попробуй: PORT=3001 node server.js\n`);
  } else {
    console.error("\n  Не удалось запустить сервер:", error.message, "\n");
  }
  process.exit(1);
});

function localAddresses() {
  const result = [];
  const nets = os.networkInterfaces();
  for (const list of Object.values(nets)) {
    for (const net of list || []) {
      if (net.family === "IPv4" && !net.internal) result.push(net.address);
    }
  }
  return result;
}

server.listen(PORT, HOST, () => {
  const lan = localAddresses();
  console.log("\n  ВЕРИТИ.fan — сервер запущен\n");
  console.log(`  На этом компьютере:  http://localhost:${PORT}`);
  lan.forEach((ip) => {
    console.log(`  С телефона (Wi-Fi):  http://${ip}:${PORT}`);
  });
  console.log(`\n  Корень сайта: ${ROOT}`);
  console.log("  Остановить: Ctrl+C\n");
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    console.log("\n  Останавливаю сервер…");
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 3000).unref();
  });
}
