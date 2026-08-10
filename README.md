# Quiz Show Host

A fully local, open-source quiz-game application with a host console and a synchronized projector display.

## Run it

1. Install Node.js 20 or later.
2. Run `npm install`.
3. Run `npm run dev`.
4. Open the host console at `http://localhost:1234`.
5. Select **Open projector display**, move that browser window to the projector, and use full-screen mode.

The Express/Socket.IO server runs at port 3000 and saves its data locally in `data/quiz-show.db`.

## Game flow and rules

Rules belong in one game configuration and should be settled before a round begins:

- The host opens on a title landing screen, then selects the first team.
- The active team chooses a category, followed by Easy, Medium, or Hard. A level is disabled once that team has attempted it.
- Fifteen numbered tiles are shown without revealing their questions. A tile becomes unavailable globally after it is selected.
- The question and four options are shown on the projector with a 30-second countdown. The host records the team's spoken selection.
- The application calculates the outcome from the saved correct option: Easy is **+10**, Medium **+20**, Hard **+30**, and any incorrect answer is **-10**.
- The team returns to category selection after each answer. Once it has attempted all 4 × 3 category/difficulty combinations, the host is returned to team selection.

The seeded question set provides the required 15 tiles for every category and level, but has neutral placeholder question text. The next feature is a question-pack editor/import so those placeholders can be replaced with your real quiz questions.

For this first runnable step, the rules and sample questions are seeded in `server/index.js`. The next step will move them into an editable host setup screen and importable JSON/CSV question packs.
