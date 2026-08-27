import cors from "cors";
import Database from "better-sqlite3";
import express from "express";
import {
  createServer
} from "node:http";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync
} from "node:fs";
import {
  Server
} from "socket.io";

mkdirSync("data", {
  recursive: true
});
const db = new Database("data/quiz-show.db");
db.pragma("journal_mode = WAL");
db.exec("CREATE TABLE IF NOT EXISTS game_state (id INTEGER PRIMARY KEY CHECK (id = 1), state_json TEXT NOT NULL)");

const categoryDetails = [
  {
    name: "Sports",
    logo: "🏆",
    description: ""
  },
  {
    name: "History",
    logo: "🏛️",
    description: ""
  },
  {
    name: "Geography",
    logo: "🌍",
    description: ""
  },
  {
    name: "Politics",
    logo: "🗳️",
    description: ""
  },
  {
    name: "Literature",
    logo: "📚",
    description: ""
  },
  {
    name: "Music",
    logo: "🎵",
    description: ""
  },
  {
    name: "Bollywood",
    logo: "🎬",
    description: ""
  },
  {
    name: "Sci-Tech",
    logo: "🔬",
    description: ""
  },
  {
    name: "Mythology",
    logo: "🪔",
    description: ""
  },
  {
    name: "Current affairs",
    logo: "📰",
    description: ""
  },
  {
    name: "Arts",
    logo: "🎨",
    description: ""
  },
  {
    name: "Economics",
    logo: "📈",
    description: ""
  }
];
const difficultyDetails = [
  {
    id: "easy",
    logo: "⭐",
    name: "Easy",
    description: "A great way to get started"
  },
  {
    id: "medium",
    logo: "⭐⭐",
    name: "Medium",
    description: "A satisfying challenge"
  },
  {
    id: "hard",
    logo: "⭐⭐⭐",
    name: "Hard",
    description: "For the quiz masters"
  }
];
const categories = categoryDetails.map((item) => item.name);
const difficulties = difficultyDetails.map((item) => item.id);
const pointsByDifficulty = {
  easy: 10,
  medium: 20,
  hard: 30
};
const timerSecondsByDifficulty = {
  easy: { first: 30, second: 20 },
  medium: { first: 60, second: 40 },
  hard: { first: 90, second: 60 }
};
const questionsPerCategory = 2;
const questionBank = {
  Bollywood: {
    easy: [
      ["Which actor played Veeru in the film Sholay?", ["Amitabh Bachchan", "Dharmendra", "Rajesh Khanna", "Rishi Kapoor"], 1],
      ["Which Indian film industry is commonly called Bollywood?", ["Hindi cinema", "Tamil cinema", "Bengali cinema", "Marathi cinema"], 0],
      ["Which actor is known as the King of Bollywood?", ["Aamir Khan", "Shah Rukh Khan", "Salman Khan", "Akshay Kumar"], 1]
    ],
    medium: [
      ["Which film won the first Filmfare Award for Best Film?", ["Do Bigha Zamin", "Mother India", "Mughal-e-Azam", "Guide"], 0],
      ["Who composed the music for Dilwale Dulhania Le Jayenge?", ["A. R. Rahman", "Jatin-Lalit", "R. D. Burman", "Shankar-Ehsaan-Loy"], 1],
      ["Which actor directed and starred in Taare Zameen Par?", ["Farhan Akhtar", "Aamir Khan", "Karan Johar", "Rajkumar Hirani"], 1]
    ],
    hard: [
      ["Which 1957 Hindi film was nominated for the Academy Award for Best Foreign Language Film?", ["Mother India", "Pyaasa", "Madhumati", "Naya Daur"], 0],
      ["Who wrote the screenplay for the film Deewar?", ["Salim-Javed", "Gulzar", "Javed Siddiqui", "Vijay Tendulkar"], 0],
      ["Which film featured the song Awaara Hoon?", ["Awaara", "Shree 420", "Barsaat", "Anari"], 0]
    ]
  },
  Sports: {
    easy: [
      ["How many players are on a football team on the field?", ["9", "10", "11", "12"], 2],
      ["Which sport uses a bat, ball and wickets?", ["Hockey", "Cricket", "Tennis", "Golf"], 1],
      ["Which country hosted the 2016 Summer Olympics?", ["China", "Brazil", "Japan", "United Kingdom"], 1]
    ],
    medium: [
      ["Which country won the 2011 ICC Cricket World Cup?", ["India", "Australia", "Sri Lanka", "England"], 0],
      ["In tennis, what is the term for a score of zero?", ["Blank", "Love", "Nil", "Duck"], 1],
      ["How long is a standard marathon?", ["26.2 miles", "20 miles", "30 miles", "15 miles"], 0]
    ],
    hard: [
      ["Which athlete holds the men's 100-metre world record?", ["Usain Bolt", "Carl Lewis", "Yohan Blake", "Justin Gatlin"], 0],
      ["In which sport is the Ryder Cup contested?", ["Golf", "Polo", "Tennis", "Rowing"], 0],
      ["Which nation has won the most men's FIFA World Cups?", ["Germany", "Brazil", "Italy", "Argentina"], 1]
    ]
  },
  History: {
    easy: [
      ["Who was the first President of independent India?", ["Dr Rajendra Prasad", "Jawaharlal Nehru", "Sardar Patel", "B. R. Ambedkar"], 0],
      ["The Taj Mahal was built by which Mughal emperor?", ["Akbar", "Babur", "Shah Jahan", "Aurangzeb"], 2],
      ["Which civilisation built the pyramids at Giza?", ["Romans", "Egyptians", "Greeks", "Mayans"], 1]
    ],
    medium: [
      ["In which year did India gain independence?", ["1945", "1947", "1950", "1952"], 1],
      ["Who led the Dandi March in 1930?", ["Subhas Chandra Bose", "Mahatma Gandhi", "Bhagat Singh", "Bal Gangadhar Tilak"], 1],
      ["The Berlin Wall fell in which year?", ["1987", "1989", "1991", "1993"], 1]
    ],
    hard: [
      ["Which treaty formally ended the First World War?", ["Treaty of Paris", "Treaty of Versailles", "Treaty of Tordesillas", "Treaty of Utrecht"], 1],
      ["Which year is associated with the Battle of Plassey?", ["1757", "1764", "1857", "1707"], 0],
      ["Who founded the Maurya Empire?", ["Ashoka", "Chandragupta Maurya", "Bindusara", "Harsha"], 1]
    ]
  },
  Geography: {
    easy: [
      ["What is the capital of Japan?", ["Kyoto", "Tokyo", "Osaka", "Nagoya"], 1],
      ["Which is the largest ocean on Earth?", ["Atlantic", "Indian", "Pacific", "Arctic"], 2],
      ["Mount Everest is part of which mountain range?", ["Andes", "Himalayas", "Alps", "Rockies"], 1]
    ],
    medium: [
      ["Which river flows through Egypt?", ["Amazon", "Nile", "Danube", "Yangtze"], 1],
      ["What is the largest hot desert in the world?", ["Gobi", "Kalahari", "Sahara", "Arabian"], 2],
      ["Which country has the most natural lakes?", ["Canada", "Russia", "Brazil", "India"], 0]
    ],
    hard: [
      ["Which strait separates Asia and North America?", ["Gibraltar Strait", "Bering Strait", "Malacca Strait", "Bosporus"], 1],
      ["What is the deepest known point in the world's oceans?", ["Tonga Trench", "Mariana Trench", "Java Trench", "Puerto Rico Trench"], 1],
      ["Which country contains the region of Transylvania?", ["Romania", "Hungary", "Bulgaria", "Serbia"], 0]
    ]
  }
};
const supplementalQuestionBank = {
  Politics: {
    easy: [
      ["Which document is the supreme law of India?", ["The Constitution", "The Penal Code", "The Gazette", "The Preamble"], 0]
    ],
    medium: [
      ["Which house of Parliament is also called the Council of States?", ["Lok Sabha", "Rajya Sabha", "Vidhan Sabha", "Legislative Council"], 1]
    ],
    hard: [
      ["Which constitutional article provides for the Election Commission of India?", ["Article 324", "Article 280", "Article 356", "Article 370"], 0]
    ]
  },
  Literature: {
    easy: [
      ["Who wrote the novel The Guide?", ["R. K. Narayan", "Mulk Raj Anand", "Ruskin Bond", "Vikram Seth"], 0]
    ],
    medium: [
      ["Who wrote India's national anthem, Jana Gana Mana?", ["Rabindranath Tagore", "Bankim Chandra Chatterjee", "Sarojini Naidu", "Subramania Bharati"], 0]
    ],
    hard: [
      ["Which Indian poet wrote the epic Savitri?", ["Sri Aurobindo", "Kalidasa", "Tulsidas", "Harivansh Rai Bachchan"], 0]
    ]
  },
  Music: {
    easy: [
      ["Which instrument is Pandit Ravi Shankar famous for playing?", ["Sitar", "Tabla", "Flute", "Sarod"], 0]
    ],
    medium: [
      ["Which form of Indian classical music is associated mainly with northern India?", ["Hindustani", "Carnatic", "Qawwali", "Baul"], 0]
    ],
    hard: [
      ["Which musician is known for popularising the bansuri globally?", ["Hariprasad Chaurasia", "Zakir Hussain", "Bismillah Khan", "Shivkumar Sharma"], 0]
    ]
  },
  "Sci-Tech": {
    easy: [
      ["What does CPU stand for?", ["Central Processing Unit", "Computer Power Utility", "Central Program User", "Control Processing Unit"], 0]
    ],
    medium: [
      ["Which planet has the largest number of known moons?", ["Saturn", "Earth", "Mars", "Venus"], 0]
    ],
    hard: [
      ["What is the name of the first image captured by the Event Horizon Telescope in 2019?", ["A black hole", "A comet", "An exoplanet", "A neutron star"], 0]
    ]
  },
  Mythology: {
    easy: [
      ["Who is the author traditionally credited with the Mahabharata?", ["Vyasa", "Valmiki", "Kalidasa", "Tulsidas"], 0]
    ],
    medium: [
      ["Which weapon is associated with Lord Vishnu?", ["Sudarshana Chakra", "Trishula", "Vajra", "Gandiva"], 0]
    ],
    hard: [
      ["In the Ramayana, who was the king of Kishkindha before Sugriva?", ["Vali", "Jambavan", "Angada", "Nala"], 0]
    ]
  },
  "Current affairs": {
    easy: [
      ["Which city hosted the 2024 Summer Olympic Games?", ["Paris", "Tokyo", "Los Angeles", "Rome"], 0]
    ],
    medium: [
      ["Which organisation received the 2024 Nobel Peace Prize?", ["Nihon Hidankyo", "UNICEF", "Doctors Without Borders", "Amnesty International"], 0]
    ],
    hard: [
      ["Which country became NATO's 32nd member in 2024?", ["Sweden", "Finland", "Ukraine", "Austria"], 0]
    ]
  },
  "Arts": {
    easy: [
      ["Which Indian classical dance form originated in Tamil Nadu?", ["Bharatanatyam", "Kathak", "Manipuri", "Sattriya"], 0]
    ],
    medium: [
      ["The Ajanta Caves are especially known for their ancient paintings and are located in which state?", ["Maharashtra", "Rajasthan", "Gujarat", "Madhya Pradesh"], 0]
    ],
    hard: [
      ["Which Mughal emperor commissioned the construction of the Red Fort in Delhi?", ["Shah Jahan", "Akbar", "Jahangir", "Aurangzeb"], 0]
    ]
  },
  "Economics": {
    easy: [
      ["What is the currency of India?", ["Rupee", "Taka", "Riyal", "Yen"], 0]
    ],
    medium: [
      ["Which institution is India's central bank?", ["Reserve Bank of India", "State Bank of India", "SEBI", "NABARD"], 0]
    ],
    hard: [
      ["What does GDP stand for in economics?", ["Gross Domestic Product", "General Development Plan", "Global Demand Price", "Gross Debt Percentage"], 0]
    ]
  }
};
const questionBankPath = "data/question-bank.csv";
const csvEscape = (value) => `"${String(value).replaceAll('"', '""')}"`;

