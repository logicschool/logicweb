# CMS 7.1.2 — compact sliding results and placements

- Inspected the existing category/result/placement card markup, generated content slots, lightbox, global animation settings and homepage partner marquee before changing the gallery presentation.
- Added a scoped enhancement to the existing `assets/enhancements.js` and stylesheet: compact image cards in two seamless rows with opposite directions on result/category and placement galleries.
- Reused existing CMS records, ordering, publication status, image uploads, category URLs and poster lightbox. No backend/schema/content changes.
- Added hover pause, Pause/Play, keyboard/manual browsing, reduced-motion handling and resize-aware loop sizing. Single posters remain static. Decorative copies are excluded from keyboard navigation and assistive reading.
- The visual Page Editor keeps its original static DOM. Banners, homepage partner animation, separate logos, Odoo/forms/tracking and unrelated design are unchanged.

# CMS 7.1.1 — separate header and footer logos

- Header and footer each have an independent logo image field with existing upload/media controls.
- Both server rendering and browser settings hydration respect each section's logo on every page.
- Existing branding remains the fallback; no current logo or other content is replaced automatically.
- The update helper accepts unmodified CMS 7.0 and CMS 7.1 code while preserving user data.

# CMS 7.1 — global layout and poster management

- Separate Global Header and Global Footer editors reuse existing settings and shared templates; saves apply to public pages, course pages, articles and result pages.
- Footer links/headings, contact details, description, newsletter labels, copyright and responsive logo sizes can be edited directly.
- Header menus, More links, Apply button, WhatsApp, announcement and responsive logo sizes can be edited directly.
- Fixed programme-card overlay interception and the inspector comparing changed hover attributes against its HTML snapshot. Programme text and images can now be selected and saved.
- Added direct poster/banner upload, previews, search, course filters, ordering, publish/draft and delete controls. New galleries reuse existing media, auth, database and lightbox logic.
- Main Results page keeps course thumbnails linking to full result pages at the existing addresses. Scoped banners support the listing, individual result courses and placements page.
- Added non-destructive migration 002 and a code-only Windows updater that checks for conflicting edits and backs up overwritten files.
- Existing public HTML, shared partial files, uploaded images, Odoo/form handlers and tracking handlers are unchanged by this update.

## Existing implementation inspected before editing

| Area | Existing implementation reused | Update |
| --- | --- | --- |
| Shared layout | `render.js`, shared header/footer partials, global settings and public settings hydration | Dedicated structured editors and server hydration; existing partial files retained |
| Programme cards | Full-card link overlay, iframe selection/inspector, page-save extraction into programme records | Preview-only overlay fix and inspector snapshot comparison fix |
| Results | Category thumbnail slot, generated `/results/<id>.html`, level grouping and lightbox | Direct upload/preview tools, course selection and draft controls; routes retained |
| Placements and banners | JSONB content services, media upload validation, existing result-card style/lightbox | Two additional content collections and scoped gallery rendering |
| Upgrade | Repeatable migration/import marker, existing local database and filesystem CMS | Additive SQL and code-only update with backups and conflict checks |

The notes below describe the previous CMS 7.0 delivery.

# Changelog — CMS 7

## Architecture and features

- Reused the original HTML/CSS frontend, visual CMS and Odoo source/mapping implementation. Added Express middleware and PostgreSQL content storage.
- Centralized header/footer markup in shared partials; global logo renders on the server and updates from Branding & Global. Enlarged responsive logo styling.
- Added database-managed programme cards with real SVG image icons and stable CMS IDs. Visual edits persist back to programme records.
- Imported the six existing blog articles with unchanged URLs; new posts use a dynamic template, publication status, metadata and sanitized content.
- Replaced the flat Results gallery with category thumbnails and generated course galleries, level grouping and lightbox posters.
- Added Content Manager, branch phone/name management, optional TOTP, QR setup and recovery codes.
- Added validated image uploads up to 20 MB, safe random filenames, SVG-to-PNG handling and hosting 413 guidance.
- Added shared branding loader, three editable avatar image placeholders, lazy image loading and explicit global-contact hooks.
- Added SQL migration/import tooling, administrator CLI, environment sample, deployment examples and verification documentation.

