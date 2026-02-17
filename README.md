# MindDock (note-recall-ai)

MindDock is an AI-assisted note platform built with Next.js App Router.  
Users can create, edit, and delete notes, then ask an AI assistant questions about their own note history.  
The assistant uses retrieval-augmented generation (RAG): it finds relevant notes using embeddings + vector search (Pinecone), then responds with streamed output.

---

## 1) Project Overview

### Purpose
This application solves a common problem: notes are easy to write, but hard to recall later. MindDock combines:

- fast note CRUD
- semantic retrieval across your notes
- conversational AI over your personal note data

### What users can do

- sign in (Clerk or local credentials flow)
- create/update/delete notes
- ask AI questions about note content
- receive streamed chat responses
- toggle light/dark theme

---

## 2) Architecture Diagram (Description)

### High-level architecture

```text
Browser (Next.js UI)
   |
   | HTTPS (fetch/useChat)
   v
Next.js App Router (Route Handlers + Server Components)
   |                |                |
   |                |                +--> Clerk (auth identity provider)
   |                |
   |                +--> Prisma --> MongoDB (notes + credential sessions/users)
   |
   +--> Embeddings/Chat Provider (xAI or Groq-compatible OpenAI API)
   |
   +--> Pinecone Vector Index (semantic retrieval, optional)
```

### Request/data flow (chat)

```text
UI (AIChatBox/useChat)
 -> POST /api/chat with messages[]
 -> getAuth() resolves user (Clerk first, then credentials cookie)
 -> create embedding for recent messages
 -> query Pinecone by userId filter
 -> fallback to latest notes if vector query unavailable/fails
 -> compose system prompt from relevant notes
 -> stream response from LLM
 -> return StreamingTextResponse to UI
```

### Request/data flow (note write)

```text
UI (AddEditNoteDialog)
 -> POST/PUT/DELETE /api/notes
 -> validate input with zod schemas
 -> authorize with getAuth()
 -> persist note in MongoDB via Prisma
 -> sync vector in Pinecone (upsert/delete), best effort
 -> return JSON response
```

---

## 3) Tech Stack

### Core framework/runtime

- Next.js 14 (App Router)
- React 18
- TypeScript

### Styling/UI

- Tailwind CSS
- shadcn/ui primitives (Radix-based)
- next-themes for dark mode
- lucide-react icons

### Data and backend

- Prisma ORM (`@prisma/client`)
- MongoDB (Prisma datasource `provider = "mongodb"`)
- Pinecone vector DB (`@pinecone-database/pinecone`)

### AI & streaming

- `openai` SDK (configured for xAI/Groq OpenAI-compatible endpoints)
- Vercel AI SDK (`ai`, `useChat`, `OpenAIStream`, `StreamingTextResponse`)

### Auth/security

- Clerk (`@clerk/nextjs`)
- Custom credentials auth using bcrypt + secure HttpOnly cookie sessions
- `bcryptjs`
- Node `crypto` SHA-256 token hashing

### Tooling

- ESLint
- Prettier + Tailwind plugin

---

## 4) Component Breakdown

### A) Presentation layer (React components)

- `src/app/page.tsx`
  - landing page + entry CTA to credentials sign-in/sign-up
- `src/app/notes/*`
  - authenticated notes workspace shell
- `src/components/Note.tsx`
  - renders note cards and opens edit dialog
- `src/components/AddEditNoteDialog.tsx`
  - form-driven create/edit/delete note operations
- `src/components/AIChatButton.tsx` + `src/components/AIChatBox.tsx`
  - conversational UI, streams responses with `useChat`

### B) API layer (Next.js Route Handlers)

- `src/app/api/notes/route.ts`
  - note CRUD APIs and vector index sync
- `src/app/api/chat/route.ts`
  - RAG chat endpoint with streaming responses
- `src/app/api/auth/credentials/*`
  - local credentials sign-up/sign-in/sign-out

### C) Auth abstraction

- `src/lib/auth.ts`
  - unified `getAuth()` resolver
  - resolution order: Clerk -> credentials cookie -> anonymous
- `src/lib/auth/credentials.ts`
  - session token creation, hashing, cookie set/clear, session lookup

### D) Data access & integrations

- `src/lib/db/prisma.ts`
  - singleton Prisma client (avoids multiple clients in dev)
- `src/lib/db/pinecone.ts`
  - optional Pinecone bootstrap and resilient network lookup behavior
- `src/lib/openai.ts`
  - chat model and embeddings provider config (xAI/Groq)
  - optional hash-based fallback embedding generation for Groq mode

### E) Validation/contracts

- `src/lib/validation/note.ts`
  - zod schemas for create/update/delete note payloads
- `src/lib/validation/credentials.ts`
  - zod schemas for credentials sign-up/sign-in payloads

