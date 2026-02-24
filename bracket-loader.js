// bracket-loader.js
async function loadFullBracket() {
  try {
    const res = await fetch('/api/bracket');
    if (!res.ok) return;
    const bracket = await res.json();

    if (!bracket.is_visible) {
      document.getElementById('full-bracket').innerHTML = '<p>No active bracket.</p>';
      return;
    }

    const container = document.getElementById('full-bracket');
    container.innerHTML = ''; // clear any placeholder

    const title = document.createElement('h2');
    title.textContent = bracket.title;
    container.appendChild(title);

    if (bracket.data && bracket.data.rounds && bracket.data.rounds.length > 0) {
      const grid = document.createElement('div');
      grid.className = 'bracket-grid';
      const roundCount = bracket.data.rounds.length;
      grid.style.gridTemplateColumns = `repeat(${roundCount}, minmax(240px, 1fr))`;

      bracket.data.rounds.forEach((round) => {
        const roundCol = document.createElement('div');
        roundCol.className = 'bracket-round';

        const roundHeader = document.createElement('h4');
        roundHeader.textContent = round.name;
        roundCol.appendChild(roundHeader);

        round.matches.forEach((match) => {
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
          roundCol.appendChild(matchDiv);
        });

        grid.appendChild(roundCol);
      });

      container.appendChild(grid);
    }
  } catch (err) {
    console.error('Error loading full bracket:', err);
  }
}

function escapeHTML(str) {
  if (!str) return '';
  const p = document.createElement('p');
  p.textContent = str;
  return p.innerHTML;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadFullBracket);
} else {
  loadFullBracket();
}