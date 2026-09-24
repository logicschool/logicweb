# Logic Website v6 — New Pages & Features

## New public pages

- `/blog.html` — premium 3-column blog grid with category filters.
- `/blog/*.html` — six starter article pages that can be duplicated or edited in the CMS.
- `/testimonials.html` — premium video testimonial gallery. Standard YouTube watch/youtu.be links open in an on-page video modal.
- `/placement-assistance.html` — dedicated placement support contact form. Submissions are stored with the existing Contact leads.
- `/career-test.html` — redesigned step-by-step course pathway assessment with six preference questions, contact capture and an instant result.

## Updated public pages

- `/placements.html` — redesigned with premium placement-support cards inspired by the supplied reference layout.
- `/results.html` — redesigned as a premium result-poster gallery with lightbox viewing.

## Result poster placeholders

Six branded SVG placeholders are included in `assets/images/result-poster-1.svg` through `result-poster-6.svg`.

Before production publishing, replace them with approved result posters using:

1. Admin → Media Library → upload the poster.
2. Admin → Page Editor → Results.
3. Click the placeholder image.
4. Choose the new image from Media Library.
5. Update the course/result label and save.

The lightbox automatically uses the current card image, so replacing an image does not require JavaScript changes.

## Testimonials

To add another YouTube testimonial:

1. Open `testimonials.html` in the Page Editor.
2. Duplicate a `.testimonial-video-card` block using element HTML/source editing.
3. Change its `href` to a YouTube watch or `youtu.be` URL.
4. Replace the thumbnail and text.

YouTube watch links automatically open in the on-page player. Other YouTube links, such as a channel link, open normally.

## Career test

The result is preference-based guidance, not a professional eligibility determination.

- Six answers are scored as India-focused or international-focused preferences.
- A tied score produces a balanced pathway instead of forcing a recommendation.
- The final contact step saves the assessment to the existing enquiry leads endpoint.
- The result is shown immediately without redirecting away from the page.

## Navigation

The original primary navigation stays compact. A new **More** menu contains:

- Blog
- Testimonials
- Career Test
- Placement Assistance

These resources are also added to the footer automatically.
