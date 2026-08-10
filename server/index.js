import cors from "cors";
import Database from "better-sqlite3";
import express from "express";
import { createServer } from "node:http";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { Server } from "socket.io";

mkdirSync("data", { recursive: true });
const db = new Database("data/quiz-show.db");
db.pragma("journal_mode = WAL");
db.exec("CREATE TABLE IF NOT EXISTS game_state (id INTEGER PRIMARY KEY CHECK (id = 1), state_json TEXT NOT NULL)");

const categoryDetails = [
  { name: "Bollywood", logo: "🎬", description: "Films, music, stars and iconic moments" },
  { name: "Sports", logo: "🏆", description: "Champions, records and sporting legends" },
  { name: "History", logo: "🏛️", description: "Civilisations, events and great leaders" },
  { name: "Geography", logo: "🌍", description: "Places, landmarks and the natural world" }
];
const difficultyDetails = [
  { id: "easy", logo: "⭐", name: "Easy", description: "A great way to get started" },
  { id: "medium", logo: "⭐⭐", name: "Medium", description: "A satisfying challenge" },
  { id: "hard", logo: "⭐⭐⭐", name: "Hard", description: "For the quiz masters" }
];
const categories = categoryDetails.map((item) => item.name);
const difficulties = difficultyDetails.map((item) => item.id);
const pointsByDifficulty = { easy: 10, medium: 20, hard: 30 };
const questionBank = {
  Bollywood: {
    easy: [["Which actor played Veeru in the film Sholay?", ["Amitabh Bachchan", "Dharmendra", "Rajesh Khanna", "Rishi Kapoor"], 1], ["Which Indian film industry is commonly called Bollywood?", ["Hindi cinema", "Tamil cinema", "Bengali cinema", "Marathi cinema"], 0], ["Which actor is known as the King of Bollywood?", ["Aamir Khan", "Shah Rukh Khan", "Salman Khan", "Akshay Kumar"], 1]],
    medium: [["Which film won the first Filmfare Award for Best Film?", ["Do Bigha Zamin", "Mother India", "Mughal-e-Azam", "Guide"], 0], ["Who composed the music for Dilwale Dulhania Le Jayenge?", ["A. R. Rahman", "Jatin-Lalit", "R. D. Burman", "Shankar-Ehsaan-Loy"], 1], ["Which actor directed and starred in Taare Zameen Par?", ["Farhan Akhtar", "Aamir Khan", "Karan Johar", "Rajkumar Hirani"], 1]],
    hard: [["Which 1957 Hindi film was nominated for the Academy Award for Best Foreign Language Film?", ["Mother India", "Pyaasa", "Madhumati", "Naya Daur"], 0], ["Who wrote the screenplay for the film Deewar?", ["Salim-Javed", "Gulzar", "Javed Siddiqui", "Vijay Tendulkar"], 0], ["Which film featured the song Awaara Hoon?", ["Awaara", "Shree 420", "Barsaat", "Anari"], 0]]
  },
  Sports: {
    easy: [["How many players are on a football team on the field?", ["9", "10", "11", "12"], 2], ["Which sport uses a bat, ball and wickets?", ["Hockey", "Cricket", "Tennis", "Golf"], 1], ["Which country hosted the 2016 Summer Olympics?", ["China", "Brazil", "Japan", "United Kingdom"], 1]],
    medium: [["Which country won the 2011 ICC Cricket World Cup?", ["India", "Australia", "Sri Lanka", "England"], 0], ["In tennis, what is the term for a score of zero?", ["Blank", "Love", "Nil", "Duck"], 1], ["How long is a standard marathon?", ["26.2 miles", "20 miles", "30 miles", "15 miles"], 0]],
    hard: [["Which athlete holds the men's 100-metre world record?", ["Usain Bolt", "Carl Lewis", "Yohan Blake", "Justin Gatlin"], 0], ["In which sport is the Ryder Cup contested?", ["Golf", "Polo", "Tennis", "Rowing"], 0], ["Which nation has won the most men's FIFA World Cups?", ["Germany", "Brazil", "Italy", "Argentina"], 1]]
  },
  History: {
    easy: [["Who was the first President of independent India?", ["Dr Rajendra Prasad", "Jawaharlal Nehru", "Sardar Patel", "B. R. Ambedkar"], 0], ["The Taj Mahal was built by which Mughal emperor?", ["Akbar", "Babur", "Shah Jahan", "Aurangzeb"], 2], ["Which civilisation built the pyramids at Giza?", ["Romans", "Egyptians", "Greeks", "Mayans"], 1]],
    medium: [["In which year did India gain independence?", ["1945", "1947", "1950", "1952"], 1], ["Who led the Dandi March in 1930?", ["Subhas Chandra Bose", "Mahatma Gandhi", "Bhagat Singh", "Bal Gangadhar Tilak"], 1], ["The Berlin Wall fell in which year?", ["1987", "1989", "1991", "1993"], 1]],
    hard: [["Which treaty formally ended the First World War?", ["Treaty of Paris", "Treaty of Versailles", "Treaty of Tordesillas", "Treaty of Utrecht"], 1], ["Which year is associated with the Battle of Plassey?", ["1757", "1764", "1857", "1707"], 0], ["Who founded the Maurya Empire?", ["Ashoka", "Chandragupta Maurya", "Bindusara", "Harsha"], 1]]
  },
  Geography: {
    easy: [["What is the capital of Japan?", ["Kyoto", "Tokyo", "Osaka", "Nagoya"], 1], ["Which is the largest ocean on Earth?", ["Atlantic", "Indian", "Pacific", "Arctic"], 2], ["Mount Everest is part of which mountain range?", ["Andes", "Himalayas", "Alps", "Rockies"], 1]],
    medium: [["Which river flows through Egypt?", ["Amazon", "Nile", "Danube", "Yangtze"], 1], ["What is the largest hot desert in the world?", ["Gobi", "Kalahari", "Sahara", "Arabian"], 2], ["Which country has the most natural lakes?", ["Canada", "Russia", "Brazil", "India"], 0]],
    hard: [["Which strait separates Asia and North America?", ["Gibraltar Strait", "Bering Strait", "Malacca Strait", "Bosporus"], 1], ["What is the deepest known point in the world's oceans?", ["Tonga Trench", "Mariana Trench", "Java Trench", "Puerto Rico Trench"], 1], ["Which country contains the region of Transylvania?", ["Romania", "Hungary", "Bulgaria", "Serbia"], 0]]
  }
};
const questionBankPath = "data/question-bank.csv";
const csvEscape = (value) => `"${String(value).replaceAll('"', '""')}"`;
function ensureStarterQuestionBank() {
  if (existsSync(questionBankPath)) return;
  const header = "category,difficulty,question,option_a,option_b,option_c,option_d,correct_option";
  const rows = [header];
  for (const category of categories) for (const difficulty of difficulties) {
    const source = questionBank[category][difficulty];
    for (let index = 0; index < 15; index += 1) {
      const [question, options, correctOption] = source[index % source.length];
      const wording = question;
      rows.push([category, difficulty, wording, ...options, correctOption].map(csvEscape).join(","));
    }
  }
  writeFileSync(questionBankPath, rows.join("\n"));
}
function parseCsvLine(line) { const values = []; let value = ""; let quoted = false; for (let i = 0; i < line.length; i += 1) { const char = line[i]; if (char === '"' && line[i + 1] === '"') { value += '"'; i += 1; } else if (char === '"') quoted = !quoted; else if (char === "," && !quoted) { values.push(value); value = ""; } else value += char; } values.push(value); return values; }
function loadQuestionSets() {
  ensureStarterQuestionBank(); const rows = readFileSync(questionBankPath, "utf8").trim().split(/\r?\n/).slice(1).map(parseCsvLine);
  const sets = Object.fromEntries(categories.map((category) => [category, Object.fromEntries(difficulties.map((difficulty) => [difficulty, []]))]));
  rows.forEach(([category, difficulty, text, a, b, c, d, correct]) => { if (sets[category]?.[difficulty]) { const list = sets[category][difficulty]; list.push({ id: `${category}-${difficulty}-${list.length + 1}`, number: list.length + 1, category, difficulty, text, options: [a, b, c, d], correctOption: Number(correct) }); } });
  return sets;
}
const questionSets = loadQuestionSets();