function ensureStarterQuestionBank() {
  const header = "category,difficulty,question,option_a,option_b,option_c,option_d,option_e,correct_option";
  if (existsSync(questionBankPath)) {
    const rows = readFileSync(questionBankPath, "utf8").trim().split(/\r?\n/).map(parseCsvLine);
    if (rows[0]?.length === 8) writeFileSync(questionBankPath, [header, ...rows.slice(1).map(([category, difficulty, question, a, b, c, d, correct]) => [category, difficulty, question, a, b, c, d, "None of the above", correct].map(csvEscape).join(","))].join("\n"));
    return;
  }
  const rows = [header];
  for (const category of categories)
    for (const difficulty of difficulties) {
      const source = questionBank[category]?.[difficulty] ?? supplementalQuestionBank[category][difficulty];
      for (let index = 0; index < 15; index += 1) {
        const [question, options, correctOption] = source[index % source.length];
        const wording = question;
        rows.push([category, difficulty, wording, ...options, "None of the above", correctOption].map(csvEscape).join(","));
      }
    }
  writeFileSync(questionBankPath, rows.join("\n"));
}

function parseCsvLine(line) {
  const values = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"' && line[i + 1] === '"') {
      value += '"';
      i += 1;
    } else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) {
      values.push(value);
      value = "";
    } else value += char;
  }
  values.push(value);
  return values;
}

