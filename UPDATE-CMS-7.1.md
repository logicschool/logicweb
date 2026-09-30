# Update your existing localhost project

This ZIP contains the full website and CMS. Use these update steps to keep your current login, database, uploads, page edits and settings.

1. In the terminal running the old website, press **Ctrl+C** to stop it.
2. Make a backup copy of your existing `Logic-CMS-7` folder while the server is stopped.
3. Extract this ZIP into a **different folder**. The new folder is named `Logic-CMS-7.1.2`. Do not extract it over your existing folder.
4. Inside the new folder, double-click **UPDATE-WINDOWS.cmd**.
5. Paste the path of your existing project, for example:

   ```text
   C:\Users\deepa\Downloads\FINAL_DRAFT\Logic-CMS-7
   ```

6. Wait for **Updated … files**. The helper copies only this update's code and documentation. It keeps `.env`, `data/`, `uploads/`, public HTML pages and shared partials. It backs up overwritten code under `data/backups/`. If it finds a conflicting code edit, it stops before changing anything and lists the files to merge.
7. Open Command Prompt in your **existing** project folder. Run each command separately:

   ```bat
   npm run migrate
   npm start
   ```

8. Open `http://localhost:8080/admin/` (or the port in your existing `.env`). Sign in with the account you already created. Refresh the browser with **Ctrl+F5**.

Do not run `admin:create` again. Do not replace `.env`, `data/dev-db/` or `uploads/` with files from the new package. The repeatable migration only adds the new gallery tables; it does not reimport seed content or reset your records. Dependencies are unchanged, so an existing working installation does not need another install.

If Windows cannot launch the helper, open Command Prompt in the new `Logic-CMS-7.1.2` folder and run:

```bat
node scripts\update-existing.js "C:\Users\deepa\Downloads\FINAL_DRAFT\Logic-CMS-7"
```

Optional preview without copying files: append `--check` to that command.

For a fresh installation, use `SETUP.md`. For a live server, deploy to staging and back up the external PostgreSQL database as described there.

## Sliding result and placement cards (CMS 7.1.2)

The main Results category thumbnails, each course's result posters, and Placement Posters now use compact cards in two rows moving in opposite directions. Keep adding/editing/deleting images through the existing CMS sections. There are no extra slide records to maintain.

- Upload a student photo or small poster in **Result Posters** or **Placement Posters**. Published records appear automatically on their existing pages; drafts stay hidden.
- Each gallery/level uses two rows when it has at least two items. A single item stays still; empty galleries keep their existing empty state. Images repeat visually for a continuous loop, without creating duplicate CMS records or changing achievement counts.
- Hover to pause temporarily. Use **Pause animation** to stop and swipe/scroll through the rows, then **Play animation** to resume. Keyboard focus pauses the row while browsing its cards.
- Click a result category to open its existing course page. Click a poster/photo to enlarge it using the existing image viewer. Images fit inside their cards without cropping.
- Automatic motion respects the visitor's reduced-motion preference and the existing CMS **Animations → Enable animations** switch. Paused/reduced-motion rows remain manually scrollable.
- Banners, the homepage partner slider and all unrelated page sections are unchanged. Page Editor keeps its static preview so its generated-content markers remain safe to save.

## Separate logos (CMS 7.1.1)

1. Open **Global Header**, choose/upload the **Header logo**, then click **Save globally**.
2. Open **Global Footer**, choose/upload the **Footer logo**, then click **Save globally**.
3. Each image applies to its own section on every page. Changing one does not replace the other. Desktop/mobile sizes remain separately adjustable.

Until a section has its own logo, it uses the current Branding & Global logo. Clearing a section's logo URL restores that fallback. No new logo files are bundled. This update works with both CMS 7.0 and CMS 7.1 installations; use your existing project folder in the updater.

## Where to edit

- **Global Header:** independent header logo and sizes, menu links, More links, Apply button, WhatsApp and announcement. Click **Save globally** once.
- **Global Footer:** independent footer logo, footer description, address/contact, headings, quick/course/social/legal links, newsletter labels, copyright and logo sizes. Click **Save globally** once. The footer logo is independent of the header logo. Global phone/email remain connected to Branding & Global.
- **Programme Cards:** edit each course's title, icon, description, duration, filter category and destination. In Page Editor, click its text or icon, click **Apply changes**, then **Save Page**. Use **Select whole card / parent** or **Edit programme fields** for the card's other fields. Header/footer selection directs you to the global editor.
- **Result Categories:** choose one thumbnail for CA, CMA USA or another course. These are the cards visitors see on `/results.html`. Existing category addresses stay the same.
- **Result Posters:** click **Add result poster**, choose its course, enter its level (for example CA Foundation), upload/select the poster and save. It appears only on that course's full results page. Use Draft to hide it temporarily or Delete to remove the record. The image remains in Media Library.
- **Placement Posters:** add a title, upload the image, optionally add student/company/course details, and save. Posters appear on `/placements.html`, above its existing content. Click any poster to enlarge it.
- **Banners:** add an image, choose Results or Placements, optionally choose a specific result course, and save. The empty course option means the main Results page. Optional caption/link, ordering, Draft and Delete controls are available. Banners scale without cropping.

Lower sort-order numbers appear first. New result-category addresses create their subpages automatically. Move/delete a category's posters and banners before deleting the category. No new student achievements or real result creatives are supplied; upload your approved artwork.
