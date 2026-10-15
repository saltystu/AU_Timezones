// Theme selection defaults to the operating system setting, supports live OS
// changes in System mode, and persists explicit user selections locally.
const controls = document.querySelectorAll('input[name="theme"]');
const systemPreference = window.matchMedia('(prefers-color-scheme: dark)');
const allowed = new Set(['system', 'light', 'dark']);
function currentChoice() {
  const mode = document.documentElement.dataset.themePreference;
  return allowed.has(mode) ? mode : 'system';
}
function renderTheme(mode) {
  document.documentElement.dataset.themePreference = mode;
  const effectiveTheme = mode === 'system' ? (systemPreference.matches ? 'dark' : 'light') : mode;
  document.documentElement.dataset.theme = effectiveTheme;
  document.querySelector('meta[name="theme-color"]').content = effectiveTheme === 'dark' ? '#0a101d' : '#f3f6fb';
  for (const control of controls) control.checked = control.value === mode;
}
for (const control of controls) {
  control.addEventListener('change', () => {
    if (!control.checked || !allowed.has(control.value)) return;
    renderTheme(control.value);
    try { localStorage.setItem('au-clock-theme', control.value); } catch { /* Optional. */ }
  });
}
systemPreference.addEventListener('change', () => {
  if (currentChoice() === 'system') renderTheme('system');
});
renderTheme(currentChoice());
