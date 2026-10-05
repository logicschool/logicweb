/* Shared by Express and the browser. Physical CMS filenames remain unchanged. */
(function (scope) {
  'use strict';
  function canonicalPath(pathname) {
    if (pathname === '/') return '/';
    // Only public HTML page namespaces; never rewrite APIs, admin or media URLs.
    if (!/^\/(?:[a-z0-9-]+|(?:courses|blog|results)\/[a-z0-9-]+)(?:\.html)?\/?$/.test(pathname)) return null;
    if (/^\/(?:api|admin|assets|uploads|data|server|partials|node_modules|test|scripts|deploy)(?:[/.]|$)/.test(pathname)) return null;
    let clean = pathname.replace(/\/$/, '').replace(/\.html$/, '');
    if (clean === '/index') return '/';
    if (clean === '/courses/index') return '/courses';
    return clean;
  }
  function sourcePath(pathname) {
    const clean = canonicalPath(pathname);
    if (clean === '/') return '/index.html';
    if (clean === '/courses') return '/courses/index.html';
    return clean ? clean + '.html' : pathname;
  }
  function href(value, basePath = '/', origin = 'https://logic.invalid') {
    if (!value || /^(?:#|\?|mailto:|tel:|javascript:|data:)/i.test(value)) return value;
    try {
      const url = new URL(value, new URL(basePath, origin));
      if (url.origin !== new URL(origin).origin) return value;
      const clean = canonicalPath(url.pathname);
      // Root-relative resources also keep working when /courses/index.html becomes /courses.
      return (clean || url.pathname) + url.search + url.hash;
    } catch { return value; }
  }
  const api = { canonicalPath, sourcePath, href };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else scope.LogicPublicUrls = api;
})(typeof window === 'undefined' ? globalThis : window);
