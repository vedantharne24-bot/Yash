# CodeCoast — Hackathon Landing Page

A static, animated hackathon landing page (fictional "CodeCoast Season 1" branding) with:

- Pixel-font hero with text-scramble intro, cursor-following glow, rotating badge and marquee strip
- Scroll-driven word-by-word "vision" reveal, counters, stacked track cards
- Tilted ribbon marquees that speed up with scroll velocity
- Bento prize grid, pinned horizontal "project folder" tracks with modal
- Interactive event calendar + live countdown
- Pinned horizontal gallery with SVG liquid-distortion hover
- Venue bento (map, live IST clock, weather, mini calendar), FAQ accordion, curved text marquee, footer

Built with plain HTML/CSS/JS + [GSAP](https://gsap.com/) (ScrollTrigger) and [Lenis](https://lenis.darkroom.engineering/) smooth scroll from CDNs — no build step.

## Run locally

```bash
python -m http.server 5173
```

Then open http://localhost:5173.

## Customise

All copy, dates, contacts and sponsor names are placeholders — edit `index.html`.
Event dates/calendar entries live at the top of the calendar block in `main.js` (`EVENT_DATE`, `EVENTS`), tracks in `TRACKS`, FAQs in `FAQ`.
Gallery images come from picsum.photos placeholders; swap the `SEEDS` list in `main.js` for your own photos.
