/** The theme the server's HTML paints (the kit's default), so a page without JavaScript looks as it will once hydrated. */
export const SERVER_THEME = 'dark';

/**
 * Runs in <head> before the first paint: the stored theme's class on <html> in place of the server's default (so a
 * light theme never paints dark first) and the motion setting. It only ever writes the literal "dark" or "light": the
 * stored value is never written into the page.
 */
export const THEME_SCRIPT = `(function () {
  var root = document.documentElement;
  var media = function (query) { return typeof matchMedia === 'function' && matchMedia(query).matches; };
  try {
    var read = function (key) { var value = localStorage.getItem(key); return value ? JSON.parse(value) : null; };
    var theme = read('rsk-theme') || read('vite-ui-theme') || '${SERVER_THEME}';
    var dark = theme === 'system' ? media('(prefers-color-scheme: dark)') : theme !== 'light';
    root.classList.remove('dark', 'light');
    root.classList.add(dark ? 'dark' : 'light');
  } catch (error) {
    root.classList.remove('light');
    root.classList.add('dark');
  }
  root.dataset.motion = media('(prefers-reduced-motion: reduce)') ? 'reduced' : 'expressive';
})();`;
