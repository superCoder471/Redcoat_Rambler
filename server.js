import { Database } from "bun:sqlite";

// 1. Initialize the SQLite database (creates journalism.db if it doesn't exist)
const db = new Database("journalism.db", { create: true });

// 2. Create the table for your stories
// Add 'featured' column (0 for false, 1 for true)
db.run(`
  CREATE TABLE IF NOT EXISTS stories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    dek TEXT,
    category TEXT,
    content TEXT,
    date TEXT,
    featured INTEGER DEFAULT 0,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

console.log("📂 Database initialized.");

// 3. Start the Bun Server
Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    // --- API ROUTES ---


     // 2. GET FEATURED (Critical: Place this before the ID route)
    if (url.pathname === "/api/stories/featured" && req.method === "GET") {
      const featured = db.query("SELECT * FROM stories WHERE featured = 1 ORDER BY id DESC").all();
      return Response.json(featured);
    }

    
    // 1. GET ALL
    if (url.pathname === "/api/stories" && req.method === "GET") {
      const allStories = db.query("SELECT * FROM stories ORDER BY id DESC").all();
      return Response.json(allStories);
    }

   

    // 3. GET ONE SPECIFIC STORY
    if (url.pathname.startsWith("/api/stories/") && req.method === "GET") {
      const id = url.pathname.split("/").pop();
      const story = db.query("SELECT * FROM stories WHERE id = ?").get(id);
      return story ? Response.json(story) : new Response("Story Not Found", { status: 404 });
    }

    // 4. POST NEW STORY
    if (url.pathname === "/api/stories" && req.method === "POST") {
      const body = await req.json();
      db.run(
        "INSERT INTO stories (title, dek, category, content, date, featured) VALUES (?, ?, ?, ?, ?, 0)",
        [body.title, body.dek, body.category, body.content, body.date]
      );
      return new Response("Story saved successfully!", { status: 201 });
    }

    // 5. TOGGLE FEATURED
    if (url.pathname.startsWith("/api/stories/toggle/") && req.method === "POST") {
      const id = url.pathname.split("/").pop();
      db.run("UPDATE stories SET featured = 1 - featured WHERE id = ?", [id]);
      return new Response("Toggled");
    }

    // 6. DELETE
    if (url.pathname.startsWith("/api/stories/delete/") && req.method === "DELETE") {
      const id = url.pathname.split("/").pop();
      db.run("DELETE FROM stories WHERE id = ?", [id]);
      return new Response("Deleted");
    }

    // --- FILE SERVER (Move this to the bottom!) ---
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