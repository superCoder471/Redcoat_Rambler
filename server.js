// bun -e "console.log(await Bun.password.hash('passwordg', 'bcrypt'))" generates hash
// YOU MUST ADD \ before each $ to escape them or nothin works
// bun -e "console.log(crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, ''))" generates secret
// bun --hot run server.js
import path from "path";


import { Database } from "bun:sqlite";

// Initialize Database
const db = new Database("journalism.db", { create: true });


// Ensure Tables Exist
db.run(`
  CREATE TABLE IF NOT EXISTS stories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT, 
    dek TEXT, 
    author TEXT, 
    category TEXT, 
    content TEXT, 
    date TEXT,
    featured INTEGER DEFAULT 0, 
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
db.run(`
  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT, email TEXT, idea TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
db.run(`
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT UNIQUE,
    expires_at DATETIME
  )
`);



// const ADMIN_PASSWORD = Bun.env.ADMIN_PASSWORD; 
//const AUTH_COOKIE = `auth_token=${Bun.env.COOKIE_SECRET}`;
const ADMIN_HASH = Bun.env.ADMIN_HASH;
//console.log("Current Hash Loaded:", ADMIN_HASH);

const isAuthorized = (req) => {
  const cookieHeader = req.headers.get("Cookie") || "";

  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [key, ...value] = c.trim().split('=');
      return [key, value.join('=')];
    })
  );

  const token = cookies['__Host-auth_token'];
  if (!token) return false;

  // Delete expired sessions
  db.prepare("DELETE FROM sessions WHERE expires_at <= ?")
    .run(new Date().toISOString());

  const now = new Date();
  const nowISO = now.toISOString();

  const session = db.prepare(
    "SELECT * FROM sessions WHERE token = ? AND expires_at > ?"
  ).get(token, nowISO);

  if (!session) return false;
//sliding refresh
  const newExpiry = new Date(Date.now() + 60 * 60 * 1000);

  db.prepare(
    "UPDATE sessions SET expires_at = ? WHERE token = ?"
  ).run(newExpiry.toISOString(), token);

  return true;
};




