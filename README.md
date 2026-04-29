# AI Teacher

An AI-powered learning platform where users enter any topic and get a full course with interactive lessons and quizzes, generated on the fly by Google Gemini.

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS |
| Backend | Express + Bun + Vercel AI SDK + Google Gemini |
| Database | SQLite (via `bun:sqlite`) |

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Bun](https://bun.sh/) v1.0+
- Google Generative AI API key — get one at [Google AI Studio](https://aistudio.google.com/apikey)

## Setup

### 1. Clone the repository

```bash
git clone <repo-url>
cd ai-teacher
```

### 2. Install dependencies

```bash
# Install both client and server dependencies
npm run install:all
```

Or install manually:

```bash
cd server && bun install
cd ../client && npm install
```

### 3. Configure environment variables

Create a `.env` file in the `server/` directory:

```bash
cp server/.env.example server/.env
```

Then edit `server/.env` and add your API key:

```
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
```

## Running the App

### Option A: Run both together (from project root)

```bash
npm run dev
```

This starts both the server (port 3001) and client (port 3000) concurrently.

### Option B: Run separately

Terminal 1 — Backend:
```bash
cd server
bun run dev
```

Terminal 2 — Frontend:
```bash
cd client
npm run dev
```

### Open the app

Go to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
ai-teacher/
├── client/                  # React frontend
│   ├── components/          # UI components
│   ├── services/api.ts      # Backend API calls
│   ├── App.tsx              # Main app component
│   ├── types.ts             # TypeScript types
│   └── vite.config.ts       # Vite config with API proxy
├── server/                  # Express backend
│   ├── src/
│   │   ├── index.ts         # Express entry point
│   │   ├── db.ts            # SQLite database layer
│   │   └── routes/
│   │       └── course.ts    # API routes + AI integration
│   ├── .env.example         # Environment variable template
│   └── package.json
└── package.json             # Root scripts
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/courses` | Get all courses |
| GET | `/api/courses/:id` | Get a single course with modules |
| POST | `/api/generate-syllabus` | Generate a new course syllabus |
| POST | `/api/stream-lesson` | Stream lesson content for a module |
| PUT | `/api/modules/:id/quiz-score` | Update quiz score and completion |
| DELETE | `/api/courses/:id` | Delete a course |

## Build for Production

```bash
# Build frontend
cd client
npm run build

# Start server
cd ../server
bun run src/index.ts
```

The built frontend is served from `client/dist/`. Configure your server or CDN to serve those static files.
