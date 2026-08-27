import { StrictMode, useEffect, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { io } from "socket.io-client";
import "./styles.css";

type Difficulty = "easy" | "medium" | "hard";
type Question = {
  id: string;
  number: number;
  category: string;
  difficulty: Difficulty;
  text: string;
  options: string[];
  correctOption: number;
  hint: string;
};
type Lifelines = { removeTwo: boolean; flip: boolean; doubleTrouble: boolean; safeguard: boolean };
type LifelineAnimation = { type: keyof Lifelines; token: number };
type Team = {
  id: string;
  name: string;
  logo: string;
  description: string;
  theme: string;
  members: string[];
  score: number;
  lifelines: Lifelines;
};
type Attempt = {
  teamId: string;
  category: string;
  difficulty: Difficulty;
  questionId: string;
  correct: boolean;
  points: number;
  skipped?: boolean;
  answerAttempt?: number;
};
type CardDetail = {
  logo: string;
  name: string;
  description: string;
  id?: string;
};
type Game = {
  rules: {
    gameTitle: string;
    seasonTitle: string;
    backgroundTheme: string;
    categories: string[];
    categoryDetails: CardDetail[];
    difficulties: Difficulty[];
    difficultyDetails: CardDetail[];
    pointsByDifficulty: Record<Difficulty, number>;
    incorrectPenalty: number;
    timerSeconds: number;
    timerSecondsByDifficulty: Record<Difficulty, { first: number; second: number }>;
  };
  teams: Team[];
  questionSets: Record<string, Record<Difficulty, Question[]>>;
  phase: string;
  activeTeamId: string | null;
  revealedTeamId: string | null;
  selectedCategory: string | null;
  selectedDifficulty: Difficulty | null;
  currentQuestion: Question | null;
  selectedOption: number | null;
  answerRevealed: boolean;
  usedQuestionIds: string[];
  attempts: Attempt[];
  timerEndsAt: number | null;
  timerPaused: boolean;
  timerRemainingSeconds: number | null;
  removedOptionIndexes: number[];
  disabledOptionIndexes: number[];
  answerAttempt: number;
  fullPointsOverride: boolean;
  doubleTroubleActive: boolean;
  safeguardActive: boolean;
  lifelineAnimation: LifelineAnimation | null;
  questionNotice: string | null;
};

const API = "http://localhost:3000/api/game";
const ASSETS = "http://localhost:3000/assets";
const gameshowStage = `${ASSETS}/gameshow-stage.png`;
const dhurandharTitle = `${ASSETS}/dhurandhar-title-transparent.png`;
const tvColourBars = `${ASSETS}/tv-colour-bars.png`;
const rewardCoin = `${ASSETS}/reward-coin.png`;
const mysteryBox = `${ASSETS}/mystery-box.png`;
const lionTitleBanner = `${ASSETS}/gloria-ke-sikandar-lion-banner.png`;
const letters = ["A", "B", "C", "D", "E"];
const teamBackdrops: Record<string, string> = {
  raw: `${ASSETS}/team-raw.png`,
  kgb: `${ASSETS}/team-kgb.png`,
  cia: `${ASSETS}/team-cia.png`,
  mossad: `${ASSETS}/team-mossad.png`,
};
const difficultyThemes: Record<Difficulty, { overlay: string; cardBackground: string; border: string }> = {
  easy: { overlay: "rgba(21, 128, 61, .42)", cardBackground: "linear-gradient(145deg, rgba(22, 163, 74, .42), rgba(5, 46, 22, .88))", border: "#4ade80" },
  medium: { overlay: "rgba(21, 94, 117, .44)", cardBackground: "linear-gradient(145deg, rgba(14, 116, 144, .48), rgba(8, 47, 73, .9))", border: "#22d3ee" },
  hard: { overlay: "rgba(153, 27, 27, .46)", cardBackground: "linear-gradient(145deg, rgba(185, 28, 28, .5), rgba(69, 10, 10, .9))", border: "#fb7185" },
};
const sounds = {
  setMuted(value: boolean) {
    soundsMuted = value;
    if (value) this.stopSuspense();
  },
  playSelection() {
    playTone(540, 0.11, "triangle", 0.07);
    playTone(760, 0.14, "triangle", 0.05, 0.1);
  },
  playCorrect() {
    playTone(523, 0.12, "sine", 0.07);
    playTone(659, 0.14, "sine", 0.07, 0.12);
    playTone(784, 0.24, "sine", 0.08, 0.25);
  },
  playWrong() {
    playTone(220, 0.18, "sawtooth", 0.06);
    playTone(165, 0.32, "sawtooth", 0.06, 0.18);
  },
  startSuspense() {
    this.stopSuspense();
    if (soundsMuted) return;
    const pulse = () => {
      playTone(110, 0.3, "sine", 0.025);
      playTone(165, 0.14, "triangle", 0.018, 0.38);
    };
    pulse();
    suspenseInterval = window.setInterval(pulse, 1100);
  },
  stopSuspense() {
    if (suspenseInterval !== null) {
      clearInterval(suspenseInterval);
      suspenseInterval = null;
    }
  },
};
const lifelineItems: { type: keyof Lifelines; icon: string; label: string }[] =
  [
    { type: "removeTwo", icon: "✂️", label: "Remove 2" },
    { type: "flip", icon: "🔄", label: "Flip" },
    { type: "doubleTrouble", icon: "⚡", label: "Double Trouble" },
    { type: "safeguard", icon: "🛡️", label: "Safeguard" },
  ];

function backgroundStyle(team?: Team) {
  return team
    ? {
      backgroundImage: `linear-gradient(rgba(5, 11, 18, 0.28), rgba(5, 11, 18, 0.28)), url(${teamBackdrops[team.id]
        })`,
      backgroundPosition: "center",
      backgroundSize: "cover",
    }
    : undefined;
}

function questionBackgroundStyle(team: Team | undefined, difficulty: Difficulty) {
  const base = backgroundStyle(team);
  return {
    ...base,
    backgroundImage: `linear-gradient(135deg, ${difficultyThemes[difficulty].overlay}, rgba(5, 11, 18, .36)), ${base?.backgroundImage ?? "none"}`,
  };
}

function hostBackgroundStyle(team?: Team) {
  return team
    ? backgroundStyle(team)
    : {
      backgroundImage: `linear-gradient(rgba(3, 8, 18, 0.45), rgba(3, 8, 18, 0.62)), url(${gameshowStage})`,
      backgroundPosition: "center",
      backgroundSize: "cover",
    };
}

function displayBackgroundStyle(team?: Team) {
  return team
    ? backgroundStyle(team)
    : {
      backgroundImage: `linear-gradient(rgba(3, 8, 18, 0.28), rgba(3, 8, 18, 0.5)), url(${gameshowStage})`,
      backgroundPosition: "center",
      backgroundSize: "cover",
    };
}

let audioContext: AudioContext | null = null;
let suspenseInterval: number | null = null;
let soundsMuted = false;

function context() {
  audioContext ??= new AudioContext();
  return audioContext;
}

function playTone(frequency: number, duration: number, type: OscillatorType, volume = 0.05, delay = 0) {
  if (soundsMuted) return;
  const audio = context();
  audio.resume().then(() => {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const start = audio.currentTime + delay;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.03);
  });
}

