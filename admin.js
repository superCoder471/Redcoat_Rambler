var quill = new Quill('#editor', {
  theme: 'snow',
  placeholder: 'Start writing your story here...',
  modules: {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline'],
      ['blockquote', 'link'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }]
    ]
  }
});
let editorMode = 'visual'; 
let currentBracket = null;

function escapeHTML(str) {
  const p = document.createElement('p');
  p.textContent = str;
  return p.innerHTML;
}

// Load bracket data into the form
async function loadBracketData() {
  const res = await fetch("/api/bracket");
  if (!res.ok) {
    console.error("Failed to load bracket");
    return;
  }
  currentBracket = await res.json();
  console.log("Bracket loaded:", currentBracket);
  
  document.getElementById('bracket-title').value = currentBracket.title || '';
  document.getElementById('bracket-visible').checked = currentBracket.is_visible === 1;
  
  renderBracketEditor();

  jsonToggle.checked = false;
  bracketEditorDiv.style.display = 'block';
  jsonContainer.style.display = 'none';
  editorMode = 'visual';
}

document.getElementById('bracket-title').addEventListener('input', (e) => {
  if (currentBracket) currentBracket.title = e.target.value;
});

document.getElementById('bracket-visible').addEventListener('change', (e) => {
  if (currentBracket) currentBracket.is_visible = e.target.checked ? 1 : 0;
});