function questionHint(category, answer) {
  return `Hint: This is a ${category} question. The answer starts with “${answer.charAt(0)}” and has ${answer.length} letters.`;
}
const fallbackExtraOptions = {
  "Which document is the supreme law of India?": "The Representation of the People Act",
  "Which house of Parliament is also called the Council of States?": "Legislative Assembly",
  "Which constitutional article provides for the Election Commission of India?": "Article 326",
  "Who wrote the novel The Guide?": "Khushwant Singh",
  "Who wrote India's national anthem, Jana Gana Mana?": "Premchand",
  "Which Indian poet wrote the epic Savitri?": "Rabindranath Tagore",
  "Which instrument is Pandit Ravi Shankar famous for playing?": "Veena",
  "Which form of Indian classical music is associated mainly with northern India?": "Dhrupad",
  "Which musician is known for popularising the bansuri globally?": "Ravi Shankar",
  "What does CPU stand for?": "Computer Processing Unit",
  "Which planet has the largest number of known moons?": "Jupiter",
  "What is the name of the first image captured by the Event Horizon Telescope in 2019?": "The M87 galaxy",
  "Who is the author traditionally credited with the Mahabharata?": "Banabhatta",
  "Which weapon is associated with Lord Vishnu?": "Pashupatastra",
  "In the Ramayana, who was the king of Kishkindha before Sugriva?": "Ravana",
  "Which city hosted the 2024 Summer Olympic Games?": "Athens",
  "Which organisation received the 2024 Nobel Peace Prize?": "World Food Programme",
  "Which country became NATO's 32nd member in 2024?": "Norway",
  "Which Indian classical dance form originated in Tamil Nadu?": "Odissi",
  "The Ajanta Caves are especially known for their ancient paintings and are located in which state?": "Karnataka",
  "Which Mughal emperor commissioned the construction of the Red Fort in Delhi?": "Bahadur Shah Zafar",
  "What is the currency of India?": "Peso",
  "Which institution is India's central bank?": "Ministry of Finance",
  "What does GDP stand for in economics?": "Gross National Product"
};

