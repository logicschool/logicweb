> CMS 7.1: see UPDATE-CMS-7.1.md for safe localhost update steps and the new Global Header, Global Footer, Result Posters, Placement Posters and Banners controls.

> CMS 7: follow SETUP.md for installation. Dynamic blog, result and programme content uses Content Manager. This file retains the original visual-editor guide.

# Logic CMS — Quick User Guide

## 1. Open the backend

Run:

```bash
npm start
```

Open `http://localhost:8080/admin/`.

Default credentials:

- **Username:** admin
- **Password:** Use the unique administrator password created with `npm run admin:create`.

Go to **Security** and manage your password and optional two-step verification.

---

## 2. Add the Logic logo

1. Open **Media Library**.
2. Click **Upload Images**.
3. Select your PNG/WebP/JPG/SVG logo.
4. Open **Branding & Global**.
5. Click **Choose / Upload Logo**.
6. Click the uploaded logo.
7. Click **Save global settings**.

This is the default logo used by the loader and by header/footer sections without their own logo. For separate images, open **Global Header → Header logo** and **Global Footer → Footer logo**, upload/select an image in each and click **Save globally**.

---

## 3. Replace any website image

1. Open **Page Editor**.
2. Choose the page.
3. In the preview, click the image you want to replace.
4. In the right-side inspector, click **Choose from Media**.
5. Pick an existing image or upload a new image.
6. Click **Save Page**.

You can also edit the image alt text in the inspector.

---

## 4. Edit text, buttons, links and styles

1. Open **Page Editor**.
2. Choose the page.
3. Click any text, heading, button, image, card or section in the preview.
4. Edit **Plain text** for normal copy, or **Rich content / inner HTML** when you need highlighted words or custom formatting.
5. For links and images, edit the URL/source fields.
6. Use **Element appearance** for text color, background, alignment, line height, letter spacing and border radius.
7. Use **Element typography** for font size and weight.
8. Click **Apply changes**, then **Save Page**.

You can also **double-click visible text directly in the website preview**, type the new content, and press **Ctrl + Enter** (or click elsewhere) to finish. Use **Duplicate**, **Move ↑**, **Move ↓** and **Delete element** for layout/content management.

For complete control over an element, use **Element HTML (advanced)**.

### Homepage hero editor

When `index.html` is selected, the Page Editor shows a dedicated **Homepage Hero** panel. It can edit the admissions badge, all three title lines, highlighted title color, description, both buttons and links, trust text/number, hero background, and enquiry-form heading/copy. Click **Apply to Preview**, then **Save Page**.

---

## 5. Edit page SEO

In **Page Editor**, the inspector includes:

- Browser title
- Meta description

Edit them, click **Apply SEO to preview**, and then **Save Page**.

---

## 6. Create or duplicate a page

Use the buttons at the top of **Page Editor**:

- **New Page** — creates a basic page.
- **Duplicate** — copies the currently selected page and is useful for new course pages.
- **Delete** — deletes a page after creating a backup. The homepage cannot be deleted.

When duplicating a page, keep it in the same folder where possible (for example `courses/new-course.html`) so existing relative asset links remain appropriate.

---

## 7. Change the main navigation

Open **Branding & Global** → **Navigation & footer links**.

Use one item per line:

```text
Courses | /courses/index.html
Results | /results.html
Placements | /placements.html
Batches | /batches.html
Branches | /branches.html
About | /about.html
Contact | /contact.html
```

The footer course links use the same format.

---

## 8. View website leads

Open **Leads & Forms**.

You can:

- View enquiry/contact/newsletter submissions
- Export CSV
- Clear the stored list

The raw lead data is stored in `data/leads.ndjson`.

---

## 9. Restore a previous version

Every page save/delete and advanced source-file save creates a backup.

Open **Developer** → **Recent backups** and click **Restore**.

---

## 10. Advanced design/code editing

Open **Developer** to edit:

- CSS
- Frontend JavaScript
- Frontend config
- Sitemap
- robots.txt

Use this section only when you need changes that the visual editor cannot provide.

---

## Important deployment note

This CMS edits files directly on the server. The server needs persistent disk storage and write permission for:

- Website HTML files
- `data/`
- `uploads/`
- `assets/` if advanced editor/media deletion is used

Always use HTTPS on the live admin panel and keep backups of `data/` and `uploads/`.


## Animation Manager

Open **Admin → Animations** to control motion across the website without editing CSS or JavaScript. You can enable/disable motion globally, choose the default entrance effect, adjust duration, delay, movement distance, stagger, viewport trigger and easing, select which content types animate automatically, and enable hover/smooth-scroll effects.

For a specific element, open **Admin → Page Editor**, click the element in the preview, and use **Element animation** in the inspector. A per-element effect, duration, delay or distance overrides the global animation defaults. Choose **No animation** when an element should stay static even if it matches an automatic animation target.

The animation manager also includes a **Premium interactions** group. From there you can independently turn on/off:

- Interactive card spotlight
- Magnetic pointer movement on buttons
- Animated statistics/count-up
- Scroll progress indicator
- Interactive hero glow / pointer parallax

The animation manager respects the visitor's operating-system **Reduce Motion** preference by default. Keep this enabled for accessibility.


## Typography editor

Open **Admin → Typography** to control site-wide font size and font weight without editing CSS. You can adjust H1, H2, H3, paragraph text, navigation, buttons, and labels. H1/H2/H3/paragraphs include separate mobile sizes. Turn **Enable custom typography settings** on, adjust the live preview, and click **Save Typography**.

For one specific heading, paragraph, button or link, open **Admin → Page Editor**, select the element, and use **Element typography** to set its font size and weight. Individual element values override the global typography settings.

## Tracking & Analytics
Open **Admin → Tracking & Analytics** to configure GTM, GA4 and Meta Pixel. Paste only the platform ID, enable the provider, enable the master tracking switch, and save. Do not install the same GA4 property or Meta Pixel both directly and inside GTM unless duplicate tracking is intentional. See `V6.8-TRACKING-ANALYTICS.md` for the event list and testing instructions.
