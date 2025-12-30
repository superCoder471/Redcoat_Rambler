const toggleButton = document.getElementById('theme-toggle');
const root = document.documentElement;

// Apply saved theme on load
const savedTheme = localStorage.getItem('theme') || 'dark';
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
const menuBtn = document.getElementById('mobile-menu-btn');
const navMenu = document.querySelector('nav');

if (menuBtn) {
  menuBtn.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    menuBtn.classList.toggle('is-active');

    const spans = menuBtn.querySelectorAll('span');
    if (menuBtn.classList.contains('is-active')) {
      // Create the X
      spans[0].style.transform = 'rotate(45deg) translate(5px, 6px)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'rotate(-45deg) translate(5px, -6px)';
    } else {
      // Reset to Waffle
      spans[0].style.transform = 'none';
      spans[1].style.opacity = '1';
      spans[2].style.transform = 'none';
    }
  });
}