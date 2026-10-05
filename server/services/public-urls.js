const fs = require('fs');
const path = require('path');
const urls = require('../../assets/public-urls');

function exists(clean, root, cache) {
  if (clean.startsWith('/blog/')) return cache.blog_posts.some(p => p.slug === clean.slice(6) && p.status === 'published');
  if (clean.startsWith('/results/')) return cache.result_categories.some(c => c.id === clean.slice(9));
  try { return fs.statSync(path.join(root, urls.sourcePath(clean))).isFile(); } catch { return false; }
}
function redirects(root, cache) {
  return (req, res, next) => {
    if (!['GET', 'HEAD'].includes(req.method)) return next();
    const clean = urls.canonicalPath(req.path);
    if (!clean || clean === req.path || !exists(clean, root, cache)) return next();
    const queryAt = req.originalUrl.indexOf('?');
    // Preserve the raw query, including duplicates, +, % escapes and empty values.
    const suffix = queryAt < 0 ? '' : req.originalUrl.slice(queryAt);
    return res.redirect(301, clean + suffix);
  };
}
function paths(root, cache) {
  const pages = fs.readdirSync(root).filter(p => p.endsWith('.html') && !['404.html', 'thank-you.html'].includes(p)).map(p => urls.canonicalPath('/' + p));
  pages.push(...fs.readdirSync(path.join(root, 'courses')).filter(p => p.endsWith('.html')).map(p => urls.canonicalPath('/courses/' + p)));
  pages.push(...cache.blog_posts.filter(p => p.status === 'published').map(p => '/blog/' + p.slug));
  pages.push(...cache.result_categories.map(c => '/results/' + c.id));
  return [...new Set(pages.filter(Boolean))];
}
module.exports = { ...urls, exists, redirects, paths };