function renderBracketEditor() {
  const editorDiv = document.getElementById('bracket-editor');
  editorDiv.innerHTML = ''; // clear previous content

  if (!currentBracket || !currentBracket.data || !currentBracket.data.rounds) {
    editorDiv.innerHTML = '<p class="error">No bracket data loaded.</p>';
    return;
  }

  // --- Homepage round dropdown ---
  const homepageDiv = document.createElement('div');
  homepageDiv.className = 'form-group';
  homepageDiv.innerHTML = `
    <label for="homepage-round">Round shown on homepage</label>
    <select id="homepage-round">
      <option value="">Last round (auto)</option>
      ${currentBracket.data.rounds.map((round, index) => 
        `<option value="${round.name}" ${currentBracket.data.homepage_round === round.name ? 'selected' : ''}>${round.name}</option>`
      ).join('')}
    </select>
    <small style="color: var(--text-muted);">Select which round appears in the homepage banner.</small>
  `;
  editorDiv.appendChild(homepageDiv);

  // --- Rounds container ---
  const roundsDiv = document.createElement('div');
  roundsDiv.className = 'rounds-container';
  roundsDiv.style.marginTop = '2rem';

  currentBracket.data.rounds.forEach((round, roundIndex) => {
    const roundCard = document.createElement('div');
    roundCard.className = 'round-card';
    roundCard.style.background = 'var(--bg-main)';
    roundCard.style.borderRadius = '12px';
    roundCard.style.padding = '1.5rem';
    roundCard.style.marginBottom = '1.5rem';
    roundCard.style.border = '1px solid oklch(100% 0 0 / 0.1)';

    // Round header with name input and delete button
    const headerDiv = document.createElement('div');
    headerDiv.style.display = 'flex';
    headerDiv.style.gap = '1rem';
    headerDiv.style.alignItems = 'center';
    headerDiv.style.marginBottom = '1rem';

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.value = round.name;
    nameInput.placeholder = 'Round name (e.g., Quarterfinals)';
    nameInput.style.flex = '1';
    nameInput.style.padding = '0.5rem';
    nameInput.style.borderRadius = '8px';
    nameInput.style.border = '1px solid oklch(100% 0 0 / 0.2)';
    nameInput.style.background = 'var(--bg-card)';
    nameInput.style.color = 'var(--text-main)';
    nameInput.dataset.roundIndex = roundIndex;
    nameInput.addEventListener('input', (e) => {
      currentBracket.data.rounds[roundIndex].name = e.target.value;
    });

    const deleteRoundBtn = document.createElement('button');
    deleteRoundBtn.textContent = 'Delete Round';
    deleteRoundBtn.className = 'btn-del';
    deleteRoundBtn.style.padding = '0.5rem 1rem';
    deleteRoundBtn.addEventListener('click', () => {
      if (confirm('Delete this round and all its matches?')) {
        currentBracket.data.rounds.splice(roundIndex, 1);
        renderBracketEditor(); // re-render
      }
    });

    headerDiv.appendChild(nameInput);
    headerDiv.appendChild(deleteRoundBtn);
    roundCard.appendChild(headerDiv);

    // --- Matches container ---
    const matchesDiv = document.createElement('div');
    matchesDiv.className = 'matches-container';
    matchesDiv.style.display = 'flex';
    matchesDiv.style.flexDirection = 'column';
    matchesDiv.style.gap = '1rem';

    round.matches.forEach((match, matchIndex) => {
      const matchRow = document.createElement('div');
      matchRow.className = 'match-row';
      matchRow.style.display = 'flex';
      matchRow.style.gap = '0.5rem';
      matchRow.style.alignItems = 'center';
      matchRow.style.background = 'var(--bg-card)';
      matchRow.style.padding = '0.75rem';
      matchRow.style.borderRadius = '8px';

      // Team 1 input
      const team1Input = document.createElement('input');
      team1Input.type = 'text';
      team1Input.value = match.team1 || '';
      team1Input.placeholder = 'Team 1';
      team1Input.style.flex = '1';
      team1Input.style.padding = '0.4rem';
      team1Input.dataset.roundIndex = roundIndex;
      team1Input.dataset.matchIndex = matchIndex;

      // Team 2 input
      const team2Input = document.createElement('input');
      team2Input.type = 'text';
      team2Input.value = match.team2 || '';
      team2Input.placeholder = 'Team 2';
      team2Input.style.flex = '1';
      team2Input.style.padding = '0.4rem';
      team2Input.dataset.roundIndex = roundIndex;
      team2Input.dataset.matchIndex = matchIndex;

      // Winner dropdown
      const winnerSelect = document.createElement('select');
      winnerSelect.style.padding = '0.4rem';
      winnerSelect.style.borderRadius = '6px';
      winnerSelect.style.background = 'var(--bg-main)';
      winnerSelect.style.color = 'var(--text-main)';
      winnerSelect.style.border = '1px solid oklch(100% 0 0 / 0.2)';

      const noneOption = document.createElement('option');
      noneOption.value = '';
      noneOption.textContent = 'No winner';
      winnerSelect.appendChild(noneOption);

      const team1Option = document.createElement('option');
      team1Option.value = match.team1 || '';
      team1Option.textContent = match.team1 || 'Team 1';
      winnerSelect.appendChild(team1Option);

      const team2Option = document.createElement('option');
      team2Option.value = match.team2 || '';
      team2Option.textContent = match.team2 || 'Team 2';
      winnerSelect.appendChild(team2Option);

      // Set selected value based on current winner
      if (match.winner === match.team1) {
        team1Option.selected = true;
      } else if (match.winner === match.team2) {
        team2Option.selected = true;
      } else {
        noneOption.selected = true;
      }

      // --- Team 1 input listener ---
      team1Input.addEventListener('input', (e) => {
        const oldTeam1 = match.team1;
        const newVal = e.target.value || null;
        match.team1 = newVal;

        const display = newVal || 'Team 1';
        team1Option.value = newVal || '';
        team1Option.textContent = display;

        if (match.winner === oldTeam1) {
          match.winner = null;
          noneOption.selected = true;
        }
      });

      // --- Team 2 input listener ---
      team2Input.addEventListener('input', (e) => {
        const oldTeam2 = match.team2;
        const newVal = e.target.value || null;
        match.team2 = newVal;

        const display = newVal || 'Team 2';
        team2Option.value = newVal || '';
        team2Option.textContent = display;

        if (match.winner === oldTeam2) {
          match.winner = null;
          noneOption.selected = true;
        }
      });

      // --- Winner dropdown change listener ---
      winnerSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === '') {
          match.winner = null;
        } else {
          match.winner = val;
        }
      });

      // Delete match button
      const deleteMatchBtn = document.createElement('button');
      deleteMatchBtn.textContent = '✕';
      deleteMatchBtn.className = 'btn-del';
      deleteMatchBtn.style.padding = '0.4rem 0.8rem';
      deleteMatchBtn.addEventListener('click', () => {
        if (confirm('Delete this match?')) {
          currentBracket.data.rounds[roundIndex].matches.splice(matchIndex, 1);
          renderBracketEditor();
        }
      });

      matchRow.appendChild(team1Input);
      matchRow.appendChild(team2Input);
      matchRow.appendChild(winnerSelect);
      matchRow.appendChild(deleteMatchBtn);
      matchesDiv.appendChild(matchRow);
    });

    roundCard.appendChild(matchesDiv);

    // Add match button for this round
    const addMatchBtn = document.createElement('button');
    addMatchBtn.textContent = 'Add Match';
    addMatchBtn.className = 'submit-btn';
    addMatchBtn.style.marginTop = '1rem';
    addMatchBtn.style.padding = '0.5rem 1rem';
    addMatchBtn.style.fontSize = '0.9rem';
    addMatchBtn.addEventListener('click', () => {
      currentBracket.data.rounds[roundIndex].matches.push({
        team1: null,
        team2: null,
        winner: null
      });
      renderBracketEditor();
    });
    roundCard.appendChild(addMatchBtn);

    roundsDiv.appendChild(roundCard);
  });

  editorDiv.appendChild(roundsDiv);

  // Add round button (global)
  const addRoundBtn = document.createElement('button');
  addRoundBtn.textContent = '+ Add Round';
  addRoundBtn.className = 'submit-btn';
  addRoundBtn.style.marginTop = '2rem';
  addRoundBtn.style.width = 'auto';
  addRoundBtn.addEventListener('click', () => {
    currentBracket.data.rounds.push({
      name: 'New Round',
      matches: []
    });
    renderBracketEditor();
  });
  editorDiv.appendChild(addRoundBtn);
}

