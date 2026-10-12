# NexusAI: AI Chatbot

A full-stack AI chatbot powered by **Google Gemini 2.5 Flash**, with streaming replies, live Google Search grounding, saved chat history, and secure sign-in.

## Features

- **Gemini 2.5 Flash** replies through the `@google/genai` SDK
- **Streaming responses** over Server-Sent Events (SSE), token by token
- **Google Search grounding** for news, sports, weather and other current topics
- **Current date and time (IST)** injected into every request
- **Saved conversations** in PostgreSQL, with rename and delete
- **Authentication** with Clerk (Google sign-in and email)
- **Per-user data isolation**: every query is filtered by the signed-in user's ID
- **Markdown and code highlighting** in replies
- **Dark and light theme**

## Tech stack

| Part | Technology |
|---|---|
| Frontend | React 19, Vite 7, Tailwind CSS v4, shadcn/ui, Wouter, TanStack Query |
| Backend | Node.js, Express 5, Pino logging, esbuild |
| AI | Google Gemini 2.5 Flash (`@google/genai`) |
| Auth | Clerk |
| Database | PostgreSQL with Drizzle ORM (local or Neon) |
| Monorepo | pnpm workspaces, TypeScript |

## Project structure

```
AI-Chat-Site/
├── artifacts/
│   ├── api-server/        Express API (port 8080)
│   └── chatbot/           React + Vite frontend (port 22967)
├── lib/
│   ├── db/                Drizzle schema and database client
│   ├── api-spec/          OpenAPI spec and codegen config
│   ├── api-zod/           Generated Zod validation schemas
│   └── api-client-react/  Generated React Query hooks
├── .env                   Your secrets (never commit this)
├── pnpm-workspace.yaml
└── package.json
```

## Prerequisites

- **Node.js** 20 or newer
- **pnpm 10** (`npm install -g pnpm@10`). pnpm 9 fails on this lockfile.
- **PostgreSQL** (local install, or a free cloud database such as [Neon](https://neon.tech))
- **Gemini API key** from [Google AI Studio](https://aistudio.google.com/apikey)
- **Clerk account** from [clerk.com](https://clerk.com), for the publishable and secret keys

## Setup

### 1. Install dependencies

```bash
pnpm install
```

> **Windows:** if `esbuild` fails to install, remove all lines ending in `: '-'` from the `overrides:` section of `pnpm-workspace.yaml`, delete `node_modules`, and run `pnpm install --no-frozen-lockfile`.

### 2. Create a `.env` file in the project root

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/nexusai
GEMINI_API_KEY=your_gemini_api_key
CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
```

- Write each value without quotes or spaces around `=`.
- `VITE_CLERK_PUBLISHABLE_KEY` has the same value as `CLERK_PUBLISHABLE_KEY`.
- A valid Gemini key is 39 characters and starts with `AIza`.
- For a cloud database, paste the connection string from your provider instead of the local URL.

### 3. Create the database tables

```bash
pnpm --filter "@workspace/db" run push
```

In PowerShell, keep the quotes around `@workspace/...`.

### 4. Run the project (two terminals)

**Terminal 1: API**
```bash
pnpm --filter "@workspace/api-server" run build
pnpm --filter "@workspace/api-server" run start
```

**Terminal 2: Frontend**
```bash
pnpm --filter "@workspace/chatbot" run dev
```

Open **http://localhost:22967**, sign in, and start chatting.

Check the API with: `curl localhost:8080/api/healthz` (use `curl.exe` in PowerShell). It should return `{"status":"ok"}`.

> The frontend dev server proxies `/api/*` to `http://localhost:8080`. Both servers read secrets from the root `.env` only when they start, so restart them after you edit it.

## Scripts

| Command | What it does |
|---|---|
| `pnpm --filter "@workspace/api-server" run build` | Bundle the API into `dist/` |
| `pnpm --filter "@workspace/api-server" run start` | Start the API |
| `pnpm --filter "@workspace/chatbot" run dev` | Start the frontend dev server |
| `pnpm --filter "@workspace/chatbot" run build` | Production build of the frontend |
| `pnpm --filter "@workspace/db" run push` | Apply the database schema |
| `pnpm run typecheck` | TypeScript check across packages |

## API endpoints

All endpoints except health require a signed-in user.

| Method | Path | Description |
|---|---|---|
| GET | `/api/healthz` | Health check |
| GET | `/api/openai/conversations` | List your conversations |
| POST | `/api/openai/conversations` | Create a conversation |
| GET | `/api/openai/conversations/:id` | Get a conversation with its messages |
| PATCH | `/api/openai/conversations/:id` | Rename a conversation |
| DELETE | `/api/openai/conversations/:id` | Delete a conversation |
| GET | `/api/openai/conversations/:id/messages` | List messages |
| POST | `/api/openai/conversations/:id/messages` | Send a message (streams the reply via SSE) |

## How a message flows

1. The frontend sends the message to `POST /api/openai/conversations/:id/messages`.
2. The API checks the Clerk session and that the conversation belongs to the user.
3. The user message is saved in PostgreSQL.
4. Gemini is called with the full history, the IST timestamp, and Google Search enabled.
5. The reply streams back to the browser as SSE.
6. The finished reply is saved to PostgreSQL.

## Troubleshooting

| Problem | Fix |
|---|---|
| `API key not valid` | The Gemini key is incomplete or wrong. Copy it with the copy button (39 characters), update `.env`, and restart the API. |
| `EADDRINUSE` or "Port already in use" | An old server is still running. Stop it with `Get-Process node \| Stop-Process -Force` (Windows), then start again. |
| `ERR_PNPM_NO_SCRIPT` | In PowerShell, put quotes around `"@workspace/..."`. |
| `DATABASE_URL must be set` | Check `.env` is in the project root and filled in. |
| Page loads but chat or sidebar fails | Make sure the API is running on port 8080 and the Vite `/api` proxy is configured. |
| Frontend error about a missing `tsconfig.json` | A `tsconfig.json` still references a deleted `lib` folder. Remove that entry from its `references`. |

## Security

- Never commit `.env` or share your keys. If a key is exposed, revoke it and create a new one.
- Keep `.env` listed in `.gitignore`.

## License

MIT