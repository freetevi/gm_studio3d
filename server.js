const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA_FILE = path.join(ROOT, "data", "catalog.json");

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "gmadmin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "gmstudio";
const SESSION_SECRET = process.env.SESSION_SECRET || "A9x!vP2#kLm8$QwR7zT1nY4@cD5fG";

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".jfif": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function readCatalog() {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return {
      "action-figure": [],
      "chaveiros": [],
      "articulados": [],
      "interiores": [],
      "luminarias": [],
      "organizadores": []
    };
  }
}

function writeCatalog(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function send(res, code, payload, type = "application/json; charset=utf-8") {
  res.writeHead(code, {
    "Content-Type": type,
    "Cache-Control": "no-store"
  });
  res.end(typeof payload === "string" ? payload : JSON.stringify(payload));
}

function parseCookies(cookieHeader = "") {
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, part) => {
      const eq = part.indexOf("=");
      if (eq > -1) {
        acc[part.slice(0, eq)] = decodeURIComponent(part.slice(eq + 1));
      }
      return acc;
    }, {});
}

function safeEqualString(a, b) {
  const aBuf = Buffer.from(String(a));
  const bBuf = Buffer.from(String(b));
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function signValue(value) {
  return crypto.createHmac("sha256", SESSION_SECRET).update(value).digest("hex");
}

function createSessionToken(username) {
  const exp = Date.now() + 1000 * 60 * 60 * 8;
  const payload = `${username}.${exp}`;
  const sig = signValue(payload);
  return `${payload}.${sig}`;
}

function verifySessionToken(token) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 3) return null;

  const sig = parts.pop();
  const payload = parts.join(".");
  const expected = signValue(payload);
  if (!safeEqualString(sig, expected)) return null;

  const [username, expRaw] = payload.split(".");
  const exp = Number(expRaw);
  if (!username || Number.isNaN(exp) || Date.now() > exp) return null;

  return { username, exp };
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error("Payload muito grande"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("JSON invalido"));
      }
    });
    req.on("error", reject);
  });
}

function isAdmin(req) {
  const cookies = parseCookies(req.headers.cookie || "");
  const session = verifySessionToken(cookies.gm_admin);
  return Boolean(session && safeEqualString(session.username, ADMIN_USERNAME));
}

function serveStatic(req, res) {
  let requestedPath = req.url === "/" ? "/index.html" : req.url;
  requestedPath = requestedPath.split("?")[0];

  const normalized = path.normalize(requestedPath).replace(/^([.][.][\\/])+/, "");
  const filePath = path.join(ROOT, normalized);

  if (!filePath.startsWith(ROOT)) {
    return send(res, 403, "Acesso negado", "text/plain; charset=utf-8");
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      return send(res, 404, "Arquivo nao encontrado", "text/plain; charset=utf-8");
    }
    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME_TYPES[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": mime });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const url = req.url.split("?")[0];

  if (req.method === "GET" && url === "/api/catalog") {
    return send(res, 200, readCatalog());
  }

  if (req.method === "GET" && url === "/api/admin/me") {
    if (!isAdmin(req)) return send(res, 401, { ok: false });
    return send(res, 200, { ok: true, username: ADMIN_USERNAME });
  }

  if (req.method === "POST" && url === "/api/admin/login") {
    try {
      const body = await readJsonBody(req);
      const validUser = safeEqualString(body.username || "", ADMIN_USERNAME);
      const validPass = safeEqualString(body.password || "", ADMIN_PASSWORD);
      if (!validUser || !validPass) {
        return send(res, 401, { ok: false, message: "Credenciais invalidas" });
      }

      const token = createSessionToken(ADMIN_USERNAME);
      res.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
        "Set-Cookie": `gm_admin=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=28800; SameSite=Lax`
      });
      return res.end(JSON.stringify({ ok: true }));
    } catch (error) {
      return send(res, 400, { ok: false, message: error.message });
    }
  }

  if (req.method === "POST" && url === "/api/admin/logout") {
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Set-Cookie": "gm_admin=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax"
    });
    return res.end(JSON.stringify({ ok: true }));
  }

  if (req.method === "POST" && url === "/api/admin/items") {
    if (!isAdmin(req)) return send(res, 401, { ok: false, message: "Nao autorizado" });

    try {
      const body = await readJsonBody(req);
      const category = String(body.category || "").trim();
      const title = String(body.title || "").trim();
      const image = String(body.image || "").trim();

      if (!category || !title || !image) {
        return send(res, 400, { ok: false, message: "Preencha categoria, nome e imagem" });
      }

      const catalog = readCatalog();
      if (!Array.isArray(catalog[category])) {
        return send(res, 400, { ok: false, message: "Categoria invalida" });
      }

      catalog[category].push({ image, label: title });
      writeCatalog(catalog);
      return send(res, 200, { ok: true, message: "Item adicionado" });
    } catch (error) {
      return send(res, 400, { ok: false, message: error.message });
    }
  }

  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`GMStudio3D online em http://localhost:${PORT}`);
});
