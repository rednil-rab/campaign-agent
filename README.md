# Agent Chat Service

A standalone DM agent chat web application for Questkeeper campaign managers. Enables DMs to chat with an AI agent that generates NPCs, encounters, quest hooks, and dice rolls—with one-click approval to apply changes directly to campaigns.

## Features

- **DM Authentication**: Log in with Questkeeper credentials
- **Campaign Selection**: Choose from your Questkeeper campaigns
- **AI-Powered Agent**: OpenAI-based agent using function calling for reliability
- **Action Approval**: Review and approve/reject generated NPCs, encounters, quest hooks, and dice rolls
- **Persistent Chat**: Messages and actions are saved per campaign
- **Rich UI**: React-based web interface with real-time message updates

## Tech Stack

- **Backend**: Express 5, Node.js 22, MongoDB, OpenAI API, Questkeeper API
- **Frontend**: React 18, Vite, Zustand, React Router, Axios
- **Testing**: Vitest, Supertest
- **Deployment**: Render (auto-deploy on main merge)

## Project Structure

```
.
├── src/                    # Backend (Express API)
│   ├── config.ts          # Environment configuration
│   ├── app.ts             # Express app setup
│   ├── server.ts          # Server entry point
│   ├── middleware/        # Auth and error handling
│   ├── api/               # Route handlers
│   ├── models/            # Mongoose schemas
│   ├── db/                # Database connection
│   ├── services/          # Business logic
│   ├── agent-client.ts    # Questkeeper API client
│   ├── openai/            # OpenAI integration
│   └── *.test.ts          # Backend tests
├── web/                   # Frontend (React)
│   ├── src/
│   │   ├── pages/         # Page components (Login, CampaignPicker, Chat)
│   │   ├── components/    # Reusable components (MessageList, MessageInput, ActionCard)
│   │   ├── api/           # Backend API client
│   │   ├── store/         # Zustand state management
│   │   ├── styles/        # CSS
│   │   ├── app.tsx        # Router setup
│   │   ├── main.tsx       # Entry point
│   │   └── *.test.ts      # Frontend tests
│   ├── index.html
│   ├── vite.config.ts
│   ├── vitest.config.ts
│   └── package.json
├── package.json           # Monorepo root
├── README.md             # This file
└── docs/                 # Design & planning

## Development Setup

### Prerequisites

- Node.js 22+
- npm/pnpm
- MongoDB instance (local or cloud)
- OpenAI API key
- Questkeeper API access (same connection as campaign manager)

### Installation

```bash
# Install all dependencies
npm ci

# Create a .env file with the variables listed below
```

### Environment Variables

**Required:**
- `JWT_SECRET`: 32+ character secret for session tokens
- `MONGODB_URI`: MongoDB connection string (e.g., `mongodb://localhost:27017/questkeeper-agent`)
- `OPENAI_API_KEY`: OpenAI API key
- `QUESTKEEPER_BASE`: Questkeeper API base URL (e.g., `http://localhost:3000/api`)

**Optional:**
- `PORT`: Server port (default: 3000)
- `MONGODB_DB`: MongoDB database name (default: `questkeeper-agent`)
- `NODE_ENV`: `development` or `production` (default: `development`)
- `WEB_DIR`: Path to built web app for production serving (default: `web/dist`)

### Running Locally

```bash
# Start MongoDB (if local)
mongod

# Terminal 1: Start backend API
npm run dev -w @questkeeper-agent/server

# Terminal 2: Start frontend dev server
npm run dev -w @questkeeper-agent/web

# Frontend will be available at http://localhost:5173 (proxies /api to backend)
```

### Building

```bash
# Build everything
npm run build

# Build specific workspace
npm run build -w @questkeeper-agent/server
npm run build -w @questkeeper-agent/web

# Production: Backend and frontend are bundled together
# `npm start` serves the API and static web app on port 3000
```

## Testing

```bash
# Run all tests (backend + frontend)
npm test

# Run specific workspace tests
npm test -w @questkeeper-agent/server
npm test -w @questkeeper-agent/web

# Watch mode
npx vitest --watch

# Run specific file
npx vitest run src/config.test.ts
```

