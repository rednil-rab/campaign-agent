# Questkeeper Agent

A separate, stateless agent service for Questkeeper. This is an early scaffold: it uses a deterministic **fake provider**, not Anthropic, and supports only read-only recap requests. Its output is a placeholder, not a real session summary.

## Run locally

Requires Node.js 22.18 or newer.

1. Run `npm install`.
2. Copy `.env.example` to `.env` and set `AGENT_SHARED_SECRET` to a random secret of at least 32 characters. Keep it private.
3. Set `QUESTKEEPER_CALLBACK_BASE` to the exact Questkeeper callback URL (default `http://localhost:3000/api/agent/v1`). Non-local callbacks require HTTPS.
4. Start Questkeeper separately, then run `npm run dev`. The agent listens on port 3001 by default.

`npm start` runs the built service; run `npm run build` first and supply environment variables yourself. `npm test` builds and runs the tests.

## API

- `GET /v1/health` returns service health.
- `GET /v1/capabilities` reports supported modes, change kinds, and the active fake provider.
- `POST /v1/turn` requires `Authorization: Bearer <AGENT_SHARED_SECRET>`. A `recap` request follows [the contract](docs/contract-v1.md) and includes a short-lived Questkeeper callback token. The service fetches `/context/dm` and returns a placeholder recap without writing to Questkeeper.

Questkeeper does not yet invoke this service or mint production turn tokens. The local Questkeeper development token endpoint can be used to manually test a recap. Use a fresh test campaign and protect both tokens as credentials.

## Boundaries and next steps

The callback base is fixed by configuration, not chosen freely by a request, and redirects are refused. Requests and callback tokens are not logged. Retried fake recaps do not perform writes; no persistent turn cache exists. Capability discovery deliberately does not advertise player turns or change actions.

Anthropic, meaningful summaries, player turns, tool-driven writes, durable idempotency, and a monthly spend cap are not implemented. A real provider must implement and enforce budget limits before the service is exposed as a public demo.
