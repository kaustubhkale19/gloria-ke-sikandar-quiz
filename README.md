# Quiz Show Host

A fully local, open-source quiz-game application with a host console and a synchronized projector display.

## Run it

1. Install Node.js 20 or later.
2. Run `npm install`.
3. Run `npm run dev`.
4. Open the host console at `http://localhost:1234`.
5. Select **Open projector display**, move that browser window to the projector, and use full-screen mode.

The Express/Socket.IO server runs at port 3000 and saves its data locally in `data/quiz-show.db`.

## Team rosters

Team members are maintained in the same editable [`data/question-bank.csv`](data/question-bank.csv) file as the questions. Add one row per member using the existing columns:

```csv
"team_members","raw","Aarav Sharma","","","","","",""
```

Use one of `raw`, `kgb`, `cia`, or `mossad` in column two and place the member's display name in column three. On the host console's team-selection screen, select **Reveal members** to show that roster on the projector; select **Back to teams** when finished.

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




Requirements / Features-
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
13. Once the question is selected, animate the selected question number as unboxing the mystery box.
14. while displaying selected Diffulty level only display in terms of star icon and no text.
15. when all the options are displayed, then Start the clock. 
16. When the timer is up, the options should be greyed out.
17. replace the timer as progress bar in green color in 2 phases. 
18. Give pause timer option on host console with Dhurandhar text spinning in front of question and answer area.
19. host console should have override option for timer and award full points.
20. If wrong option is selected, do not hide the option, make it non clickable and greyed out.
21. When Remove-2 is selected, the wrong options text are removed but box should be greyed out.
22. When Team names are revealed, have a facility to reveal the team members. The trigger should be on host console. The team members should be fetched from same external csv where question banks are present so that can be edited externally. The team members list displayed should be in a responsive container.
23. host console should have option to change the answer once selected before confirming
24. Arena page for all team lineups on one page - Done
25. Timer text not readable. Take it above timer bar. - Done
26. Show placeholder screen for pause timer - Done
27. Increase hint text font - Deferred
28. Second attempt is giving full points to team. Should award half points for second attempt. - Done
29. Provide feature to end the game, show final points table and annouce a winner - Done.
30. Increase icon size for lifelines and remove text - Done
31. Game rules and help. Content to be provided by Abhishek - Pending
32. Seperate team csv file from question bank - Pending
33. Hint not showing on audience console if multiple lifelines are used - Deferred.
34. Remove Hint lifeline. Keep only 2 lifelines Remove 2 and Flip. Lifelines can be used after the options are revealed - Done
35. Add 2 boosters - Double-Trouble (Apply 2x to awarded points, positive as well as penalty points) and Safegurad (no penalty for this question) - Done
36. Keep the timer running until final answer is submitted from host console. Pause the timer if submitting answer is correct. - Done.
37. Implement Timer duration as - Easy (30 seconds for first attempt and 20 for second attempt), Medium (60 for first attempt and 40 for second) and Hard (60 for first attempt and 90 for second) - Done
38. Point calculation on Flip should be standard. Do not award half points for first attempt on flipped question. - Done
39. If team does not attempt a question, treat it as skip. Award 0 points. Do not show 'Incorrect -10 points' on projector screen - Done
40. Make the timer as count down i.e. 60 - 59 - 58. Keep the animation and color theme - Done
41. After confirming answer from host console, provide one more step to reveal the result - Done.
42. Provide confirmation option after selecting booster or lifeline. - Done
43. Add difficulty star on question number selection page as well - Done
44. used lifeline disable style is not clearly visible - Done
46. In team points box, show number of attempted categories in bracket - Done
47. If correct option is selected, ponits being awarded before clicking 'Reveal Correct Answer' button. Award points only after revealing correct answer.
48. Rules not opening on Audience console when Rules button is clicked on host console. To open rules on audience console, rules button on audience screen needs to be clicked. 
49. Sync Rules popop window open/close on host and audience console.
50. On host console - Do not ask for Trump card selection if both Trump cards are used by a team. Just show that trump cards are used.
51. On clicking lifeline, should we pause the clock till lifelife is confirmed?