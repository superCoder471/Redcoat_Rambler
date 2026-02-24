async function loadBracketBanner() {
  try {
    const res = await fetch('/api/bracket');
    if (!res.ok) return;
    const bracket = await res.json();

    if (!bracket.is_visible) return;

    const banner = document.createElement('section');
    banner.className = 'bracket-banner teaser';

    const title = document.createElement('h3');
    title.textContent = bracket.title;
    banner.appendChild(title);

    if (bracket.data && bracket.data.rounds && bracket.data.rounds.length > 0) {
      // Determine which round to show
      let roundToShow = null;

      // If homepage_round is specified, try to find a round with that name
      if (bracket.data.homepage_round) {
        roundToShow = bracket.data.rounds.find(r => r.name === bracket.data.homepage_round);
      }

      // Fallback to the last round if not found or not specified
      if (!roundToShow) {
        roundToShow = bracket.data.rounds[bracket.data.rounds.length - 1];
      }

      const roundDiv = document.createElement('div');
      roundDiv.className = 'bracket-round';

      const roundHeader = document.createElement('h4');
      roundHeader.textContent = roundToShow.name;
      roundDiv.appendChild(roundHeader);

      // Show up to 3 matches
      const matchesToShow = roundToShow.matches.slice(0, 3);
      matchesToShow.forEach((match) => {
        const matchDiv = document.createElement('div');
        matchDiv.className = 'bracket-match';
        const team1 = match.team1 || '???';
        const team2 = match.team2 || '???';
        matchDiv.innerHTML = `
          <div class="teams">
            <span class="team">${escapeHTML(team1)}</span>
            <span class="vs">vs</span>
            <span class="team">${escapeHTML(team2)}</span>
          </div>
          ${match.winner ? `<div class="winner">Winner: ${escapeHTML(match.winner)}</div>` : ''}
        `;
        roundDiv.appendChild(matchDiv);
      });

      // If there are more matches, add ellipsis
      if (roundToShow.matches.length > 3) {
        const moreDiv = document.createElement('div');
        moreDiv.className = 'bracket-more';
        moreDiv.textContent = `... and ${roundToShow.matches.length - 3} more`;
        roundDiv.appendChild(moreDiv);
      }

      banner.appendChild(roundDiv);

      // Link to full bracket page
      const link = document.createElement('a');
      link.href = 'bracket.html';
      link.className = 'view-bracket-link';
      link.textContent = 'View Full Bracket →';
      banner.appendChild(link);
    }

    const storiesSection = document.querySelector('.stories');
    if (storiesSection) {
      storiesSection.parentNode.insertBefore(banner, storiesSection);
    }
  } catch (err) {
    console.error('Error loading bracket banner:', err);
  }
}

function escapeHTML(str) {
  if (!str) return '';
  const p = document.createElement('p');
  p.textContent = str;
  return p.innerHTML;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadBracketBanner);
} else {
  loadBracketBanner();
}