async function action(path: string, body?: object) {
  await fetch(`${API}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function useGame() {
  const [game, setGame] = useState<Game | null>(null);
  useEffect(() => {
    fetch(API)
      .then((r) => r.json())
      .then(setGame);
    const socket = io("http://localhost:3000");
    socket.on("game-state", setGame);
    return () => {
      socket.disconnect();
    };
  }, []);
  return game;
}

function activeTeam(game: Game) {
  return game.teams.find((team) => team.id === game.activeTeamId);
}

function categoryComplete(game: Game, category: string) {
  return (
    game.attempts.filter(
      (item) => item.teamId === game.activeTeamId && item.category === category
    ).length >= 2
  );
}

function matrixGrid(count: number) {
  const sizing = "auto-rows-fr";
  if (count <= 1) return `${sizing} grid-cols-1`;
  if (count <= 3) return `${sizing} grid-cols-3`;
  if (count <= 4) return `${sizing} grid-cols-2`;
  if (count <= 6) return `${sizing} grid-cols-2 md:grid-cols-3`;
  if (count <= 9) return `${sizing} grid-cols-3`;
  if (count <= 12) return `${sizing} grid-cols-3 md:grid-cols-4`;
  return `${sizing} grid-cols-3 md:grid-cols-4 xl:grid-cols-5`;
}

function Timer({
  until,
  paused = false,
  remainingSeconds = null,
  totalSeconds = 60,
  className = "",
}: {
  until: number | null;
  paused?: boolean;
  remainingSeconds?: number | null;
  totalSeconds?: number;
  className?: string;
}) {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    const update = () =>
      setRemaining(
        paused
          ? remainingSeconds ?? 0
          : until
            ? Math.max(0, Math.ceil((until - Date.now()) / 1000))
            : 0
      );
    update();
    const id = window.setInterval(update, 250);
    return () => clearInterval(id);
  }, [until, paused, remainingSeconds]);
  if (!until && !paused && remainingSeconds === null)
    return (
      <div className="timer-progress timer-ready" aria-label="Timer will start after options are revealed">
        Get ready
      </div>
    );
  const elapsed = Math.min(totalSeconds, Math.max(0, totalSeconds - remaining));
  const circumference = 2 * Math.PI * 44;
  const dashOffset = circumference * (elapsed / totalSeconds);
  const lateHalf = elapsed >= totalSeconds / 2;
  return (
    <div
      className={`timer-progress ${lateHalf ? "timer-late" : "timer-early"} ${!paused && remaining > 0 && remaining <= 10 ? "timer-critical" : ""} ${className}`}
      role="progressbar"
      aria-label="Question time elapsed"
      aria-valuemin={0}
      aria-valuemax={totalSeconds}
      aria-valuenow={elapsed}
    >
      <svg className="timer-progress-ring" viewBox="0 0 100 100" aria-hidden="true">
        <circle className="timer-progress-track" cx="50" cy="50" r="44" />
        <circle
          className="timer-progress-fill"
          cx="50"
          cy="50"
          r="44"
          style={{ strokeDasharray: circumference, strokeDashoffset: dashOffset }}
        />
      </svg>
      <span className="timer-progress-elapsed">{remaining}</span>
      {paused && <span className="timer-progress-status">Paused</span>}
    </div>
  );
}

function useTimerExpired(until: number | null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    setNow(Date.now());
    if (!until) return;
    const timeout = window.setTimeout(() => setNow(Date.now()), Math.max(0, until - Date.now()) + 50);
    return () => clearTimeout(timeout);
  }, [until]);
  return Boolean(until && now >= until);
}

function teamProgress(game: Game, teamId: string) {
  const attempts = game.attempts.filter((attempt) => attempt.teamId === teamId);
  const categoriesAttempted = new Set(attempts.map((attempt) => attempt.category)).size;
  const attemptsByDifficulty = game.rules.difficulties.reduce(
    (totals, difficulty) => {
      totals[difficulty] = attempts.filter((attempt) => attempt.difficulty === difficulty).length;
      return totals;
    },
    {} as Record<Difficulty, number>
  );

  return { categoriesAttempted, attemptsByDifficulty };
}

function rankedTeams(game: Game) {
  return game.teams
    .map((team, originalIndex) => ({ team, originalIndex }))
    .sort((a, b) => b.team.score - a.team.score || a.originalIndex - b.originalIndex)
    .map(({ team }) => team);
}

function questionTimerSeconds(game: Game) {
  const difficulty = game.currentQuestion?.difficulty;
  if (!difficulty) return game.rules.timerSeconds;
  return game.rules.timerSecondsByDifficulty[difficulty][game.answerAttempt === 2 ? "second" : "first"];
}

function Scoreboard({ game }: { game: Game }) {
  return (
    <div className="scoreboard">
      {game.teams.map((team) => {
        const progress = teamProgress(game, team.id);
        return (
          <div
            key={team.id}
            className={`score-card rounded-xl border shadow-xl ${team.id === game.activeTeamId
                ? "border-gold bg-ink/95 ring-2 ring-gold/50"
                : "border-slate-600 bg-ink/80"
              }`}
          >
            <div className="score-card-heading">
              <span className="score-team-icon" aria-hidden="true">{team.logo}</span>
              <span className="score-team-name" title={team.name}>{team.name}</span>
              <span className={`score-team-points ${team.id === game.activeTeamId ? "text-gold" : "text-slate-200"}`}>
                {team.score}
              </span>
            </div>
            <div className="score-progress" aria-label={`${team.name} is at round ${progress.categoriesAttempted}`}>
              <span className="score-category-count">
                Round <strong>{progress.categoriesAttempted}</strong>
              </span>
              <span className="score-levels" aria-label="Attempts by difficulty">
                {game.rules.difficulties.map((difficulty) => (
                  <span key={difficulty} className={`score-level score-level-${difficulty}`} title={`${difficulty}: ${progress.attemptsByDifficulty[difficulty]} attempts`}>
                    {difficulty.charAt(0).toUpperCase()} <strong>{progress.attemptsByDifficulty[difficulty]}</strong>
                  </span>
                ))}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DisplayHeader({ game }: { game: Game; team?: Team }) {
  return (
    <header className="display-header mb-8">
      <Scoreboard game={game} />
    </header>
  );
}

function DisplayCategoryHeading({
  category,
  detail,
  timer,
}: {
  category: string | null | undefined;
  detail: string;
  timer?: ReactNode;
}) {
  return (
    <div className="display-category-heading mb-8">
      <div className="text-center">
        <p className="mb-2 text-lg font-bold uppercase tracking-[.3em] text-slate-300">
          Your chosen category
        </p>
        <h2 className="text-6xl font-black text-gold">{category}</h2>
        <p className="mt-3 text-2xl font-bold">{detail}</p>
      </div>
      {timer}
    </div>
  );
}

function LifelineBar({
  team,
  onUse,
  doubleTroubleActive = false,
  safeguardActive = false,
}: {
  team?: Team;
  onUse?: (type: keyof Lifelines) => void;
  doubleTroubleActive?: boolean;
  safeguardActive?: boolean;
}) {
  if (new URLSearchParams(location.search).get("screen") === "display")
    return null;
  const canUse = Boolean(onUse);
  return (
    <div className="mt-7 flex flex-wrap justify-center gap-5">
      {lifelineItems.map((item) => (
        <button
          key={item.type}
          disabled={!team?.lifelines?.[item.type]}
          onClick={() => {
            if (canUse) onUse?.(item.type);
          }}
          className={`lifeline-circle ${item.type === "doubleTrouble" && doubleTroubleActive ? "is-active" : ""} ${item.type === "safeguard" && safeguardActive ? "is-safeguard-active" : ""}`}
          title={item.label}
          aria-label={item.label}
          aria-pressed={item.type === "doubleTrouble" ? doubleTroubleActive : undefined}
        >
          <span className={`lifeline-sprite lifeline-sprite-${item.type}`} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

function DisplayLifelines({ team, doubleTroubleActive, safeguardActive }: { team?: Team; doubleTroubleActive: boolean; safeguardActive: boolean }) {
  return (
    <aside className="display-lifelines" aria-label="Team lifelines">
      {lifelineItems.map((item) => (
        <div
          key={item.type}
          aria-disabled={!team?.lifelines?.[item.type]}
          aria-label={item.label}
          title={item.label}
          className={`lifeline-circle ${item.type === "doubleTrouble" && doubleTroubleActive ? "is-active" : ""} ${item.type === "safeguard" && safeguardActive ? "is-safeguard-active" : ""}`}
        >
          <span className={`lifeline-sprite lifeline-sprite-${item.type}`} aria-hidden="true" />
        </div>
      ))}
    </aside>
  );
}

function resultMessage(game: Game) {
  const attempt = game.attempts.at(-1);
  if (attempt?.skipped)
    return "Question skipped. No points awarded or deducted.";
  if (attempt?.correct)
    return `Correct! +${attempt.points} points`;
  if (attempt?.points === 0)
    return "Incorrect. No points deducted.";
  return `Incorrect. -${Math.abs(attempt?.points ?? game.rules.incorrectPenalty)} points`;
}

function BrandBanner({
  showGameTitle = true,
  showDhurandhar = true,
}: {
  showGameTitle?: boolean;
  showDhurandhar?: boolean;
}) {
  const showBanner = showGameTitle || showDhurandhar;
  return (
    <header className="brand-banner" aria-label="Gloria Ke Sikandar branding">
      {showBanner && <img className="brand-lion-title" src={lionTitleBanner} alt="Gloria Ke Sikandar — Season 2: Dhurandhar" />}
    </header>
  );
}

function Display({ game }: { game: Game }) {
  const team = activeTeam(game);
  const question = game.currentQuestion!;
  const timerExpired = useTimerExpired(game.timerEndsAt);
  const difficultyIcon = game.rules.difficultyDetails.find(
    (item) => item.id === question?.difficulty
  )?.logo ?? question?.difficulty;
  const selectedDifficultyIcon = game.rules.difficultyDetails.find(
    (item) => item.id === game.selectedDifficulty
  )?.logo ?? "";
  if (game.lifelineAnimation) {
    const lifeline = lifelineItems.find((item) => item.type === game.lifelineAnimation?.type);
    if (lifeline)
      return (
        <main className="lifeline-activation-screen min-h-screen" style={displayBackgroundStyle(team)}>
          <section className="lifeline-activation" aria-live="assertive">
            <span className={`lifeline-activation-icon lifeline-sprite lifeline-sprite-${lifeline.type}`} aria-hidden="true" />
            <p>{lifeline.label}</p>
            <h1>Activated</h1>
          </section>
        </main>
      );
  }
  if (game.phase === "game-over") {
    const finalStandings = rankedTeams(game);
    const winner = finalStandings[0];
    return (
      <main className="finale-screen min-h-screen overflow-auto p-12 text-center" style={displayBackgroundStyle(winner)}>
        <section className="finale-content mx-auto">
          <p className="finale-kicker">The final scores are in</p>
          <p className="finale-announcement">And the winner is</p>
          <div className="finale-winner">
            <span className="finale-winner-logo" aria-hidden="true">{winner.logo}</span>
            <h1>{winner.name}</h1>
            <p>{winner.score} points</p>
          </div>
          <section className="final-standings" aria-label="Final points table">
            <h2>Final standings</h2>
            {finalStandings.map((item, index) => (
              <div key={item.id} className={`final-standing ${index === 0 ? "is-winner" : ""}`}>
                <span className="final-standing-rank">{index + 1}</span>
                <span className="final-standing-logo" aria-hidden="true">{item.logo}</span>
                <span className="final-standing-team">{item.name}</span>
                <strong>{item.score} <small>pts</small></strong>
              </div>
            ))}
          </section>
        </section>
      </main>
    );
  }
  if (game.timerPaused && game.phase === "question")
    return (
      <main
        className="landing grid min-h-screen place-items-center overflow-hidden p-12 text-center"
        style={{
          backgroundImage: `linear-gradient(rgba(3, 8, 18, 0.4), rgba(3, 8, 18, 0.72)), url(${gameshowStage})`,
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        <section className="projector-pause-notice" aria-live="polite">
          <img className="projector-pause-pattern" src={tvColourBars} alt="Vintage television colour bars" />
          <h1>Sorry for interruption</h1>
          <p className="projector-pause-message">We are experiencing a technical glitch.</p>
        </section>
      </main>
    );
  if (game.phase === "landing")
    return (
      <main
        className="landing grid min-h-screen place-items-center overflow-hidden p-12 text-center"
        style={{
          backgroundImage: `linear-gradient(rgba(3, 8, 18, 0.28), rgba(3, 8, 18, 0.5)), url(${gameshowStage})`,
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        <img className="projector-lion-title" src={lionTitleBanner} alt="Gloria Ke Sikandar — Season 2: Dhurandhar" />
      </main>
    );
  if (game.phase === "question-transition" && question)
    return (
      <main className="min-h-screen p-12" style={questionBackgroundStyle(team, question.difficulty)}>
        <Scoreboard game={game} />
        <div className="grid min-h-[80vh] place-items-center text-center">
          <div>
            <p className="text-2xl font-bold uppercase tracking-[.25em] text-gold">
              Question selected
            </p>
            <div className="mystery-unbox mx-auto my-8" aria-label={`Question ${question.number} selected`}>
              <img src={mysteryBox} alt="" aria-hidden="true" />
              <span>{question.number}</span>
            </div>
            <p className="text-3xl font-black">Get ready for the question…</p>
          </div>
        </div>
      </main>
    );
  if (game.phase === "team-members") {
    const rosterTeam = game.teams.find((item) => item.id === game.revealedTeamId);
    if (!rosterTeam) return null;
    return (
      <main className="landing min-h-screen p-12" style={displayBackgroundStyle(rosterTeam)}>
        <DisplayHeader game={game} />
        <section className="team-members-reveal mx-auto max-w-6xl text-center">
          <p className="mb-3 text-xl font-bold uppercase tracking-[.3em] text-gold">Meet the team</p>
          <div className="mb-9 flex items-center justify-center gap-4">
            <span className="text-6xl" aria-hidden="true">{rosterTeam.logo}</span>
            <h2 className="text-6xl font-black">{rosterTeam.name}</h2>
          </div>
          {rosterTeam.members.length ? (
            <div className="team-members-grid" aria-label={`${rosterTeam.name} team members`}>
              {rosterTeam.members.map((member) => <div key={member} className="team-member-card">{member}</div>)}
            </div>
          ) : (
            <p className="rounded-2xl border border-gold/60 bg-ink/80 p-8 text-xl text-slate-200">
              No team members have been added yet.
            </p>
          )}
        </section>
      </main>
    );
  }
  if (game.phase === "all-team-members")
    return (
      <main
        className="landing min-h-screen overflow-auto p-12 text-center"
        style={{
          backgroundImage: `linear-gradient(rgba(3, 8, 18, 0.38), rgba(3, 8, 18, 0.7)), url(${gameshowStage})`,
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        <section className="all-teams-reveal mx-auto">
          <p className="mb-2 text-xl font-bold uppercase tracking-[.3em] text-gold">Meet the teams</p>
          <h2 className="mb-9 text-6xl font-black">All teams and members</h2>
          <div className="team-rosters-column">
            {game.teams.map((item) => (
              <article key={item.id} className="team-roster-card">
                <h3><span aria-hidden="true">{item.logo}</span>{item.name}</h3>
                {item.members.length ? (
                  <div className="team-roster-members">
                    {item.members.map((member) => <div key={member}>{member}</div>)}
                  </div>
                ) : <p>No team members are configured.</p>}
              </article>
            ))}
          </div>
        </section>
      </main>
    );
  if (
    [
      "team-selection",
      "category-selection",
      "difficulty-selection",
      "question-selection",
    ].includes(game.phase)
  ) {
    const heading =
      game.phase === "team-selection"
        ? "Select the next team"
        : game.phase === "category-selection"
          ? "Pick your challenge"
          : game.phase === "difficulty-selection"
            ? `${game.selectedCategory}: choose a difficulty`
            : "Choose a hidden question number";
    const cards: CardDetail[] =
      game.phase === "team-selection"
        ? game.teams
        : game.phase === "category-selection"
          ? game.rules.categoryDetails
          : game.phase === "difficulty-selection"
            ? game.rules.difficultyDetails
            : [];
    return (
      <main
        className="landing min-h-screen p-12"
        style={displayBackgroundStyle(team)}
      >
        <DisplayHeader game={game} team={team} />
        <section className="mx-auto max-w-6xl text-center">
          {game.phase === "difficulty-selection" ? (
            <DisplayCategoryHeading category={game.selectedCategory} detail="Pick a difficulty" />
          ) : game.phase === "question-selection" ? (
            <DisplayCategoryHeading category={game.selectedCategory} detail={`${selectedDifficultyIcon} · Choose a hidden question number`} />
          ) : (
            <h2 className="mb-10 text-5xl font-black">{heading}</h2>
          )}
          {game.phase === "question-selection" ? (
            <div className="mx-auto grid max-w-3xl grid-cols-5 gap-4">
              {game.questionSets[game.selectedCategory!][
                game.selectedDifficulty!
              ].map((question) => (
                <div
                  key={question.id}
                  className={`mystery-question-tile ${game.usedQuestionIds.includes(question.id) ? "is-used" : ""}`}
                >
                  <img src={mysteryBox} alt="" aria-hidden="true" />
                  <span>{question.number}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className={`grid gap-5 ${matrixGrid(cards.length)}`}>
              {cards.map((card) => {
                const locked =
                  game.phase === "category-selection" &&
                  categoryComplete(game, card.name);
                const difficultyTheme =
                  game.phase === "difficulty-selection" && card.id
                    ? difficultyThemes[card.id as Difficulty]
                    : undefined;
                const image =
                  game.phase === "team-selection" && card.id
                    ? teamBackdrops[card.id]
                    : undefined;
                return (
                  <div
                    key={card.name}
                    style={
                      image
                        ? {
                          backgroundImage: `linear-gradient(rgba(5, 11, 18, 0.25), rgba(5, 11, 18, 0.48)), url(${image})`,
                          backgroundPosition: "center",
                          backgroundSize: "cover",
                        }
                        : difficultyTheme
                          ? {
                            backgroundImage: difficultyTheme.cardBackground,
                            borderColor: difficultyTheme.border,
                          }
                          : undefined
                    }
                    className={`rounded-2xl border p-7 ${locked
                        ? "border-slate-800 bg-slate-950 text-slate-600"
                        : "border-slate-600 bg-panel"
                      } ${game.phase === "team-selection" ? "projector-team-card" : ""}`}
                  >
                    <div className={`mb-3 ${game.phase === "team-selection" ? "text-7xl" : "text-5xl"}`}>{card.logo}</div>
                    <h3 className={game.phase === "team-selection" ? "text-4xl font-black" : "text-2xl font-black"}>{card.name}</h3>
                    <p className={`mt-2 text-slate-300 ${game.phase === "team-selection" ? "text-xl" : ""}`}>
                      {locked ? "Completed by this team" : card.description}
                    </p>
                    {game.phase === "difficulty-selection" && card.id && (
                      <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-gold/70 bg-amber-400/15 px-4 py-1 text-gold shadow-lg">
                        <span className="reward-coin" aria-label={`${game.rules.pointsByDifficulty[card.id as Difficulty]} points`}>
                          <img src={rewardCoin} alt="" />
                          <span>{game.rules.pointsByDifficulty[card.id as Difficulty]}</span>
                        </span>
                        <span className="text-xs font-black uppercase tracking-wider">points</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    );
  }
  if (!question) return null;
  if (game.phase === "question-prompt")
    return (
      <main className="min-h-screen p-10" style={questionBackgroundStyle(team, question.difficulty)}>
        <DisplayHeader game={game} team={team} />
        <section className="question-reveal mx-auto grid min-h-[65vh] max-w-6xl place-items-center text-center">
          <div>
            <DisplayCategoryHeading category={question.category} detail={difficultyIcon} />
            <h2 className="text-5xl font-black leading-tight">
              {question.text}
            </h2>
          </div>
        </section>
      </main>
    );
  const result = game.phase === "answer-result";
  const pendingReveal = game.phase === "answer-pending-reveal";
  const selected = game.selectedOption;
  if (game.removedOptionIndexes.length || game.disabledOptionIndexes.length)
    return (
      <main className="min-h-screen p-10" style={questionBackgroundStyle(team, question.difficulty)}>
        <DisplayHeader game={game} team={team} />
        <section className="question-reveal mx-auto max-w-6xl">
          <DisplayCategoryHeading
            category={question.category}
            detail={difficultyIcon}
            timer={!result && !pendingReveal ? <Timer until={game.timerEndsAt} paused={game.timerPaused} remainingSeconds={game.timerRemainingSeconds} totalSeconds={questionTimerSeconds(game)} /> : undefined}
          />
          <h2 className="mb-10 text-center text-5xl font-black leading-tight">
            {question.text}
          </h2>
          {game.questionNotice && (
            <p className="mb-6 text-center text-xl font-bold text-amber-200">
              {game.questionNotice}
            </p>
          )}
          <div className="grid grid-cols-2 gap-5">
            {question.options.map((option, index) => {
              const removed =
                game.removedOptionIndexes.includes(index) ||
                game.disabledOptionIndexes.includes(index);
              const correct = result && question.correctOption === index;
              const wrong = result && selected === index && !correct;
              return (
                <div
                  key={option}
                  aria-disabled={removed || (timerExpired && !game.fullPointsOverride)}
                  className={`option-reveal rounded-2xl border-2 p-6 text-2xl font-bold ${(timerExpired && !game.fullPointsOverride) || removed
                      ? "border-slate-700 bg-slate-950 text-slate-500"
                      : correct
                        ? "border-emerald-400 bg-emerald-500/20"
                        : wrong
                          ? "border-rose-400 bg-rose-500/20"
                          : selected === index
                            ? "border-gold bg-amber-500/20"
                            : "border-slate-700 bg-panel"
                    }`}
                >
                  <span className={`mr-4 ${removed ? "text-slate-600" : "text-gold"}`}>{letters[index]}</span>
                  {option}
                </div>
              );
            })}
          </div>
          <LifelineBar team={team} />
          {result && (
            <p className="mt-8 text-center text-3xl font-black text-gold">
              {resultMessage(game)}
            </p>
          )}
        </section>
      </main>
    );
  return (
    <main className="min-h-screen p-10" style={questionBackgroundStyle(team, question.difficulty)}>
      <DisplayHeader game={game} team={team} />
      <section className="question-reveal mx-auto max-w-6xl">
        <DisplayCategoryHeading
          category={question.category}
          detail={difficultyIcon}
          timer={!result && !pendingReveal ? <Timer until={game.timerEndsAt} paused={game.timerPaused} remainingSeconds={game.timerRemainingSeconds} totalSeconds={questionTimerSeconds(game)} /> : undefined}
        />
        <h2 className="mb-10 text-center text-5xl font-black leading-tight">
          {question.text}
        </h2>
        <div className="grid grid-cols-2 gap-5">
          {question.options.map((option, index) => {
            if (game.removedOptionIndexes.includes(index)) return null;
            const correct = result && question.correctOption === index;
            const wrong = result && selected === index && !correct;
            return (
              <div
                key={option}
                aria-disabled={timerExpired && !game.fullPointsOverride}
                className={`option-reveal rounded-2xl border-2 p-6 text-2xl font-bold ${timerExpired && !game.fullPointsOverride
                    ? "border-slate-700 bg-slate-950 text-slate-500"
                    : correct
                    ? "border-emerald-400 bg-emerald-500/20"
                    : wrong
                      ? "border-rose-400 bg-rose-500/20"
                      : selected === index
                        ? "border-gold bg-amber-500/20"
                        : "border-slate-700 bg-panel"
                  }`}
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <span className="mr-4 text-gold">{letters[index]}</span>
                {option}
              </div>
            );
          })}
        </div>
        <LifelineBar
          team={team}
          onUse={(type) => action("use-lifeline", { type })}
          doubleTroubleActive={game.doubleTroubleActive}
          safeguardActive={game.safeguardActive}
        />
        {result && (
          <p className="mt-8 text-center text-3xl font-black text-gold">
            {resultMessage(game)}
          </p>
        )}
      </section>
    </main>
  );
  return (
    <main className="min-h-screen p-10" style={questionBackgroundStyle(team, question.difficulty)}>
      <DisplayHeader game={game} team={team} />
      <section className="question-reveal mx-auto max-w-6xl">
        <DisplayCategoryHeading category={question.category} detail={difficultyIcon} />
        <div className="mb-8 flex justify-center">
          <Timer until={game.timerEndsAt} totalSeconds={questionTimerSeconds(game)} />
        </div>
        <h2 className="mb-10 text-center text-5xl font-black leading-tight">
          {question.text}
        </h2>
        <div className="grid grid-cols-2 gap-5">
          {question.options.map((option, index) => {
            const correct = result && question.correctOption === index;
            const wrong = result && selected === index && !correct;
            return (
              <div
                key={option}
                className={`option-reveal rounded-2xl border-2 p-6 text-2xl font-bold ${correct
                    ? "border-emerald-400 bg-emerald-500/20"
                    : wrong
                      ? "border-rose-400 bg-rose-500/20"
                      : selected === index
                        ? "border-gold bg-amber-500/20"
                        : "border-slate-700 bg-panel"
                  }`}
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <span className="mr-4 text-gold">{letters[index]}</span>
                {option}
              </div>
            );
          })}
        </div>
        {result && (
          <p className="mt-8 text-center text-3xl font-black text-gold">
            {resultMessage(game)}
          </p>
        )}
      </section>
    </main>
  );
  return (
    <main className="min-h-screen p-10" style={questionBackgroundStyle(team, question.difficulty)}>
      <Scoreboard game={game} />
      <header className="mb-10 flex items-start gap-8">
        <div>
          <p className="text-lg text-gold">Now playing</p>
          <p className="text-3xl font-black text-gold">
            {team?.logo} {team?.name}
          </p>
          <h1 className="mt-3 text-4xl font-black">{game.rules.gameTitle}</h1>
          <p className="mt-1 text-lg font-bold text-gold">
            {game.rules.seasonTitle}
          </p>
          <p className="mt-2 text-sm font-bold uppercase tracking-[.25em] text-slate-300">
            {question.category} · {question.difficulty}
          </p>
        </div>
        <Timer until={game.timerEndsAt} totalSeconds={questionTimerSeconds(game)} />
      </header>
      <section className="question-reveal mx-auto max-w-6xl">
        <h2 className="mb-10 text-center text-5xl font-black leading-tight">
          {question.text}
        </h2>
        <div className="grid grid-cols-2 gap-5">
          {question.options.map((option, index) => {
            const correct = result && question.correctOption === index;
            const wrong = result && selected === index && !correct;
            return (
              <div
                key={option}
                className={`option-reveal rounded-2xl border-2 p-6 text-2xl font-bold ${correct
                    ? "border-emerald-400 bg-emerald-500/20"
                    : wrong
                      ? "border-rose-400 bg-rose-500/20"
                      : selected === index
                        ? "border-gold bg-amber-500/20"
                        : "border-slate-700 bg-panel"
                  }`}
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <span className="mr-4 text-gold">{letters[index]}</span>
                {option}
              </div>
            );
          })}
        </div>
        {result && (
          <p className="mt-8 text-center text-3xl font-black text-gold">
            {resultMessage(game)}
          </p>
        )}
      </section>
    </main>
  );
}

function Host({ game }: { game: Game }) {
  const team = activeTeam(game);
  const q = game.currentQuestion;
  const timerExpired = useTimerExpired(game.timerEndsAt);
  const choices =
    game.selectedCategory && game.selectedDifficulty
      ? game.questionSets[game.selectedCategory][game.selectedDifficulty]
      : [];
  const selectedDifficultyIcon = game.rules.difficultyDetails.find(
    (item) => item.id === game.selectedDifficulty
  )?.logo ?? "";
  const [muted, setMuted] = useState(false);
  const [lifelineToConfirm, setLifelineToConfirm] = useState<keyof Lifelines | null>(null);
  const canGoBack = [
    "team-selection",
    "team-members",
    "all-team-members",
    "category-selection",
    "difficulty-selection",
    "question-selection",
  ].includes(game.phase);
  const resetGame = () => {
    if (
      window.confirm(
        "Reset the entire game? This clears all team scores, attempted questions, and progress."
      )
    ) {
      sounds.stopSuspense();
      action("reset");
    }
  };
  const endGame = () => {
    if (window.confirm("End the game now? The projector will reveal the final standings and winner.")) {
      sounds.stopSuspense();
      action("end-game");
    }
  };
  const toggleSound = () => {
    const next = !muted;
    setMuted(next);
    sounds.setMuted(next);
  };
  const title = (
    <header className="mb-8 flex items-center justify-between">
      <p className="text-gold text-sm font-bold uppercase tracking-[.2em]">
        Host console
      </p>
      <div className="flex gap-3">
        {canGoBack && (
          <button onClick={() => action("back")} className="bg-slate-700">
            ← Back
          </button>
        )}
        <button onClick={toggleSound} className="bg-slate-700">
          {muted ? "🔇 Sound off" : "🔊 Sound on"}
        </button>
        {game.phase !== "landing" && game.phase !== "game-over" && (
          <button onClick={endGame} className="bg-amber-600 text-ink">
            End game & reveal winner
          </button>
        )}
        <button onClick={resetGame} className="bg-rose-700">
          Reset game
        </button>
        <a
          className="rounded-lg bg-slate-700 px-4 py-3 font-bold"
          href="/?screen=display"
          target="_blank"
        >
          Open projector display
        </a>
      </div>
    </header>
  );
  if (game.phase === "landing")
    return (
      <main className="host" style={hostBackgroundStyle()}>
        {title}
        <Panel title="Start the game">
          <p className="mb-6 text-slate-300">
            The audience display is on the landing screen. Start when the show
            is ready to reveal the teams.
          </p>
          <button onClick={() => action("start")} className="bg-gold text-ink">
            Reveal teams
          </button>
        </Panel>
      </main>
    );
  if (game.phase === "game-over") {
    const finalStandings = rankedTeams(game);
    const winner = finalStandings[0];
    return (
      <main className="host" style={hostBackgroundStyle(winner)}>
        {title}
        <Panel title="Finale is live on the projector">
          <p className="mb-6 text-xl text-gold">
            {winner.logo} {winner.name} wins with {winner.score} points.
          </p>
          <div className="grid gap-3">
            {finalStandings.map((item, index) => (
              <div key={item.id} className="flex items-center gap-4 rounded-xl bg-slate-800/80 px-5 py-4">
                <strong className="w-7 text-gold">{index + 1}</strong>
                <span className="text-2xl" aria-hidden="true">{item.logo}</span>
                <span className="flex-1 text-xl font-bold">{item.name}</span>
                <strong className="text-gold">{item.score} pts</strong>
              </div>
            ))}
          </div>
          <button onClick={resetGame} className="mt-7 bg-rose-700">Start a new game</button>
        </Panel>
      </main>
    );
  }
  if (game.phase === "team-selection")
    return (
      <main className="host" style={hostBackgroundStyle()}>
        {title}
        <Panel title="Select the next playing team">
          <div className="mb-5 text-center">
            <button onClick={() => action("reveal-all-team-members")} className="bg-gold text-ink">
              Show all teams and members
            </button>
          </div>
          <div className={`grid gap-3 ${matrixGrid(game.teams.length)}`}>
            {game.teams.map((item) => {
              const done =
                game.attempts.filter((a) => a.teamId === item.id).length ===
                game.rules.categories.length * 2;
              return (
                <div
                  key={item.id}
                  style={{
                    backgroundImage: `linear-gradient(rgba(5, 11, 18, 0.2), rgba(5, 11, 18, 0.55)), url(${teamBackdrops[item.id]
                      })`,
                    backgroundPosition: "center",
                    backgroundSize: "cover",
                  }}
                  className="team-selection-host-card"
                >
                  <button disabled={done} onClick={() => action("select-team", { teamId: item.id })} className="team-selection-host-main">
                    <span className="shrink-0 text-5xl">{item.logo}</span>
                    <span className="min-w-0 flex-1 text-3xl font-black">
                      {item.name}
                      <small className="mt-2 block text-lg font-medium text-slate-200">{item.description}</small>
                    </span>
                    <span className="shrink-0 text-xl font-black text-gold">{done ? "Complete" : `${item.score} pts`}</span>
                  </button>
                  <button onClick={() => action("reveal-team-members", { teamId: item.id })} className="team-members-trigger">
                    Reveal members <span aria-hidden="true">({item.members.length})</span>
                  </button>
                </div>
              );
            })}
          </div>
        </Panel>
      </main>
    );
  if (game.phase === "team-members") {
    const rosterTeam = game.teams.find((item) => item.id === game.revealedTeamId);
    if (!rosterTeam) return null;
    return (
      <main className="host" style={hostBackgroundStyle(rosterTeam)}>
        {title}
        <Panel title={`${rosterTeam.name}: team members`}>
          <p className="mb-5 text-slate-300">The roster is now visible on the projector display.</p>
          <div className="team-members-grid team-members-grid-host">
            {rosterTeam.members.length ? rosterTeam.members.map((member) => <div key={member} className="team-member-card">{member}</div>) : <p>No team members are configured in the CSV.</p>}
          </div>
          <button onClick={() => action("hide-team-members")} className="mt-6 bg-gold text-ink">Back to teams</button>
        </Panel>
      </main>
    );
  }
  if (game.phase === "all-team-members")
    return (
      <main className="host" style={hostBackgroundStyle()}>
        {title}
        <Panel title="All teams and team members">
          <p className="mb-5 text-slate-300">All rosters are now visible on the projector display.</p>
          <button onClick={() => action("hide-team-members")} className="bg-gold text-ink">Back to teams</button>
        </Panel>
      </main>
    );
  if (game.phase === "category-selection")
    return (
      <main className="host" style={hostBackgroundStyle(team)}>
        {title}
        <Panel title={`${team?.name}: select a category`}>
          <div
            className={`grid gap-4 ${matrixGrid(
              game.rules.categoryDetails.length
            )}`}
          >
            {game.rules.categoryDetails.map((category) => {
              const locked = categoryComplete(game, category.name);
              return (
                <button
                  key={category.name}
                  disabled={locked}
                  onClick={() =>
                    action("select-category", { category: category.name })
                  }
                  className="bg-slate-700 text-left"
                >
                  <span className="mr-3 text-3xl">{category.logo}</span>
                  <strong className="text-2xl">{category.name}</strong>
                  <small className="ml-3 text-slate-300">
                    {locked ? "Completed by this team" : category.description}
                  </small>
                </button>
              );
            })}
          </div>
        </Panel>
      </main>
    );
  if (game.phase === "difficulty-selection")
    return (
      <main className="host" style={hostBackgroundStyle(team)}>
        {title}
        <Panel title={`${team?.name}: ${game.selectedCategory}`}>
          <p className="mb-5 text-slate-300">
            Choose any difficulty for this question. Difficulty levels can be
            selected again.
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            {game.rules.difficultyDetails.map((difficulty) => (
              <button
                key={difficulty.id}
                onClick={() =>
                  action("select-difficulty", { difficulty: difficulty.id })
                }
                style={{
                  backgroundImage: difficultyThemes[difficulty.id as Difficulty].cardBackground,
                  borderColor: difficultyThemes[difficulty.id as Difficulty].border,
                }}
                className="border text-left"
              >
                <span className="mr-3 text-2xl">{difficulty.logo}</span>
                <strong className="text-xl">{difficulty.name}</strong>
                <small className="block mt-2 text-slate-300">
                  {difficulty.description}
                </small>
                <span className="text-gold">
                  {game.rules.pointsByDifficulty[difficulty.id as Difficulty]}{" "}
                  pts
                </span>
              </button>
            ))}
          </div>
        </Panel>
      </main>
    );
  if (game.phase === "question-selection")
    return (
      <main className="host" style={hostBackgroundStyle(team)}>
        {title}
        <Panel
          title={`${team?.name}: ${game.selectedCategory} / ${selectedDifficultyIcon}`}
        >
          <p className="mb-5 text-slate-300">
            Let the team select a numbered tile. The question remains hidden
            until selected.
          </p>
          <div className="grid grid-cols-5 gap-3 mx-auto max-w-3xl">
            {choices.map((question) => (
              <button
                key={question.id}
                disabled={game.usedQuestionIds.includes(question.id)}
                onClick={() => {
                  sounds.startSuspense();
                  action("select-question", { number: question.number });
                }}
                className="mystery-question-button"
              >
                <img src={mysteryBox} alt="" aria-hidden="true" />
                <span>{question.number}</span>
              </button>
            ))}
          </div>
        </Panel>
      </main>
    );
  if (game.phase === "question-prompt" && q)
    return (
      <main className="host" style={hostBackgroundStyle(team)}>
        {title}
        <Panel title={`${team?.name}: question ${q.number}`}>
          <p className="mb-5 text-sm uppercase tracking-wider text-gold">
            {q.category} / {q.difficulty} /{" "}
            {game.rules.pointsByDifficulty[q.difficulty]} points
          </p>
          <h2 className="mb-6 text-3xl font-black">{q.text}</h2>
          <p className="mb-6 text-slate-300">
            The projector is showing the question only. Reveal the choices when
            the team is ready.
          </p>
          <button
            onClick={() => action("reveal-options")}
            className="bg-gold text-ink"
          >
            Reveal options
          </button>
        </Panel>
      </main>
    );
  if (!q) return null;
  if (game.phase === "question-transition")
    return (
      <main className="host" style={hostBackgroundStyle(team)}>
        {title}
        <Panel title="Question selected">
          <p className="text-xl text-gold">
            Question {q.number} is being revealed on the projector…
          </p>
        </Panel>
      </main>
    );
  if (game.phase === "question" && q)
    return (
      <main className="host" style={hostBackgroundStyle(team)}>
        {title}
        <Panel title={`${team?.name}: question ${q.number}`}>
          <p className="mb-5 text-sm uppercase tracking-wider text-gold">
            {q.category} / {q.difficulty} /{" "}
            {game.rules.pointsByDifficulty[q.difficulty]} points{" "}
            {game.answerAttempt === 2 && "· second attempt: half points"}
          </p>
          <div className="mb-5 flex items-center justify-between gap-4">
            <Timer
              until={game.timerEndsAt}
              paused={game.timerPaused}
              remainingSeconds={game.timerRemainingSeconds}
              totalSeconds={questionTimerSeconds(game)}
            />
            <button
              onClick={() => action("toggle-clock")}
              className="bg-slate-700"
            >
              {game.timerPaused ? "Resume timer" : "Pause timer"}
            </button>
            <button
              onClick={() => action("toggle-full-points-override")}
              className={game.fullPointsOverride ? "bg-emerald-500 text-ink" : "bg-slate-700"}
            >
              {game.fullPointsOverride ? "Superadmin override active" : "Superadmin: override timer"}
            </button>
          </div>
          <h2 className="mb-6 text-3xl font-black">{q.text}</h2>
          {game.questionNotice && (
            <p className="mb-5 rounded-xl border border-amber-400 bg-amber-500/15 p-4 font-bold text-amber-200">
              {game.questionNotice}
            </p>
          )}
          <div className="grid gap-3">
            {q.options.map((option, index) => {
              const removed =
                game.removedOptionIndexes.includes(index) ||
                game.disabledOptionIndexes.includes(index);
              return (
                <button
                  key={option}
                  disabled={removed || (timerExpired && !game.fullPointsOverride)}
                  onClick={() => {
                    sounds.stopSuspense();
                    sounds.playSelection();
                    action("select-option", { optionIndex: index });
                  }}
                  className={`text-left ${removed || (timerExpired && !game.fullPointsOverride) ? "bg-slate-950 text-slate-500" : "bg-slate-700"}`}
                >
                  <span className={`mr-3 ${removed || (timerExpired && !game.fullPointsOverride) ? "text-slate-600" : "text-gold"}`}>{letters[index]}</span>
                  {option}
                </button>
              );
            })}
          </div>
          <div className="mt-6">
            <button
              onClick={() => action("skip-question")}
              className="bg-slate-700"
            >
              Skip question (no score change)
            </button>
          </div>
          <LifelineBar
            team={team}
            onUse={setLifelineToConfirm}
            doubleTroubleActive={game.doubleTroubleActive}
            safeguardActive={game.safeguardActive}
          />
          {lifelineToConfirm && (() => {
            const lifeline = lifelineItems.find((item) => item.type === lifelineToConfirm)!;
            return (
              <div className="mt-6 rounded-xl border border-gold bg-amber-400/15 p-5 text-center">
                <p className="text-xl font-black text-gold">Use {lifeline.label}?</p>
                <p className="mt-2 text-slate-200">This lifeline can only be used once by this team.</p>
                <div className="mt-4 flex justify-center gap-3">
                  <button onClick={() => setLifelineToConfirm(null)} className="bg-slate-700">Cancel</button>
                  <button onClick={() => { action("use-lifeline", { type: lifelineToConfirm }); setLifelineToConfirm(null); }} className="bg-gold text-ink">Confirm lifeline</button>
                </div>
              </div>
            );
          })()}
        </Panel>
      </main>
    );
  return (
    <main className="host" style={hostBackgroundStyle(team)}>
      {title}
      <Panel title={`${team?.name}: question ${q.number}`}>
        <p className="mb-5 text-sm uppercase tracking-wider text-gold">
          {q.category} · {q.difficulty} ·{" "}
          {game.rules.pointsByDifficulty[q.difficulty]} points
        </p>
        {game.phase === "answer-review" && (
          <div className="mb-5 flex justify-center">
            <Timer until={game.timerEndsAt} paused={game.timerPaused} remainingSeconds={game.timerRemainingSeconds} totalSeconds={questionTimerSeconds(game)} />
          </div>
        )}
        <h2 className="mb-6 text-3xl font-black">{q.text}</h2>
        {game.questionNotice && (
          <p className="mb-5 rounded-xl border border-amber-400 bg-amber-500/15 p-4 font-bold text-amber-200">
            {game.questionNotice}
          </p>
        )}
        {game.phase === "answer-review" && (
          <p className="mb-5 text-sm font-bold text-gold">
            Review the selection below. You can choose a different answer before confirming.
          </p>
        )}
        {game.phase === "answer-pending-reveal" && (
          <div className="mb-5 rounded-xl border border-gold/70 bg-amber-400/10 p-5 text-center">
            <p className="mb-4 font-bold text-gold">Final answer recorded. The correct answer is still hidden on the projector.</p>
            <button onClick={() => action("reveal-answer")} className="bg-gold text-ink">
              Reveal correct answer
            </button>
          </div>
        )}
        <div className="grid gap-3">
          {q.options.map((option, index) => (
            <button
              key={option}
              disabled={
                game.phase !== "answer-review" ||
                game.removedOptionIndexes.includes(index) ||
                game.disabledOptionIndexes.includes(index)
              }
              onClick={() => {
                sounds.stopSuspense();
                sounds.playSelection();
                action("select-option", { optionIndex: index });
              }}
              className={`text-left ${timerExpired
                  ? "bg-slate-950 text-slate-500"
                  : game.selectedOption === index
                  ? "bg-gold text-ink"
                  : "bg-slate-700"
                }`}
            >
              <span className="mr-3 text-gold">{letters[index]}</span>
              {option}
            </button>
          ))}
        </div>
        {game.phase === "answer-review" && (
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => action("toggle-full-points-override")}
              className={game.fullPointsOverride ? "bg-emerald-500 text-ink" : "bg-slate-700"}
            >
              {game.fullPointsOverride ? "Superadmin: full points enabled" : "Superadmin: award full points"}
            </button>
            <button
              onClick={() => {
                sounds.stopSuspense();
                game.selectedOption === q.correctOption
                  ? sounds.playCorrect()
                  : sounds.playWrong();
                action("mark-answer");
              }}
              className="bg-gold text-ink"
            >
              Confirm answer
            </button>
            <button
              onClick={() => action("skip-question")}
              className="bg-slate-700"
            >
              Skip question
            </button>
          </div>
        )}
        {game.phase === "answer-result" && (
          <>
            <p className="mt-6 text-xl font-black text-gold">
              {resultMessage(game)}
            </p>
            <button
              onClick={() => action("continue")}
              className="mt-6 bg-gold text-ink"
            >
              Continue
            </button>
          </>
        )}
      </Panel>
    </main>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-panel p-7">
      <h2 className="mb-6 text-2xl font-black">{title}</h2>
      {children}
    </section>
  );
}

function GameRules({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div className="rules-overlay" role="presentation" onMouseDown={onClose}>
      <section
        className="rules-poster"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rules-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="rules-close" type="button" onClick={onClose} aria-label="Close game rules">×</button>
        <header className="rules-poster-heading">
          <img src={lionTitleBanner} alt="Gloria Ke Sikandar — Season 2: Dhurandhar" />
          <h1 id="rules-title">Game Rules</h1>
          <span>Rules · scoring · lifelines · trump cards</span>
        </header>
        <div className="rules-grid">
          <article className="rules-teams"><h2>Teams & rounds</h2><p>Players are divided into 4 teams.</p><div className="rules-team-badges" aria-label="Teams"><span className="rules-team-raw">RAW</span><span className="rules-team-kgb">KGB</span><span className="rules-team-cia">CIA</span><span className="rules-team-mossad">Mossad</span></div><p>The game is conducted in 8 rounds. Each team plays 2 rounds, in the sequence shown by the host.</p></article>
          <article className="rules-rounds"><h2>Sequence of rounds</h2><div className="rules-round-strip"><span>1<br /><b>RAW</b></span><i>→</i><span>2<br /><b>KGB</b></span><i>→</i><span>3<br /><b>CIA</b></span><i>→</i><span>4<br /><b>Mossad</b></span></div><p>The order rotates in later sets so every team gets its turn.</p></article>
          <article><h2>Categories</h2><div className="rules-category-icons" aria-hidden="true"><span>🏆</span><span>📚</span><span>🌍</span><span>🎬</span><span>🎵</span><span>🔬</span></div><p>There are 12 categories. A team plays 8 categories and can choose its category in each round. The same category may be selected twice.</p></article>
          <article className="rules-points"><h2>Points & time</h2><div className="rules-score-table"><span>Easy <b>10</b><em>30s / 20s</em></span><span>Medium <b>20</b><em>60s / 40s</em></span><span>Difficult <b>30</b><em>90s / 60s</em></span></div><p>Time shown is first attempt / second attempt.</p></article>
          <article><h2>Attempts</h2><p>There is no negative marking on the first attempt.</p><p>On a wrong second attempt, 10 points are deducted. A team may decline the second attempt to avoid the penalty.</p><p>No first-attempt selection means the question is skipped, with no points gained or lost.</p></article>
          <article className="rules-lifelines"><h2>Lifelines</h2><div className="rules-lifeline-art"><span><i className="lifeline-sprite lifeline-sprite-removeTwo" /><b>Remove 2</b></span><span><i className="lifeline-sprite lifeline-sprite-flip" /><b>Flip</b></span></div><p>Each team has 2 lifelines, usable once each. Remove 2 removes two wrong answers; Flip replaces the question and restarts the first attempt. Both may be used on one question if required.</p></article>
          <article className="rules-trumps"><h2>Trump cards</h2><div className="rules-trump-art"><span><b>2×</b><em>Double Trouble</em></span><span><b>🛡</b><em>Safeguard</em></span></div><p>Declare a trump card before choosing a question. Double Trouble doubles points and penalties; Safeguard prevents negative marking, even on the second attempt.</p></article>
          <article><h2>Winning</h2><p>The team with the highest score at the end of the game is declared the winner.</p></article>
        </div>
        <p className="rules-dismiss">Click outside, press Esc, or use × to return to the game.</p>
      </section>
    </div>
  );
}

function App() {
  const game = useGame();
  const [rulesOpen, setRulesOpen] = useState(false);
  if (!game)
    return (
      <>
        <BrandBanner />
        <div className="screen-content">
          <main className="grid min-h-screen place-items-center">
            Connecting to the quiz server…
          </main>
        </div>
      </>
    );
  const isDisplay =
    new URLSearchParams(location.search).get("screen") === "display";
  const isLandingDisplay = isDisplay && game.phase === "landing";
  const showScoreboardLane =
    isDisplay && !isLandingDisplay && !game.timerPaused && !["all-team-members", "game-over"].includes(game.phase);
  const showDisplayLifelines =
    isDisplay && game.phase === "question" && !game.timerPaused;
  const screen = isDisplay ? <Display game={game} /> : <Host game={game} />;
  return (
    <>
      <BrandBanner
        showGameTitle={!isLandingDisplay}
        showDhurandhar={!isLandingDisplay}
      />
      {!isLandingDisplay && game.phase !== "game-over" && (
        <button className="rules-trigger" type="button" onClick={() => setRulesOpen(true)} aria-haspopup="dialog" aria-label="Show game rules">
          <span aria-hidden="true">?</span><span>Rules</span>
        </button>
      )}
      {showDisplayLifelines && <DisplayLifelines team={activeTeam(game)} doubleTroubleActive={game.doubleTroubleActive} safeguardActive={game.safeguardActive} />}
      <div
        className={`screen-content ${showScoreboardLane ? "has-scoreboard" : ""
          } ${showDisplayLifelines ? "has-lifelines" : ""}`}
      >
        {screen}
      </div>
      {rulesOpen && <GameRules onClose={() => setRulesOpen(false)} />}
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
