// admin.js
// admin.js (at the top)
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

const publishForm = document.getElementById('publish-form');

publishForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const newStory = {
    title: document.getElementById('post-title').value,
    dek: document.getElementById('post-dek').value,
    category: document.getElementById('post-category').value,
    content: quill.root.innerHTML, // The HTML from the editor
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  };

  try {
    const response = await fetch("/api/stories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newStory)
    });

    if (response.ok) {
      alert("🚀 Story Published to the Database!");
      publishForm.reset();
      quill.setContents([]); 
    }
  } catch (error) {
    console.error("Upload failed:", error);
  }
});

async function loadAdminList() {
  const response = await fetch("/api/stories");
  const stories = await response.json();
  const list = document.getElementById("admin-story-list");
  list.innerHTML = "";

  stories.forEach(s => {
    const div = document.createElement("div");
    div.className = "admin-item";
    div.innerHTML = `
      <span>${s.title} (${s.category})</span>
      <div class="admin-btns">
        <button class="btn-feat ${s.featured ? 'active' : ''}" onclick="toggleFeatured(${s.id})">
          ${s.featured ? '⭐ Unfeature' : '☆ Feature'}
        </button>
        <button class="btn-del" onclick="deleteStory(${s.id})">Delete</button>
      </div>
    `;
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

loadAdminList(); // Run on page load