function loadQuestionSets() {
  ensureStarterQuestionBank();
  const rows = readFileSync(questionBankPath, "utf8").trim().split(/\r?\n/).slice(1).map(parseCsvLine);
  const sets = Object.fromEntries(categories.map((category) => [category, Object.fromEntries(difficulties.map((difficulty) => [difficulty, []]))]));
  rows.forEach(([category, difficulty, text, a, b, c, d, e, correct]) => {
    if (sets[category]?.[difficulty]) {
      const list = sets[category][difficulty];
      const options = [a, b, c, d, e];
      const correctOption = Number(correct);
      list.push({
        id: `${category}-${difficulty}-${list.length + 1}`,
        number: list.length + 1,
        category,
        difficulty,
        text,
        options,
        correctOption,
        hint: questionHint(category, options[correctOption])
      });
    }
  });
  for (const category of categories)
    for (const difficulty of difficulties)
      if (!sets[category][difficulty].length) {
        const source = supplementalQuestionBank[category]?.[difficulty] ?? questionBank[category][difficulty];
        for (let index = 0; index < 15; index += 1) {
          const [text, options, correctOption] = source[index % source.length];
          const questionOptions = [...options, fallbackExtraOptions[text]];
          sets[category][difficulty].push({
            id: `${category}-${difficulty}-${index + 1}`,
            number: index + 1,
            category,
            difficulty,
            text,
            options: questionOptions,
            correctOption,
            hint: questionHint(category, questionOptions[correctOption])
          });
        }
      }
  return sets;
}
const questionSets = loadQuestionSets();

// Team rosters live alongside questions in question-bank.csv. Add one row per
// member using: team_members,<team id>,<member name>,,,,,,
function loadTeamMembers() {
  ensureStarterQuestionBank();
  const membersByTeam = {};
  const rows = readFileSync(questionBankPath, "utf8").trim().split(/\r?\n/).slice(1).map(parseCsvLine);
  rows.forEach(([recordType, teamId, memberName]) => {
    if (recordType.trim().toLowerCase() !== "team_members") return;
    const id = teamId.trim().toLowerCase();
    const name = memberName.trim();
    if (!id || !name) return;
    (membersByTeam[id] ??= []).push(name);
  });
  return membersByTeam;
}

