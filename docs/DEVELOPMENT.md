# Development Guide

This guide explains the codebase structure, testing patterns, and common development workflows.

## Code Organization

### Backend Structure (`src/`)

```
src/
├── config.ts              # Environment variables & validation
├── app.ts                 # Express app setup (middleware, routes)
├── server.ts              # Server entry point (listen)
├── middleware/
│   ├── auth.ts           # JWT verification middleware
│   └── errors.ts         # Global error handler
├── api/
│   ├── health.ts         # GET /api/health
│   ├── chat.ts           # Chat endpoints (/threads, /messages)
│   └── actions.ts        # Action endpoints (/approve, /reject)
├── models/
│   ├── types.ts          # TypeScript interfaces
│   └── ChatThread.ts     # Mongoose schema
├── db/
│   └── connect.ts        # MongoDB connection
├── services/
│   └── chatService.ts    # Business logic (message persistence, etc)
├── agent-client.ts       # Questkeeper API client
├── openai/
│   ├── tools.ts          # Function calling tool definitions
│   └── provider.ts       # OpenAI API calls
└── *.test.ts             # Colocated test files
```

**Key Principles:**
- One file per concern (single responsibility)
- Tests colocated with implementation (`*.test.ts` next to source)
- Domain logic in pure functions; I/O in services
- All errors mapped to HTTP status codes

### Frontend Structure (`web/src/`)

```
web/src/
├── pages/
│   ├── LoginPage.tsx           # Questkeeper login
│   ├── CampaignPicker.tsx      # Campaign selection
│   └── ChatPage.tsx            # Main chat interface
├── components/
│   ├── MessageList.tsx         # Display chat messages
│   ├── MessageInput.tsx        # Send message form
│   └── ActionCard.tsx          # Approve/reject actions
├── api/
│   └── client.ts               # Axios client, endpoint wrappers
├── store/
│   └── chat.ts                 # Zustand state management
├── styles/
│   └── chat.css                # Global styles
├── app.tsx                      # React Router setup
├── main.tsx                     # Entry point
└── *.test.ts                   # Unit tests
```

**Key Principles:**
- One component per file
- Pages under `pages/`, reusable components under `components/`
- Zustand for global state (messages, campaign ID, loading)
- CSS co-located with components (or in `styles/`)

## Testing Strategy

### Backend Testing (Vitest + Supertest)

**Pattern: TDD (Test-Driven Development)**

1. Write a failing test
2. Verify it fails with expected error
3. Implement minimal code to pass
4. Verify all tests pass
5. Commit

**Example:**
```typescript
// config.test.ts - RED
test('requires JWT_SECRET', () => {
  delete process.env.JWT_SECRET;
  expect(() => loadConfig()).toThrow('JWT_SECRET required');
});

// config.ts - GREEN
function loadConfig() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET required');
  }
  // ...
}
```

**Testing Each Layer:**

| Layer | Test Type | Example |
|---|---|---|
| Config | Unit | Validate env vars loaded correctly |
| Middleware | Integration | Mock Express request/response |
| Routes | Integration | Supertest + in-memory database |
| Domain | Unit | Pure functions, no mocks |
| Services | Integration | Mock database, real logic |

**Running Tests:**
```bash
# All tests
npm test

# Specific file
npm test -- src/config.test.ts

# Watch mode
npm test -- --watch

# With coverage
npm test -- --coverage
```

### Frontend Testing (Vitest)

**Current Coverage:**
- Zustand store state management (8 tests)
- API client (mocked, integrated with store)

**Future Enhancements:**
- Component rendering (once testing-library dependency is resolved)
- User interactions (click, type, submit)
- API mocking (msw or jest.mock)

**Running Tests:**
```bash
# All frontend tests
npm test -w @questkeeper-agent/web

# Specific file
npm test -- web/src/store.test.ts

# Watch mode
npm test -- --watch
```

## Development Workflows

### Adding a New Endpoint

1. **Write failing test** (`src/api/example.test.ts`)
   ```typescript
   test('POST /example returns data', async () => {
     const res = await request(app)
       .post('/api/example')
       .set('Authorization', `Bearer ${token}`)
       .send({ input: 'test' });
     
     expect(res.status).toBe(200);
     expect(res.body.data).toEqual({ result: 'processed' });
   });
   ```

2. **Verify test fails**
   ```bash
   npm test -- src/api/example.test.ts
   # Expected: 404 or missing route error
   ```

3. **Implement endpoint** (`src/api/example.ts`)
   ```typescript
   export async function handleExample(req: AuthRequest, res: Response) {
     const { input } = req.body;
     const result = processInput(input);
     res.json({ data: result });
   }
   ```

4. **Add route** (`src/app.ts`)
   ```typescript
   app.post('/api/example', requireAuth, handleExample);
   ```

5. **Verify test passes**
   ```bash
   npm test -- src/api/example.test.ts
   # Expected: PASS
   ```

