# Assignment 6 — The Missing Slice

A jQuery investigation of the birthday party in the supplied assignment. Task 1 solves all 20 selector cases; Task 2 is a separate copy with spotlight effects, expandable guest details, animated room moves, and time sorting.

## Run

Open `task1/index.html` or `task2/index.html` in a browser. For a local HTTP preview, run this from the project folder:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000/task1/` and `http://localhost:8000/task2/`. jQuery and avatar assets are included locally, so the application does not require a CDN connection or a build step.

## Try it

1. In Task 1, select each case and expand the displayed jQuery chain. Every case starts with a freshly rendered party. Cases 18 and 19 visibly add Miras and remove Natasha.
2. In Task 2, run case 3, then Clear. The AITU students upstairs remain bright during the case, and Clear restores everyone.
3. Click a guest, inspect their written information, then press Escape or click outside the card to close it.
4. Open Arman's card and move him to the balcony. Run case 1: Arman should no longer be in the hall.
5. Sort the living room twice. The first click orders the arrivals as 19:55, 20:20, 20:30, 21:00, 21:10; the second restores the picture order.
6. Click cases, sort buttons, and guests rapidly. Allow the last action to finish and confirm the page settles into that state.

The cake thief is **Zarina**: she was downstairs, arrived at 21:10, has crumbs and no cup, and stood next to AITU students. Case 20 finds her by searching the rendered guest cards.

## Source layout

- `task1/`: selector version, including the original party data and all 20 jQuery chains.
- `task2/`: separate effects and animation version.
- `shared/vendor/`: local jQuery distribution.
- `shared/avatars/`: local guest avatars.
- `scripts/browser-tests.cjs`: browser verification of selector results, effects, moves, sorting, and rapid clicks.

Each version stores room and guest data in `data.js`, case chains in `cases.js`, jQuery rendering and interactions in `app.js`, and presentation in `styles.css`. Task 2 updates its party model after a move so later cases use the guest's new room. Reset restores the supplied picture.

All page interactions use jQuery event handlers and effects. The page has no inline `onclick` handlers, CSS transitions, CSS animations, or additional behavior libraries. Playwright is used only for development checks, outside the application.

## Browser checks

The pages themselves need no installation. To run the development checks, use Node.js and install the test dependency and its browser:

```bash
npm ci
npx playwright install chromium
npm test
```

The checks cover all 20 expected case results, spotlight and Clear, opening and closing details, room moves and model updates, sorting, repeated clicks, and mobile layout. They save local evidence under `report/`, which is excluded from Git.

`PLAYWRIGHT_MODULE` and `CHROME_EXECUTABLE` can point to an existing Playwright installation and Chrome executable. Local asset attribution and licenses are in `shared/`.
