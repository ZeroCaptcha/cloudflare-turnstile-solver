// The command against a stand-in for the ZeroCaptcha REST API: no key, no real task, nothing
// spent. The stand-in answers POST /v1/tasks and GET /v1/tasks/{id} as the API does, for
// Cloudflare Turnstile and challenge-page tasks: running on the first poll, succeeded on the next.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { after, before, beforeEach, test } from "node:test";

import { main } from "../solve-turnstile.mjs";

const KEY = "zc_live_test_key";
const TOKEN = "0.stand-in-turnstile-token";
const CLEARANCE = "stand-in-cf-clearance";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140.0.0.0 Safari/537.36";
const PAGE = "https://shop.example.com/login";
const SITEKEY = "0x4AAAAAAAB1cD2eF3gH4iJ5";

const requests = [];
const tasks = new Map();
let server;

/** Answers a request with JSON. */
function send(response, status, value) {
  response.writeHead(status, { "content-type": "application/json" }).end(JSON.stringify(value));
}

before(async () => {
  server = createServer((request, response) => {
    let text = "";
    request.on("data", (chunk) => (text += chunk));
    request.on("end", () => {
      const body = text === "" ? undefined : JSON.parse(text);
      requests.push({
        method: request.method,
        path: request.url,
        body,
        key: request.headers["idempotency-key"],
      });
      if (request.headers.authorization !== `Bearer ${KEY}`) {
        return send(response, 401, {
          code: "unauthorized",
          detail: "The key is not valid.",
          request_id: "req-1",
        });
      }
      if (request.method === "POST") {
        const id = crypto.randomUUID();
        tasks.set(id, { body, polls: 0 });
        return send(response, 201, { id, status: "queued" });
      }
      const id = request.url.replace("/v1/tasks/", "");
      const task = tasks.get(id);
      task.polls += 1;
      if (task.polls === 1) return send(response, 200, { id, status: "running" });
      const solution =
        task.body.type === "CloudflareChallengeTask"
          ? {
              token: CLEARANCE,
              userAgent: USER_AGENT,
              cookie: { name: "cf_clearance", value: CLEARANCE },
            }
          : { token: TOKEN };
      return send(response, 200, { id, status: "succeeded", solution });
    });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  process.env.ZEROCAPTCHA_API = `http://127.0.0.1:${server.address().port}`;
  process.env.ZEROCAPTCHA_KEY = KEY;
});

after(() => server.close());
beforeEach(() => {
  requests.length = 0;
});

/** Runs the command and returns its exit status and what it printed. */
async function run(...args) {
  const out = [];
  const err = [];
  const status = await main(args, {
    out: (line) => out.push(line),
    err: (line) => err.push(line),
    intervalMs: 10,
  });
  return { status, out: out.join("\n"), err: err.join("\n") };
}

test("prints the token", async () => {
  const result = await run("--url", PAGE, "--sitekey", SITEKEY);
  assert.deepEqual(result, { status: 0, out: TOKEN, err: "" });
  assert.deepEqual(requests[0].body, {
    type: "TurnstileTaskProxyless",
    websiteURL: PAGE,
    websiteKey: SITEKEY,
  });
  assert.ok(requests[0].key, "createTask sends an Idempotency-Key");
});

test("sends the action, the cData and the proxy", async () => {
  const proxy = "http://user:pass@proxy.example.net:8080";
  await run(
    "--url",
    PAGE,
    "--sitekey",
    SITEKEY,
    "--action",
    "login",
    "--cdata",
    "abc",
    "--proxy",
    proxy,
  );
  assert.deepEqual(requests[0].body, {
    type: "TurnstileTask",
    websiteURL: PAGE,
    websiteKey: SITEKEY,
    action: "login",
    cdata: "abc",
    proxy,
  });
});

test("prints JSON", async () => {
  const result = await run("--url", PAGE, "--sitekey", SITEKEY, "--json");
  assert.deepEqual(JSON.parse(result.out), { token: TOKEN });
});

test("passes a Cloudflare challenge page through the proxy", async () => {
  const proxy = "http://user:pass@proxy.example.net:8080";
  const result = await run(
    "--challenge",
    "--url",
    "https://shop.example.com/",
    "--proxy",
    proxy,
    "--json",
  );
  assert.equal(result.status, 0);
  assert.deepEqual(JSON.parse(result.out), { cfClearance: CLEARANCE, userAgent: USER_AGENT });
  assert.deepEqual(requests[0].body, {
    type: "CloudflareChallengeTask",
    websiteURL: "https://shop.example.com/",
    proxy,
  });
});

test("a challenge page needs a proxy", async () => {
  const result = await run("--challenge", "--url", "https://shop.example.com/");
  assert.equal(result.status, 2);
  assert.match(result.err, /Usage/);
  assert.equal(requests.length, 0);
});

test("a refusal is printed with its code and request ID", async () => {
  process.env.ZEROCAPTCHA_KEY = "zc_live_wrong";
  try {
    const result = await run("--url", PAGE, "--sitekey", SITEKEY);
    assert.equal(result.status, 1);
    assert.equal(result.err, "unauthorized: The key is not valid. (request req-1)");
  } finally {
    process.env.ZEROCAPTCHA_KEY = KEY;
  }
});