---

## 5) Folder & Code Structure

### Repository structure

```text
.
|-- prisma/
|   `-- schema.prisma
|-- src/
|   |-- app/
|   |   |-- api/
|   |   |   |-- auth/credentials/
|   |   |   |-- chat/route.ts
|   |   |   `-- notes/route.ts
|   |   |-- credentials/
|   |   |-- notes/
|   |   |-- sign-in/
|   |   |-- sign-up/
|   |   |-- layout.tsx
|   |   `-- page.tsx
|   |-- components/
|   |   |-- ui/
|   |   `-- (feature components)
|   `-- lib/
|       |-- auth/
|       |-- db/
|       |-- validation/
|       `-- openai.ts
|-- next.config.js
|-- tailwind.config.js
`-- package.json
```

### Why this structure

- **App Router feature colocation**: routes and route handlers stay close to feature areas.
- **`lib/` separation**: external integration logic is centralized and reusable.
- **`components/ui` vs feature components**: generic primitives are separated from domain-specific components.
- **schema-driven validation**: zod schemas define contracts once and are reused in APIs.

---

## 6) Data Flow & State Management

### Frontend state

- local UI state with `useState`:
  - dialog visibility
  - chat panel open/close
  - form error messages
- form state with `react-hook-form` for notes
- chat state with `useChat` (messages/input/loading/error)

### Server state

- source of truth is MongoDB (via Prisma)
- on mutation success, UI calls `router.refresh()` to reload fresh server data
- vector index state in Pinecone is synchronized on best effort

### Auth state

- Clerk session state (if logged through Clerk)
- credentials auth uses secure cookie (`credentials_session`) mapped to hashed token in DB
- all protected APIs call `getAuth()` on server side

---

## 7) Database Design

Database is MongoDB with Prisma models in `prisma/schema.prisma`.

### Collections

#### `notes`

- `id` (ObjectId, primary key)
- `title` (required)
- `content` (optional)
- `userId` (owner identifier)
- `createdAt`, `updatedAt`

Purpose: core note domain objects scoped by user.

#### `credentials_users`

- `id` (ObjectId, primary key)
- `email` (unique)
- `username` (unique, optional)
- `passwordHash` (bcrypt hash)
- `createdAt`, `updatedAt`

Purpose: local-auth identity records when not using Clerk.

#### `credentials_sessions`

- `id` (ObjectId, primary key)
- `userId` (ObjectId ref to `credentials_users`)
- `tokenHash` (unique SHA-256 hash of session token)
- `createdAt`
- `expiresAt`

Purpose: secure session management without storing raw tokens.

### Relationship design

- one `CredentialsUser` -> many `CredentialsSession`
- notes are linked by `userId` string to support both Clerk users and credentials users

This design keeps note ownership flexible across multiple auth providers.

---

## 8) API Endpoints

All endpoints are under `src/app/api/**`.

### `POST /api/auth/credentials/signup`

Creates a local credentials user and logs them in.

Request body:

```json
{
  "email": "user@example.com",
  "username": "optional_username",
  "password": "minimum_8_characters"
}
```

Responses:

- `201` `{ "userId": "<id>" }`
- `400` `{ "error": "Invalid input" }`
- `409` `{ "error": "User already exists" }`
- `500` `{ "error": "Internal server error" }`

### `POST /api/auth/credentials/signin`

Logs in with email or username + password.

Request body:

```json
{
  "identifier": "user@example.com or username",
  "password": "plaintext_password"
}
```

Responses:

- `200` `{ "userId": "<id>" }`
- `400` invalid input
- `401` invalid credentials
- `500` server error

### `POST /api/auth/credentials/signout`

Clears credentials session cookie and DB session.

Responses:

- `200` `{ "success": true }`
- `500` server error

### `POST /api/notes`

Creates a note, then upserts vector embedding (if Pinecone enabled).

Request body:

```json
{
  "title": "My note title",
  "content": "Optional content"
}
```

Responses:

- `201` `{ "note": { ... } }`
- `400` invalid input
- `401` unauthorized
- `500` server error

### `PUT /api/notes`

Updates an existing note + embedding sync.

Request body:

```json
{
  "id": "note_id",
  "title": "Updated title",
  "content": "Updated content"
}
```

Responses:

- `200` `{ "updatedNote": { ... } }`
- `400` invalid input
- `401` unauthorized (ownership enforced)
- `404` note not found
- `500` server error

### `DELETE /api/notes`

Deletes a note and deletes Pinecone vector (best effort).

Request body:

```json
{
  "id": "note_id"
}
```

Responses:

- `200` `{ "message": "Note deleted" }`
- `400`, `401`, `404`, `500`

### `POST /api/chat`

RAG chat endpoint. Retrieves relevant notes and streams LLM answer.

Request body:

```json
{
  "messages": [
    { "role": "user", "content": "What tasks did I plan this week?" }
  ]
}
```

Success response:

- `200` streamed text response (via Vercel AI SDK `StreamingTextResponse`)

Failure responses:

- `401` unauthorized
- `500` server error

### Authentication and authorization behavior

- APIs call `getAuth()` server-side.
- `getAuth()` tries Clerk first, then local credentials cookie session.
- note update/delete endpoints enforce note ownership by comparing `note.userId`.
- chat and notes endpoints are effectively protected by runtime auth checks.

---

## 9) Deployment Architecture

### Recommended deployment topology

```text
GitHub
  -> Vercel (Next.js app hosting, serverless route handlers)
      -> MongoDB Atlas (application data)
      -> Pinecone (vector index, optional)
      -> xAI/Groq API endpoint (LLM + embeddings)
      -> Clerk (auth provider)
```

### CI/CD status

- no CI workflow files are currently committed in this repository
- typical production workflow:
  - push to GitHub
  - Vercel auto-builds and deploys per branch/environment

### Environment configuration

Configure env vars in local `.env.local` and deployment environment:

```bash
# Required
DATABASE_URL=...
GROK_API_KEY=...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...

# Optional AI provider tuning
GROK_PROVIDER=groq|xai
GROK_BASE_URL=...
GROK_CHAT_MODEL=...
GROK_EMBEDDING_MODEL=...
GROK_EMBEDDING_DIM=1536

# Optional Pinecone
PINECONE_API_KEY=...
PINECONE_ENVIRONMENT=gcp-starter
PINECONE_PROJECT_ID=...
PINECONE_INDEX_NAME=nextjs-ai-note-app
PINECONE_EMBEDDING_DIM=1536
PINECONE_DISABLED=false

# Optional credentials auth session
CREDENTIALS_SESSION_DAYS=30
```

---

## 10) Security Considerations

### Authentication

- dual-mode auth:
  - Clerk sessions
  - custom credentials sessions
- server routes do not trust client identity; they resolve identity server-side

### Password handling

- passwords are hashed using bcrypt (`bcryptjs`, salt rounds = 12)
- plaintext passwords are never stored

### Session handling

- credentials cookie:
  - `HttpOnly`
  - `SameSite=Lax`
  - `Secure` in production
- DB stores only SHA-256 hash of session token, not raw token
- session expiration enforced via `expiresAt`

### Authorization and data isolation

- note update/delete operations verify owner (`userId`) before mutation
- chat retrieval filters vectors by `userId`
- fallback note retrieval is scoped by `userId`

### Input validation

- zod schema validation on all write/auth endpoints
- invalid payloads are rejected with `400`

---

## 11) Development Workflow

### Local setup

```bash
git clone <repo-url>
cd note-recall-ai
npm install
npx prisma generate
npm run dev
```

Open: `http://localhost:3000`

### Useful commands

```bash
# development server
npm run dev

# production build
npm run build
npm run start

# lint
npm run lint
```

### Prisma with MongoDB

After schema changes:

```bash
npx prisma generate
npx prisma db push
```

### Debugging tips

- watch server logs in terminal for API errors (`/api/chat`, `/api/notes`)
- inspect browser Network tab for endpoint payload/status
- verify auth provider resolution through behavior (Clerk vs credentials)

### Testing status

- no automated test suite is currently included
- manual verification is recommended for:
  - auth flows
  - note CRUD
  - chat retrieval + streaming

---

## 12) Examples

### Example use cases

1. Create a note: meeting summary, TODOs, project ideas.
2. Ask: “What did I say about API rate limits?”
3. Assistant retrieves related notes and returns a contextual summary.
4. Update the note and ask follow-up questions; retrieval reflects latest content.

### Example cURL requests

Create note:

```bash
curl -X POST http://localhost:3000/api/notes \
  -H "Content-Type: application/json" \
  -d '{"title":"Sprint plan","content":"Finish auth docs by Friday"}'
```

Sign up (credentials):

```bash
curl -X POST http://localhost:3000/api/auth/credentials/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"dev@example.com","username":"devuser","password":"strongpass123"}'
```

Chat:

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"What are my sprint tasks?"}]}'
```

### Example JSON response

```json
{
  "note": {
    "id": "65f5c8...",
    "title": "Sprint plan",
    "content": "Finish auth docs by Friday",
    "userId": "user_123",
    "createdAt": "2026-02-17T12:00:00.000Z",
    "updatedAt": "2026-02-17T12:00:00.000Z"
  }
}
```

---

## Notes for Contributors

- Keep API contracts aligned with zod schemas.
- Maintain the `getAuth()` abstraction when adding new protected routes.
- If adding new vector providers, keep Pinecone optional/fallback behavior intact.