6. **Commit**
   ```bash
   git commit -m "feat: add /api/example endpoint"
   ```

### Adding a React Component

1. **Create component** (`web/src/components/Example.tsx`)
   ```typescript
   export const Example: React.FC = () => {
     return <div>Example component</div>;
   };
   ```

2. **Test component** (`web/src/components/example.test.ts`)
   ```typescript
   test('renders example text', () => {
     // Test implementation
   });
   ```

3. **Use in page** (`web/src/pages/ChatPage.tsx`)
   ```typescript
   import { Example } from '../components/Example';
   
   export const ChatPage = () => (
     <>
       <Example />
     </>
   );
   ```

4. **Run tests**
   ```bash
   npm test -w @questkeeper-agent/web
   ```

### Debugging

**Backend:**
```bash
# Start with verbose logs
NODE_DEBUG=* npm run dev -w @questkeeper-agent/server

# Debug in VS Code
# - Set breakpoint in code
# - Run: npm run dev -- --inspect-brk
# - Open: chrome://inspect
```

**Frontend:**
```bash
# Check Network tab in browser DevTools
# - See API requests/responses
# - Check status codes, payloads

# Check Console tab
# - See errors, warnings
# - Use console.log() in components

# Check React DevTools
# - Inspect component tree
# - View Zustand store state
```

**Database:**
```bash
# Connect to MongoDB
mongosh mongodb://localhost:27017/questkeeper-agent

# View collections
show collections

# Query messages
db.chatthreads.find({ campaignId: "123" }).pretty()

# Delete test data
db.chatthreads.deleteMany({ campaignId: "test" })
```

### Git Workflow

```bash
# Start feature
git checkout -b feat/feature-name

# Make changes, test, commit
npm test
git add -A
git commit -m "feat: description"

# Push and open PR
git push origin feat/feature-name
# Open PR on GitHub

# After review, merge via GitHub
git checkout main
git pull origin main
```

**Commit Message Format:**
- `feat: add X` - New feature
- `fix: resolve X` - Bug fix
- `test: add X` - Test additions
- `docs: update X` - Documentation
- `chore: update X` - Non-code changes

## Common Tasks

### Running Full Stack Locally

**Terminal 1: Backend**
```bash
npm run dev -w @questkeeper-agent/server
# Listens on localhost:3000, calls Questkeeper at QUESTKEEPER_BASE
```

**Terminal 2: Frontend**
```bash
npm run dev -w @questkeeper-agent/web
# Listens on localhost:5173, proxies /api to localhost:3000
```

**Terminal 3: MongoDB (if not Docker)**
```bash
mongod
# Default: localhost:27017
```

**Visit:** http://localhost:5173

### Building for Production

```bash
# Build everything
npm run build

# Output:
# - src/: compiled TypeScript (unused in production, Node.js runs TS)
# - web/dist/: optimized React bundle

# Verify build
npm start
# Serves on port 3000
# - GET / → serves web/dist/index.html
# - GET /api/* → Express API
```

### Connecting Questkeeper Locally

Questkeeper must be running separately:

```bash
# In another workspace/directory
cd ../questkeeper
npm run dev
# Questkeeper on localhost:3000

# In campaign-agent
# Set QUESTKEEPER_BASE=http://localhost:3000/api
npm run dev -w @questkeeper-agent/server
```

**To test authentication flow:**
1. Open Agent Chat at http://localhost:5173
2. Click "Sign in with Questkeeper"
3. Redirects to Questkeeper login
4. After auth, redirects back with session JWT
5. Chat loads user's campaigns

## Performance Tips

### Backend
- **Database:** Add indexes for frequently queried fields (campaignId, ownerId)
- **API:** Use pagination for large result sets
- **Caching:** Cache Questkeeper campaign list (30 min TTL)

### Frontend
- **Bundle:** Vite automatically code-splits large components
- **State:** Use `useChatStore` selectors to avoid unnecessary re-renders
- **API:** Debounce user input (message sending)

## Security Reminders

- **Never commit secrets:** Use `.env` file (git-ignored)
- **Validate all input:** Middleware parses and copies request bodies
- **Scope by owner:** Every database query filtered by `ownerId`
- **Filter DM data:** Player views must exclude `secret`, private notes
- **HTTPS in production:** Render/deployment platform enforces this

## Useful Resources

- **Express:** https://expressjs.com
- **Vitest:** https://vitest.dev
- **React:** https://react.dev
- **Zustand:** https://zustand-demo.vercel.app
- **Vite:** https://vitejs.dev
- **MongoDB:** https://docs.mongodb.com
- **OpenAI:** https://platform.openai.com/docs

## Getting Help

- Check existing tests for patterns
- Read inline comments for context
- Review git history for similar changes
- Consult design doc (`docs/design/agent-chat-service.md`)
- Ask team members (or maintainers) for clarification
