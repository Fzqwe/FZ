const nav = document.querySelector('#main-nav');
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelectorAll('.nav-link');
const cursorGlow = document.querySelector('.cursor-glow');
const introLoader = document.querySelector('.intro-loader');
const pageShell = document.querySelector('.page-shell');
const steamState = document.querySelector('#steam-state');
const steamHours = document.querySelector('#rust-hours');
const steamUpdated = document.querySelector('#steam-updated');
const steamProgress = document.querySelector('#steam-progress');

window.addEventListener('load', () => {
  window.setTimeout(() => {
    introLoader.classList.add('is-hidden');
    pageShell.classList.add('is-ready');
  }, 1350);
});

const steamApiUrl = window.STEAM_RUST_API_URL || '/api/steam-rust';
const loadSteamHours = async () => {
  try {
    const response = await fetch(steamApiUrl, { headers: { Accept: 'application/json' } });
    const data = await response.json();
    if (!response.ok) throw new Error(data.code || `Steam API responded with ${response.status}`);
    if (!Number.isFinite(data.rustHours)) throw new Error('Invalid Rust hours payload');
    steamHours.textContent = Math.round(data.rustHours).toLocaleString('ru-RU');
    steamState.textContent = 'Данные профиля получены';
    steamUpdated.textContent = `обновлено ${new Date(data.updatedAt).toLocaleTimeString('ru-RU')}`;
    steamProgress.style.width = `${Math.min(100, Math.max(8, data.rustHours / 100))}%`;
  } catch (error) {
    steamState.textContent = error.message === 'missing_api_key'
      ? 'Ожидается настройка Steam API Key'
      : 'Не удалось получить данные Steam';
    steamUpdated.textContent = 'ошибка подключения';
    console.error('Steam Rust tracker error:', error);
  }
};
loadSteamHours();
window.setInterval(loadSteamHours, 60000);

menuToggle.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
});

navLinks.forEach((link) => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
  });
});

const sections = document.querySelectorAll('main section[id]');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      navLinks.forEach((link) => {
        link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
      });
    }
  });
}, { threshold: 0.4 });
sections.forEach((section) => observer.observe(section));

document.addEventListener('contextmenu', (event) => event.preventDefault());
document.addEventListener('selectstart', (event) => event.preventDefault());
document.addEventListener('dragstart', (event) => event.preventDefault());
document.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && ['c', 'u', 's', 'a'].includes(event.key.toLowerCase())) {
    event.preventDefault();
  }
  if (event.key === 'F12') event.preventDefault();
});

document.addEventListener('mousemove', (event) => {
  cursorGlow.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`;
});