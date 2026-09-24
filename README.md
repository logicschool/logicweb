# Logic School of Management — Premium Website + Full CMS

This project contains the complete responsive Logic School website with the **Premium Future UI** design system and a built-in password-protected admin backend. You can edit pages, upload/reuse images, change the logo and contact details, manage navigation/footer links, review website leads, export CSV files, edit SEO, and access advanced HTML/CSS/JS controls without rebuilding the project.

## Start the website

Requirements: **Node.js 18 or newer**. No npm packages are required.

```bash
npm start
```

Then open:

- Website: `http://localhost:8080/`
- Admin backend: `http://localhost:8080/admin/`

## Default admin login

- Username: `admin`
- Password: `LogicAdmin@2026`

**Change the password immediately** from **Admin → Security** before putting the site on a public server.

## What the backend can edit

### Branding & Global
- Upload/select the Logic logo
- Favicon
- Main green and yellow brand colours
- Site name and tagline
- Main phone number
- WhatsApp number
- Email
- Main address
- Facebook, Instagram, YouTube and LinkedIn links
- Site-wide announcement bar
- Main navigation links
- Footer course links
- Custom trusted `<head>` code for analytics/pixels/verification

### Page Editor
- Every HTML page in the site
- Visual click-to-select editing
- Text and inner HTML
- Buttons and links
- Images and alt text
- CSS classes
- Inline styles
- Entire element HTML
- Insert headings, paragraphs, images and sections
- Per-page browser title and meta description
- Full HTML source mode
- Create a new page
- Duplicate an existing page
- Delete a page (homepage protected)
- Automatic backup before saves/deletes

### Media Library
- Upload JPG, PNG, WebP, GIF, SVG and ICO files
- Reuse uploaded media in pages
- Copy image URLs
- Delete media
- Choose an uploaded image directly while editing an `<img>` element
- Choose an uploaded logo from the same library

### Leads & Forms
- Enquiry submissions
- Contact-form submissions
- Newsletter submissions
- View leads in the dashboard
- Export all leads as CSV
- Clear stored leads when required

### Developer
- Edit `assets/styles.css`
- Edit `assets/site.js`
- Edit `assets/config.js`
- Edit `sitemap.xml`
- Edit `robots.txt`
- Automatic backups before changes
- Restore recent backups

## Where CMS data is stored

This build deliberately uses a simple file-based backend so it has **zero external dependencies**:

- Global settings: `data/site-settings.json`
- Admin password hash: `data/admin-auth.json`
- Leads: `data/leads.ndjson`
- Backups: `data/backups/`
- Uploaded media: `uploads/`

## Production hosting requirement

The CMS changes files on the server. Therefore, production hosting must provide a **persistent writable filesystem**.

Suitable examples include:
- A VPS running Node.js
- Node-enabled cPanel/Plesk hosting
- A persistent-volume Node deployment

A purely static host such as GitHub Pages cannot run this backend. Some serverless hosts use temporary/ephemeral filesystems; if you deploy there, page edits/uploads may disappear after a restart unless persistent storage or a database is added.

## Recommended production checklist

1. Change the admin password.
2. Upload the final Logic logo in **Media Library**, then select it in **Branding & Global**.
3. Add final social links.
4. Check all branch/course content in the visual editor.
5. Configure a production domain and HTTPS.
6. Back up `data/` and `uploads/` regularly.
7. If multiple staff members need concurrent editing, move authentication/content/leads to a database in a later version.

See `CMS-GUIDE.md` for step-by-step instructions.


### Premium Future UI + Animation Manager
The frontend keeps the original Logic green/white/yellow visual direction but adds a premium glass navigation system, gradient depth, interactive card lighting, refined responsive layouts, animated statistics and polished micro-interactions.

The CMS includes **Admin → Animations** for global entrance effects, timing, stagger, custom CSS selectors, hover interactions and smooth scrolling. It also controls premium interactions: **card spotlight, magnetic buttons, animated numbers, scroll progress and hero pointer motion**. Individual elements can still be overridden in the Page Editor inspector.


