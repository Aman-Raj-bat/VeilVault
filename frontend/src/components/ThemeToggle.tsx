type Props = {
  className?: string;
};

export default function ThemeToggle({ className = '' }: Props) {
  const isDark =
    document.documentElement.getAttribute('data-theme') !== 'light';

  function toggleTheme() {
    const root = document.documentElement;
    const current = root.getAttribute('data-theme');
    root.setAttribute('data-theme', current === 'light' ? 'dark' : 'light');
    localStorage.setItem('veilVault-theme', current === 'light' ? 'dark' : 'light');
  }

  return (
    <button
      id="theme-toggle-btn"
      onClick={toggleTheme}
      className={`theme-toggle ${className}`}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}
