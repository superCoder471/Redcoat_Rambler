// article-loader.js
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

    // Inject the data into the HTML
    document.title = `${story.title} – Redcoat Rambler`;
    document.getElementById('art-title').innerText = story.title;
    document.getElementById('art-dek').innerText = story.dek;
    document.getElementById('art-category').innerText = story.category;
    document.getElementById('art-date').innerText = story.date;
    document.getElementById('art-content').innerHTML = story.content;
}

loadFullStory();