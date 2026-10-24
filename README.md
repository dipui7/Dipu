# Mohammad Dipu Islam — Portfolio

Static site published with GitHub Pages at <https://dipui7.github.io/Dipu/>.

| File | Page |
| --- | --- |
| `index.html` | Home |
| `portfolio.html` | Photography, films and design |
| `stories.html` | Impact stories (with category filters) |
| `about.html` | About, timeline and toolkit |
| `contact.html` | Contact form (Formspree) |
| `404.html` | Not-found page |

`assets/css/site.css` is the compiled stylesheet and `assets/js/site.js` handles the navbar, animations, the photo/video viewer and the story filters.

## Adding a photo

1. Add the original as `images/p43.jpg`.
2. Run `python3 scripts/optimize_images.py` to create the web versions in `images/web/`.
3. In `portfolio.html`, copy a photo block and change the number and caption:
   - **Series** (Childhood, The Caregivers, Home & Water): copy a `<figure>` block inside the series.
   - **Archive**: copy an `<a class="photo-tile …">` block inside `<details class="archive">`.

## Adding the showreel

On the home page, find the `SHOWREEL` comment in the "Screening room" section and follow it. Turn the
`<div data-showreel>` into a link with `data-video="youtube:YOUR_ID"` and replace "Coming soon" with a play button.

## Adding a film

Copy one of the film cards in `portfolio.html` and replace the YouTube ID (it appears in the link, `data-video="youtube:…"` and the thumbnail URL). Vimeo (`data-video="vimeo:ID"`) and MP4 files (`data-video="films/clip.mp4"`) also work.

## Adding a story

Copy one of the cards in `stories.html`, update the link, image, title, summary, category tag (`data-category` and the label) and reading time.

## Changing the styles

```bash
npm install
npm run build   # rebuilds assets/css/site.css — commit it afterwards
```
