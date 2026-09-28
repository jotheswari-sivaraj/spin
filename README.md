# Spin Academy & Makeup Studio — landing page

Single-page site for Spin Academy & Makeup Studio, Kumaran Nagar, Trichy.
Plain HTML + Tailwind CSS v4 + vanilla JS. No framework, no runtime dependencies.

## Structure

```
index.html            Page markup, SEO meta and JSON-LD structured data
src/input.css         Tailwind entry: design tokens (@theme) and components
assets/css/styles.css Compiled CSS (generated, do not edit by hand)
assets/js/main.js     Header, menu, service tabs, gallery, enquiry form
assets/img/           Studio photos (WebP), logo, icons, og-image.jpg
robots.txt, sitemap.xml
```

## Develop

```bash
npm install
npm run dev     # watch mode, rebuilds assets/css/styles.css
npm run build   # minified production CSS
```

Serve the folder with any static server (for example `npx http-server -c-1 .`).
After a release, bump `?v=` on the CSS and JS links in `index.html` so browsers fetch the new files.

## Enquiry form

The form has two modes: **Book appointment** (date, time slot, studio or home) and **Walk in** (today or tomorrow, rough time).
On submit it validates, then opens WhatsApp to **+91 82484 31617** with the details pre-filled.

Settings live in `CONFIG` at the top of `assets/js/main.js`:

- `whatsappNumber`: the number enquiries go to
- `firstSlot`, `lastSlot`, `slotMinutes`, `closesAt`: booking slots and open/closed status
- `endpoint`: set to a backend URL (for example a CodeIgniter route) to also POST each enquiry as JSON

## Carousels

The gallery and the course cards (phones only) use one small carousel script in `main.js`.
Add `data-carousel data-autoplay="4000"` to a wrapper, `data-carousel-track` to the scrolling list, and optionally
`data-carousel-prev` / `data-carousel-next` buttons and a `data-carousel-controls` block with `data-carousel-dots`
and `data-carousel-toggle`. Autoplay pauses on hover, focus or touch, only runs while the carousel is on screen,
and is off by default for visitors who prefer reduced motion.

## Before going live

1. Replace `https://spinmakeupstudio.in/` with the real domain in `index.html`, `robots.txt` and `sitemap.xml`.
2. Confirm the opening days and hours. The page currently shows 9:30 am to 8:30 pm.
3. Submit `sitemap.xml` in Google Search Console.
4. Keep the name, address and phone number identical on the website, Google Business Profile and Justdial.
