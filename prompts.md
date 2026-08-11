Flow for Projector screen is as follows - 
1. Landing screen of the gameshow displaying title, gameshow background.
2. Reveal the team names and allow selection of the team which will play first from host console. 
3. Playing team will select the category of questions from available categories like Bollywood, Sports, History and Geography.
4. Next, the team will select the sub-category - Easy, Medium or Hard.
5. Team can select a random question from a set of say 15 questions without revealing the actual question. Means team can select question number 5 to play first.
6. Selected question with 4 options will be displayed along with timer. 
7. If the selected option is correct, award 10 points for easy, 20 for medium and 30 for hard sub-category.
8. If the selected option is incorrect, deduct 10 points from the team's score.
9. Once the question is answered, go back to sub-category selection and the process repeats till the first team attempts one question from all sub-categories. 
10. After first team's turn is over, present the choice to select the next team which would play. 
11. Repeat the same process for the next playing team.
12. Every team will attempt one question from each sub-categories from every category.



While team is making selection for category, sub-category and question number, the possible options should be visible on the projector screen but clickable from host console only. 
For teams, categories and sub-categories, show logo, name and short description. 
Allow back navigation on all pages except the question page. 



When a team is selected to play, show team branding/theme in the background.
Team score should always be displayed on top right corner. 
Once the playing team selects the category, team should attempt one question from each sub-categories before going to next category selection.


Once the question is attempted, block that question selection for rest of the gameshow.
Once the team has attempted all questions from a category, block the category for that team.
Show the points of all the teams on top right corner but highlight the playing team points.

Timer is overlapping with team points. 
The title of the gameshow is "Gloria Ke Sikandar" and this is Season-2 called "Dhurandhar" which is the famous latest bollywood movie based on Indian spy story. The participating team names are also based on the same spy theme - RAW, KGB, CIA and Mossad. Make the logo and backgrounds for the teams accordingly.


Make below styling updates:
1. For the team points in top right corner, make box width equal for all.
2. Shift 'Now Paying team name' to header. Header should consist of Title on left, now playing team name in the middle and team points on the right side. Make sure these sections are not ovelapping with each other.
3. Remove the timer from header and shift it above the question. Add clock icon as well.
4. For both Host console and Projector console, arrange grids for Teams and Categories in such a way that it looks like a matrix e.g. if there are 4 teams, arrange them in 2x2 matrix. If there are 12 categories, arrange them in 4x3 grid. Decide the grid sizing based on count.


Make below changes in the rules for difficulty level:
1. Team attempting a category need not attempt one question from each difficulty level. Rather it can opt for any difficulty level.
2. Every team should play 2 questions from each category. 2 questions can be of any difficulty.
3. Do not disable the difficulty level tile once a question is attempted from that difficulty.


Below is the list of categories. Add missing categories and sample questions across all 3 difficulties.
1. Sports
2. History
3. Geography 
4. Politics
5. Literature 
6. Music
7. Bollywood 
8. Science and Technology
9. Mythology 
10. Current affairs
Add relevant icons and description per category. 
Questions for these categories should be relevant to India -> History, Politics, Literature, Music, Bollywood, Mythology
Questions for rest of the categories can be global.


Add lifeline feature.
1. Each team has 3 lifelines:
- Remove 2: This will remove 2 incorrect answers
- Flip: This will allow the team to change the question. If a team uses this lifeline, go back to question number selection page. Old question can not be attempted by other teams so block it for selection.
- Hint: This will show a hint for the question. Generate relevant hints for all questions.
2. Each team can use a lifeline only once during the game show.
3. Show available lifelines for a team on the question page just below the answers.
4. If a team has utilized a lifeline, disable it for that team.
5. Once a team decides to use a lifeline, pause the clock.
6. Allow pausing the clock from host console as well.
7. Assign appropriate icons for each lifeline. Show them in a circle.