# DM Assistant

A standalone web chat for tabletop RPG dungeon masters, built alongside [Questkeeper](https://github.com/rednil-rab/campaign-manager). A DM signs in with their Questkeeper account, picks a campaign, and asks an OpenAI-backed assistant for NPCs, encounters, quest hooks and dice rolls. NPCs and quest hooks can be added to the campaign with one click.

## How it works

- **Login:** the DM's email and password are sent to Questkeeper's `/api/auth/login`. This service keeps the resulting Questkeeper session inside its own httpOnly cookie (`qa_session`, signed with `JWT_SECRET`, 7 days). The browser never sees the Questkeeper token.
- **Campaigns:** read from Questkeeper as the signed-in DM, so a DM only ever sees and writes their own campaigns.
- **Chat:** each message sends a compact summary of the campaign (NPCs, quests, last three session recaps) plus recent history to OpenAI using function calling. Threads are stored in MongoDB per DM and campaign.
- **Suggestions:** an NPC or quest hook is shown with an **Add to campaign** button. Approving it saves it to Questkeeper (an NPC, or a dormant quest). Encounters are text only. Dice are rolled on the server.
- **Cost controls:** `gpt-4o-mini` by default, replies capped at 700 tokens, and a per-DM daily message limit.

## Run locally

Requires Node.js 22+, a MongoDB database, an OpenAI API key and a running Questkeeper.

```bash
npm ci
npm --prefix web ci
```

Copy `.env.example` to `.env` in the repo root and fill it in:

| Variable | Required | Default | |
|---|---|---|---|
| `JWT_SECRET` | yes | | 32+ random characters; signs the session cookie |
| `MONGODB_URI` | yes | | MongoDB connection string |
| `OPENAI_API_KEY` | yes | | |
| `QUESTKEEPER_BASE` | no | `http://localhost:3000/api` | Questkeeper API base URL |
| `MONGODB_DB` | no | `questkeeper` | Use a different name from Questkeeper's database |
| `OPENAI_MODEL` | no | `gpt-4o-mini` | |
| `DAILY_MESSAGE_LIMIT` | no | `50` | Messages per DM per 24h window (in memory; resets on restart) |
| `PORT` | no | `3001` | |
| `WEB_DIR` | no | | Built web app to serve, e.g. `web/dist` |
| `NODE_ENV` | no | | `production` marks the session cookie `Secure` |

```bash
npm run dev                 # API on :3001 and Vite on :5173 together; open http://localhost:5173
npm run dev:api             # or each one on its own
npm run dev:web
```

## Build and deploy

```bash
npm run build   # typecheck, bundle the server to dist/, build web/dist
npm start       # node dist/server.js (set WEB_DIR=web/dist to serve the UI from the same process)
```

On Render, create a Web Service from this repo with build command `npm ci && npm run build`, start command `npm start`, and the environment variables above (`NODE_ENV=production`, `WEB_DIR=web/dist`, `QUESTKEEPER_BASE` pointing at your deployed Questkeeper). MongoDB Atlas has a free tier.

## Look and feel

The web app uses the shared 8-bit theme from [`@questkeeper/theme`](https://github.com/rednil-rab/questkeeper-theme), a git dependency in `web/package.json` pinned by tag, so it matches Questkeeper. `web/src/main.tsx` imports the theme's `tokens.css` and `base.css` before the app CSS, and `web/index.html` loads the Press Start 2P and VT323 fonts (the tokens fall back to monospace). `web/src/styles/chat.css` holds layout only and must use theme tokens, never raw colors. To change the look, change the theme repo, then bump the tag.

## Checks

```bash
npm run typecheck
npm test        # backend and web unit tests; no database or OpenAI key needed
```

## API

All routes except `/health` and `/api/auth/login` need the session cookie.

| | |
|---|---|
| `POST /api/auth/login` | `{ email, password }`; rate limited to 10 attempts per 15 minutes per address |
| `POST /api/auth/logout`, `GET /api/auth/me` | |
| `GET /api/chat/campaigns` | |
| `GET /api/chat/threads/:campaignId` | |
| `POST /api/chat/threads/:campaignId/messages` | `{ content }` (max 2000 characters) |
| `POST /api/chat/threads/:campaignId/actions/:actionId/apply` | save the suggestion to Questkeeper |
| `POST /api/chat/threads/:campaignId/actions/:actionId/reject` | |

## Known limitations

- DM only; there is no player chat.
- Replies are not streamed, and Markdown is shown as plain text.
- The per-DM message limit and login limiter are in memory and per instance.
- MongoDB storage and the live OpenAI call are not covered by automated tests.