function createState() {
  const teams = [
    { id: "raw", name: "RAW", logo: "🕵️", description: "India's silent intelligence network", theme: "radial-gradient(circle at top right, #d89430 0%, #1f4b36 40%, #071c19 86%)", score: 0 },
    { id: "kgb", name: "KGB", logo: "♟️", description: "The masters of covert strategy", theme: "radial-gradient(circle at top right, #9f2838 0%, #4c1724 43%, #160b12 86%)", score: 0 },
    { id: "cia", name: "CIA", logo: "🛰️", description: "Global intelligence, precision and resolve", theme: "radial-gradient(circle at top right, #2b73bd 0%, #163d71 43%, #07152b 86%)", score: 0 },
    { id: "mossad", name: "Mossad", logo: "🦉", description: "Expert intelligence from the shadows", theme: "radial-gradient(circle at top right, #2f9a9b 0%, #155154 43%, #071e25 86%)", score: 0 }
  ];
  return {
    rules: { gameTitle: "Gloria Ke Sikandar", seasonTitle: "Season 2: Dhurandhar", backgroundTheme: "Spy Thriller", teams: teams.map((team) => team.name), categories, categoryDetails, difficulties, difficultyDetails, pointsByDifficulty, incorrectPenalty: 10, timerSeconds: 30 },
    teams, questionSets, phase: "landing", activeTeamId: null, selectedCategory: null, selectedDifficulty: null,
    currentQuestion: null, selectedOption: null, answerRevealed: false, usedQuestionIds: [], attempts: [], timerEndsAt: null
  };
}
function getState() {
  const record = db.prepare("SELECT state_json FROM game_state WHERE id = 1").get();
  if (record) return JSON.parse(record.state_json);
  const state = createState(); saveState(state); return state;
}
function saveState(state) { db.prepare("INSERT INTO game_state (id, state_json) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET state_json = excluded.state_json").run(JSON.stringify(state)); }
function teamComplete(state, teamId) { return state.attempts.filter((attempt) => attempt.teamId === teamId).length >= categories.length * difficulties.length; }
function categoryComplete(state, teamId, category) { return difficulties.every((difficulty) => state.attempts.some((attempt) => attempt.teamId === teamId && attempt.category === category && attempt.difficulty === difficulty)); }
function publish() { io.emit("game-state", getState()); }
function update(mutator, res) { const state = getState(); const error = mutator(state); if (error) return res.status(400).json({ error }); saveState(state); publish(); res.json(state); }