function createState() {
  const teams = [{
    id: "raw",
    name: "RAW",
    logo: "🕵️",
    description: "India's silent intelligence network",
    theme: "radial-gradient(circle at top right, #d89430 0%, #1f4b36 40%, #071c19 86%)",
    members: [],
    score: 0
  },
  {
    id: "kgb",
    name: "KGB",
    logo: "♟️",
    description: "The masters of covert strategy",
    theme: "radial-gradient(circle at top right, #9f2838 0%, #4c1724 43%, #160b12 86%)",
    members: [],
    score: 0
  },
  {
    id: "cia",
    name: "CIA",
    logo: "🛰️",
    description: "Global intelligence, precision and resolve",
    theme: "radial-gradient(circle at top right, #2b73bd 0%, #163d71 43%, #07152b 86%)",
    members: [],
    score: 0
  },
  {
    id: "mossad",
    name: "Mossad",
    logo: "🦉",
    description: "Expert intelligence from the shadows",
    theme: "radial-gradient(circle at top right, #2f9a9b 0%, #155154 43%, #071e25 86%)",
    members: [],
    score: 0
  }
  ];
  teams.forEach((team) => {
    team.lifelines = {
      removeTwo: true,
      flip: true,
      doubleTrouble: true,
      safeguard: true
    };
  });
  return {
    rules: {
      gameTitle: "Gloria Ke Sikandar",
      seasonTitle: "Season 2: Dhurandhar",
      backgroundTheme: "Spy Thriller",
      teams: teams.map((team) => team.name),
      categories,
      categoryDetails,
      difficulties,
      difficultyDetails,
      pointsByDifficulty,
      incorrectPenalty: 10,
      timerSeconds: 60,
      timerSecondsByDifficulty
    },
    teams,
    questionSets,
    phase: "landing",
    activeTeamId: null,
    revealedTeamId: null,
    selectedCategory: null,
    selectedDifficulty: null,
    currentQuestion: null,
    selectedOption: null,
    answerRevealed: false,
    usedQuestionIds: [],
    attempts: [],
    timerEndsAt: null,
    timerPaused: false,
    timerRemainingSeconds: null,
    removedOptionIndexes: [],
    disabledOptionIndexes: [],
    answerAttempt: 1,
    fullPointsOverride: false,
    flippedQuestionActive: false,
    doubleTroubleActive: false,
    safeguardActive: false,
    lifelineAnimation: null,
    questionNotice: null,
  };
}

function getState() {
  const record = db.prepare("SELECT state_json FROM game_state WHERE id = 1").get();
  if (record) {
    const state = JSON.parse(record.state_json);
    state.rules = {
      ...state.rules,
      categories,
      categoryDetails,
      difficulties,
      difficultyDetails,
      pointsByDifficulty,
      timerSeconds: 60,
      timerSecondsByDifficulty
    };
    state.questionSets = questionSets;
    const membersByTeam = loadTeamMembers();
    state.teams.forEach((team) => {
      team.members = membersByTeam[team.id] ?? [];
    });
    if (state.currentQuestion) state.currentQuestion = questionSets[state.currentQuestion.category]?.[state.currentQuestion.difficulty]?.find((question) => question.id === state.currentQuestion.id) ?? state.currentQuestion;
    state.teams.forEach((team) => {
      team.lifelines = {
        removeTwo: team.lifelines?.removeTwo ?? true,
        flip: team.lifelines?.flip ?? true,
        doubleTrouble: team.lifelines?.doubleTrouble ?? true,
        safeguard: team.lifelines?.safeguard ?? true
      };
    });
    state.timerPaused ??= false;
    state.timerRemainingSeconds ??= null;
    state.removedOptionIndexes ??= [];
    state.disabledOptionIndexes ??= [];
    state.answerAttempt ??= 1;
    state.fullPointsOverride ??= false;
    state.flippedQuestionActive ??= false;
    state.doubleTroubleActive ??= false;
    state.safeguardActive ??= false;
    state.lifelineAnimation ??= null;
    state.questionNotice ??= null;
    return state;
  }
  const state = createState();
  const membersByTeam = loadTeamMembers();
  state.teams.forEach((team) => {
    team.members = membersByTeam[team.id] ?? [];
  });
  saveState(state);
  return state;
}

function saveState(state) {
  db.prepare("INSERT INTO game_state (id, state_json) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET state_json = excluded.state_json").run(JSON.stringify(state));
}

function teamComplete(state, teamId) {
  return state.attempts.filter((attempt) => attempt.teamId === teamId).length >= categories.length * questionsPerCategory;
}

function categoryComplete(state, teamId, category) {
  return state.attempts.filter((attempt) => attempt.teamId === teamId && attempt.category === category).length >= questionsPerCategory;
}

function questionTimerSeconds(state) {
  const difficulty = state.currentQuestion?.difficulty;
  const attempt = state.answerAttempt === 2 ? "second" : "first";
  return timerSecondsByDifficulty[difficulty]?.[attempt] ?? 60;
}

function recordSkippedQuestion(state) {
  const team = state.teams.find((item) => item.id === state.activeTeamId);
  if (!team || !state.currentQuestion) return "No active question to skip.";
  state.attempts.push({
    teamId: team.id,
    category: state.selectedCategory,
    difficulty: state.selectedDifficulty,
    questionId: state.currentQuestion.id,
    correct: false,
    points: 0,
    skipped: true,
    answerAttempt: state.answerAttempt
  });
  state.selectedOption = null;
  state.timerEndsAt = null;
  state.timerPaused = false;
  state.timerRemainingSeconds = null;
  state.answerRevealed = true;
  state.questionNotice = "Question skipped. No points awarded or deducted.";
  state.phase = "answer-pending-reveal";
}

