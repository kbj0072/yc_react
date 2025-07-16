const btn = document.getElementById('theme-toggle');
const link = document.getElementById('prism-theme');
const root = document.documentElement;

let isDark = false;

btn.addEventListener('click', () => {
  isDark = !isDark;
  if (isDark) {
    link.href = 'https://cdn.jsdelivr.net/npm/prismjs/themes/prism-tomorrow.css';
    root.classList.add('dark');
    btn.textContent = '🌞 라이트 모드';
  } else {
    link.href = 'https://cdn.jsdelivr.net/npm/prismjs/themes/prism.css';
    root.classList.remove('dark');
    btn.textContent = '🌙 다크 모드';
  }
});
