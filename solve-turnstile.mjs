#!/usr/bin/env node
// A command-line Cloudflare Turnstile solver on the ZeroCaptcha API, with no dependencies:
//
//   export ZEROCAPTCHA_API=https://api.zerocaptcha.io ZEROCAPTCHA_KEY=zc_live_...
//   node solve-turnstile.mjs --url https://shop.example.com/login --sitekey 0x4AAAAAAAB1cD2eF3gH4iJ5 \
//     --action login --cdata session-7f3a9c2e
//
// It prints the token. Options:
//   --action <name>   the widget's data-action, or turnstile.render()'s action option: pass it
//                     whenever the widget sets one, since many sites check it
//   --cdata <value>   the widget's data-cdata, or turnstile.render()'s cData option, likewise
//   --proxy <url>     solve through your proxy, such as http://user:pass@proxy.example.net:8080
//   --challenge       pass a Cloudflare challenge page instead (needs --proxy, no --sitekey), and
//                     print its cf_clearance cookie and user agent
//   --json            print the result as JSON
//   --timeout <s>     give up after this many seconds (180 by default)
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import { zeroCaptcha, ZeroCaptchaError } from "./src/zerocaptcha.mjs";

const USAGE =
  "Usage: node solve-turnstile.mjs --url <page URL> --sitekey <sitekey> [--action <name>] [--cdata <value>] [--proxy <url>] [--json]\n" +
  "       node solve-turnstile.mjs --challenge --url <page URL> --proxy <url> [--json]";

/**
 * Runs the command with these arguments; resolves with its exit status.
 *
 * @param {string[]} args
 * @param {{ out?: (line: string) => void, err?: (line: string) => void, intervalMs?: number }} [io]
 */
export async function main(args, io = {}) {
  const out = io.out ?? ((line) => process.stdout.write(`${line}\n`));
  const err = io.err ?? ((line) => process.stderr.write(`${line}\n`));
  let values;
  try {
    ({ values } = parseArgs({
      args,
      options: {
        url: { type: "string" },
        sitekey: { type: "string" },
        action: { type: "string" },
        cdata: { type: "string" },
        proxy: { type: "string" },
        challenge: { type: "boolean", default: false },
        json: { type: "boolean", default: false },
        timeout: { type: "string", default: "180" },
      },
    }));
  } catch (error) {
    err(`${error.message}\n${USAGE}`);
    return 2;
  }
  const missing = values.challenge ? !values.url || !values.proxy : !values.url || !values.sitekey;
  if (missing) {
    err(USAGE);
    return 2;
  }
  try {
    const client = zeroCaptcha({
      timeoutMs: Number(values.timeout) * 1000,
      intervalMs: io.intervalMs,
    });
    if (values.challenge) {
      const clearance = await client.solveChallenge({
        websiteURL: values.url,
        proxy: values.proxy,
      });
      out(
        values.json
          ? JSON.stringify(clearance)
          : `cf_clearance=${clearance.cfClearance}\nuser-agent=${clearance.userAgent}`,
      );
      return 0;
    }
    const task = { websiteURL: values.url, websiteKey: values.sitekey };
    for (const field of ["action", "cdata", "proxy"]) {
      if (values[field] !== undefined) task[field] = values[field];
    }
    const token = await client.solveTurnstile(task);
    out(values.json ? JSON.stringify({ token }) : token);
    return 0;
  } catch (error) {
    if (!(error instanceof ZeroCaptchaError) && !/ZEROCAPTCHA_/.test(String(error?.message)))
      throw error;
    const request = error.requestId === undefined ? "" : ` (request ${error.requestId})`;
    err(`${error.message}${request}`);
    return 1;
  }
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main(process.argv.slice(2));
}