const jsonToggle = document.getElementById('json-toggle');
const bracketEditorDiv = document.getElementById('bracket-editor');
const jsonContainer = document.getElementById('json-editor-container');
const jsonTextarea = document.getElementById('bracket-json');

jsonToggle.addEventListener('change', (e) => {
  if (e.target.checked) {
    // Switching to JSON mode
    jsonTextarea.value = JSON.stringify(currentBracket.data, null, 2);
    bracketEditorDiv.style.display = 'none';
    jsonContainer.style.display = 'block';
    editorMode = 'json';
  } else {
    // Switching to visual mode
    try {
      const newData = JSON.parse(jsonTextarea.value);
      if (!newData || typeof newData !== 'object' || !Array.isArray(newData.rounds)) {
        throw new Error('Invalid bracket data: must have a "rounds" array');
      }
      currentBracket.data = newData;
      renderBracketEditor();
      bracketEditorDiv.style.display = 'block';
      jsonContainer.style.display = 'none';
      editorMode = 'visual';
    } catch (err) {
      alert('Invalid JSON: ' + err.message);
      jsonToggle.checked = true;
    }
  }
});

document.getElementById('save-bracket').addEventListener('click', async () => {
  const title = document.getElementById('bracket-title').value.trim();
  const is_visible = document.getElementById('bracket-visible').checked ? 1 : 0;
  
  let data;
  if (editorMode === 'visual') {
    const homepageSelect = document.getElementById('homepage-round');
    if (homepageSelect) {
      const selected = homepageSelect.value;
      currentBracket.data.homepage_round = selected === '' ? null : selected;
    }
    data = currentBracket.data;
  } else {
    try {
      data = JSON.parse(jsonTextarea.value);
      if (!data || typeof data !== 'object' || !Array.isArray(data.rounds)) {
        throw new Error('Invalid JSON: must have a "rounds" array');
      }
    } catch (err) {
      alert('Invalid JSON: ' + err.message);
      return;
    }
  }

  const payload = { title, data, is_visible };

  try {
    const res = await fetch("/api/bracket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      alert("✅ Bracket saved!");
      await loadBracketData();
    } else {
      const err = await res.text();
      alert("❌ Error: " + err);
    }
  } catch (err) {
    alert("❌ Network error: " + err);
  }
});

const publishForm = document.getElementById('publish-form');

async function loadAdminList() {
  const response = await fetch("/api/stories");
  const stories = await response.json();
  const list = document.getElementById("admin-story-list");
  list.innerHTML = "";

  stories.forEach(s => {
    const div = document.createElement("div");
    div.className = "admin-item";
    
    div.innerHTML = `
      <span class="story-info"></span>
      <div class="admin-btns">
        <button class="btn-feat ${s.featured ? 'active' : ''}" onclick="toggleFeatured(${s.id})">
          ${s.featured ? '⭐ Unfeature' : '☆ Feature'}
        </button>
        <button class="btn-edit" onclick="editStory(${s.id})">Edit</button>
        <button class="btn-del" onclick="deleteStory(${s.id})">Delete</button>
      </div>
    `;
    
    div.querySelector('.story-info').textContent = `${s.title} (${s.category})`;
    list.appendChild(div);
  });
}