function startClock(state, seconds = questionTimerSeconds(state)) {
  state.timerEndsAt = Date.now() + seconds * 1000;
  const questionId = state.currentQuestion?.id;
  setTimeout(() => {
    const current = getState();
    if (
      current.currentQuestion?.id !== questionId ||
      !["question", "answer-review"].includes(current.phase) ||
      !current.timerEndsAt ||
      current.timerEndsAt > Date.now()
    ) return;
    if (recordSkippedQuestion(current)) return;
    saveState(current);
    publish();
  }, seconds * 1000 + 50);
}

function triggerLifelineAnimation(state, type) {
  const token = Date.now();
  state.lifelineAnimation = { type, token };
  setTimeout(() => {
    const current = getState();
    if (current.lifelineAnimation?.token !== token) return;
    current.lifelineAnimation = null;
    saveState(current);
    publish();
  }, 2400);
}

function publish() {
  io.emit("game-state", getState());
}

function update(mutator, res) {
  const state = getState();
  const error = mutator(state);
  if (error) return res.status(400).json({
    error
  });
  saveState(state);
  publish();
  res.json(state);
}

const app = express();
app.use(cors());
app.use(express.json());
app.use("/assets", express.static("src/assets"));
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:1234"
  }
});
app.get("/api/game", (_req, res) => res.json(getState()));
app.post("/api/game/start", (_req, res) => update((state) => {
  state.phase = "team-selection";
}, res));
app.post("/api/game/end-game", (_req, res) => update((state) => {
  if (state.phase === "landing") return "Start the game before ending it.";
  state.phase = "game-over";
  state.activeTeamId = null;
  state.revealedTeamId = null;
  state.selectedCategory = null;
  state.selectedDifficulty = null;
  state.currentQuestion = null;
  state.selectedOption = null;
  state.timerEndsAt = null;
  state.timerPaused = false;
  state.timerRemainingSeconds = null;
  state.removedOptionIndexes = [];
  state.disabledOptionIndexes = [];
  state.questionNotice = null;
}, res));
app.post("/api/game/reveal-team-members", (req, res) => update((state) => {
  const team = state.teams.find((item) => item.id === req.body.teamId);
  if (!team) return "Select a valid team.";
  state.revealedTeamId = team.id;
  state.phase = "team-members";
}, res));
app.post("/api/game/reveal-all-team-members", (_req, res) => update((state) => {
  state.revealedTeamId = null;
  state.phase = "all-team-members";
}, res));
app.post("/api/game/hide-team-members", (_req, res) => update((state) => {
  if (!["team-members", "all-team-members"].includes(state.phase)) return "Team members are not currently being shown.";
  state.revealedTeamId = null;
  state.phase = "team-selection";
}, res));
app.post("/api/game/select-team", (req, res) => update((state) => {
  const team = state.teams.find((item) => item.id === req.body.teamId);
  if (!team) return "Select a valid team.";
  if (teamComplete(state, team.id)) return "This team has already completed the game.";
  state.activeTeamId = team.id;
  state.revealedTeamId = null;
  state.phase = "category-selection";
  state.selectedCategory = null;
  state.selectedDifficulty = null;
}, res));
app.post("/api/game/select-category", (req, res) => update((state) => {
  if (!categories.includes(req.body.category)) return "Select a valid category.";
  if (categoryComplete(state, state.activeTeamId, req.body.category)) return "This team has already played both questions in this category.";
  state.selectedCategory = req.body.category;
  state.phase = "difficulty-selection";
}, res));
app.post("/api/game/select-difficulty", (req, res) => update((state) => {
  if (!difficulties.includes(req.body.difficulty)) return "Select a valid difficulty.";
  state.selectedDifficulty = req.body.difficulty;
  state.phase = "question-selection";
}, res));
app.post("/api/game/select-question", (req, res) => {
  let selectedQuestionId = null;
  update((state) => {
    const question = state.questionSets[state.selectedCategory]?.[state.selectedDifficulty]?.find((item) => item.number === Number(req.body.number));
    if (!question || state.usedQuestionIds.includes(question.id)) return "That question is unavailable.";
    selectedQuestionId = question.id;
    state.currentQuestion = question;
    state.usedQuestionIds.push(question.id);
    state.selectedOption = null;
    state.answerRevealed = false;
    state.timerEndsAt = null;
    state.timerPaused = false;
    state.timerRemainingSeconds = null;
    state.removedOptionIndexes = [];
    state.disabledOptionIndexes = [];
    state.answerAttempt = 1;
    state.fullPointsOverride = false;
    // Keep the marker when this selection follows the Flip lifeline.
    state.flippedQuestionActive ??= false;
    state.doubleTroubleActive = false;
    state.safeguardActive = false;
    state.questionNotice = null;
    state.phase = "question-transition";
  }, res);
  if (!selectedQuestionId) return;
  setTimeout(() => {
    const state = getState();
    if (state.phase !== "question-transition" || state.currentQuestion?.id !== selectedQuestionId) return;
    state.phase = "question-prompt";
    saveState(state);
    publish();
  }, 2200);
});
app.post("/api/game/reveal-options", (_req, res) => {
  let questionId = null;
  update((state) => {
    if (!state.currentQuestion || state.phase !== "question-prompt") return "Select a question before revealing its options.";
    questionId = state.currentQuestion.id;
    state.phase = "question";
    state.timerPaused = false;
    state.timerRemainingSeconds = null;
    state.timerEndsAt = null;
  }, res);
  if (!questionId) return;
  setTimeout(() => {
    const state = getState();
    if (state.phase !== "question" || state.currentQuestion?.id !== questionId || state.timerPaused) return;
    startClock(state);
    saveState(state);
    publish();
  }, 1000);
});

