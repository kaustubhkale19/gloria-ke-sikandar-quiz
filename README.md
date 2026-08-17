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
- The active team chooses a category, followed by Easy, Medium, or Hard. It may choose the same difficulty more than once.
- Fifteen numbered tiles are shown without revealing their questions. A tile becomes unavailable globally after it is selected.
- The question and four options are shown on the projector with a 30-second countdown. The host records the team's spoken selection.
- The application calculates the outcome from the saved correct option: Easy is **+10**, Medium **+20**, Hard **+30**, and any incorrect answer is **-10**.
- Each team answers two questions from every category. Those two questions can be at any difficulty; after completing all categories, the host returns to team selection.

The seeded question set provides the required 15 tiles for every category and level, but has neutral placeholder question text. The next feature is a question-pack editor/import so those placeholders can be replaced with your real quiz questions.

For this first runnable step, the rules and sample questions are seeded in `server/index.js`. The next step will move them into an editable host setup screen and importable JSON/CSV question packs.




Notes on projector console  15-Aug-2026
1. Welcome screen - Remove Welcome to text.
Gloria Ke Sikandar should be a half rounded on top, Season 2 - small in the center and below that Dhurandar should be bigger in size as branding. Font should be same as Dhurandar movie title.
2. Top Left - ARCH Logo and Center - Gloria Ke Sikandar and Top Right - Dhurandhar  
3. Team Name and points should be arranged vertically on right side of screen in a bigger boxes
4. Team Logo and name should be inline.
5. Once team is selected, the lifelines should be displayed on left side in a vertical manner
6. Science and Technology to be renamed as Sci-Tech
7. Business and Economy to be renamed as Economics.
8. Art and Culture to be renamed as Arts.
9. Choose a category to be renamed to Pick your challenge. 
10. Choose a dificulty screen - Sports in center and title should be - 
The points details should be displayed in a separate section with points as coins.
11. Choose a question screen - Category should be displayed on top along with selected difficulty level




12. 15 Questions should contain the icon like mystery box with number on it.
13. Once the question is selected, animate the selected number as unboxing the mystery box.
14. while displaying selected Diffulty level only display in terms of star icon and no text.
15. when all the options are displayed, then Start the clock. 
16. When the timer is up, the options should be greyed out.
17. replace the timer as progress bar in green color in 2 phases. 
18. Give pause timer option on host console with Dhurandhar text spinning in front of question and answer area.
19. host console should have override option for timer and award full points.
20. If wrong option is selected, do not hide the option, make it non clickable and greyed out.
21. When Remove-2 is selected, the wrong options text are removed but box should be greyed out.
