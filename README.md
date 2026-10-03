<!-- zc:header (generated from the registry; edit repos/registry.json) -->
# Cloudflare Turnstile solver

[![CI](https://github.com/ZeroCaptcha/cloudflare-turnstile-solver/actions/workflows/ci.yml/badge.svg)](https://github.com/ZeroCaptcha/cloudflare-turnstile-solver/actions/workflows/ci.yml)

Cloudflare Turnstile solver: get a valid Cloudflare Turnstile token for any page and sitekey from the ZeroCaptcha API. A zero-dependency Node.js CLI, the REST and createTask formats, and links to tested examples for Python, Node.js, Go, PHP, Java, C#, Rust, Playwright, Puppeteer and Selenium.

[Website](https://zerocaptcha.io/cloudflare-turnstile-solver) · [Docs](https://zerocaptcha.io/docs) · [Quickstart](https://zerocaptcha.io/docs/quickstart) · [API reference](https://zerocaptcha.io/docs/reference/api) · [Pricing](https://zerocaptcha.io/pricing)
<!-- /zc:header -->

## What it does

Cloudflare Turnstile is Cloudflare's CAPTCHA: a widget on a site's form that gives the browser a token, which the site checks with Cloudflare before it accepts the form. When you automate, test or monitor a site you are allowed to, the widget stands between your script and the form.

ZeroCaptcha is an API that solves it: send the page's URL and the widget's sitekey, get a valid Cloudflare Turnstile token back, and submit it as the browser would. This repository is the starting point:

- **`solve-turnstile.mjs`**, a command-line solver with no dependencies (Node.js 20 or later);
- a map of the tested examples for every language and browser tool, the SDKs, and the API formats.

## Quickstart

1. Create an account on the ZeroCaptcha website, create an API key on the dashboard and add funds (crypto, from $10). A task is charged only when it succeeds.
2. Set the API's address and your key:

   ```sh
   export ZEROCAPTCHA_API=https://api.zerocaptcha.io
   export ZEROCAPTCHA_KEY=zc_live_...
   ```

3. Read the widget's `data-sitekey`, `data-action` and `data-cdata` from the page (or the `sitekey`, `action` and `cData` options of its `turnstile.render()` call), then:

   ```sh
   node solve-turnstile.mjs --url https://shop.example.com/login --sitekey 0x4AAAAAAAB1cD2eF3gH4iJ5 \
     --action login --cdata session-7f3a9c2e
   ```

   Many sites check the action and cData when they verify the token and refuse one solved without them, so pass both whenever the widget sets them, and leave them out when it does not.

   It prints the token. `--json` prints JSON, `--proxy http://user:pass@proxy.example.net:8080` solves through your proxy, and `--challenge --url <page> --proxy <url>` passes a Cloudflare challenge page instead and prints its `cf_clearance` cookie and user agent.

4. Send the token in the form's `cf-turnstile-response` field, within 300 seconds.

The same call with curl:

```sh
# action and cdata are the widget's data-action and data-cdata; leave out any it does not set. For
# your own proxy, make the type TurnstileTask and add "proxy"; to be called when the task ends, add
# "callbackUrl". The reply is the task, or a problem document whose code says why it was refused.
curl -sS --fail-with-body "$ZEROCAPTCHA_API/v1/tasks" \
  -H "Authorization: Bearer $ZEROCAPTCHA_KEY" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d '{"type": "TurnstileTaskProxyless", "websiteURL": "https://shop.example.com/login", "websiteKey": "0x4AAAAAAAB1cD2eF3gH4iJ5", "action": "login", "cdata": "session-7f3a9c2e"}'
# then GET $ZEROCAPTCHA_API/v1/tasks/<id> every 2 seconds until "status" is "succeeded" (or failed, with its errorCode)
```

## Examples in your language

Each is a small, working project with its own tests against a stand-in API.

| Language or tool | Repository | Guide on the website |
| --- | --- | --- |
| Python | [cloudflare-turnstile-solver-python](https://github.com/ZeroCaptcha/cloudflare-turnstile-solver-python) | [Python](https://zerocaptcha.io/cloudflare-turnstile-solver/python) |
| Node.js and TypeScript | [cloudflare-turnstile-solver-nodejs](https://github.com/ZeroCaptcha/cloudflare-turnstile-solver-nodejs) | [Node.js](https://zerocaptcha.io/cloudflare-turnstile-solver/nodejs) |
| Go | [cloudflare-turnstile-solver-go](https://github.com/ZeroCaptcha/cloudflare-turnstile-solver-go) | [Go](https://zerocaptcha.io/cloudflare-turnstile-solver/go) |
| PHP | [cloudflare-turnstile-solver-php](https://github.com/ZeroCaptcha/cloudflare-turnstile-solver-php) | [PHP](https://zerocaptcha.io/cloudflare-turnstile-solver/php) |
| Java | [cloudflare-turnstile-solver-java](https://github.com/ZeroCaptcha/cloudflare-turnstile-solver-java) | [Java](https://zerocaptcha.io/cloudflare-turnstile-solver/java) |
| C# and .NET | [cloudflare-turnstile-solver-csharp](https://github.com/ZeroCaptcha/cloudflare-turnstile-solver-csharp) | [C#](https://zerocaptcha.io/cloudflare-turnstile-solver/csharp) |
| Rust | [cloudflare-turnstile-solver-rust](https://github.com/ZeroCaptcha/cloudflare-turnstile-solver-rust) | [Quickstart](https://zerocaptcha.io/docs/quickstart) |
| Playwright | [cloudflare-turnstile-solver-playwright](https://github.com/ZeroCaptcha/cloudflare-turnstile-solver-playwright) | [Playwright](https://zerocaptcha.io/cloudflare-turnstile-solver/playwright) |
| Puppeteer | [cloudflare-turnstile-solver-puppeteer](https://github.com/ZeroCaptcha/cloudflare-turnstile-solver-puppeteer) | [Puppeteer](https://zerocaptcha.io/cloudflare-turnstile-solver/puppeteer) |
| Selenium | [cloudflare-turnstile-solver-selenium](https://github.com/ZeroCaptcha/cloudflare-turnstile-solver-selenium) | [Selenium](https://zerocaptcha.io/cloudflare-turnstile-solver/selenium) |
| curl | this README | [curl](https://zerocaptcha.io/cloudflare-turnstile-solver/curl) |

The official SDKs are [zerocaptcha-js](https://github.com/ZeroCaptcha/zerocaptcha-js), [zerocaptcha-python](https://github.com/ZeroCaptcha/zerocaptcha-python) and [zerocaptcha-go](https://github.com/ZeroCaptcha/zerocaptcha-go), and [zerocaptcha-mcp](https://github.com/ZeroCaptcha/zerocaptcha-mcp) lets an AI assistant solve tasks.

## How it works

1. **Create a task** with the page's URL and the widget's sitekey, plus its action and cData if it sets them. The task's price is held on your balance, and you get its ID at once.
2. **Wait for it:** ask for the task every 2 seconds, or give a `callbackUrl` and receive it, signed, when it ends.
3. **Use the token:** a succeeded task carries `solution.token`, and only then is the price charged. A failed or expired task costs nothing.

The API speaks three formats on one host, so existing clients work unchanged:

- **REST:** `POST /v1/tasks` and `GET /v1/tasks/{id}`, with `Idempotency-Key` and RFC 9457 errors. The SDKs use it. [Reference](https://zerocaptcha.io/docs/reference/api).
- **createTask:** `createTask`, `getTaskResult` and `getBalance`, as CapSolver, Anti-Captcha and 2Captcha clients send them. [Docs](https://zerocaptcha.io/docs/createtask).
- **in.php and res.php:** 2Captcha's original format, `method=turnstile`. [Docs](https://zerocaptcha.io/docs/2captcha).

Moving from another service? See [createtask-api-migration](https://github.com/ZeroCaptcha/createtask-api-migration).

## Honest limits

- **A token works once, for 300 seconds.** That is Cloudflare's rule, not ours: solve right before you submit.
- **The action and cData must match the widget's,** or the site's siteverify check can refuse the token.
- **Cloudflare Turnstile and Cloudflare challenge pages only.** ZeroCaptcha does not solve reCAPTCHA, hCaptcha or other CAPTCHAs.
- **Proxies are `http` or `https`.** SOCKS is not supported. A challenge page always needs your proxy.
- **Prepaid, per solved task:** there is no subscription, and nothing is charged for a task that fails. Top-ups are in crypto, from $10, and final.
- **Only for sites you own or are allowed to automate.** The [Acceptable Use Policy](https://zerocaptcha.io/legal/acceptable-use) applies to every task, and any site owner can [opt out](https://zerocaptcha.io/opt-out).

## FAQ

**What is Cloudflare Turnstile, exactly?**
A CAPTCHA replacement that mostly runs without a puzzle: the widget checks the browser and issues a token. The [explainer](https://zerocaptcha.io/guides/what-is-cloudflare-turnstile) covers how it works, and the [token article](https://zerocaptcha.io/blog/cloudflare-turnstile-token) covers the token's format, lifetime and siteverify.

**Where do I find the sitekey?**
Usually in the widget's `data-sitekey` attribute; sometimes in a `turnstile.render` call. The [sitekey guide](https://zerocaptcha.io/guides/find-cloudflare-turnstile-sitekey) shows every place.

**How fast is it, and how often does it succeed?**
The [status page](https://zerocaptcha.io/status) shows the live figures for the last 24 hours, read from the API; we publish no other numbers.

**What does it cost?**
The [pricing page](https://zerocaptcha.io/pricing) lists the price per 1,000 solved tasks. Only a task that succeeds is charged.

**How does it compare with other solvers?**
The [comparison of Cloudflare Turnstile solvers](https://zerocaptcha.io/compare/best-cloudflare-turnstile-solvers) is sourced and dated.

## Run the tests

```sh
node --test
```

The tests run the command against a stand-in API on your machine: no key, no real task, nothing spent.

<!-- zc:footer (generated from the registry) -->
## More from ZeroCaptcha

- The website: [ZeroCaptcha](https://zerocaptcha.io), the [docs](https://zerocaptcha.io/docs), the [guides](https://zerocaptcha.io/guides), the [blog](https://zerocaptcha.io/blog) and the [status page](https://zerocaptcha.io/status)
- Start here: [zerocaptcha](https://github.com/ZeroCaptcha/zerocaptcha), **cloudflare-turnstile-solver**, [cloudflare-challenge-solver](https://github.com/ZeroCaptcha/cloudflare-challenge-solver)
- Examples by language: [cloudflare-turnstile-solver-python](https://github.com/ZeroCaptcha/cloudflare-turnstile-solver-python), [cloudflare-turnstile-solver-nodejs](https://github.com/ZeroCaptcha/cloudflare-turnstile-solver-nodejs), [cloudflare-turnstile-solver-go](https://github.com/ZeroCaptcha/cloudflare-turnstile-solver-go), [cloudflare-turnstile-solver-php](https://github.com/ZeroCaptcha/cloudflare-turnstile-solver-php), [cloudflare-turnstile-solver-java](https://github.com/ZeroCaptcha/cloudflare-turnstile-solver-java), [cloudflare-turnstile-solver-csharp](https://github.com/ZeroCaptcha/cloudflare-turnstile-solver-csharp), [cloudflare-turnstile-solver-rust](https://github.com/ZeroCaptcha/cloudflare-turnstile-solver-rust)
- Browser automation: [cloudflare-turnstile-solver-playwright](https://github.com/ZeroCaptcha/cloudflare-turnstile-solver-playwright), [cloudflare-turnstile-solver-puppeteer](https://github.com/ZeroCaptcha/cloudflare-turnstile-solver-puppeteer), [cloudflare-turnstile-solver-selenium](https://github.com/ZeroCaptcha/cloudflare-turnstile-solver-selenium)
- SDKs, MCP server and migration: [zerocaptcha-js](https://github.com/ZeroCaptcha/zerocaptcha-js), [zerocaptcha-python](https://github.com/ZeroCaptcha/zerocaptcha-python), [zerocaptcha-go](https://github.com/ZeroCaptcha/zerocaptcha-go), [zerocaptcha-mcp](https://github.com/ZeroCaptcha/zerocaptcha-mcp), [createtask-api-migration](https://github.com/ZeroCaptcha/createtask-api-migration)
- Lists: [awesome-cloudflare-turnstile](https://github.com/ZeroCaptcha/awesome-cloudflare-turnstile)

## Licence

MIT: see [LICENSE](LICENSE).

## Disclaimer

ZeroCaptcha is an independent service, not affiliated with or endorsed by Cloudflare. Cloudflare and Turnstile are trademarks of Cloudflare, Inc. Use ZeroCaptcha only on sites you own or are allowed to automate, as the [Acceptable Use Policy](https://zerocaptcha.io/legal/acceptable-use) says; any site owner can [opt out](https://zerocaptcha.io/opt-out).
<!-- /zc:footer -->
