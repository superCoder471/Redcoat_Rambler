import { describe, test, expect, beforeEach, afterEach, mock } from "bun:test";

// Mock Quill globally before tests
global.Quill = class {
  constructor() {
    this.root = { innerHTML: '' };
  }
  setContents() {}
};

// Mock alert and confirm to avoid popups during tests
global.alert = mock(() => {});
global.confirm = mock(() => true); // always confirm for deletion tests

// Helper to set up DOM elements (must match admin.html)
function setupDOM() {
  document.body.innerHTML = `
    <div id="bracket-form">
      <input type="text" id="bracket-title" />
      <input type="checkbox" id="bracket-visible" />
      <input type="checkbox" id="json-toggle" />
      <div id="bracket-editor"></div>
      <div id="json-editor-container" style="display:none;">
        <textarea id="bracket-json"></textarea>
      </div>
      <button id="save-bracket"></button>
    </div>
    <div id="editor"></div>
    <div id="login-overlay" style="display:block;"></div>
    <input type="password" id="admin-pass" />
    <div id="admin-story-list"></div>
    <div id="submissions-list"></div>
    <button id="theme-toggle"></button>
    <form id="publish-form"></form>
  `;
}

// Read admin.js code once
const adminJsCode = await Bun.file("admin.js").text();

describe("Admin Panel Bracket Editor", () => {
  let fetchMock;
  let admin; // will hold __admin_test__ object

  beforeEach(() => {
    setupDOM();

    // Mock fetch globally
    fetchMock = mock((url, options) => {
      if (url === '/api/bracket' && options?.method === 'POST') {
        return Promise.resolve(new Response('OK', { status: 200 }));
      }
      if (url === '/api/bracket' && !options) {
        return Promise.resolve(new Response(JSON.stringify({
          title: 'Test Bracket',
          is_visible: 1,
          data: {
            homepage_round: null,
            rounds: [
              {
                name: 'Round 1',
                matches: [
                  { team1: 'Team A', team2: 'Team B', winner: null }
                ]
              }
            ]
          }
        }), { status: 200 }));
      }
      if (url === '/api/login' && options?.method === 'POST') {
        return Promise.resolve(new Response('Authorized', { status: 200, headers: { 'Set-Cookie': 'token' } }));
      }
      if (url === '/api/submissions' && !options) {
        return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
      }
      if (url === '/api/stories' && !options) {
        return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
      }
      // For any other fetch, return 404
      return Promise.resolve(new Response('Not Found', { status: 404 }));
    });
    global.fetch = fetchMock;

    // Set test environment flag so admin.js exposes internals
    process.env.NODE_ENV = 'test';

    // Execute admin.js in global scope
    new Function(adminJsCode)();

    // Get the exposed test helpers
    admin = globalThis.__admin_test__;
  });

  afterEach(() => {
    fetchMock.mockRestore();
    delete globalThis.__admin_test__;
    delete process.env.NODE_ENV;
  });

  test("loadBracketData fetches and populates form", async () => {
    await admin.loadBracketData();
    expect(document.getElementById('bracket-title').value).toBe('Test Bracket');
    expect(document.getElementById('bracket-visible').checked).toBe(true);
    expect(document.getElementById('bracket-editor').innerHTML).not.toBe('');
  });

  test("renderBracketEditor creates round cards and homepage dropdown", () => {
    // Set currentBracket manually using the setter
    admin.setCurrentBracket({
      title: 'Test',
      is_visible: 1,
      data: {
        homepage_round: null,
        rounds: [{ name: 'Round 1', matches: [] }]
      }
    });
    admin.renderBracketEditor();
    const editor = document.getElementById('bracket-editor');
    expect(editor.querySelector('#homepage-round')).toBeTruthy();
    expect(editor.querySelector('.round-card')).toBeTruthy();
  });

  test("team input updates currentBracket and winner dropdown options", () => {
    admin.setCurrentBracket({
      data: {
        rounds: [{
          name: 'Round 1',
          matches: [{ team1: 'A', team2: 'B', winner: 'A' }]
        }]
      }
    });
    admin.renderBracketEditor();
    const team1Input = document.querySelector('.match-row input[placeholder="Team 1"]');
    team1Input.value = 'Alpha';
    team1Input.dispatchEvent(new Event('input'));
    expect(admin.getCurrentBracket().data.rounds[0].matches[0].team1).toBe('Alpha');
    const winnerSelect = document.querySelector('.match-row select');
    expect(winnerSelect.options[1].textContent).toBe('Alpha');
    expect(winnerSelect.options[1].selected).toBe(false); // winner reset because old winner was 'A'
    expect(winnerSelect.options[0].selected).toBe(true);
  });

  test("saving bracket in visual mode sends correct payload", async () => {
    admin.setCurrentBracket({
      title: 'Test',
      is_visible: 1,
      data: {
        homepage_round: null,
        rounds: [{ name: 'Round 1', matches: [] }]
      }
    });
    admin.setEditorMode('visual');
    document.getElementById('bracket-title').value = 'New Title';
    document.getElementById('bracket-visible').checked = false;
    await document.getElementById('save-bracket').click();
    expect(fetchMock).toHaveBeenCalledWith('/api/bracket', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        title: 'New Title',
        data: admin.getCurrentBracket().data,
        is_visible: 0
      })
    }));
  });

  test("saving bracket in JSON mode validates and sends JSON", async () => {
    admin.setCurrentBracket({ data: {} });
    admin.setEditorMode('json');
    const jsonTextarea = document.getElementById('bracket-json');
    jsonTextarea.value = JSON.stringify({ rounds: [{ name: 'R1', matches: [] }] });
    document.getElementById('bracket-title').value = 'JSON Title';
    document.getElementById('bracket-visible').checked = true;
    await document.getElementById('save-bracket').click();
    expect(fetchMock).toHaveBeenCalledWith('/api/bracket', expect.objectContaining({
      method: 'POST',
      body: expect.stringContaining('"rounds"')
    }));
  });

  test("JSON toggle switches modes and validates", () => {
    admin.setCurrentBracket({
      data: {
        rounds: [{ name: 'R1', matches: [] }]
      }
    });
    admin.renderBracketEditor();
    const jsonToggle = document.getElementById('json-toggle');
    jsonToggle.checked = true;
    jsonToggle.dispatchEvent(new Event('change'));
    expect(document.getElementById('bracket-editor').style.display).toBe('none');
    expect(document.getElementById('json-editor-container').style.display).toBe('block');
    expect(document.getElementById('bracket-json').value).toBe(JSON.stringify(admin.getCurrentBracket().data, null, 2));
    // Switch back with invalid JSON
    document.getElementById('bracket-json').value = 'invalid';
    jsonToggle.checked = false;
    jsonToggle.dispatchEvent(new Event('change'));
    expect(jsonToggle.checked).toBe(true); // stays in JSON mode
  });

  test("login hides overlay and loads bracket data", async () => {
    document.getElementById('admin-pass').value = 'test';
    await admin.checkLogin();
    expect(document.getElementById('login-overlay').style.display).toBe('none');
    
    // Wait for bracket data to load asynchronously
    let bracket = null;
    for (let i = 0; i < 20; i++) {
        await new Promise(resolve => setTimeout(resolve, 10));
        bracket = admin.getCurrentBracket();
        if (bracket) break;
    }
    expect(bracket).toBeTruthy();
    expect(bracket.title).toBe('Test Bracket');
    });
});