# Redcoat Rambler

Website for the **Berlin High School Redcoat Rambler** student newspaper.

Built with Bun, SQLite, and vanilla JS. No frameworks, no build step — just files served directly.

All CSS, tests, and this README are written by AI. I'm lazy and hate graphic design, deal with it.

---

## Project structure

```
├── server.js              # Bun HTTP server + API routes
├── journalism.db          # SQLite database (auto-created on first run)
├── index.html             # Homepage (featured stories)
├── archive.html           # Full story archive with filters
├── article.html           # Individual article page
├── authors.html           # Meet the Authors page
├── submit.html            # Reader idea submission form
├── admin.html             # Admin panel (password protected)
├── 404.html               # Custom 404 page
├── styles.css             # Global styles (dark/light theme)
├── theme.js               # Theme toggle + mobile menu + scroll progress
├── index-loader.js        # Fetches featured stories for homepage
├── archive-loader.js      # Fetches + filters stories for archive
├── article-loader.js      # Fetches individual story content
├── submit.js              # Handles idea submission form
├── admin.js               # Admin panel logic (publish, edit, delete, feature)
├── server.test.js         # Server API tests
├── frontend.test.js       # Frontend unit tests (escapeHTML, theme toggle)
├── happydom.ts            # DOM environment for frontend tests
├── package.json           # Scripts and dev dependencies
└── README.md
```

---

## Running the server

```bash
bun --hot run server.js
```

The server runs on `http://localhost:3000`. The `--hot` flag enables hot reloading on file changes.

---

## Testing

```bash
bun run test           # run all tests (server + frontend)
bun run test:server    # server API tests only
bun run test:frontend  # frontend unit tests only (requires happy-dom)
```

The two test suites run in separate processes because the frontend tests use `happy-dom` to simulate a browser DOM, which would interfere with the server tests if run together.

**Coverage:**
- Server: all API routes, auth, session security, SQL injection protection, path traversal, dotfile blocking
- Frontend: `escapeHTML` (XSS protection), theme toggle logic and localStorage persistence

---

## Admin setup

### 1. Generate a password hash

```bash
bun -e "console.log(await Bun.password.hash('yourpassword', 'bcrypt'))"
```

### 2. Store it in a `.env` file

```
ADMIN_HASH=\$2b\$10\$yourhashere...
```

> **Important:** Add a `\` before every `$` in the hash when writing it to `.env`, otherwise the shell will try to interpret them as variables.

### 3. Start the server

The server reads `ADMIN_HASH` from the environment automatically. Login at `/admin.html`.

---

## API reference

All routes are served from `server.js`. Public routes are accessible without authentication. Admin routes require a valid session cookie set by `/api/login`.

### Public

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/stories` | Get all stories. Supports `?category=` and `?author=` filters |
| `GET` | `/api/stories/featured` | Get only featured stories |
| `GET` | `/api/stories/:id` | Get a single story by ID |
| `GET` | `/api/authors` | Get list of distinct author names |
| `POST` | `/api/submissions` | Submit a story idea |
| `POST` | `/api/login` | Log in with admin password, receives session cookie |
| `POST` | `/api/logout` | Clear session cookie and invalidate session |

### Admin (requires session cookie)

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/stories` | Create a new story |
| `PUT` | `/api/stories/update/:id` | Update an existing story |
| `DELETE` | `/api/stories/delete/:id` | Delete a story |
| `POST` | `/api/stories/toggle/:id` | Toggle a story's featured status |
| `GET` | `/api/submissions` | View all submitted ideas |
| `DELETE` | `/api/submissions/delete/:id` | Delete a submission |

---

## Security notes

- Admin sessions are stored server-side in SQLite with a 1-hour sliding expiry
- Session cookies are `HttpOnly`, `Secure`, `SameSite=Strict`, and use the `__Host-` prefix
- The static file server blocks dotfiles (`.env`, `.git`, etc.) and path traversal attacks
- All database queries use prepared statements (no SQL injection)
- Article content is sanitized client-side with [DOMPurify](https://github.com/cure53/DOMPurify) before rendering

---

## Dependencies

**Runtime:** none — Bun and its standard library handle everything.

**Dev:**
- `@happy-dom/global-registrator` — DOM simulation for frontend unit tests

---

## Environment variables

| Variable | Description |
|----------|-------------|
| `ADMIN_HASH` | bcrypt hash of the admin password |