## Bugs fixed

- Global phone updates no longer overwrite branch-specific phone numbers.
- Career-test submission failures are shown; success no longer appears before server receipt.
- Removed misleading localStorage-only form submission success. Newsletter feedback is visible.
- Added duplicate-click handling, atomic duplicate-lead protection, server-side validation and form rate limits.
- Protected backend/data/Git files from static access; replaced default/file-based auth with database-backed bcrypt authentication and protected sessions.
- Shared layout and generated content stay reusable after visual-editor saves.
- Removed duplicate Cloudflare beacon script tags found by the cleanup pass, while retaining CMS-controlled tracking code.

## Preserved

Existing course names/URLs, page content, assets, colour/font choices, course filters, WhatsApp, brochures, career-test questions, testimonial video behavior, visual editing tools and Odoo scalar source-ID handling. Source images and original historical documentation remain unless explicitly superseded. No React/Next.js rewrite.

## Changed files

- `404.html`
- `CMS-GUIDE.md`
- `README.md`
- `about.html`
- `admin/admin.js`
- `admin/index.html`
- `admissions.html`
- `assets/site.js`
- `batches.html`
- `blog/acca-starter-guide.html`
- `blog/after-plus-two-commerce-path.html`
- `blog/ca-foundation-roadmap.html`
- `blog/cma-usa-decision-guide.html`
- `blog/course-comparison-guide.html`
- `blog/practical-accounting-skills.html`
- `blog.html`
- `branches.html`
- `career-test.html`
- `contact.html`
- `courses/acca.html`
- `courses/bat.html`
- `courses/bcom-acca.html`
- `courses/ca.html`
- `courses/ciap.html`
- `courses/cma-india.html`
- `courses/cma-usa.html`
- `courses/cpa-usa.html`
- `courses/dipifr.html`
- `courses/ea.html`
- `courses/index.html`
- `courses/mba-acca.html`
- `courses/mcom-cpa.html`
- `data/integrations.json`
- `index.html`
- `package-lock.json`
- `package.json`
- `placement-assistance.html`
- `placements.html`
- `privacy.html`
- `refund-policy.html`
- `results.html`
- `server.js`
- `testimonials.html`
- `thank-you.html`

## Added files

- `.env.example`
- `.gitignore`
- `DATABASE.md`
- `INSPECTION.md`
- `SECURITY.md`
- `SETUP.md`
- `VERIFICATION.md`
- `admin/content.html`
- `admin/content.js`
- `assets/enhancements.css`
- `assets/enhancements.js`
- `assets/images/avatar-1.svg`
- `assets/images/avatar-2.svg`
- `assets/images/avatar-3.svg`
- `data/content-seed.json`
- `deploy/logic.service.example`
- `deploy/nginx.conf.example`
- `partials/footer.html`
- `partials/header.html`
- `scripts/admin-create.js`
- `scripts/migrate.js`
- `server/app.js`
- `server/migrations/001_initial.sql`
- `server/routes/auth.js`
- `server/routes/forms.js`
- `server/routes/media.js`
- `server/services/content.js`
- `server/services/db.js`
- `server/services/render.js`
- `server/services/seed.js`
- `test/browser.cjs`
- `test/integration.test.js`
- `test-output/browser-results.json`
- `test-output/home-desktop.png`
- `test-output/home-footer-mobile.png`
- `test-output/home-mobile.png`
- `test-output/results-mobile.png`

## Packaging exclusions

Git metadata, installed node_modules, local test databases, test-created backups and the old admin authentication file are excluded. API/webhook secrets are removed from the packaged integration configuration; restore them securely through the environment/CMS. The original uploaded ZIP remains the pre-edit backup. No live website was modified.

See VERIFICATION.md for local evidence and remaining hosting/input requirements.
