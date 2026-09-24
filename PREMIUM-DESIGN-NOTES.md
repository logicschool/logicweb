# Logic Premium Future UI — Design Notes

This v4 build keeps the existing Logic School of Management green / white / yellow identity and the existing CMS, but upgrades the frontend presentation and interaction system.

## Frontend upgrades

- Floating glass navigation with a compact scroll state
- Premium mesh / grid hero background with responsive pointer glow
- Refined heading scale, spacing and typography rhythm
- Deep-green glass enquiry cards with improved form focus states
- Dark premium statistics band with count-up animation
- Richer course cards with icon surfaces, animated directional affordances and pointer spotlight
- Branded career guidance banner with a subtle technical grid
- Premium image treatment and metric overlays
- Bento-style results cards
- Dark career-network section with interactive industry pills
- Larger campus cards with smoother image motion
- Card-based FAQ treatment
- Premium dark callback section and footer
- Unified rounded surfaces, shadows, borders and responsive spacing across inner pages
- Scroll progress indicator
- Magnetic pointer movement on key buttons
- Reduced-motion accessibility support

## Admin → Animations

The backend can now control these premium interactions independently:

- Interactive card spotlight
- Magnetic buttons
- Animated statistics / count-up
- Scroll progress indicator
- Hero pointer glow / parallax

The existing entrance-effect controls and per-element animation overrides still work.

## Recommended settings

For the intended premium feel, keep:

- Entrance effect: Fade up
- Duration: 700 ms
- Stagger: 80 ms
- Easing: Smooth / Premium
- Card hover: On
- Image hover: On
- Button hover: On
- Premium card spotlight: On
- Magnetic buttons: On
- Animated statistics: On
- Scroll progress: On
- Hero pointer motion: On
- Respect Reduce Motion: On
