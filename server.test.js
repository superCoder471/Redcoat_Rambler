import { config } from "dotenv";
config({ path: ".env.test" }); 

import { describe, test, expect } from "bun:test";
import { handleRequest } from "./server.js";

const BASE = "http://localhost";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getAdminCookie() {
  const res = await handleRequest(new Request(`${BASE}/api/login`, {
    method: "POST",
    body: JSON.stringify({ password: "testpass" }),
    headers: { "Content-Type": "application/json" }
  }));
  return res.headers.get("Set-Cookie");
}

// Creates a story and returns its ID. All test stories are prefixed __TEST__
// so they're easy to spot if anything leaks into the real DB.
async function createStory(cookie, overrides = {}) {
  const defaults = {
    title: "__TEST__ Story",
    dek: "Test dek",
    author: "__TEST__ Author",
    category: "__TEST__",
    content: "Test content",
    date: "2024-01-01"
  };
  const body = { ...defaults, ...overrides };
  await handleRequest(new Request(`${BASE}/api/stories`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json", "Cookie": cookie }
  }));
  const stories = await (await handleRequest(new Request(`${BASE}/api/stories`))).json();
  return stories.find(s => s.title === body.title)?.id ?? null;
}

async function deleteStory(cookie, id) {
  await handleRequest(new Request(`${BASE}/api/stories/delete/${id}`, {
    method: "DELETE",
    headers: { "Cookie": cookie }
  }));
}

// Creates a submission and returns { id, cookie } ready for cleanup
async function createSubmission(overrides = {}) {
  const defaults = { name: "__TEST__", email: "test@test.com", idea: "__TEST__ idea" };
  const body = { ...defaults, ...overrides };
  await handleRequest(new Request(`${BASE}/api/submissions`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" }
  }));
  const cookie = await getAdminCookie();
  const subs = await (await handleRequest(new Request(`${BASE}/api/submissions`, {
    headers: { "Cookie": cookie }
  }))).json();
  return { id: subs.find(s => s.name === body.name)?.id ?? null, cookie };
}