const app = express(); app.use(cors()); app.use(express.json()); app.use("/assets", express.static("src/assets"));
const httpServer = createServer(app); const io = new Server(httpServer, { cors: { origin: "http://localhost:1234" } });
app.get("/api/game", (_req, res) => res.json(getState()));
app.post("/api/game/start", (_req, res) => update((state) => { state.phase = "team-selection"; }, res));
app.post("/api/game/select-team", (req, res) => update((state) => {
  const team = state.teams.find((item) => item.id === req.body.teamId); if (!team) return "Select a valid team."; if (teamComplete(state, team.id)) return "This team has already completed the game.";
  state.activeTeamId = team.id; state.phase = "category-selection"; state.selectedCategory = null; state.selectedDifficulty = null;
}, res));
app.post("/api/game/select-category", (req, res) => update((state) => {
  if (!categories.includes(req.body.category)) return "Select a valid category.";
  if (categoryComplete(state, state.activeTeamId, req.body.category)) return "This team has already completed every sub-category in this category.";
  state.selectedCategory = req.body.category; state.phase = "difficulty-selection";
}, res));
app.post("/api/game/select-difficulty", (req, res) => update((state) => {
  if (!difficulties.includes(req.body.difficulty)) return "Select a valid difficulty.";
  const alreadyAttempted = state.attempts.some((item) => item.teamId === state.activeTeamId && item.category === state.selectedCategory && item.difficulty === req.body.difficulty);
  if (alreadyAttempted) return "This team has already attempted this sub-category.";
  state.selectedDifficulty = req.body.difficulty; state.phase = "question-selection";
}, res));
app.post("/api/game/select-question", (req, res) => update((state) => {
  const question = state.questionSets[state.selectedCategory]?.[state.selectedDifficulty]?.find((item) => item.number === Number(req.body.number));
  if (!question || state.usedQuestionIds.includes(question.id)) return "That question is unavailable.";
  state.currentQuestion = question; state.usedQuestionIds.push(question.id); state.selectedOption = null; state.answerRevealed = false; state.timerEndsAt = null; state.phase = "question-transition";
  setTimeout(() => { const latest = getState(); if (latest.phase === "question-transition" && latest.currentQuestion?.id === question.id) { latest.phase = "question"; latest.timerEndsAt = Date.now() + latest.rules.timerSeconds * 1000; saveState(latest); publish(); } }, 1200);
}, res));
app.post("/api/game/select-option", (req, res) => update((state) => {
  const optionIndex = Number(req.body.optionIndex); if (!state.currentQuestion || !Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex > 3) return "Select a valid option.";
  state.selectedOption = optionIndex; state.timerEndsAt = null; state.phase = "answer-review";
}, res));
app.post("/api/game/mark-answer", (req, res) => update((state) => {
  if (!state.currentQuestion || state.selectedOption === null) return "Select an answer before marking it.";
  const team = state.teams.find((item) => item.id === state.activeTeamId); if (!team) return "No active team.";
  const correct = state.selectedOption === state.currentQuestion.correctOption; const points = correct ? state.rules.pointsByDifficulty[state.currentQuestion.difficulty] : -state.rules.incorrectPenalty;
  team.score += points; state.attempts.push({ teamId: team.id, category: state.selectedCategory, difficulty: state.selectedDifficulty, questionId: state.currentQuestion.id, correct, points }); state.answerRevealed = true; state.phase = "answer-result";
}, res));
app.post("/api/game/continue", (_req, res) => update((state) => {
  if (!state.activeTeamId) return "No active team.";
  state.currentQuestion = null; state.selectedOption = null; state.answerRevealed = false; state.timerEndsAt = null; state.selectedDifficulty = null;
  if (teamComplete(state, state.activeTeamId)) { state.phase = "team-selection"; state.activeTeamId = null; state.selectedCategory = null; }
  else {
    const categoryFinished = categoryComplete(state, state.activeTeamId, state.selectedCategory);
    state.phase = categoryFinished ? "category-selection" : "difficulty-selection";
    if (categoryFinished) state.selectedCategory = null;
  }
}, res));
app.post("/api/game/back", (_req, res) => update((state) => {
  if (state.phase === "team-selection") state.phase = "landing";
  else if (state.phase === "category-selection") { state.phase = "team-selection"; state.activeTeamId = null; }
  else if (state.phase === "difficulty-selection") { state.phase = "category-selection"; state.selectedCategory = null; }
  else if (state.phase === "question-selection") { state.phase = "difficulty-selection"; state.selectedDifficulty = null; }
  else return "Back navigation is unavailable while a question is in play.";
}, res));
app.post("/api/game/reset", (_req, res) => { const state = createState(); saveState(state); publish(); res.json(state); });
io.on("connection", (socket) => socket.emit("game-state", getState()));
httpServer.listen(3000, () => console.log("Quiz server running at http://localhost:3000"));
