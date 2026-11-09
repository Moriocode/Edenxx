/**
 * Local stand-in for the Upstash REST API, used only to verify the analytics
 * route without real credentials. Implements the handful of commands the
 * analytics module issues, including `/pipeline`.
 *
 * Not part of the app; run it from a scratch directory:
 *   node mock-upstash.mjs 6380
 */
import http from "node:http";

const port = Number(process.argv[2] || 6380);
const strings = new Map(); // key -> { value: string, exp?: number }
const counters = new Map(); // key -> number
const zsets = new Map(); // key -> Map<member, score>

const now = () => Date.now();

function liveString(key) {
  const entry = strings.get(key);
  if (!entry) return undefined;
  if (entry.exp && entry.exp <= now()) {
    strings.delete(key);
    return undefined;
  }
  return entry;
}

function cmd(name, args) {
  const c = name.toUpperCase();
  if (c === "SET") {
    const [key, value, ...opts] = args;
    const nx = opts.some((o) => String(o).toUpperCase() === "NX");
    if (nx && liveString(key)) return null;
    const exIndex = opts.findIndex((o) => String(o).toUpperCase() === "EX");
    const exp = exIndex >= 0 ? now() + Number(opts[exIndex + 1]) * 1000 : undefined;
    counters.delete(key);
    strings.set(key, { value: String(value), exp });
    return "OK";
  }
  if (c === "GET") {
    const entry = liveString(args[0]);
    if (entry) return entry.value;
    // Counters live in their own map in this mock; real Redis returns GET on them.
    const counter = counters.get(args[0]);
    return counter === undefined ? null : String(counter);
  }
  if (c === "INCR") {
    strings.delete(args[0]);
    const next = (counters.get(args[0]) || 0) + 1;
    counters.set(args[0], next);
    return next;
  }
  if (c === "EXPIRE") return 1;
  if (c === "ZINCRBY") {
    const [key, incr, member] = args;
    if (!zsets.has(key)) zsets.set(key, new Map());
    const set = zsets.get(key);
    const next = (set.get(String(member)) || 0) + Number(incr);
    set.set(String(member), next);
    return String(next);
  }
  if (c === "ZREVRANGE") {
    const [key, start, stop, ...rest] = args;
    const set = zsets.get(key) || new Map();
    const sorted = [...set.entries()].sort((a, b) => b[1] - a[1]);
    const slice = sorted.slice(Number(start), Number(stop) + 1);
    const withScores = rest.some((r) => String(r).toUpperCase() === "WITHSCORES");
    return withScores ? slice.flatMap(([m, s]) => [m, String(s)]) : slice.map(([m]) => m);
  }
  throw new Error(`mock does not implement ${c}`);
}

const server = http.createServer((req, res) => {
  if (req.method !== "POST") {
    res.writeHead(405).end(JSON.stringify({ error: "only POST is mocked" }));
    return;
  }
  let raw = "";
  req.on("data", (chunk) => (raw += chunk));
  req.on("end", () => {
    let body;
    try {
      body = JSON.parse(raw || "[]");
    } catch {
      res.writeHead(400).end(JSON.stringify({ error: "bad JSON" }));
      return;
    }
    try {
      const isPipeline = req.url?.startsWith("/pipeline");
      const replies = (isPipeline ? body : [body]).map(([name, ...args]) => {
        try {
          return { result: cmd(name, args) };
        } catch (err) {
          return { error: String(err.message || err) };
        }
      });
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(isPipeline ? replies : replies[0]));
    } catch (err) {
      res.writeHead(500).end(JSON.stringify({ error: String(err) }));
    }
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`mock upstash listening on http://127.0.0.1:${port}`);
});
