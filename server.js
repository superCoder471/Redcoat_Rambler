import { Database } from "bun:sqlite";

// 1. Initialize Database
const db = new Database("journalism.db", { create: true });

// 2. Ensure Tables Exist
db.run(`
  CREATE TABLE IF NOT EXISTS stories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT, dek TEXT, category TEXT, content TEXT, date TEXT,
    featured INTEGER DEFAULT 0, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
db.run(`
  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT, email TEXT, idea TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

const ADMIN_PASSWORD = "test"; // Change this for real use!
const AUTH_COOKIE = "auth_token=simple_secret_123";

// Helper function to check if the user is logged in
const isAuthorized = (req) => {
  const cookie = req.headers.get("Cookie");
  return cookie && cookie.includes(AUTH_COOKIE);
};

console.log("📂 Database initialized.");

Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    // --- PUBLIC ROUTES (Anyone can access) ---

    // Login Route
    if (url.pathname === "/api/login" && req.method === "POST") {
      const body = await req.json();
      if (body.password === ADMIN_PASSWORD) {
        return new Response("Authorized", {
          status: 200,
          headers: {
            "Set-Cookie": `${AUTH_COOKIE}; HttpOnly; Path=/; SameSite=Strict`
          }
        });
      }
      return new Response("Unauthorized", { status: 401 });
    }

    // 1. PUBLIC: Anyone can submit an idea
    if (url.pathname === "/api/submissions" && req.method === "POST") {
      const { name, email, idea } = await req.json();
      const query = db.prepare("INSERT INTO submissions (name, email, idea) VALUES (?, ?, ?)");
      query.run(name, email, idea);
      return new Response("Idea received!", { status: 201 });
    }

    // Get Stories (for the homepage)
    if (url.pathname === "/api/stories" && req.method === "GET") {
      const stories = db.query("SELECT * FROM stories ORDER BY id DESC").all();
      return Response.json(stories);
    }

    // Get Featured Stories
    if (url.pathname === "/api/stories/featured" && req.method === "GET") {
      const featured = db.query("SELECT * FROM stories WHERE featured = 1 ORDER BY id DESC").all();
      return Response.json(featured);
    }

    // --- ADMIN ROUTES (Requires Cookie) ---

    if (url.pathname.startsWith("/api/submissions") || url.pathname.includes("/delete") || url.pathname.includes("/toggle")) {
      if (!isAuthorized(req)) {
        return new Response("Unauthorized access blocked", { status: 403 });
      }
    }

    // 2. PRIVATE: Only admin (with cookie) can see ideas
    if (url.pathname === "/api/submissions" && req.method === "GET") {
      if (!isAuthorized(req)) {
        return new Response("Unauthorized", { status: 403 });
      }
      const subs = db.query("SELECT * FROM submissions ORDER BY id DESC").all();
      return Response.json(subs);
    }

    // Post New Story
    if (url.pathname === "/api/stories" && req.method === "POST") {
      if (!isAuthorized(req)) return new Response("Forbidden", { status: 403 });
      const body = await req.json();
      db.run(
        "INSERT INTO stories (title, dek, category, content, date, featured) VALUES (?, ?, ?, ?, ?, 0)",
        [body.title, body.dek, body.category, body.content, body.date]
      );
      return new Response("Story saved!", { status: 201 });
    }

    // Toggle Featured
    if (url.pathname.startsWith("/api/stories/toggle/") && req.method === "POST") {
      const id = url.pathname.split("/").pop();
      db.run("UPDATE stories SET featured = 1 - featured WHERE id = ?", [id]);
      return new Response("Toggled");
    }

    // Delete Story
    if (url.pathname.startsWith("/api/stories/delete/") && req.method === "DELETE") {
      const id = url.pathname.split("/").pop();
      db.run("DELETE FROM stories WHERE id = ?", [id]);
      return new Response("Deleted");
    }

    // --- STATIC FILE SERVER ---
    let filePath = "." + url.pathname;
    if (url.pathname === "/") filePath = "./index.html";

    const file = Bun.file(filePath);
    if (await file.exists()) {
      return new Response(file);
    }

    return new Response("404 Not Found", { status: 404 });
  },
});

console.log("🚀 Server running at http://localhost:3000");