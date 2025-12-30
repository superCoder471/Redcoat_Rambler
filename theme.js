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

// --- NEW MOBILE MENU LOGIC ---
const menuToggle = document.getElementById('mobile-menu-btn');
const navMenu = document.querySelector('nav');

if (menuToggle) {
  menuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    
    // Optional: Animate hamburger to X
    const spans = menuToggle.querySelectorAll('span');
    spans.forEach(span => span.classList.toggle('open'));
  });
}