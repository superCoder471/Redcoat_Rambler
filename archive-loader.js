// archive-loader.js
async function loadArchive() {
  try {
    const response = await fetch("/api/stories");
    const stories = await response.json();
    const archiveList = document.querySelector(".archive-list");

    if (!archiveList) return;

    // Clear the placeholders
    archiveList.innerHTML = "";

    if (stories.length === 0) {
      archiveList.innerHTML = "<p>The archives are currently empty.</p>";
      return;
    }

    stories.forEach(story => {
      const item = document.createElement("a");
      item.href = `article.html?id=${story.id}`;
      item.className = "archive-item";
      
      item.innerHTML = `
        <div class="archive-meta">
          <span class="archive-date">${story.date}</span>
          <span class="archive-section">${story.category}</span>
        </div>
        <h3>${story.title}</h3>
        <p>${story.dek}</p>
        <span class="read-more">Read →</span>
      `;
      archiveList.appendChild(item);
    });
  } catch (err) {
    console.error("Archive load failed:", err);
  }
}

loadArchive();