See `PREMIUM-DESIGN-NOTES.md` for the v4 premium UI changes and recommended animation settings.


### Typography editor
The CMS includes a dedicated **Admin → Typography** page for global font-size and font-weight controls, plus per-element font overrides in the visual Page Editor.


### v5.1 animation visibility fix
- Above-the-fold content is revealed immediately on initial page load; it no longer waits for the first scroll event.
- Whole-section entrance animation is disabled by default to avoid large blank areas before content reveals.
- Default motion is subtler: 480 ms duration, 14 px travel, 45 ms stagger.
- CMS-added images are constrained responsively so large source files cannot overflow their content area.


## v6 resource and career pages
- `blog.html` plus six starter article pages under `blog/`
- `testimonials.html` with YouTube modal support
- redesigned `placements.html` with premium placement-support cards
- `placement-assistance.html` dedicated contact form
- redesigned `results.html` with premium result-poster cards and image lightbox
- `career-test.html` with a seven-step UI (six preference questions + contact step) and instant pathway result
- Blog and Career Test added to global navigation; Testimonials and Placement Assistance added to footer resources
- All new pages remain editable through the existing CMS Page Editor.

### v6.1 detailed course pages
All 12 course pages now use a richer long-form course explainer with overview cards, course route, learning focus, career directions, core skills, FAQ and counselling. Course-section icons are standard image elements and can be replaced from the visual CMS. The inspector displays the recommended icon design size (256 × 256 px). See `V6.1-COURSE-PAGES.md`.


### v6.2 social icon manager
The Branding & Global screen now includes a repeatable social icon manager. Each social link can have its own destination URL, uploaded icon/image, and Contain or Cover & clip fit mode. Social tiles are 38 × 38 px on the website; 128 × 128 px source artwork is recommended.

### v6.3 homepage placement partners + testimonials
The homepage now includes a premium placement-partner logo strip with CMS-replaceable logo images and a featured testimonial video section with a dedicated **See more testimonials** action. See `V6.3-HOMEPAGE-SECTIONS.md` for editing instructions and recommended logo dimensions.

### v6.4 partner marquee
The homepage Placement Partners row now uses a seamless continuous auto-scrolling loop on the public site. It remains static inside CMS edit mode for easier logo editing. Reduced-motion visitors receive a manual horizontal row instead.


## v6.5 — Brochures + CRM/Odoo
Admin now includes a Brochures manager for homepage/course PDFs and a server-side CRM/Odoo integration that can send website form leads directly to Odoo or a webhook while retaining local lead storage. See `V6.5-BROCHURE-ODOO.md`.


### v6.6.1 compatibility fix
The brochure lead gate is isolated from the existing public settings endpoint. All earlier homepage, navigation, social, animation, testimonial, placement-partner, course-page, blog, result and CMS behavior remains on the v6.5/v6.4 code path; brochure availability is loaded through a separate public endpoint.

### v6.7 Odoo source routing
Website leads now carry a canonical Odoo source such as Website Brochure, Website Career Test, Website Placement Assistance, Website Contact or Website Enquiry. The supplied Logic `leads.logic` model is supported directly: name, phone, email, preferred course and lead source are mapped automatically. See `V6.7-ODOO-SOURCE-ROUTING.md`.

### v6.7.2 Odoo Many2one fix
Direct Odoo sync now always sends `leads.logic.leads_source` as a single numeric Many2one ID (for example `831`), never as an integer array such as `[831]`.

### v6.8 Tracking & Analytics
The CMS now includes **Admin → Tracking & Analytics** for Google Tag Manager, Google Analytics 4 and Meta Pixel. Tracking scripts are injected server-side into every public page and are excluded from CMS editor previews. Lead, brochure, career-test, newsletter, WhatsApp, call and testimonial-video events are wired for conversion measurement without sending name, phone or email to analytics platforms.

See `V6.8-TRACKING-ANALYTICS.md` for setup and event names.
