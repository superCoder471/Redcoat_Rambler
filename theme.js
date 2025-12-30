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

window.addEventListener('scroll', () => {
  const progressBar = document.getElementById('progress-bar');
  if (progressBar) {
    // Calculate percentage: (current scroll / (total height - window height)) * 100
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    
    progressBar.style.width = scrolled + "%";
  }
});

//SHARE BUTTOIN
const shareBtn = document.getElementById('share-btn');

if (shareBtn) {
  shareBtn.addEventListener('click', async () => {
    const shareData = {
      title: document.title,
      text: 'Check out this story from the Redcoat Rambler!',
      url: window.location.href,
    };

    try {
      // Check if the browser supports native sharing
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: Copy to clipboard if sharing isn't supported
        await navigator.clipboard.writeText(window.location.href);
        shareBtn.innerHTML = '<span class="icon">✅</span> Link Copied';
        setTimeout(() => {
          shareBtn.innerHTML = '<span class="icon">🔗</span> Share Story';
        }, 2000);
      }
    } catch (err) {
      console.log('Error sharing:', err);
    }
  });
}