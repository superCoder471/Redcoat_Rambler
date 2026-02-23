import { describe, test, expect, beforeEach } from "bun:test";

// ─── escapeHTML ───────────────────────────────────────────────────────────────
// Copied from the loader files — pure function, tested in isolation.
// If you ever change the implementation in the loader files, update this too.

function escapeHTML(str) {
  if (!str) return "";
  const p = document.createElement('p');
  p.textContent = str;
  return p.innerHTML;
}

describe("escapeHTML", () => {

  test("returns empty string for null", () => {
    expect(escapeHTML(null)).toBe("");
  });

  test("returns empty string for undefined", () => {
    expect(escapeHTML(undefined)).toBe("");
  });

  test("returns empty string for empty string", () => {
    expect(escapeHTML("")).toBe("");
  });

  test("leaves plain text unchanged", () => {
    expect(escapeHTML("Hello world")).toBe("Hello world");
  });

  test("escapes < and >", () => {
    expect(escapeHTML("<script>")).toBe("&lt;script&gt;");
  });

  test("escapes a full script tag", () => {
    expect(escapeHTML("<script>alert('xss')</script>")).not.toContain("<script>");
  });

  test("escapes ampersands", () => {
    expect(escapeHTML("cats & dogs")).toBe("cats &amp; dogs");
  });

  test("handles a string with multiple special characters", () => {
    const result = escapeHTML('<a href="test">link & more</a>');
    expect(result).not.toContain("<a");
    expect(result).not.toContain("</a>");
    expect(result).toContain("&amp;");
  });

  test("handles numbers coerced to strings", () => {
    expect(escapeHTML("42")).toBe("42");
  });
});


// ─── Theme Toggle ─────────────────────────────────────────────────────────────
// Tests the core toggle logic from theme.js without importing the file directly
// (it has side effects on load). We test the logic as a function instead.

function applyTheme(current) {
  const newTheme = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
  return newTheme;
}

function loadSavedTheme() {
  const saved = localStorage.getItem("theme") || "dark";
  document.documentElement.setAttribute("data-theme", saved);
  return saved;
}

describe("Theme toggle", () => {

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  test("defaults to dark when nothing is saved", () => {
    const theme = loadSavedTheme();
    expect(theme).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  test("loads saved light theme from localStorage", () => {
    localStorage.setItem("theme", "light");
    const theme = loadSavedTheme();
    expect(theme).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  test("loads saved dark theme from localStorage", () => {
    localStorage.setItem("theme", "dark");
    const theme = loadSavedTheme();
    expect(theme).toBe("dark");
  });

  test("toggles from dark to light", () => {
    const newTheme = applyTheme("dark");
    expect(newTheme).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(localStorage.getItem("theme")).toBe("light");
  });

  test("toggles from light to dark", () => {
    const newTheme = applyTheme("light");
    expect(newTheme).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  test("toggle persists to localStorage", () => {
    applyTheme("dark");
    expect(localStorage.getItem("theme")).toBe("light");
    applyTheme("light");
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  test("two toggles returns to original theme", () => {
    applyTheme("dark");  // → light
    applyTheme("light"); // → dark
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });
});