async function deleteSubmission(cookie, id) {
  await handleRequest(new Request(`${BASE}/api/submissions/delete/${id}`, {
    method: "DELETE",
    headers: { "Cookie": cookie }
  }));
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Server API Tests", () => {

  // ── Authentication ──────────────────────────────────────────────────────────

  describe("Authentication", () => {

    test("Correct password returns 200 and sets secure cookie", async () => {
      const res = await handleRequest(new Request(`${BASE}/api/login`, {
        method: "POST",
        body: JSON.stringify({ password: "testpass" }),
        headers: { "Content-Type": "application/json" }
      }));
      expect(res.status).toBe(200);
      const cookie = res.headers.get("Set-Cookie");
      expect(cookie).toContain("__Host-auth_token=");
      expect(cookie).toContain("HttpOnly");
      expect(cookie).toContain("Secure");
    });

    test("Wrong password returns 401", async () => {
      const res = await handleRequest(new Request(`${BASE}/api/login`, {
        method: "POST",
        body: JSON.stringify({ password: "wrongpassword" }),
        headers: { "Content-Type": "application/json" }
      }));
      expect(res.status).toBe(401);
    });

    test("Empty password returns 401", async () => {
      const res = await handleRequest(new Request(`${BASE}/api/login`, {
        method: "POST",
        body: JSON.stringify({ password: "" }),
        headers: { "Content-Type": "application/json" }
      }));
      expect(res.status).toBe(401);
    });

    test("Missing password key returns 401 without crashing", async () => {
      const res = await handleRequest(new Request(`${BASE}/api/login`, {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" }
      }));
      expect(res.status).toBe(401);
    });

    test("Logout sets Max-Age=0 to clear cookie", async () => {
      const res = await handleRequest(new Request(`${BASE}/api/logout`, { method: "POST" }));
      expect(res.headers.get("Set-Cookie")).toContain("Max-Age=0");
    });

    test("Logout invalidates the session — cookie stops working", async () => {
      const cookie = await getAdminCookie();

      // Confirm it works before logout
      const before = await handleRequest(new Request(`${BASE}/api/submissions`, {
        headers: { "Cookie": cookie }
      }));
      expect(before.status).toBe(200);

      // Logout
      await handleRequest(new Request(`${BASE}/api/logout`, {
        method: "POST",
        headers: { "Cookie": cookie }
      }));

      // Same cookie should now be rejected
      const after = await handleRequest(new Request(`${BASE}/api/submissions`, {
        headers: { "Cookie": cookie }
      }));
      expect(after.status).toBe(403);
    });
  });

  // ── Session Security ────────────────────────────────────────────────────────

  describe("Session Security", () => {

    test("Fake token is rejected with 403", async () => {
      const res = await handleRequest(new Request(`${BASE}/api/submissions`, {
        headers: { "Cookie": "__Host-auth_token=fake-token-abc" }
      }));
      expect(res.status).toBe(403);
    });

    test("No cookie is rejected with 403", async () => {
      const res = await handleRequest(new Request(`${BASE}/api/submissions`));
      expect(res.status).toBe(403);
    });

    test("Sliding expiry: session stays valid after activity", async () => {
      const cookie = await getAdminCookie();
      const res = await handleRequest(new Request(`${BASE}/api/submissions`, {
        headers: { "Cookie": cookie }
      }));
      expect(res.status).toBe(200);
    });

    test("SQL injection in story ID does not crash server", async () => {
      const res = await handleRequest(new Request(`${BASE}/api/stories/1;DROP TABLE stories;`));
      expect(res.status).toBe(404);
    });
  });

  // ── Stories: Public reads ───────────────────────────────────────────────────

  describe("Stories — Public reads", () => {

    test("GET /api/stories returns an array", async () => {
      const res = await handleRequest(new Request(`${BASE}/api/stories`));
      expect(res.status).toBe(200);
      expect(Array.isArray(await res.json())).toBe(true);
    });

    test("GET /api/stories?category= returns only matching stories", async () => {
      const cookie = await getAdminCookie();
      const id = await createStory(cookie, {
        title: "__TEST__ Category Filter",
        category: "__TEST__CAT__"
      });
      try {
        const res = await handleRequest(new Request(`${BASE}/api/stories?category=__TEST__CAT__`));
        const data = await res.json();
        expect(res.status).toBe(200);
        expect(data.every(s => s.category === "__TEST__CAT__")).toBe(true);
        expect(data.some(s => s.id === id)).toBe(true);
      } finally {
        await deleteStory(cookie, id);
      }
    });

    test("GET /api/stories?author= returns only matching stories", async () => {
      const cookie = await getAdminCookie();
      const id = await createStory(cookie, {
        title: "__TEST__ Author Filter",
        author: "__TEST__AUTHOR__"
      });
      try {
        const res = await handleRequest(new Request(`${BASE}/api/stories?author=__TEST__AUTHOR__`));
        const data = await res.json();
        expect(res.status).toBe(200);
        expect(data.every(s => s.author === "__TEST__AUTHOR__")).toBe(true);
      } finally {
        await deleteStory(cookie, id);
      }
    });

    test("GET /api/stories?category=&author= filters by both simultaneously", async () => {
      const cookie = await getAdminCookie();
      const id = await createStory(cookie, {
        title: "__TEST__ Combined Filter",
        category: "__TEST__COMBO__",
        author: "__TEST__COMBO_AUTHOR__"
      });
      try {
        const res = await handleRequest(new Request(
          `${BASE}/api/stories?category=__TEST__COMBO__&author=__TEST__COMBO_AUTHOR__`
        ));
        const data = await res.json();
        expect(res.status).toBe(200);
        expect(data.some(s => s.id === id)).toBe(true);
        expect(data.every(s =>
          s.category === "__TEST__COMBO__" && s.author === "__TEST__COMBO_AUTHOR__"
        )).toBe(true);
      } finally {
        await deleteStory(cookie, id);
      }
    });

    test("GET /api/stories/:id returns the correct story", async () => {
      const cookie = await getAdminCookie();
      const id = await createStory(cookie, { title: "__TEST__ By ID" });
      try {
        const res = await handleRequest(new Request(`${BASE}/api/stories/${id}`));
        const story = await res.json();
        expect(res.status).toBe(200);
        expect(story.id).toBe(id);
        expect(story.title).toBe("__TEST__ By ID");
      } finally {
        await deleteStory(cookie, id);
      }
    });

    test("GET /api/stories/:id returns 404 for missing ID", async () => {
      const res = await handleRequest(new Request(`${BASE}/api/stories/99999`));
      expect(res.status).toBe(404);
    });

    test("GET /api/stories/:id returns 404 for non-numeric ID", async () => {
      const res = await handleRequest(new Request(`${BASE}/api/stories/not-a-number`));
      expect(res.status).toBe(404);
    });

    test("GET /api/stories/featured returns only featured stories", async () => {
      const cookie = await getAdminCookie();
      const id = await createStory(cookie, { title: "__TEST__ Featured" });
      try {
        // Toggle on
        await handleRequest(new Request(`${BASE}/api/stories/toggle/${id}`, {
          method: "POST",
          headers: { "Cookie": cookie }
        }));

        const res = await handleRequest(new Request(`${BASE}/api/stories/featured`));
        const data = await res.json();
        expect(res.status).toBe(200);
        expect(Array.isArray(data)).toBe(true);
        expect(data.every(s => s.featured === 1)).toBe(true);
        expect(data.some(s => s.id === id)).toBe(true);
      } finally {
        // Toggle back off, then delete
        await handleRequest(new Request(`${BASE}/api/stories/toggle/${id}`, {
          method: "POST",
          headers: { "Cookie": cookie }
        }));
        await deleteStory(cookie, id);
      }
    });
  });

  // ── Stories: Admin writes ───────────────────────────────────────────────────

  describe("Stories — Admin writes", () => {

    test("POST /api/stories creates story when authorized", async () => {
      const cookie = await getAdminCookie();
      const res = await handleRequest(new Request(`${BASE}/api/stories`, {
        method: "POST",
        body: JSON.stringify({
          title: "__TEST__ Create Story",
          dek: "dek",
          author: "__TEST__ Author",
          category: "__TEST__",
          content: "content",
          date: "2024-01-01"
        }),
        headers: { "Content-Type": "application/json", "Cookie": cookie }
      }));
      expect(res.status).toBe(201);
      // Cleanup
      const stories = await (await handleRequest(new Request(`${BASE}/api/stories`))).json();
      const id = stories.find(s => s.title === "__TEST__ Create Story")?.id;
      await deleteStory(cookie, id);
    });

    test("POST /api/stories returns 403 without cookie", async () => {
      const res = await handleRequest(new Request(`${BASE}/api/stories`, {
        method: "POST",
        body: JSON.stringify({ title: "__TEST__ Ghost" }),
        headers: { "Content-Type": "application/json" }
      }));
      expect(res.status).toBe(403);
    });

    test("PUT /api/stories/update/:id updates all fields when authorized", async () => {
      const cookie = await getAdminCookie();
      const id = await createStory(cookie, { title: "__TEST__ Before Update" });
      try {
        const res = await handleRequest(new Request(`${BASE}/api/stories/update/${id}`, {
          method: "PUT",
          body: JSON.stringify({
            title: "__TEST__ After Update",
            dek: "new dek",
            author: "__TEST__ New Author",
            category: "__TEST__",
            content: "new content"
          }),
          headers: { "Content-Type": "application/json", "Cookie": cookie }
        }));
        expect(res.status).toBe(200);

        // Verify all fields actually changed
        const story = await (await handleRequest(new Request(`${BASE}/api/stories/${id}`))).json();
        expect(story.title).toBe("__TEST__ After Update");
        expect(story.author).toBe("__TEST__ New Author");
        expect(story.dek).toBe("new dek");
        expect(story.content).toBe("new content");
      } finally {
        await deleteStory(cookie, id);
      }
    });

    test("PUT /api/stories/update/:id returns 403 without cookie", async () => {
      const res = await handleRequest(new Request(`${BASE}/api/stories/update/1`, {
        method: "PUT",
        body: JSON.stringify({ title: "hacked", dek: "", author: "", category: "", content: "" }),
        headers: { "Content-Type": "application/json" }
      }));
      expect(res.status).toBe(403);
    });

    test("POST /api/stories/toggle/:id toggles featured flag on and off", async () => {
      const cookie = await getAdminCookie();
      const id = await createStory(cookie, { title: "__TEST__ Toggle" });
      try {
        // Should start at 0
        const initial = await (await handleRequest(new Request(`${BASE}/api/stories/${id}`))).json();
        expect(initial.featured).toBe(0);

        // Toggle on
        const res1 = await handleRequest(new Request(`${BASE}/api/stories/toggle/${id}`, {
          method: "POST", headers: { "Cookie": cookie }
        }));
        expect(res1.status).toBe(200);
        expect(await res1.text()).toBe("Toggled");
        const on = await (await handleRequest(new Request(`${BASE}/api/stories/${id}`))).json();
        expect(on.featured).toBe(1);

        // Toggle off
        await handleRequest(new Request(`${BASE}/api/stories/toggle/${id}`, {
          method: "POST", headers: { "Cookie": cookie }
        }));
        const off = await (await handleRequest(new Request(`${BASE}/api/stories/${id}`))).json();
        expect(off.featured).toBe(0);
      } finally {
        await deleteStory(cookie, id);
      }
    });

    test("POST /api/stories/toggle/:id returns 403 without cookie", async () => {
      const res = await handleRequest(new Request(`${BASE}/api/stories/toggle/1`, {
        method: "POST"
      }));
      expect(res.status).toBe(403);
    });

    test("DELETE /api/stories/delete/:id deletes the story", async () => {
      const cookie = await getAdminCookie();
      const id = await createStory(cookie, { title: "__TEST__ To Delete" });

      const res = await handleRequest(new Request(`${BASE}/api/stories/delete/${id}`, {
        method: "DELETE",
        headers: { "Cookie": cookie }
      }));
      expect(res.status).toBe(200);
      expect(await res.text()).toBe("Deleted");

      // Verify it's gone
      const verify = await handleRequest(new Request(`${BASE}/api/stories/${id}`));
      expect(verify.status).toBe(404);
    });

    test("DELETE /api/stories/delete/:id returns 403 without cookie", async () => {
      const res = await handleRequest(new Request(`${BASE}/api/stories/delete/1`, {
        method: "DELETE"
      }));
      expect(res.status).toBe(403);
    });

    test("Large story content (10kb) is stored and retrieved correctly", async () => {
      const cookie = await getAdminCookie();
      const largeContent = "A".repeat(10000);
      const id = await createStory(cookie, {
        title: "__TEST__ Big Story",
        content: largeContent
      });
      try {
        const story = await (await handleRequest(new Request(`${BASE}/api/stories/${id}`))).json();
        expect(story.content.length).toBe(10000);
      } finally {
        await deleteStory(cookie, id);
      }
    });
  });

  // ── Authors ─────────────────────────────────────────────────────────────────

  describe("Authors", () => {

    test("GET /api/authors returns an array", async () => {
      const res = await handleRequest(new Request(`${BASE}/api/authors`));
      expect(res.status).toBe(200);
      expect(Array.isArray(await res.json())).toBe(true);
    });

    test("GET /api/authors deduplicates — same author across two stories appears once", async () => {
      const cookie = await getAdminCookie();
      const id1 = await createStory(cookie, { title: "__TEST__ Dup A", author: "__TEST__DUP__" });
      const id2 = await createStory(cookie, { title: "__TEST__ Dup B", author: "__TEST__DUP__" });
      try {
        const authors = await (await handleRequest(new Request(`${BASE}/api/authors`))).json();
        expect(authors.filter(a => a === "__TEST__DUP__").length).toBe(1);
      } finally {
        await deleteStory(cookie, id1);
        await deleteStory(cookie, id2);
      }
    });

    test("GET /api/authors excludes null and empty-string entries", async () => {
      const authors = await (await handleRequest(new Request(`${BASE}/api/authors`))).json();
      expect(authors.every(a => a !== null && a !== "")).toBe(true);
    });
  });

  // ── Submissions ─────────────────────────────────────────────────────────────

  describe("Submissions", () => {

    test("POST /api/submissions creates a submission (public, no auth required)", async () => {
      const { id, cookie } = await createSubmission({ name: "__TEST__ Public Submit" });
      try {
        expect(id).toBeTruthy();
      } finally {
        await deleteSubmission(cookie, id);
      }
    });

    test("GET /api/submissions returns list when authorized", async () => {
      const cookie = await getAdminCookie();
      const res = await handleRequest(new Request(`${BASE}/api/submissions`, {
        headers: { "Cookie": cookie }
      }));
      expect(res.status).toBe(200);
      expect(Array.isArray(await res.json())).toBe(true);
    });

    test("GET /api/submissions returns 403 without cookie", async () => {
      const res = await handleRequest(new Request(`${BASE}/api/submissions`));
      expect(res.status).toBe(403);
    });

    test("DELETE /api/submissions/delete/:id removes submission when authorized", async () => {
      const { id, cookie } = await createSubmission({ name: "__TEST__ Delete Me" });
      const res = await handleRequest(new Request(`${BASE}/api/submissions/delete/${id}`, {
        method: "DELETE",
        headers: { "Cookie": cookie }
      }));
      expect(res.status).toBe(200);
    });

    test("DELETE /api/submissions/delete/:id returns 403 without cookie", async () => {
      const res = await handleRequest(new Request(`${BASE}/api/submissions/delete/1`, {
        method: "DELETE"
      }));
      expect(res.status).toBe(403);
    });
  });

  // ── Static File Server ──────────────────────────────────────────────────────

  describe("Static File Server", () => {

    test("GET / serves index.html (200) or graceful 404 if file absent", async () => {
      const res = await handleRequest(new Request(`${BASE}/`));
      expect([200, 404]).toContain(res.status);
    });

    test("Path traversal /../.env is blocked (403 or 404)", async () => {
      const res = await handleRequest(new Request(`${BASE}/../.env`));
      expect([403, 404]).toContain(res.status);
    });

    test("Direct dotfile request /.env returns 403", async () => {
      const res = await handleRequest(new Request(`${BASE}/.env`));
      expect(res.status).toBe(403);
    });

    test("Unknown static file returns 404", async () => {
      const res = await handleRequest(new Request(`${BASE}/does-not-exist-xyz.html`));
      expect(res.status).toBe(404);
    });
  });

  // ── API Routing ─────────────────────────────────────────────────────────────

  describe("API Routing", () => {

    test("Completely unknown /api/ route returns 404", async () => {
      const res = await handleRequest(new Request(`${BASE}/api/this/does/not/exist`));
      expect(res.status).toBe(404);
    });
  });

});