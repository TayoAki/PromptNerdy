# Docker Self-Hosting

Run PromptNerdy locally with Docker.

In Docker mode, PromptNerdy uses `AUTH_MODE=local_noauth` (no auth checks, local admin user `admin@localhost`). Only expose it behind your own auth-protected reverse proxy, tunnel, or private network.

The default `compose.yaml` uses the published GHCR image:

- `ghcr.io/tayoaki/promptnerdy:latest`

## Prerequisites

- Docker Desktop (or Docker Engine + Docker Compose)
- A DataForSEO API key (see [`DATAFORSEO_API_KEY.md`](./DATAFORSEO_API_KEY.md))

## Quickstart

```bash
cp .env.example .env
```

Set `DATAFORSEO_API_KEY` in `.env` using the [DataForSEO setup guide](./DATAFORSEO_API_KEY.md), then start PromptNerdy:

```bash
docker compose up -d
```

Open `http://localhost:<PORT>` (default `3001`). The first start builds the app and may take 1-2 minutes; follow progress with `docker compose logs -f`.

Optional env values:

- `PORT` (defaults to `3001`)
- `ALLOWED_HOST` (single reverse-proxy hostname to allow in Vite preview)
- `AUTH_MODE=local_noauth` (already set in compose)
- `PROMPTNERDY_IMAGE` (defaults to `ghcr.io/tayoaki/promptnerdy:latest`)

AI Visibility uses your `DATAFORSEO_API_KEY` and sends tracked questions to DataForSEO. Set `OPENROUTER_API_KEY` for setup research, Prompt Research, and generated prompt suggestions. You pay providers directly; the app shows the collection cost before a check or schedule starts. Keep the container running for background answers and daily, weekly, or monthly tracking. The built-in scheduler checks for due work every five minutes; no host cron setup is required. See the [AI Visibility guide](https://promptnerdy.com/docs/ai-visibility).

If you are putting Docker behind a reverse proxy or a temporary tunnel, remember that Docker self-hosting runs with app auth disabled. Only expose it behind your own auth-protected reverse proxy, tunnel, or private network, and add the public hostname before restarting:

```bash
ALLOWED_HOST=yourdomain.com docker compose up -d
```

You can also persist it in `.env`.

If you have no auth proxy of your own, set `BASIC_AUTH_USERNAME` and `BASIC_AUTH_PASSWORD` in `.env`. The app then asks every visitor for that username and password before serving anything except `/api/health`. MCP clients can't connect through this gate.

## Accounts and teams

To give each person their own login instead, run with `AUTH_MODE=hosted` (remove the `AUTH_MODE=local_noauth` line from `compose.yaml`'s `environment:` list, which overrides `.env`). Then set the following in `.env`:

- `BETTER_AUTH_SECRET`: a long random secret.
- `BETTER_AUTH_URL`: the public URL of your deployment.
- `BILLING_ENABLED=false`: there is no usage billing.
- `GOOGLE_SIGN_IN_ENABLED=false`: unless you set up a Google OAuth client.
- `BYPASS_EMAIL_VERIFICATION=true`: unless you set up Loops email.
- `SIGNUP_ALLOWED_EMAILS`: your own email address.

With billing off, sign-up is invite-only. The listed addresses can create an account, and everyone else needs an invitation from **Settings → Organization**. Without an email provider, PromptNerdy shows you the invite link to send yourself, and password reset isn't available.

## Telemetry

PromptNerdy collects anonymized telemetry for core usage events: heartbeats with aggregate counts (installs, users, projects, feature usage) tied to a random install ID, sent every 5 minutes during the first two hours after install, then at most once daily. Telemetry also includes failed setup check names and statuses, never values or error messages. No URLs, keywords, prompts, emails, or IP-derived location are collected, and idle installs send nothing.

Heartbeats are triggered by requests to the app or MCP server. Requests to `/api/health`, including Docker's automatic health checks, do not trigger telemetry.

To disable it, set `PROMPTNERDY_TELEMETRY_DISABLED=1` (or `DO_NOT_TRACK=1`) in `.env`, then run `docker compose up -d --force-recreate promptnerdy`.

## Pin to a specific image tag

Set `PROMPTNERDY_IMAGE` in `.env` and restart:

```bash
PROMPTNERDY_IMAGE=ghcr.io/tayoaki/promptnerdy:v1.2.3
docker compose up -d
```

## Build your own image locally

If you are testing local code changes, build and run a local tag:

```bash
docker build -f deploy/docker/Dockerfile -t promptnerdy:local .
PROMPTNERDY_IMAGE=promptnerdy:local docker compose up -d
```

## Common commands

- Restart service after env changes:

```bash
docker compose up -d promptnerdy
```

- Pull latest published image and restart:

```bash
docker compose pull && docker compose up -d
```

- Stop:

```bash
docker compose down
```

## Health and troubleshooting

Startup checks appear in `docker compose logs` before the build. Once running, `/api/health` reports configuration and database status, and `docker compose ps` reports container health. Scheduler failures appear as `[scheduler]` messages in container logs. The pinned Cloudflare Vite runtime exposes `/cdn-cgi/handler/scheduled`; the container calls it only at `127.0.0.1` using the configured `PORT`. It passes the five-minute cron expression without overriding the clock. Newer Cloudflare versions may use a different local route; the [Cron Triggers documentation](https://developers.cloudflare.com/workers/configuration/cron-triggers/#test-cron-triggers-locally) describes the local handler mechanism.

## Troubleshooting environment variables

To confirm Docker Compose is using the expected environment variables:

```bash
docker compose config
```

Check that `AUTH_MODE=local_noauth`, and that `DATAFORSEO_API_KEY` is the base64
encoded value of your DataForSEO email and API password in this format:
`email:password`.

If you changed `.env`, recreate the container so Compose reapplies it:

```bash
docker compose up -d --force-recreate promptnerdy
```
