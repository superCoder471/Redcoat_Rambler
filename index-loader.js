// index-loader.js
async function fetchLatestStories() {
  try {
    // We use the general "all stories" endpoint instead
    const response = await fetch("/api/stories");    
    const allStories = await response.json();
    const grid = document.querySelector(".story-grid");

    if (!grid) return;
    grid.innerHTML = "";

    // Filter the list in JavaScript instead of the API
    const featuredStories = allStories.filter(story => story.featured === 1);

    if (featuredStories.length === 0) {
      grid.innerHTML = "<p>No featured stories yet. Mark some as featured in Admin!</p>";
      return;
    }

    featuredStories.forEach(story => {
      const card = document.createElement("a");
      card.href = `article.html?id=${story.id}`; 
      card.className = "story-card";
      
      card.innerHTML = `
        <div class="category-tag">${story.category}</div>
        <h4>${story.title}</h4>
        <p>${story.dek}</p>
        <span class="read-more">Read More →</span>
      `;
      grid.appendChild(card);
    });
    
  } catch (err) {
    console.error("Error loading stories:", err);
  }
}

fetchLatestStories();