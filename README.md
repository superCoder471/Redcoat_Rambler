# Redcoat Rambler – Student Newspaper

<p align="center">
  <img src="assets/images/logo.png" alt="Redcoat Rambler Logo" width="300" height="300" style="border-radius: 12px;">
</p>

<p align="center">
  <strong>The official website of the Berlin High School Redcoat Rambler student newspaper.</strong><br>
  Built with Bun, SQLite, and vanilla JavaScript. No frameworks, no build step — just pure, fast, and secure.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white">
  <img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white">
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white">
  <img src="https://img.shields.io/badge/Tests-✔️-brightgreen?style=for-the-badge">
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge">
</p>

---

## Table of Contents

- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Admin Setup](#-admin-setup)
- [API Reference](#-api-reference)
- [Testing](#-testing)
- [Security](#-security)
- [Deployment](#-deployment)
- [Customization](#-customization)
- [Acknowledgments](#-acknowledgments)

---

## Features

### For Readers
- **Homepage** – Displays featured stories with a clean, card-based layout.
- **Archive** – Browse all published stories, filterable by category and author.
- **Article Page** – Individual story view with readable typography, progress bar, and share button.
- **Author Pages** – Meet the team, with links to each author's stories.
- **Submit an Idea** – Public form to suggest story topics (no login required).
- **Dark/Light Mode** – Toggleable theme with persistent local storage.
- **Mobile Responsive** – Hamburger menu and fluid layouts for all devices.
- **Custom 404 Page** – Playful "Story Redacted" error page.
- **Bracket System** – Interactive tournament bracket that can be displayed on the homepage. A teaser shows the selected round (up to three matches) with a link to the full bracket page (`bracket.html`), which displays all rounds in a scrollable grid. Bracket visibility and content are controlled by admins.

### For Admins
- **Secure Admin Panel** – Password‑protected (`/admin.html`) with session‑based authentication.
- **Publish Stories** – Rich text editor (Quill) to write and format articles.
- **Manage Stories** – Edit, delete, or toggle featured status.
- **Manage Submissions** – View and delete reader‑submitted ideas.
- **Bracket Management** – A dedicated section in the admin panel to create and edit brackets.
  - **Visual Editor** – Add, edit, and delete rounds and matches. Team names and winners can be set interactively; the winner dropdown updates in real time when team names change.
  - **JSON Toggle** – Switch to a raw JSON editor for advanced users. Changes are validated when switching back to visual mode, ensuring data integrity.
  - **Homepage Round Selection** – Choose which round (or "last round" automatically) appears in the homepage banner.
  - **Visibility Control** – Show or hide the bracket on the public site with a single checkbox.

### Technical Highlights
- **No Frameworks** – Vanilla JS, pure CSS, and Bun runtime.
- **SQLite Database** – Lightweight, file‑based, with prepared statements.
- **Session Management** – Server‑side sessions with sliding expiry.
- **XSS Protection** – Client‑side sanitization with DOMPurify; all outputs escaped.
- **Static File Security** – Blocks dotfiles and path traversal.
- **Comprehensive Tests** – Server API tests, frontend unit tests (escapeHTML, theme toggle), and now full admin panel tests covering bracket editor logic.

---

## Technology Stack

| Layer          | Technology                          |
|----------------|-------------------------------------|
| **Runtime**    | [Bun](https://bun.sh) v1.1+         |
| **Database**   | SQLite (via `bun:sqlite`)           |
| **Backend**    | Built‑in Bun HTTP server             |
| **Frontend**   | Vanilla HTML, CSS, JavaScript        |
| **Editor**     | [Quill](https://quilljs.com) (admin) |
| **Sanitizer**  | [DOMPurify](https://github.com/cure53/DOMPurify) |
| **Testing**    | Bun test + [Happy DOM](https://github.com/capricorn86/happy-dom) |
| **Auth**       | bcrypt (Bun password), session cookies |

---

## Project Structure

```
.
├── server.js              # Main HTTP server + all API routes
├── journalism.db          # SQLite database (auto‑created)
├── .env                   # Environment variables (ADMIN_HASH)
├── package.json           # Scripts and dev dependencies
├── bun.lock               # Bun lockfile
├── README.md              # You are here
│
├── Public Pages
│   ├── index.html         # Homepage (featured stories) + bracket banner
│   ├── archive.html       # Full archive with filters
│   ├── article.html       # Individual story view
│   ├── authors.html       # Meet the authors
│   ├── submit.html        # Idea submission form
│   ├── admin.html         # Admin panel (protected)
│   ├── bracket.html       # Full bracket view
│   └── 404.html           # Custom error page
│
├── Assets & Styles
│   ├── styles.css         # Global styles (dark/light theme, bracket visuals)
│   ├── assets/images/     # Logo and author placeholders
│   └── theme.js           # Theme toggle + mobile menu + progress bar
│
├── JavaScript Loaders
│   ├── index-loader.js    # Fetches featured stories for homepage
│   ├── archive-loader.js  # Fetches + filters stories for archive
│   ├── article-loader.js  # Fetches individual story + sanitizes content
│   ├── submit.js          # Handles idea submission
│   ├── admin.js           # Admin panel logic (publish, edit, delete, feature, bracket editor)
│   ├── banner-loader.js   # Fetches bracket and renders homepage teaser
│   └── bracket-loader.js  # Fetches bracket and renders full bracket page
│
├── Tests
│   ├── server.test.js     # API endpoint tests (including bracket endpoints)
│   ├── frontend.test.js   # escapeHTML + theme toggle tests
│   ├── admin.test.js      # Comprehensive admin panel tests (bracket editor, login, saving)
│   ├── happydom.ts        # Happy DOM setup for frontend tests
│   └── git_nuke.sh        # Utility to reset git history (for when you accidentally commit your password... again)
```

---

## Getting Started

### Prerequisites
- [Bun](https://bun.sh) installed (v1.1 or higher)
- Git (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/redcoat-rambler.git
   cd redcoat-rambler
   ```

2. **Install dev dependencies** (only needed for testing)
   ```bash
   bun install
   ```

3. **Set up environment variables** (see [Environment Variables](#-environment-variables))
   ```bash
   cp .env.example .env
   # Edit .env with your ADMIN_HASH
   ```

4. **Run the server**
   ```bash
   bun --hot run server.js
   ```
   The server will start at `http://localhost:3000`.  
   The `--hot` flag enables automatic restart on file changes.

5. **Access the site**
   - Public: `http://localhost:3000`
   - Admin panel: `http://localhost:3000/admin.html`

---

## Environment Variables

The server expects a single environment variable:

| Variable     | Description                                                                 |
|--------------|-----------------------------------------------------------------------------|
| `ADMIN_HASH` | bcrypt hash of the admin password (see [Admin Setup](#-admin-setup) below) |

Create a `.env` file in the project root:

```
ADMIN_HASH=$2b$10$YourGeneratedHashHere
```

> **Important:** If you copy the hash from the terminal, escape every `$` with a backslash (`\$`) so the shell doesn't interpret them as variables.

---

## Admin Setup

### 1. Generate a bcrypt password hash

```bash
bun -e "console.log(await Bun.password.hash('yourpassword', 'bcrypt'))"
```

### 2. Add the hash to `.env`

```
ADMIN_HASH=\$2b\$10\$YourGeneratedHashHere
```

### 3. Login

- Navigate to `/admin.html`
- Enter the password
- On success, a secure `__Host-auth_token` cookie is set (valid 1 hour, sliding expiry)

---

## API Reference

All routes are served from `server.js`.  
Base URL: `http://localhost:3000`

### Public Routes (no authentication)

| Method | Endpoint                     | Description                                      |
|--------|------------------------------|--------------------------------------------------|
| GET    | `/api/stories`               | Get all stories. Supports `?category=` & `?author=` |
| GET    | `/api/stories/featured`      | Get only featured stories                        |
| GET    | `/api/stories/:id`           | Get a single story by ID                         |
| GET    | `/api/authors`               | Get list of distinct author names                 |
| POST   | `/api/submissions`           | Submit a story idea (public)                     |
| POST   | `/api/login`                 | Authenticate and receive session cookie           |
| POST   | `/api/logout`                | Clear session cookie and invalidate session       |
| GET    | `/api/bracket`               | Get the current bracket (title, data, visibility) |

### Admin Routes (require session cookie)

| Method | Endpoint                          | Description                          |
|--------|-----------------------------------|--------------------------------------|
| POST   | `/api/stories`                    | Create a new story                   |
| PUT    | `/api/stories/update/:id`         | Update an existing story              |
| DELETE | `/api/stories/delete/:id`         | Delete a story                        |
| POST   | `/api/stories/toggle/:id`         | Toggle featured status                |
| GET    | `/api/submissions`                | View all submitted ideas              |
| DELETE | `/api/submissions/delete/:id`     | Delete a submission                   |
| POST   | `/api/bracket`                    | Update the bracket (title, data, visibility) – full server‑side validation |

### Example Requests

**Get all stories**
```bash
curl http://localhost:3000/api/stories
```

**Filter by category**
```bash
curl "http://localhost:3000/api/stories?category=News"
```

**Submit an idea**
```bash
curl -X POST http://localhost:3000/api/submissions \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","idea":"Investigate the new cafeteria menu"}'
```

**Login (admin)**
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"password":"yourpassword"}' \
  -c cookies.txt
```

**Publish a story (using saved cookie)**
```bash
curl -X POST http://localhost:3000/api/stories \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"title":"New Story","dek":"Summary","author":"Jane","category":"News","content":"<p>Hello</p>","date":"Mar 25, 2025"}'
```

**Get the current bracket**
```bash
curl http://localhost:3000/api/bracket
```

**Update the bracket (admin)**
```bash
curl -X POST http://localhost:3000/api/bracket \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"title":"Best Pet Bracket","data":{"rounds":[{"name":"Quarterfinals","matches":[{"team1":"Cat","team2":"Dog","winner":null}]}]},"is_visible":1}'
```

---

## Testing

The project includes three test suites: **server API tests**, **frontend unit tests**, and **admin panel tests**.

### Run all tests
```bash
bun run test
```

### Run only server tests
```bash
bun run test:server
```

### Run only frontend tests
```bash
bun run test:frontend
```

### Run only admin tests
```bash
bun run test:admin
```

**What's tested?**
- **Server:** All API endpoints (stories, submissions, authentication, sessions, bracket), SQL injection prevention, static file security, and correct database operations. Tests use a separate `.env.test` file with a test password hash.
- **Frontend:** `escapeHTML` function (XSS protection) and theme toggle logic (localStorage, attribute changes).
- **Admin Panel:** Comprehensive tests for the bracket editor: loading data, rendering rounds and matches, updating team names and winner dropdowns, switching between visual and JSON modes, saving in both modes, and the login flow.

> Frontend and admin tests use `happy-dom` to simulate a browser environment.

---

## Security

- **Authentication** – bcrypt‑hashed password, server‑side sessions stored in SQLite with 1‑hour sliding expiry.
- **Cookies** – `__Host-auth_token` is `HttpOnly`, `Secure`, `SameSite=Strict`, and uses the `__Host-` prefix for domain‑locked security.
- **SQL Injection** – All database queries use prepared statements.
- **XSS** – User‑generated content (story bodies) is sanitized with DOMPurify on the client. All dynamic text is escaped via `escapeHTML()`.
- **Static Files** – The file server blocks requests to dotfiles (`.env`, `.git`) and prevents path traversal (e.g., `../`).
- **Session Cleanup** – Expired sessions are automatically deleted on each authentication check.

---

## Deployment

Because the site is a single Bun server, deployment is straightforward.

### Option 1: Bare Metal / VPS

1. Transfer the project folder to your server.
2. Ensure Bun is installed.
3. Set environment variables (`.env`).
4. Run with a process manager like `pm2` or `systemd`:

   ```bash
   bun run server.js &
   ```

### Option 2: Docker (example)

A minimal `Dockerfile` could look like:

```dockerfile
FROM oven/bun:latest
WORKDIR /app
COPY . .
RUN bun install --production
EXPOSE 3000
CMD ["bun", "run", "server.js"]
```

### Option 3: Fly.io / Render

- Use the Bun buildpack or Docker image.
- Set the `ADMIN_HASH` environment variable in the dashboard.
- Expose port 3000.

---

## Customization

### Styling

All styles are in `styles.css`. The file uses CSS variables (OKLCH colors) for theming. To change the color scheme, modify the `:root` and `[data-theme="light"]` blocks.

### Adding a New Page

1. Create an HTML file (e.g., `about.html`).
2. Include the common `<header>` and `<footer>`.
3. Add any necessary JavaScript loaders.
4. The static file server will serve it automatically.

### Modifying the Admin Editor

The admin panel uses Quill. You can customize the toolbar in `admin.js`:

```js
modules: {
  toolbar: [
    [{ 'header': [1, 2, false] }],
    ['bold', 'italic', 'underline'],
    // ... add more buttons
  ]
}
```

---

## Acknowledgments

- **AI‑assisted** – The CSS, README, and test suites were written with help from AI (as the author humorously notes: *"I hate graphic design, deal with it"*).
- **Berlin High School** – For supporting student journalism.
- **Bun** – For an incredibly fast and pleasant runtime.
- **Open source libraries** – Quill, DOMPurify, Happy DOM.

---

## License

### Source Code
The source code of this website (all files that make the site function) is open source under the [MIT License](LICENSE). You are free to use, modify, and distribute it, provided you include the original copyright notice.

### Content
All other content on this site, including but not limited to:
- Articles
- Author biographies
- Images
- Any other creative works
is © 2025 Redcoat Rambler. All rights reserved. No part of this content may be reproduced, distributed, or transmitted without prior written permission.

### Reader Submissions
Reader‑submitted ideas are governed by the terms stated on the [Submit an Idea](submit.html) page.

---

<p align="center">
  Made by the Redcoat Rambler staff.
</p>