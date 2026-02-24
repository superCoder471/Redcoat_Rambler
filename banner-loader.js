// banner-loader.js
async function loadBracketBanner() {
  try {
    const res = await fetch('/api/bracket');
    if (!res.ok) return;
    const bracket = await res.json();

    // Only show if visible
    if (!bracket.is_visible) return;

    const banner = document.createElement('section');
    banner.className = 'bracket-banner';

    const title = document.createElement('h3');
    title.textContent = bracket.title;
    banner.appendChild(title);

    // Create a simple representation
    if (bracket.data && bracket.data.rounds) {
      bracket.data.rounds.forEach((round, rIndex) => {
        const roundDiv = document.createElement('div');
        roundDiv.className = 'bracket-round';
        roundDiv.innerHTML = `<h4>${round.name}</h4>`;

        round.matches.forEach((match, mIndex) => {
          const matchDiv = document.createElement('div');
          matchDiv.className = 'bracket-match';
          const team1 = match.team1 || '???';
          const team2 = match.team2 || '???';
          const winner = match.winner ? ` → Winner: ${match.winner}` : '';
          matchDiv.innerHTML = `<span>${team1} vs ${team2}${winner}</span>`;
          roundDiv.appendChild(matchDiv);
        });

        banner.appendChild(roundDiv);
      });
    }

    // Insert above the stories section
    const storiesSection = document.querySelector('.stories');
    if (storiesSection) {
        
      storiesSection.parentNode.insertBefore(banner, storiesSection);
    }
  } catch (err) {
    console.error('Error loading bracket banner:', err);
  }
}

// Execute when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadBracketBanner);
} else {
  loadBracketBanner();
}