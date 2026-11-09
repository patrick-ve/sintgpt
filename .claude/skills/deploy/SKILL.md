---
name: deploy
description: Deploy SintGPT to Cloudflare Workers. Checks, tests and builds the app, then has the user run `! npx wrangler --cwd .output deploy`, then checks the live site. Use when the user asks to deploy, redeploy, ship or release sintgpt.com.
---

# Deploy SintGPT to Cloudflare

The user runs the deploy command; you prepare and verify. Auto mode blocks a
production deploy run by you, and a deploy is the user's decision.

## Never

- Never run `wrangler deploy` (or `npm run deploy`) yourself. Hand the command to the user.
- Never pass `--secrets-file .env`: `.env` holds the **test** Dodo key and test product. Live secrets are Worker secrets only.
- Never open, print or cat `.env` or `.env.analytics`. The checks below print names only.
- Never add a `wrangler.jsonc`/`wrangler.toml`. The config is generated from `nuxt.config.ts` into `.output/server/wrangler.json`.
- Never deploy a build that failed a step below. Stop and report.

## 1. Check what goes out

1. `git status --short` and `git log --oneline origin/master..HEAD`.
2. Uncommitted changes or unpushed commits: tell the user what they are and ask whether to commit and push first. The build uses the working tree, so a dirty tree ships code that is not in git.

## 2. Test

Run both; stop on a failure and show the output.

```sh
npm run typecheck
npm run test:unit
```

Run `npm run test:e2e` (about 10 minutes) only when the user asks, or when the change touches pages, the payment flow or server routes and it has not run since.

## 3. Build and check

```sh
npm run build:cloudflare
node scripts/predeploy-check.mjs
```

- The build ends with `strip-comments: … 0 with comments left`. Anything else fails the build.
- The check must end with `ok`. It fails when a value from `.env` or `.env.analytics` is in `.output`, when an env file was copied into it, or when `.env` holds a live Dodo key.

## 4. Hand over the deploy

Tell the user the build is ready and ask them to run:

```
! npx wrangler --cwd .output deploy
```

Then wait for the output. Do not continue without it.

## 5. Verify the live site

From the user's deploy output, note `Current Version ID` and the bindings. The list must still have `RATE_LIMITER`, `POEM_LINKS`, `ANALYTICS`, `POEM_BURST`, `EVENTS_BURST` and `ASSETS`. A missing binding is a failure to report.

```sh
bash scripts/smoke-test.sh
```

- When DNS fails locally, use `SMOKE_IP=104.21.83.254 bash scripts/smoke-test.sh`.
- The smoke test is read-only: it writes no analytics events, poems or links.
- Also check what this deploy changed, with `curl` or a browser. For example: new text on a page, a new file, a fixed bug.
- In a browser, mock `**/api/poem/generate` and `**/api/events` (Playwright `page.route`), so the check costs no AI Gateway call and adds no analytics data.

## 6. Report

- Version ID, commit (`git log --oneline -1`), and whether the commit is on GitHub.
- The result of each step, with failures first. Say which checks did not run.
- If the live site fails: `! npx wrangler --cwd .output rollback` goes back to the previous version. That is again the user's command to run.
