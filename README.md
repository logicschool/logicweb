> **CMS 7.1 update:** Read **UPDATE-CMS-7.1.md** before updating an existing installation. The full project is included; the Windows update helper preserves current content and accounts.

# Logic School website — CMS 7

Updated version of the supplied website, preserving the existing HTML/CSS design and visual editor.

Start with **SETUP.md**. Requires Node.js and PostgreSQL for production. It cannot run on static hosting alone.

- `npm ci --omit=dev`
- Configure `.env` from `.env.example`
- `npm run migrate`
- `npm run admin:create`
- `npm start`

Open `/admin/` for the visual CMS and `/admin/content.html` for blog, programmes, results, branches and two-step verification.

See **CHANGELOG.md**, **DATABASE.md**, **SECURITY.md** and **VERIFICATION.md**. Legacy `V6*.md` files are retained as historical notes; the new setup and security documents supersede their deployment/authentication guidance.
