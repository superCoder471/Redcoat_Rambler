function escapeHTML(str) {
  if (!str) return "";
  const p = document.createElement('p');
  p.textContent = str;
  return p.innerHTML;
}


async function loadFullStory() {
    const params = new URLSearchParams(window.location.search);
    const storyId = params.get('id');

    if (!storyId) {
        window.location.href = "index.html";
        return;
    }

    const response = await fetch(`/api/stories/${storyId}`);
    if (!response.ok) {
        document.getElementById('art-title').innerText = "Story Not Found";
        return;
    }

    const story = await response.json();

    // Inject data into HTML
    document.title = `${story.title} – Redcoat Rambler`;
document.getElementById('art-author').innerHTML = `By <a href="archive.html?author=${encodeURIComponent(story.author)}">${escapeHTML(story.author) || "Redcoat Staff"}</a>`;
    document.getElementById('art-title').innerText = story.title;
    document.getElementById('art-dek').innerText = story.dek;
document.getElementById('art-category').innerHTML = `<a href="archive.html?category=${encodeURIComponent(story.category)}">${escapeHTML(story.category)}</a>`;
    document.getElementById('art-date').innerText = story.date;

    const cleanContent = DOMPurify.sanitize(story.content);

document.getElementById('art-content').innerHTML = cleanContent;}

loadFullStory();
