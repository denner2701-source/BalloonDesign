(() => {
  const key = 'balloon-design-theme';
  const button = $('#theme-toggle');
  const apply = theme => {
    const dark = theme === 'dark';
    document.body.classList.toggle('dark-mode', dark);
    button.textContent = dark ? '☀' : '☾';
    button.setAttribute('aria-label', dark ? 'Ativar modo claro' : 'Ativar modo escuro');
    localStorage.setItem(key, dark ? 'dark' : 'light');
  };
  const saved = localStorage.getItem(key);
  apply(saved || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  button.addEventListener('click', () => apply(document.body.classList.contains('dark-mode') ? 'light' : 'dark'));
})();