window.toggleFeatured = async (id) => {
  const response = await fetch(`/api/stories/toggle/${id}`, { method: "POST" });
  if (response.ok) {
    await loadAdminList();
  }
};

window.deleteStory = async (id) => {
  if (confirm("Are you sure you want to delete this story?")) {
    const response = await fetch(`/api/stories/delete/${id}`, { method: "DELETE" });
    if (response.ok) {
      await loadAdminList();
    }
  }
};

window.checkLogin = async () => {
  const password = document.getElementById('admin-pass').value;
  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" }, 
    body: JSON.stringify({ password })
  });

  if (res.ok) {
    document.getElementById('login-overlay').style.display = 'none';
    loadSubmissions(); 
    loadBracketData();
  } else {
    alert("Incorrect password!");
  }
};

async function loadSubmissions() {
  const response = await fetch("/api/submissions");
  const subs = await response.json();
  const list = document.getElementById("submissions-list");
  
  list.innerHTML = subs.map(s => `
    <div class="admin-item">
      <div>
        <strong>${escapeHTML(s.name)}</strong> (${escapeHTML(s.email)})<br>
        <p>${escapeHTML(s.idea)}</p>
        <small>${s.timestamp}</small>
      </div>
      <button class="btn-del" onclick="deleteSubmission(${s.id})">Delete</button> 
    </div>
  `).join('');
}

loadAdminList();

const themeBtn = document.getElementById('theme-toggle');
const currentTheme = localStorage.getItem('theme') || 'dark';

document.documentElement.setAttribute('data-theme', currentTheme);
themeBtn.innerText = currentTheme === 'dark' ? '🌙' : '☀️';

themeBtn.addEventListener('click', () => {
  const theme = document.documentElement.getAttribute('data-theme');
  const newTheme = theme === 'dark' ? 'light' : 'dark';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  themeBtn.innerText = newTheme === 'dark' ? '🌙' : '☀️';
});

window.deleteSubmission = async (id) => {
  if (confirm("Delete this suggestion?")) {
    const res = await fetch(`/api/submissions/delete/${id}`, { method: "DELETE" });
    if (res.ok) loadSubmissions();
  }
};

let editingStoryId = null;

window.editStory = async (id) => {
  const response = await fetch(`/api/stories/${id}`);
  const story = await response.json();
  
  document.getElementById('post-title').value = story.title;
  document.getElementById('post-dek').value = story.dek;
  document.getElementById('post-author').value = story.author;
  document.getElementById('post-category').value = story.category;
  quill.root.innerHTML = story.content;
  
  editingStoryId = id;
  
  document.querySelector('.submit-btn').innerText = "Update Story";
  window.scrollTo(0,0); 
};

publishForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const storyData = {
    title: document.getElementById('post-title').value,
    dek: document.getElementById('post-dek').value,
    author: document.getElementById('post-author').value,
    category: document.getElementById('post-category').value,
    content: quill.root.innerHTML,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  };

  const url = editingStoryId ? `/api/stories/update/${editingStoryId}` : "/api/stories";
  const method = editingStoryId ? "PUT" : "POST";

  const response = await fetch(url, {
    method: method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(storyData)
  });

  if (response.ok) {
    alert(editingStoryId ? "✅ Story Updated!" : "🚀 Story Published!");
    publishForm.reset();
    quill.setContents([]);
    editingStoryId = null;
    document.querySelector('.submit-btn').innerText = "Publish to Website";
    loadAdminList();
  } else {
    const errorText = await response.text();
    alert(`Error: ${errorText}`);
  }
});









//for testing

if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
  globalThis.__admin_test__ = {
    loadBracketData,
    renderBracketEditor,
    checkLogin,
    loadSubmissions,
    getCurrentBracket: () => currentBracket,
    setCurrentBracket: (val) => { currentBracket = val; },
    getEditorMode: () => editorMode,
    setEditorMode: (val) => { editorMode = val; },
    jsonToggle,
    bracketEditorDiv,
    jsonContainer,
    jsonTextarea,
    // Also expose DOM elements if needed
  };
}