export async function handleRequest(req) {
  const url = new URL(req.url);


  // --- PUBLIC ROUTES (Anyone can access) ---

    // Login Route
    if (url.pathname === "/api/login" && req.method === "POST") {
      const body = await req.json();
      const isMatch = await Bun.password.verify(body.password, ADMIN_HASH);
      if (isMatch) {
        const token = crypto.randomUUID(); // secure random token
        
        // expire in 24 hours
        const expires = new Date(Date.now() + 60 * 60 * 1000);

        db.prepare(
          "INSERT INTO sessions (token, expires_at) VALUES (?, ?)"
        ).run(token, expires.toISOString());

        return new Response("Authorized", {
          status: 200,
          headers: {
            "Set-Cookie": `__Host-auth_token=${token}; HttpOnly; Path=/; SameSite=Strict; Secure; Max-Age=3600`
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

    if (url.pathname === "/api/authors" && req.method === "GET") {
      const authors = db.query("SELECT DISTINCT author FROM stories WHERE author IS NOT NULL AND author != '' ORDER BY author ASC").all();
      // authors will look like [{author: "Jimmy"}, {author: "Sarah"}]
      return Response.json(authors.map(a => a.author));
    }

   // Get Stories (with optional filtering) for home page
    if (url.pathname === "/api/stories" && req.method === "GET") {
      const category = url.searchParams.get("category");
      const author = url.searchParams.get("author");
      
      let query = "SELECT * FROM stories WHERE 1=1";
      let params = [];

      if (category) {
        query += " AND category = ?";
        params.push(category);
      }
      if (author) {
        query += " AND author = ?";
        params.push(author);
      }

      query += " ORDER BY id DESC";
      
      const stories = db.query(query).all(...params);
      return Response.json(stories);
    }

    // Get Featured Stories
    if (url.pathname === "/api/stories/featured" && req.method === "GET") {
      const featured = db.query("SELECT * FROM stories WHERE featured = 1 ORDER BY id DESC").all();
      return Response.json(featured);
    }

    
    //get story by id
    if (url.pathname.startsWith("/api/stories/") && req.method === "GET") {
      const id = url.pathname.split("/").pop();
      const story = db.query("SELECT * FROM stories WHERE id = ?").get(id);

      if (story) {
        return Response.json(story);
      } else {
        return new Response("Story Not Found", { status: 404 });
      }
    }

    

    // Logout
    if (url.pathname === "/api/logout" && req.method === "POST") {
      const cookieHeader = req.headers.get("Cookie") || "";

      const cookies = Object.fromEntries(
        cookieHeader.split(';').map(c => {
          const [key, ...value] = c.trim().split('=');
          return [key, value.join('=')];
        })
      );

      const token = cookies['__Host-auth_token'];

      if (token) {
        db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
      }

      return new Response("Logged out", {
        headers: {
          "Set-Cookie": "__Host-auth_token=; HttpOnly; Path=/; Max-Age=0; Secure; SameSite=Strict"
        }
      });
    }

    // --- ADMIN ROUTES (Requires Cookie) ---


        // 1. Delete Submission 
    if (url.pathname.startsWith("/api/submissions/delete/") && req.method === "DELETE") {
      if (!isAuthorized(req)) return new Response("Forbidden", { status: 403 });
      const id = url.pathname.split("/").pop();
      // Using prepare for consistency and safety
      db.prepare("DELETE FROM submissions WHERE id = ?").run(id); 
      return new Response("Submission Deleted");
    }

    // 2. Update/Edit Story (Add this near the Post New Story route)
    if (url.pathname.startsWith("/api/stories/update/") && req.method === "PUT") {
      if (!isAuthorized(req)) return new Response("Forbidden", { status: 403 });
      const id = url.pathname.split("/").pop();
      const body = await req.json();
      
      // Use prepare().run() for better performance and consistency
      db.prepare(
        "UPDATE stories SET title = ?, dek = ?, author = ?, category = ?, content = ? WHERE id = ?"
      ).run(body.title, body.dek, body.author, body.category, body.content, id);
      
      return new Response("Story Updated");
    }


    // if (url.pathname.startsWith("/api/submissions") || url.pathname.includes("/delete") || url.pathname.includes("/toggle")) {
    //   if (!isAuthorized(req)) {
    //     return new Response("Unauthorized access blocked", { status: 403 });
    //   }
    // }

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
      
      // Use prepare().run()
      db.prepare(
        "INSERT INTO stories (title, dek, author, category, content, date, featured) VALUES (?, ?, ?, ?, ?, ?, 0)"
      ).run(body.title, body.dek, body.author, body.category, body.content, body.date);
      
      return new Response("Story saved!", { status: 201 });
    }

    // Toggle Featured
    if (url.pathname.startsWith("/api/stories/toggle/") && req.method === "POST") {
      if (!isAuthorized(req)) return new Response("Forbidden", { status: 403 });
      const id = url.pathname.split("/").pop();
      // Ensure the ID is passed as a parameter
      db.prepare("UPDATE stories SET featured = 1 - featured WHERE id = ?").run(id);
      return new Response("Toggled");
    }

    // Delete Story
    if (url.pathname.startsWith("/api/stories/delete/") && req.method === "DELETE") {
      if (!isAuthorized(req)) return new Response("Forbidden", { status: 403 });
      const id = url.pathname.split("/").pop();
      db.prepare("DELETE FROM stories WHERE id = ?").run(id);
      return new Response("Deleted");
    }

    // --- STATIC FILE SERVER ---
    // let filePath = "." + url.pathname;
    // if (url.pathname === "/") filePath = "./index.html";

    // // If it's an API route that didn't match anything above, 
    // // force a 404 before trying to find a file.
    // if (url.pathname.startsWith("/api/")) {
    //   return new Response("API Route Not Found", { status: 404 });
    // }

    // const file = Bun.file(filePath);
    // if (await file.exists()) {
    //   return new Response(file);
    // }


    // --- STATIC FILE SERVER ---
    if (url.pathname.startsWith("/api/")) {
      return new Response("API Route Not Found", { status: 404 });
    }

    const rootDir = import.meta.dir;
    const filePath = url.pathname === "/"
      ? path.join(rootDir, "index.html")
      : path.join(rootDir, url.pathname);

    // Block traversal outside root
    if (!filePath.startsWith(rootDir + path.sep) && filePath !== rootDir) {
      return new Response("Forbidden", { status: 403 });
    }

    // Block dotfiles (.env, .git, etc.)
    const basename = path.basename(filePath);
    if (basename.startsWith(".")) {
      return new Response("Forbidden", { status: 403 });
    }

    const file = Bun.file(filePath);
    if (await file.exists()) {
      return new Response(file);
    }

    return new Response(Bun.file("404.html"), { status: 404 });

}


console.log("Database initialized.");

if (import.meta.main) {
  Bun.serve({
    port: 3000,
    fetch: handleRequest,
  });

  console.log("Server running at http://localhost:3000");
}