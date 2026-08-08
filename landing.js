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

  /* === BUY MODAL === */
  const modal = document.getElementById('buyModal');
  if (!modal) return;
  const form = document.getElementById('buyForm');
  const barInput = document.getElementById('buyBar');
  const emailInput = document.getElementById('buyEmail');
  const errorEl = document.getElementById('buyError');
  const submitBtn = document.getElementById('buySubmit');
  const T = isEN
    ? { invalid: 'Please check the form and try again.', net: 'Network error. Please try again.' }
    : { invalid: 'Bitte Formular prüfen und erneut versuchen.', net: 'Netzwerkfehler. Bitte erneut versuchen.' };

  function open() {
    errorEl.textContent = '';
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    setTimeout(() => barInput.focus(), 50);
  }
  function close() {
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
  }

  document.querySelectorAll('[data-buy]').forEach(btn => {
    btn.addEventListener('click', (e) => { e.preventDefault(); open(); });
  });
  document.querySelectorAll('[data-buy-close]').forEach(btn => {
    btn.addEventListener('click', (e) => { e.preventDefault(); close(); });
  });
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) close();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.textContent = '';

    if (!form.reportValidity()) {
      errorEl.textContent = T.invalid;
      return;
    }

    const payload = {
      bar: barInput.value.trim(),
      email: emailInput.value.trim(),
      locale: isEN ? 'en' : 'de',
    };

    submitBtn.disabled = true;
    const originalLabel = submitBtn.textContent;
    submitBtn.textContent = isEN ? 'Loading…' : 'Lade…';

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok || !data.url) {
        errorEl.textContent = data.error || T.net;
        return;
      }

      window.location.href = data.url;
    } catch (err) {
      errorEl.textContent = T.net;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
    }
  });
})();
