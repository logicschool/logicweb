# CMS 7.1.2 sliding-gallery verification

- Inspected category and poster rendering, the existing image lightbox, animation settings, CMS page-save markers and homepage partner marquee before implementing this update.
- Browser tests passed on `/results.html`, `/results/ca.html` and `/placements.html` at **1440, 768, 390 and 360 px** with no page JavaScript errors or horizontal document overflow.
- Verified the first row moves left and the second right, and that the animation distance matches the repeated group width for seamless loops at each size.
- Verified Pause/Play, category link navigation, poster lightbox, keyboard focus/activation, exclusion of decorative copies from tab order, draft exclusion, reduced motion and the existing global animation switch.
- Authenticated Page Editor preview retained its original static six-card DOM. Empty and single-placement states passed. Test images and records were confined to a temporary database; no achievements were added to shipped content.
- Desktop/mobile screenshots were visually reviewed. Evidence: `test-output/sliders.json` and the `*-slider-*.png` screenshots. Run with `node test/sliders-browser.cjs` (same Chromium requirements as existing browser tests).
- The public presentation change is limited to `assets/enhancements.js` and `assets/enhancements.css`. Existing public HTML, CMS/backend code, shared templates, logo settings, media, banners and Odoo/forms/tracking handlers are unchanged.

# CMS 7.1.1 separate-logo verification

- Browser checks passed at 1440 px desktop and 390 px mobile on the homepage, CA course, CA results and a blog article.
- Verified existing-logo fallback, independent header save, independent footer save, persistence after reload, browser hydration retaining different images, and clearing a section logo restoring its default.
- Both images loaded successfully, with no page JavaScript errors or document overflow. Tracking, brochure and default branding values remained unchanged.
- Upgrade helper passed against temporary copies of both previous full deliveries (CMS 7.0 and 7.1), retaining existing data. No live site was changed.
- Evidence: `test-output/separate-logos.json`; test: `node test/logos-browser.cjs`. Test screenshots use existing course icons solely to distinguish the two test images; shipped logo settings remain unchanged.

# CMS 7.1 verification — September 28, 2026

- Existing regression suite and new layout/gallery integration suite: **2 passed, 0 failed**, using isolated local PGlite databases.
- Global header/footer saves were verified across the homepage, course pages, generated blog articles, course result pages and placements. Shared brochure/tracking settings remained unchanged, and branch-specific phone numbers remained independent.
- New checks covered published/draft result visibility, course isolation, listing/course/placement banners, poster and banner deletion, category dependency protection and repeatable migration without record loss.
- Browser workflows passed: programme heading/image selection, text editing and save/reload persistence; global layout saves; direct poster upload and publication; result thumbnail navigation; category banner publication; poster lightbox; mobile poster edit and delete.
- Affected public pages and new CMS screens were checked at **1440, 768, 390 and 360 px**, with no JavaScript errors or document overflow. See `test-output/cms-workflows.json`.
- The existing whole-site browser check passed again: **32 routes × 9 widths** (1920, 1440, 1366, 1024, 768, 430, 390, 375, 360), with no JavaScript errors or horizontal overflow. See `test-output/browser-results.json`.
- Footer preview scrolling and mobile navigation were separately exercised. Desktop/mobile screenshots of the new editors and public pages were visually inspected.
- The code-only updater passed preflight, conflict refusal, backup, preserved-data and repeat-run checks against a temporary copy of the previous full ZIP. `.env`, local database sentinel, upload sentinel, homepage and shared footer remained byte-for-byte intact.
- Existing public HTML files, shared partials, uploaded assets and legacy `server.js` Odoo/forms/tracking implementation were compared with the previous delivery; this update does not replace them.

No live deployment, real Odoo submission or vendor analytics receipt was performed. Local browser checks block external requests and use reduced motion. Existing hosting/credential requirements below still apply.

---

# Verification and remaining deployment work

## Local evidence — September 28, 2026

- JavaScript syntax checks passed for all authored and modified JS/CJS files.
- Automated integration tests passed against an isolated PGlite embedded PostgreSQL engine.
- Verified database imports, admin login/logout, session expiry enforcement in code, CSRF rejection, settings updates and sensitive-file denial.
- Verified blog draft exclusion, publishing at dynamic article URLs and removal of scripts from article content.
- Verified result-category pages, CA level grouping and poster lightbox markup.
- Verified valid image upload, extension/MIME rejection, public image serving and media deletion.
- Verified newsletter validation/deduplication, honeypot rejection, enquiry/contact/career/placement source mappings, lead storage, gated brochure receipt/download and denial of direct PDF access.
- Verified programme edits through the existing visual page-save route persist to the database while shared/generated placeholders remain reusable.
- Verified branch-specific phone markup remains independent of global phone updates.
- Verified TOTP setup, QR generation, enabling, login enforcement, recovery-code reuse rejection and disabling with password/code.
- Browser automation checked **32 routes at 9 widths**: 1920, 1440, 1366, 1024, 768, 430, 390, 375 and 360 px. No page JavaScript errors or document horizontal overflow were detected. Routes included all root/course HTML files, one generated blog article, the CA result page and admin login.
- Browser login and opening/editing a record in Content Manager succeeded. Desktop/mobile screenshots were visually inspected; evidence is in `test-output/`.
- Visual checks confirmed one shared header, one hero and one footer on the homepage. Existing logo, colours, layout and navigation were retained.

The width matrix used reduced motion and blocked external resources to isolate the application. It checks layout/JavaScript, not every interaction on every device. Follow-up screenshots used normal resource loading. Real mobile hardware, all external embeds and production font/tracking delivery still need staging checks. Generated result/article templates share the tested layouts; every possible future content combination is not covered.

## Not completed here / inputs still required

1. **Live deployment and external PostgreSQL verification:** hosting access, database credentials, TLS and reverse-proxy configuration were not supplied. This ZIP is tested locally but is not a claim of production certification.
2. **Odoo end-to-end delivery:** no test lead was sent to the real CRM. The original mapping and source-routing implementation are retained. Re-enter secrets, test the connection and submit controlled staging leads.
3. **Real student portraits and approved result creatives:** none were supplied. Three editable avatar image placeholders and the existing category placeholder artwork are retained. Result galleries start empty instead of presenting fabricated achievements.
4. **Analytics receipt:** GTM/GA4/Meta hooks and CMS controls remain. Live IDs, consent setup and vendor-side receipt must be checked by the site owner.
5. **Production uploads / HTTP 413:** application limits are implemented; the hosting proxy limit must be changed as described in SETUP.md. Local testing cannot change your host's limit.
6. **Multi-instance hosting:** not supported by this package's process-local form/login rate limits, brochure tokens and legacy filesystem editor. Use one Node process until those are moved to shared infrastructure.
7. **Email notification service:** none was configured or supplied; forms persist to the database and use the existing Odoo/webhook integration.

Use SETUP.md's staging/go-live checklist before replacing the live website.