**Test Coverage:**
- Backend: 35+ tests covering config, auth, database, API endpoints, OpenAI integration, action approval
- Frontend: 8+ tests covering Zustand store state management and message handling

## API Endpoints

### Authentication
- `GET /api/chat/login` - Redirect to Questkeeper login flow

### Chat
- `GET /api/chat/campaigns` - List user's campaigns
- `POST /api/chat/threads/:campaignId` - Start/get chat thread
- `POST /api/chat/threads/:campaignId/messages` - Send message, receive agent response
- `POST /api/chat/threads/:campaignId/actions/:actionId/approve` - Approve an action
- `POST /api/chat/threads/:campaignId/actions/:actionId/reject` - Reject an action

### Health
- `GET /api/health` - Service health check

**Response Format:**
```json
{
  "data": { /* resource data */ },
  "error": "string" // only on error
}
```

## Architecture

### Three-Layer Architecture

```
UI (React) → API (Express) → Domain Logic (Zustand/Pure Functions)
                              ↓
                    Data Persistence (MongoDB)
                    External APIs (Questkeeper, OpenAI)
```

### Auth Flow

1. User logs in via `/api/chat/login` (redirects to Questkeeper)
2. Backend receives JWT token from Questkeeper
3. Session stored in `qk_session` cookie (httpOnly, 7 days)
4. Protected routes verify token with `requireAuth` middleware
5. DM identity injected into `req.dm = { userId, email }`

### Chat Flow

1. DM sends message via `/api/chat/threads/:campaignId/messages`
2. Backend saves message, calls OpenAI with function-calling tools
3. OpenAI calls one of 4 tools: `generate_npc`, `generate_encounter`, `suggest_quest_hook`, `roll_dice`
4. Backend returns narration + action payload to frontend
5. DM approves/rejects via `/api/chat/threads/:campaignId/actions/:actionId/approve`
6. Backend applies changes to campaign via Questkeeper API

### OpenAI Tools

- **generate_npc**: Create a named NPC with attributes
- **generate_encounter**: Design an encounter with enemies, loot, challenges
- **suggest_quest_hook**: Propose a quest for the campaign
- **roll_dice**: Roll custom dice and return result

Each tool call includes the campaign context and player-view to ensure narrative consistency.

## Deployment

### Render (Recommended)

1. Push to `main` branch of GitHub repo
2. Render auto-deploys via webhook
3. Environment variables set in Render dashboard
4. MongoDB Atlas (or Render's DB offerings) for data

### Manual Deployment

```bash
# Build everything
npm run build

# Start production server
npm start

# Server listens on $PORT (default 3000), serves:
# - API on /api/
# - Frontend on /
```

## Security Considerations

- **Session Auth**: JWT in cookies, httpOnly flag prevents XSS
- **Bearer Tokens**: Agent API uses HMAC-derived tokens (Questkeeper integration point)
- **Data Access**: Owner scoping enforced at repository layer; only DM's campaigns visible
- **DM Secrets**: Player views filter out DM-only data (`secret`, private notes, hidden events)
- **Input Validation**: All inputs parsed and validated before storage
- **Error Handling**: Errors never expose internal details; mapped to HTTP 400/500

## Known Limitations & Future Work

1. **Player Agent Chat**: MVP is DM-only. Player agent integration deferred.
2. **Questkeeper API Contract**: Current endpoints assumed; may need adjustment per actual implementation
3. **OpenAI Model**: Assumes `gpt-4-turbo` availability; fallback to alternative not implemented
4. **UI Styling**: Basic styles in place; design system/responsive tweaks recommended for production
5. **Rich Formatting**: Agent responses are plain text; rich formatting (markdown, embedded images) deferred

See `docs/design/agent-chat-service.md` for complete architecture and open items.

## Contributing

- Follow existing patterns (pure domain functions, TDD, monorepo structure)
- Run `npm test` before submitting PRs
- Lint: `npm run lint`
- Typecheck: `npm run typecheck`
- Build: `npm run build`

## License

MIT (or project-specific license)
