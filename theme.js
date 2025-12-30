const toggleButton = document.getElementById('theme-toggle');
const root = document.documentElement;

// Apply saved theme on load
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  root.setAttribute('data-theme', savedTheme);
  toggleButton.textContent = savedTheme === 'light' ? '☀️' : '🌙';
}

// Toggle theme
toggleButton.addEventListener('click', () => {
  const current = root.getAttribute('data-theme');
  if (current === 'light') {
    root.setAttribute('data-theme', 'dark');
    toggleButton.textContent = '🌙';
    localStorage.setItem('theme', 'dark');
  } else {
    root.setAttribute('data-theme', 'light');
    toggleButton.textContent = '☀️';
    localStorage.setItem('theme', 'light');
  }
});
