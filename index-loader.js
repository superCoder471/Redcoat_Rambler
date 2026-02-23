function escapeHTML(str) {
  if (!str) return "";
  const p = document.createElement('p');
  p.textContent = str;
  return p.innerHTML;
}
async function fetchLatestStories() {
  try {
    // all stories endpoitn
    const response = await fetch("/api/stories");    
    const allStories = await response.json();
    const grid = document.querySelector(".story-grid");

    if (!grid) return;
    grid.innerHTML = "";

    const featuredStories = allStories.filter(story => story.featured === 1);

    if (featuredStories.length === 0) {
      grid.innerHTML = "<p>No featured stories yet.</p>";
      return;
    }

    featuredStories.forEach(story => {
      const card = document.createElement("a");
      card.href = `article.html?id=${story.id}`; 
      card.className = "story-card";
      
      card.innerHTML = `
        <div class="category-tag">${escapeHTML(story.category)}</div>
        <h4>${escapeHTML(story.title)}</h4>
        <p>${escapeHTML(story.dek)}</p>
        <span class="read-more">Read More →</span>
      `;
      grid.appendChild(card);
    });
    
  } catch (err) {
    console.error("Error loading stories:", err);
  }
}

fetchLatestStories();