function pauseClock(state) {
  if (state.timerEndsAt) state.timerRemainingSeconds = Math.max(0, Math.ceil((state.timerEndsAt - Date.now()) / 1000));
  state.timerEndsAt = null;
  state.timerPaused = true;
}
app.post("/api/game/toggle-clock", (_req, res) => update((state) => {
  if (!state.currentQuestion || !["question", "answer-review"].includes(state.phase)) return "The clock is unavailable right now.";
  if (state.timerPaused) {
    startClock(state, state.timerRemainingSeconds ?? questionTimerSeconds(state));
    state.timerRemainingSeconds = null;
    state.timerPaused = false;
  } else pauseClock(state);
}, res));
app.post("/api/game/use-lifeline", (req, res) => update((state) => {
  const type = req.body.type;
  const team = state.teams.find((item) => item.id === state.activeTeamId);
  if (!team || !state.currentQuestion || state.phase !== "question" || !["removeTwo", "flip", "doubleTrouble", "safeguard"].includes(type)) return "That lifeline is unavailable right now.";
  if (!team.lifelines?.[type]) return "This lifeline has already been used by this team.";
  team.lifelines[type] = false;
  triggerLifelineAnimation(state, type);
  state.selectedOption = null;
  state.phase = "question";
  if (type === "removeTwo") state.removedOptionIndexes = state.currentQuestion.options.map((_, index) => index).filter((index) => index !== state.currentQuestion.correctOption && !state.disabledOptionIndexes.includes(index)).slice(0, 2);
  if (type === "doubleTrouble") {
    state.doubleTroubleActive = true;
  }
  if (type === "safeguard") {
    state.safeguardActive = true;
  }
  if (type === "flip") {
    const flippedQuestionId = state.currentQuestion.id;
    state.usedQuestionIds = [...new Set([...state.usedQuestionIds, flippedQuestionId])];
    state.currentQuestion = null;
    state.selectedOption = null;
    state.answerRevealed = false;
    state.removedOptionIndexes = [];
    state.disabledOptionIndexes = [];
    state.answerAttempt = 1;
    state.flippedQuestionActive = true;
    state.doubleTroubleActive = false;
    state.safeguardActive = false;
    state.questionNotice = null;
    state.timerPaused = false;
    state.timerRemainingSeconds = null;
    state.timerEndsAt = null;
    state.phase = "question-selection";
  }
}, res));
app.post("/api/game/select-option", (req, res) => update((state) => {
  const optionIndex = Number(req.body.optionIndex);
  if (!state.currentQuestion || !["question", "answer-review"].includes(state.phase) || !Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= state.currentQuestion.options.length || state.removedOptionIndexes?.includes(optionIndex) || state.disabledOptionIndexes?.includes(optionIndex)) return "Select a valid option.";
  if (state.phase === "question" && (!state.timerEndsAt || state.timerEndsAt <= Date.now()) && !state.fullPointsOverride) return "The clock has expired.";
  state.selectedOption = optionIndex;
  state.phase = "answer-review";
}, res));
app.post("/api/game/mark-answer", (req, res) => update((state) => {
  if (!state.currentQuestion || state.selectedOption === null) return "Select an answer before marking it.";
  if ((!state.timerEndsAt || state.timerEndsAt <= Date.now()) && !state.fullPointsOverride) return "The clock has expired.";
  const team = state.teams.find((item) => item.id === state.activeTeamId);
  if (!team) return "No active team.";
  const correct = state.selectedOption === state.currentQuestion.correctOption;
  if (!correct && state.answerAttempt === 1 && !state.doubleTroubleActive) {
    state.disabledOptionIndexes = [...new Set([...state.disabledOptionIndexes, state.selectedOption])];
    state.selectedOption = null;
    state.answerAttempt = 2;
    state.questionNotice = "First attempt was incorrect. That option is now disabled — choose from the remaining answers.";
    state.timerPaused = false;
    state.timerRemainingSeconds = null;
    startClock(state);
    state.phase = "question";
    return;
  }
  const remainingSeconds = state.timerEndsAt
    ? Math.max(0, Math.ceil((state.timerEndsAt - Date.now()) / 1000))
    : state.timerRemainingSeconds ?? 0;
  const answeredInFirstHalf = remainingSeconds > questionTimerSeconds(state) / 2;
  const timingMultiplier = answeredInFirstHalf ? 1 : .5;
  // The superadmin override restores full points for a late first attempt only.
  // A correct second attempt must always be worth half of its difficulty level.
  const scoreMultiplier = state.answerAttempt === 2
    ? .5
    : state.flippedQuestionActive
      ? 1
    : state.fullPointsOverride
      ? 1
      : timingMultiplier;
  const difficultyPoints = state.rules.pointsByDifficulty[state.currentQuestion.difficulty];
  const points = correct
    ? difficultyPoints * (state.doubleTroubleActive ? 2 : scoreMultiplier)
    : state.safeguardActive
      ? 0
      : state.doubleTroubleActive
        ? -difficultyPoints * 2
        : -state.rules.incorrectPenalty;
  team.score += points;
  if (correct) {
    // Freeze the clock exactly when the host confirms a correct answer.
    state.timerRemainingSeconds = remainingSeconds;
    state.timerEndsAt = null;
    state.timerPaused = true;
  }
  state.attempts.push({
    teamId: team.id,
    category: state.selectedCategory,
    difficulty: state.selectedDifficulty,
    questionId: state.currentQuestion.id,
    correct,
    points,
    answerAttempt: state.answerAttempt
  });
  state.answerRevealed = true;
  state.questionNotice = correct
    ? null
    : state.safeguardActive
      ? "Safeguard protected this answer. No points have been deducted."
      : state.doubleTroubleActive
        ? "Double Trouble answer was incorrect. Double points have been deducted."
        : "Second attempt was incorrect. A 10 point penalty has been applied.";
  if (!correct) state.timerEndsAt = null;
  state.phase = "answer-pending-reveal";
}, res));
app.post("/api/game/reveal-answer", (_req, res) => update((state) => {
  if (!state.currentQuestion || state.phase !== "answer-pending-reveal") return "There is no answer waiting to be revealed.";
  state.phase = "answer-result";
}, res));
app.post("/api/game/toggle-full-points-override", (_req, res) => update((state) => {
  if (!state.currentQuestion || !["question", "answer-review"].includes(state.phase)) return "The full-points override is available while a question is in play.";
  state.fullPointsOverride = !state.fullPointsOverride;
}, res));
app.post("/api/game/skip-question", (_req, res) => update((state) => {
  if (!state.currentQuestion || !["question", "answer-review"].includes(state.phase)) return "A question can only be skipped while it is in play.";
  return recordSkippedQuestion(state);
}, res));
app.post("/api/game/continue", (_req, res) => update((state) => {
  if (!state.activeTeamId) return "No active team.";
  state.currentQuestion = null;
  state.selectedOption = null;
  state.answerRevealed = false;
  state.timerEndsAt = null;
  state.timerPaused = false;
  state.timerRemainingSeconds = null;
  state.removedOptionIndexes = [];
  state.disabledOptionIndexes = [];
  state.answerAttempt = 1;
  state.fullPointsOverride = false;
  state.flippedQuestionActive = false;
  state.doubleTroubleActive = false;
  state.safeguardActive = false;
  state.questionNotice = null;
  state.selectedDifficulty = null;
  if (teamComplete(state, state.activeTeamId)) {
    state.phase = "team-selection";
    state.activeTeamId = null;
    state.selectedCategory = null;
  } else {
    const categoryFinished = categoryComplete(state, state.activeTeamId, state.selectedCategory);
    state.phase = categoryFinished ? "category-selection" : "difficulty-selection";
    if (categoryFinished) state.selectedCategory = null;
  }
}, res));
app.post("/api/game/back", (_req, res) => update((state) => {
  if (state.phase === "team-selection") state.phase = "landing";
  else if (state.phase === "team-members") {
    state.phase = "team-selection";
    state.revealedTeamId = null;
  }
  else if (state.phase === "all-team-members") state.phase = "team-selection";
  else if (state.phase === "category-selection") {
    state.phase = "team-selection";
    state.activeTeamId = null;
  } else if (state.phase === "difficulty-selection") {
    state.phase = "category-selection";
    state.selectedCategory = null;
  } else if (state.phase === "question-selection") {
    state.phase = "difficulty-selection";
    state.selectedDifficulty = null;
  } else return "Back navigation is unavailable while a question is in play.";
}, res));
app.post("/api/game/reset", (_req, res) => {
  const state = createState();
  saveState(state);
  publish();
  res.json(state);
});
io.on("connection", (socket) => socket.emit("game-state", getState()));
httpServer.listen(3000, () => console.log("Quiz server running at http://localhost:3000"));
