(() => {
  const LANG_KEY = 'bibelstundeLang';
  const isEN = location.pathname === '/en' || location.pathname.startsWith('/en/');
  const stored = (() => { try { return localStorage.getItem(LANG_KEY); } catch { return null; } })();

  if (!stored) {
    const prefersEN = (navigator.language || '').toLowerCase().startsWith('en');
    if (prefersEN && !isEN && location.pathname === '/') {
      location.replace('/en');
      return;
    }
  }

  try { localStorage.setItem(LANG_KEY, isEN ? 'en' : 'de'); } catch {}

  document.querySelectorAll('.lang a').forEach(a => {
    a.addEventListener('click', () => {
      try { localStorage.setItem(LANG_KEY, a.textContent.trim().toLowerCase()); } catch {}
    });
  });

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href').slice(1);
      const target = id && document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
})();
