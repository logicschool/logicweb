# Original ZIP inspection

- Plain HTML/CSS/JavaScript frontend with root pages, course pages and six individual blog files.
- Existing Node.js HTTP server in `server.js`; no original Express or SQL database dependency.
- Existing visual CMS in `admin/` with page source editing, branding, typography, animations, media, brochures, Odoo, tracking and backups.
- Global settings in `data/site-settings.json`; admin scrypt hash in `data/admin-auth.json`; leads and integration logs in NDJSON; Odoo configuration in protected JSON.
- Forms already posted JSON to Node endpoints. Career-test failures were swallowed, static-file form fallback pretended localStorage was submission, and newsletter lacked visible inline feedback.
- Media used base64 JSON, with a 10 MB original image-byte cap. A hosting/proxy body limit could still cause 413. File MIME/extension and SVG handling needed hardening.
- Headers and footers repeated in each public HTML page. Blog text, programme cards and result placeholders were embedded in page markup.
- Global phone replacement selected every `tel:` link, including branch contacts.
- Existing CRM logic includes the custom `leads.logic` field map and scalar Many2one source-ID fix. These were preserved.
- ZIP included Git history and sensitive runtime data. Git metadata and old admin credentials are not shipped in the updated archive; original uploaded bytes remain the source backup.
