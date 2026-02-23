function escapeHTML(str) {
  if (!str) return "";
  const p = document.createElement('p');
  p.textContent = str;
  return p.innerHTML;
}
async function populateAuthors() {
    try {
        const response = await fetch("/api/authors");
        const authors = await response.json();
        const authSelect = document.getElementById('filter-author');
        
        authSelect.innerHTML = '<option value="">All Authors</option>';
        
        authors.forEach(author => {
            const option = document.createElement('option');
            option.value = author;
            option.textContent = author;
            authSelect.appendChild(option);
        });

        const params = new URLSearchParams(window.location.search);
        const authFilter = params.get('author');
        if (authFilter) authSelect.value = authFilter;

    } catch (err) {
        console.error("Failed to load authors:", err);
    }
}

async function loadArchive() {
    const params = new URLSearchParams(window.location.search);
    const catFilter = params.get('category') || "";
    const authFilter = params.get('author') || "";

    if(catFilter) document.getElementById('filter-category').value = catFilter;

    // Fetch stories with filters
    const response = await fetch(`/api/stories?category=${encodeURIComponent(catFilter)}&author=${encodeURIComponent(authFilter)}`);
    const stories = await response.json();
    
    const list = document.getElementById('archive-list');
    
    if (stories.length === 0) {
        list.innerHTML = `<p style="text-align:center; color:var(--text-muted); margin-top: 40px;">No stories found matching those filters.</p>`;
        return;
    }

    list.innerHTML = stories.map(s => `
        <a href="article.html?id=${s.id}" class="archive-item">
            <span class="archive-cat">${escapeHTML(s.category)}</span>
            <span class="archive-title">${escapeHTML(s.title)}</span>
            <span class="archive-date">${s.date} • By ${escapeHTML(s.author)}</span>
        </a>
    `).join('');
}

// Helper to update URL and refresh
function updateFilters() {
    const cat = document.getElementById('filter-category').value;
    const auth = document.getElementById('filter-author').value;
    window.location.href = `archive.html?category=${encodeURIComponent(cat)}&author=${encodeURIComponent(auth)}`;
}

// Listeners
document.getElementById('filter-category').addEventListener('change', updateFilters);
document.getElementById('filter-author').addEventListener('change', updateFilters);

// run the gosh darn thing and please work this time omg 
populateAuthors();
loadArchive();