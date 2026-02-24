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

function escapeHTML(str) {
  const p = document.createElement('p');
  p.textContent = str;
  return p.innerHTML;
}


// Load bracket data into the form
async function loadBracket() {
  const res = await fetch("/api/bracket");
  if (!res.ok) {
    console.error("Failed to load bracket");
    return;
  }
  const bracket = await res.json();
  document.getElementById('bracket-title').value = bracket.title || '';
  document.getElementById('bracket-visible').checked = bracket.is_visible === 1;
  document.getElementById('bracket-data').value = JSON.stringify(bracket.data, null, 2); // pretty print
}

// Save bracket data
document.getElementById('save-bracket').addEventListener('click', async () => {
  const title = document.getElementById('bracket-title').value.trim();
  const is_visible = document.getElementById('bracket-visible').checked ? 1 : 0;
  let data;
  try {
    data = JSON.parse(document.getElementById('bracket-data').value);
  } catch (e) {
    alert("Invalid JSON in bracket data");
    return;
  }

  const payload = { title, data, is_visible };

  const res = await fetch("/api/bracket", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    alert("✅ Bracket saved!");
    // Optionally reload to show updated data
    loadBracket();
  } else {
    const err = await res.text();
    alert("❌ Error: " + err);
  }
});


const publishForm = document.getElementById('publish-form');

// publishForm.addEventListener('submit', async (e) => {
//   e.preventDefault();

//     const newStory = {
//       title: document.getElementById('post-title').value,
//       dek: document.getElementById('post-dek').value,
//       author: document.getElementById('post-author').value, // Add this line
//       category: document.getElementById('post-category').value,
//       content: quill.root.innerHTML,
//       date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
//     };

//   try {
//     const response = await fetch("/api/stories", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(newStory)
//     });

//     if (response.ok) {
//       alert("🚀 Story Published to the Database!");
//       publishForm.reset();
//       quill.setContents([]); 
//     }
//   } catch (error) {
//     console.error("Upload failed:", error);
//   }
// });

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
    await loadAdminList(); // Refresh the list to show the new star status
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

// Check password on the backend
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
    loadBracket();
  } else {
    alert("Incorrect password!");
  }
};

async function loadSubmissions() {
  const response = await fetch("/api/submissions");
  const subs = await response.json();
  const list = document.getElementById("submissions-list");
  
  // ADDED THE DELETE BUTTON TO THE HTML STRING BELOW
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

loadAdminList(); // Run on page load
// --- THEME TOGGLE LOGIC ---
const themeBtn = document.getElementById('theme-toggle');
const currentTheme = localStorage.getItem('theme') || 'dark';

// Set initial theme
document.documentElement.setAttribute('data-theme', currentTheme);
themeBtn.innerText = currentTheme === 'dark' ? '🌙' : '☀️';

themeBtn.addEventListener('click', () => {
    const theme = document.documentElement.getAttribute('data-theme');
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    themeBtn.innerText = newTheme === 'dark' ? '🌙' : '☀️';
});


// DELETE SUBMISSION
window.deleteSubmission = async (id) => {
  if (confirm("Delete this suggestion?")) {
    const res = await fetch(`/api/submissions/delete/${id}`, { method: "DELETE" });
    if (res.ok) loadSubmissions();
  }
};

// EDIT STORY LOGIC
let editingStoryId = null;

window.editStory = async (id) => {
  const response = await fetch(`/api/stories/${id}`);
  const story = await response.json();
  
  // Fill the form with existing data
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

