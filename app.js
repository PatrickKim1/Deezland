/* ============================================
   DEEZ - Reach Nirvana Together
   ============================================ */

// --- Animals ---
const ANIMALS = [
  { emoji: '🐕', name: 'Buddy', trait: 'loyal' },
  { emoji: '🐱', name: 'Zen', trait: 'wise' },
  { emoji: '🦊', name: 'Spark', trait: 'clever' },
  { emoji: '🐼', name: 'Chill', trait: 'relaxed' },
  { emoji: '🐨', name: 'Hugz', trait: 'caring' },
  { emoji: '🦁', name: 'Roar', trait: 'fierce' },
  { emoji: '🐸', name: 'Leap', trait: 'energetic' },
  { emoji: '🦄', name: 'Dream', trait: 'magical' },
  { emoji: '🐙', name: 'Flow', trait: 'flexible' },
  { emoji: '🦋', name: 'Fly', trait: 'free' },
];

// --- Nirvana Levels ---
const NIRVANA_LEVELS = [
  { name: 'Seedling', icon: '🌱', xp: 0 },
  { name: 'Sprout', icon: '🌿', xp: 100 },
  { name: 'Bloom', icon: '🌸', xp: 300 },
  { name: 'Tree', icon: '🌳', xp: 600 },
  { name: 'Forest', icon: '🏕️', xp: 1000 },
  { name: 'Mountain', icon: '🏔️', xp: 1500 },
  { name: 'Cloud', icon: '☁️', xp: 2100 },
  { name: 'Star', icon: '⭐', xp: 2800 },
  { name: 'Cosmos', icon: '🌌', xp: 3600 },
  { name: 'Nirvana', icon: '🪷', xp: 4500 },
];

// --- Habit Emoji Options ---
const HABIT_EMOJIS = [
  '💪', '🏃', '📚', '🧘', '💧', '🥗', '😴', '✍️',
  '🎵', '🧹', '💊', '🌅', '🧠', '💰', '🎨', '🌿',
  '📱', '🐾', '🍳', '🧘‍♂️', '🚶', '💻', '🎯', '❤️',
];

// --- Mascot Messages ---
const MASCOT_MESSAGES = {
  morning: [
    "Rise and shine! Let's crush some habits today!",
    "Good morning, sunshine! Ready to level up?",
    "A new day, a new chance to be awesome!",
    "The early bird gets the XP! Let's go!",
  ],
  afternoon: [
    "Keep the momentum going! You're doing great!",
    "Halfway through the day - keep pushing!",
    "Don't forget your habits! You've got this!",
    "Your future self will thank you. Keep going!",
  ],
  evening: [
    "Last chance to check off today's habits!",
    "Wind down strong - finish those habits!",
    "You're almost at the finish line for today!",
    "End the day right - complete your habits!",
  ],
  allDone: [
    "ALL HABITS DONE! You absolute legend!",
    "Perfect day! Your nirvana journey continues!",
    "100%! Nothing can stop you!",
    "Every habit crushed! You're unstoppable!",
  ],
  streak: [
    "streak going! The fire burns bright!",
    "day streak! You're on FIRE!",
    "days strong! Legendary commitment!",
  ],
  empty: [
    "Add your first habit and start your journey to nirvana!",
    "Every great journey starts with a single habit. Add one!",
  ],
};

// --- Default Friends (Demo) ---
const DEFAULT_FRIENDS = [
  {
    id: 'f1',
    name: 'Alex',
    animal: 3, // fox
    level: 4,
    online: true,
    habits: [
      { name: 'Run 5K', emoji: '🏃', done: true },
      { name: 'Read', emoji: '📚', done: true },
      { name: 'Meditate', emoji: '🧘', done: false },
    ],
    streak: 12,
  },
  {
    id: 'f2',
    name: 'Jordan',
    animal: 7, // unicorn
    level: 6,
    online: true,
    habits: [
      { name: 'Gym', emoji: '💪', done: true },
      { name: 'Journal', emoji: '✍️', done: true },
      { name: 'No sugar', emoji: '🥗', done: true },
      { name: 'Sleep 8h', emoji: '😴', done: false },
    ],
    streak: 28,
  },
  {
    id: 'f3',
    name: 'Sam',
    animal: 0, // dog
    level: 2,
    online: false,
    habits: [
      { name: 'Walk dog', emoji: '🐾', done: true },
      { name: 'Drink water', emoji: '💧', done: false },
    ],
    streak: 3,
  },
  {
    id: 'f4',
    name: 'Riley',
    animal: 5, // lion
    level: 8,
    online: true,
    habits: [
      { name: 'Code 1hr', emoji: '💻', done: true },
      { name: 'Exercise', emoji: '🏃', done: true },
      { name: 'Read 30m', emoji: '📚', done: true },
      { name: 'Meditate', emoji: '🧘', done: true },
      { name: 'Cook', emoji: '🍳', done: true },
    ],
    streak: 45,
  },
];

// --- State ---
const today = () => new Date().toISOString().split('T')[0];

function loadState() {
  try {
    const saved = localStorage.getItem('deez-state');
    if (saved) return JSON.parse(saved);
  } catch (e) { /* fresh start */ }
  return null;
}

function saveState() {
  localStorage.setItem('deez-state', JSON.stringify(state));
}

let state = loadState() || {
  user: null, // { name, animal (index) }
  habits: [],
  friends: DEFAULT_FRIENDS,
  xp: 0,
  notifications: [],
  completionLog: {}, // { 'YYYY-MM-DD': ['habitId1', 'habitId2'] }
};

let currentPage = 'dashboard';

// --- Utility ---
function $(sel, parent = document) { return parent.querySelector(sel); }
function $$(sel, parent = document) { return [...parent.querySelectorAll(sel)]; }

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getNirvanaLevel(xp) {
  let level = NIRVANA_LEVELS[0];
  for (const l of NIRVANA_LEVELS) {
    if (xp >= l.xp) level = l;
    else break;
  }
  return level;
}

function getNirvanaProgress(xp) {
  const level = getNirvanaLevel(xp);
  const levelIndex = NIRVANA_LEVELS.indexOf(level);
  if (levelIndex === NIRVANA_LEVELS.length - 1) return 100;
  const next = NIRVANA_LEVELS[levelIndex + 1];
  const progress = ((xp - level.xp) / (next.xp - level.xp)) * 100;
  return Math.min(100, Math.max(0, progress));
}

function getStreak(habit) {
  let streak = 0;
  const d = new Date();
  // Check today first
  const todayStr = today();
  const todayDone = state.completionLog[todayStr]?.includes(habit.id);

  // Start from yesterday if today isn't done yet, otherwise from today
  if (!todayDone) d.setDate(d.getDate() - 1);

  while (true) {
    const dateStr = d.toISOString().split('T')[0];
    if (state.completionLog[dateStr]?.includes(habit.id)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function getTodayCompletedCount() {
  return state.completionLog[today()]?.length || 0;
}

function getTotalCompletions() {
  let total = 0;
  for (const date in state.completionLog) {
    total += state.completionLog[date].length;
  }
  return total;
}

function getLongestStreak() {
  let longest = 0;
  for (const habit of state.habits) {
    const s = getStreak(habit);
    if (s > longest) longest = s;
  }
  return longest;
}

function getDaysActive() {
  return Object.keys(state.completionLog).length;
}

// --- Confetti ---
const confettiCanvas = document.getElementById('confetti-canvas');
const confettiCtx = confettiCanvas.getContext('2d');
let confettiParticles = [];
let confettiRunning = false;

function resizeConfetti() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}
resizeConfetti();
window.addEventListener('resize', resizeConfetti);

function fireConfetti(x, y) {
  const colors = ['#ff6b35', '#ff4f81', '#a855f7', '#4ade80', '#fbbf24', '#60a5fa', '#2dd4bf'];
  for (let i = 0; i < 40; i++) {
    const angle = (Math.PI * 2 * i) / 40 + (Math.random() - 0.5);
    const speed = 4 + Math.random() * 6;
    confettiParticles.push({
      x: x || window.innerWidth / 2,
      y: y || window.innerHeight / 2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 4 + Math.random() * 4,
      life: 1,
      decay: 0.015 + Math.random() * 0.01,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
    });
  }
  if (!confettiRunning) {
    confettiRunning = true;
    animateConfetti();
  }
}

function animateConfetti() {
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  confettiParticles = confettiParticles.filter(p => p.life > 0);

  for (const p of confettiParticles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.15;
    p.vx *= 0.99;
    p.life -= p.decay;
    p.rotation += p.rotationSpeed;

    confettiCtx.save();
    confettiCtx.translate(p.x, p.y);
    confettiCtx.rotate((p.rotation * Math.PI) / 180);
    confettiCtx.globalAlpha = p.life;
    confettiCtx.fillStyle = p.color;
    confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
    confettiCtx.restore();
  }

  if (confettiParticles.length > 0) {
    requestAnimationFrame(animateConfetti);
  } else {
    confettiRunning = false;
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  }
}

// --- Toast ---
function showToast(icon, message, duration = 2500) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('leaving');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// --- Hi-Five Animation ---
function showHiFive(friendName) {
  const overlay = document.createElement('div');
  overlay.className = 'hifive-overlay';
  overlay.innerHTML = '<div class="hifive-hand">🙌</div>';
  document.body.appendChild(overlay);
  fireConfetti();
  showToast('🙌', `You hi-fived ${friendName}!`);
  setTimeout(() => overlay.remove(), 800);
}

// --- Poke Animation ---
function showPoke(friendId, friendName) {
  const card = document.querySelector(`[data-friend-id="${friendId}"]`);
  if (card) {
    card.classList.remove('poke-shake');
    void card.offsetWidth; // force reflow
    card.classList.add('poke-shake');
  }
  showToast('👉', `You poked ${friendName}! They'll feel that!`);
}

// --- Router ---
function navigate(page) {
  currentPage = page;
  render();
}

// --- Render Engine ---
function render() {
  const app = document.getElementById('app');

  if (!state.user) {
    app.innerHTML = renderOnboarding();
    attachOnboardingEvents();
    return;
  }

  app.innerHTML = `
    <div class="main-layout">
      <div class="page-content" id="page-content">
        ${renderPage()}
      </div>
      ${renderBottomNav()}
    </div>
  `;

  attachPageEvents();
  renderFloatingAnimals();
}

// --- Onboarding ---
let onboardingStep = 0;
let onboardingName = '';
let onboardingAnimal = -1;

function renderOnboarding() {
  if (onboardingStep === 0) {
    return `
      <div class="onboarding">
        <div class="onboarding-logo">🪷</div>
        <h1>Deez</h1>
        <p class="onboarding-subtitle">Reach nirvana together with your friends. Track habits. Send vibes. Ascend.</p>
        <div class="onboarding-step">
          <h2>What's your name?</h2>
          <input type="text" class="onboarding-input" id="name-input"
            placeholder="Enter your name" maxlength="20" autocomplete="off"
            value="${onboardingName}">
          <button class="btn-primary" id="next-btn" ${onboardingName.trim().length < 1 ? 'disabled' : ''}>
            Continue
          </button>
        </div>
      </div>
    `;
  }

  return `
    <div class="onboarding">
      <div class="onboarding-logo">🪷</div>
      <h1>Deez</h1>
      <p class="onboarding-subtitle">Choose your spirit animal. They'll be your companion on the path to nirvana.</p>
      <div class="onboarding-step">
        <h2>Pick your spirit animal</h2>
        <div class="animal-grid">
          ${ANIMALS.map((a, i) => `
            <div class="animal-option ${onboardingAnimal === i ? 'selected' : ''}" data-animal="${i}">
              ${a.emoji}
            </div>
          `).join('')}
        </div>
        <div class="animal-name">
          ${onboardingAnimal >= 0 ? `${ANIMALS[onboardingAnimal].name} the ${ANIMALS[onboardingAnimal].trait}` : 'Tap to choose'}
        </div>
        <button class="btn-primary" id="start-btn" ${onboardingAnimal < 0 ? 'disabled' : ''}>
          Begin Journey 🚀
        </button>
      </div>
    </div>
  `;
}

function attachOnboardingEvents() {
  const nameInput = $('#name-input');
  const nextBtn = $('#next-btn');
  const startBtn = $('#start-btn');

  if (nameInput) {
    nameInput.focus();
    nameInput.addEventListener('input', (e) => {
      onboardingName = e.target.value;
      nextBtn.disabled = onboardingName.trim().length < 1;
    });
    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && onboardingName.trim().length >= 1) {
        onboardingStep = 1;
        render();
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (onboardingName.trim().length >= 1) {
        onboardingStep = 1;
        render();
      }
    });
  }

  $$('.animal-option').forEach(el => {
    el.addEventListener('click', () => {
      onboardingAnimal = parseInt(el.dataset.animal);
      render();
    });
  });

  if (startBtn) {
    startBtn.addEventListener('click', () => {
      if (onboardingAnimal >= 0) {
        state.user = {
          name: onboardingName.trim(),
          animal: onboardingAnimal,
          joinDate: today(),
        };
        saveState();
        fireConfetti();
        showToast('🎉', `Welcome, ${state.user.name}! Your journey begins!`);
        render();
      }
    });
  }
}

// --- Pages ---
function renderPage() {
  switch (currentPage) {
    case 'dashboard': return renderDashboard();
    case 'friends': return renderFriends();
    case 'stats': return renderStats();
    case 'profile': return renderProfile();
    default: return renderDashboard();
  }
}

// --- Dashboard ---
function renderDashboard() {
  const animal = ANIMALS[state.user.animal];
  const todayDone = state.completionLog[today()] || [];
  const allDone = state.habits.length > 0 && todayDone.length >= state.habits.length;
  const timeOfDay = getTimeOfDay();

  let mascotMsg;
  if (state.habits.length === 0) {
    mascotMsg = randomFrom(MASCOT_MESSAGES.empty);
  } else if (allDone) {
    mascotMsg = randomFrom(MASCOT_MESSAGES.allDone);
  } else {
    mascotMsg = randomFrom(MASCOT_MESSAGES[timeOfDay]);
  }

  return `
    <div class="page-header">
      <h1><span class="header-animal">${animal.emoji}</span> Today</h1>
      <div class="header-actions">
        <button class="header-btn" id="add-habit-btn" title="Add habit">＋</button>
      </div>
    </div>

    <div class="nirvana-section">
      <div class="nirvana-card">
        <div class="nirvana-header">
          <div class="nirvana-level">
            <span class="nirvana-level-icon">${getNirvanaLevel(state.xp).icon}</span>
            <div class="nirvana-level-info">
              <h3>${getNirvanaLevel(state.xp).name}</h3>
              <span>Path to Nirvana</span>
            </div>
          </div>
          <div class="nirvana-xp"><strong>${state.xp}</strong> XP</div>
        </div>
        <div class="nirvana-bar-track">
          <div class="nirvana-bar-fill" style="width: ${getNirvanaProgress(state.xp)}%"></div>
        </div>
      </div>
    </div>

    <div class="mascot-section">
      <div class="mascot-bubble">
        <div class="mascot-avatar">${animal.emoji}</div>
        <div class="mascot-text">
          <p><strong>${animal.name} says:</strong> ${mascotMsg}</p>
        </div>
      </div>
    </div>

    ${state.habits.length > 0 ? `
      <div class="section-header">
        <h2>Habits <span class="section-count">${todayDone.length}/${state.habits.length}</span></h2>
      </div>
      <div class="habits-list">
        ${state.habits.map((habit, i) => {
          const done = todayDone.includes(habit.id);
          const streak = getStreak(habit);
          return `
            <div class="habit-card ${done ? 'completed' : ''} habit-card-delay-${i + 1}"
                 data-habit-id="${habit.id}">
              <div class="habit-checkbox ${done ? 'check-pop' : ''}">
                ${done ? '✓' : ''}
              </div>
              <span class="habit-emoji">${habit.emoji}</span>
              <div class="habit-info">
                <div class="habit-name">${habit.name}</div>
                ${streak > 0 ? `
                  <div class="habit-streak">
                    <span class="streak-fire">🔥</span> ${streak} day${streak !== 1 ? 's' : ''}
                  </div>
                ` : ''}
              </div>
              <span class="habit-animal">${ANIMALS[habit.animal || state.user.animal].emoji}</span>
            </div>
          `;
        }).join('')}
      </div>
    ` : `
      <div class="empty-state">
        <div class="empty-state-icon">${animal.emoji}</div>
        <h3>No habits yet!</h3>
        <p>${animal.name} is waiting for you to start your journey. Add your first habit!</p>
        <button class="btn-primary" id="add-habit-empty-btn">Add First Habit ✨</button>
      </div>
    `}
  `;
}

// --- Friends ---
function renderFriends() {
  return `
    <div class="page-header">
      <h1>🤝 Friends</h1>
    </div>

    <div class="friends-list">
      ${state.friends.map((friend, i) => {
        const friendAnimal = ANIMALS[friend.animal];
        const friendLevel = getNirvanaLevel(friend.level * 200);
        return `
          <div class="friend-card friend-card-delay-${i + 1}" data-friend-id="${friend.id}">
            <div class="friend-header">
              <div class="friend-avatar">${friendAnimal.emoji}</div>
              <div class="friend-info">
                <div class="friend-name">${friend.name}</div>
                <div class="friend-status">
                  <span class="status-dot ${friend.online ? '' : 'offline'}"></span>
                  ${friend.online ? 'Active now' : 'Offline'}
                  ${friend.streak > 0 ? ` · 🔥 ${friend.streak}` : ''}
                </div>
              </div>
              <span class="friend-level">${friendLevel.icon} ${friendLevel.name}</span>
            </div>
            <div class="friend-habits">
              ${friend.habits.map(h => `
                <span class="friend-habit-pill ${h.done ? 'done' : ''}">
                  ${h.emoji} ${h.name} ${h.done ? '✓' : ''}
                </span>
              `).join('')}
            </div>
            <div class="friend-actions">
              <button class="friend-action-btn btn-hifive" data-action="hifive" data-friend-id="${friend.id}" data-friend-name="${friend.name}">
                🙌 Hi Five
              </button>
              <button class="friend-action-btn btn-poke" data-action="poke" data-friend-id="${friend.id}" data-friend-name="${friend.name}">
                👉 Poke
              </button>
            </div>
          </div>
        `;
      }).join('')}
    </div>

    <div style="padding: 20px;">
      <button class="btn-secondary" style="width: 100%;" id="add-friend-btn">
        ➕ Add Friend
      </button>
    </div>
  `;
}

// --- Stats ---
function renderStats() {
  const totalCompletions = getTotalCompletions();
  const longestStreak = getLongestStreak();
  const daysActive = getDaysActive();
  const todayDone = getTodayCompletedCount();

  // Generate heatmap data (last 35 days = 5 weeks)
  const heatmapDays = [];
  const now = new Date();
  // Align to start of the week (Sunday)
  const dayOfWeek = now.getDay();

  for (let i = 34 + dayOfWeek; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i + dayOfWeek);
    const dateStr = d.toISOString().split('T')[0];
    const isFuture = d > now;
    const count = state.completionLog[dateStr]?.length || 0;
    let level = 0;
    if (!isFuture && count > 0) {
      if (count >= 4) level = 4;
      else if (count >= 3) level = 3;
      else if (count >= 2) level = 2;
      else level = 1;
    }
    heatmapDays.push({ date: dateStr, level, isFuture, count });
  }

  // Achievements
  const achievements = [
    { icon: '🌅', name: 'First Dawn', desc: 'Complete first habit', unlocked: totalCompletions >= 1 },
    { icon: '🔥', name: 'On Fire', desc: '3-day streak', unlocked: longestStreak >= 3 },
    { icon: '⚡', name: 'Lightning', desc: '7-day streak', unlocked: longestStreak >= 7 },
    { icon: '🏔️', name: 'Summit', desc: '14-day streak', unlocked: longestStreak >= 14 },
    { icon: '👑', name: 'Royalty', desc: '30-day streak', unlocked: longestStreak >= 30 },
    { icon: '💎', name: 'Diamond', desc: '50 completions', unlocked: totalCompletions >= 50 },
    { icon: '🌟', name: 'All Star', desc: 'Complete all in a day', unlocked: state.habits.length > 0 && todayDone >= state.habits.length },
    { icon: '🫂', name: 'Social', desc: 'Hi-five a friend', unlocked: (state.hifiveCount || 0) >= 1 },
    { icon: '🐾', name: 'Pack Leader', desc: '5 habits tracked', unlocked: state.habits.length >= 5 },
    { icon: '🪷', name: 'Nirvana', desc: 'Reach 4500 XP', unlocked: state.xp >= 4500 },
  ];

  return `
    <div class="page-header">
      <h1>📊 Stats</h1>
    </div>

    <div class="stats-grid">
      <div class="stat-card stat-card-delay-1">
        <div class="stat-value fire">${longestStreak}</div>
        <div class="stat-label">🔥 Best Streak</div>
      </div>
      <div class="stat-card stat-card-delay-2">
        <div class="stat-value green">${totalCompletions}</div>
        <div class="stat-label">✅ Completions</div>
      </div>
      <div class="stat-card stat-card-delay-3">
        <div class="stat-value purple">${daysActive}</div>
        <div class="stat-label">📅 Days Active</div>
      </div>
      <div class="stat-card stat-card-delay-4">
        <div class="stat-value teal">${state.xp}</div>
        <div class="stat-label">⚡ Total XP</div>
      </div>
    </div>

    <div class="heatmap-section">
      <div class="heatmap-card">
        <h3>🗓️ Activity</h3>
        <div class="heatmap-grid">
          ${heatmapDays.map(d => `
            <div class="heatmap-cell ${d.isFuture ? 'future' : d.level > 0 ? 'level-' + d.level : ''}"
                 title="${d.date}: ${d.count} habits"></div>
          `).join('')}
        </div>
        <div class="heatmap-labels">
          <span>5 weeks ago</span>
          <span>Today</span>
        </div>
      </div>
    </div>

    <div class="achievements-section">
      <div class="section-header" style="padding-left:0;padding-right:0;">
        <h2>🏆 Achievements</h2>
        <span class="section-count">${achievements.filter(a => a.unlocked).length}/${achievements.length}</span>
      </div>
      <div class="achievements-grid">
        ${achievements.map(a => `
          <div class="achievement ${a.unlocked ? '' : 'locked'}">
            <span class="achievement-icon">${a.icon}</span>
            <span class="achievement-name">${a.name}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// --- Profile ---
function renderProfile() {
  const animal = ANIMALS[state.user.animal];
  const level = getNirvanaLevel(state.xp);

  return `
    <div class="page-header">
      <h1>✨ Profile</h1>
    </div>

    <div class="profile-hero">
      <div class="profile-avatar">${animal.emoji}</div>
      <div class="profile-name">${state.user.name}</div>
      <div class="profile-joined">Joined ${formatDate(state.user.joinDate)}</div>
      <div class="profile-level-badge">${level.icon} ${level.name} · ${state.xp} XP</div>
    </div>

    <div class="profile-stats">
      <div class="profile-stat">
        <div class="profile-stat-value">${state.habits.length}</div>
        <div class="profile-stat-label">Habits</div>
      </div>
      <div class="profile-stat">
        <div class="profile-stat-value">${state.friends.length}</div>
        <div class="profile-stat-label">Friends</div>
      </div>
      <div class="profile-stat">
        <div class="profile-stat-value">${getLongestStreak()}</div>
        <div class="profile-stat-label">Best Streak</div>
      </div>
    </div>

    <div class="profile-actions">
      <button class="profile-action" id="change-animal-btn">
        <span class="profile-action-icon">${animal.emoji}</span>
        <div class="profile-action-text">
          <strong>Spirit Animal</strong>
          <span>${animal.name} the ${animal.trait}</span>
        </div>
        <span class="profile-action-arrow">›</span>
      </button>
      <button class="profile-action" id="change-name-btn">
        <span class="profile-action-icon">✏️</span>
        <div class="profile-action-text">
          <strong>Change Name</strong>
          <span>${state.user.name}</span>
        </div>
        <span class="profile-action-arrow">›</span>
      </button>
      <button class="profile-action" id="export-btn">
        <span class="profile-action-icon">📤</span>
        <div class="profile-action-text">
          <strong>Export Data</strong>
          <span>Download your journey</span>
        </div>
        <span class="profile-action-arrow">›</span>
      </button>
      <div class="danger-zone">
        <button class="profile-action" id="reset-btn">
          <span class="profile-action-icon">🗑️</span>
          <div class="profile-action-text">
            <strong style="color: var(--accent-coral);">Reset Everything</strong>
            <span>Start fresh from the beginning</span>
          </div>
          <span class="profile-action-arrow">›</span>
        </button>
      </div>
    </div>
  `;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// --- Bottom Nav ---
function renderBottomNav() {
  const pages = [
    { id: 'dashboard', icon: '🏠', label: 'Home' },
    { id: 'friends', icon: '👥', label: 'Friends' },
    { id: 'stats', icon: '📊', label: 'Stats' },
    { id: 'profile', icon: '✨', label: 'Profile' },
  ];

  return `
    <nav class="bottom-nav">
      ${pages.map(p => `
        <button class="nav-item ${currentPage === p.id ? 'active' : ''}" data-page="${p.id}">
          <span class="nav-icon">${p.icon}</span>
          <span class="nav-label">${p.label}</span>
          ${p.id === 'friends' ? '<span class="nav-badge"></span>' : ''}
        </button>
      `).join('')}
    </nav>
  `;
}

// --- Floating Animals ---
function renderFloatingAnimals() {
  let container = document.querySelector('.floating-animals');
  if (container) container.remove();

  container = document.createElement('div');
  container.className = 'floating-animals';

  const animals = ['🐕', '🐱', '🦊', '🐼', '🦋', '🐸', '🦄'];
  for (let i = 0; i < 5; i++) {
    const el = document.createElement('div');
    el.className = 'floating-animal';
    el.textContent = animals[Math.floor(Math.random() * animals.length)];
    el.style.setProperty('--start-x', `${Math.random() * 80 + 10}vw`);
    el.style.setProperty('--start-y', `${Math.random() * 80 + 10}vh`);
    el.style.setProperty('--duration', `${20 + Math.random() * 30}s`);
    el.style.left = '0';
    el.style.top = '0';
    container.appendChild(el);
  }

  document.body.appendChild(container);
}

// --- Modal ---
function showModal(content) {
  const root = document.getElementById('modal-root');
  root.innerHTML = `
    <div class="modal-overlay" id="modal-overlay">
      <div class="modal-sheet">
        <div class="modal-handle"></div>
        ${content}
      </div>
    </div>
  `;

  // Close on backdrop click
  const overlay = $('#modal-overlay');
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
}

function closeModal() {
  const root = document.getElementById('modal-root');
  const overlay = root.querySelector('.modal-overlay');
  if (overlay) {
    overlay.style.animation = 'fadeIn 0.2s ease reverse forwards';
    const sheet = overlay.querySelector('.modal-sheet');
    if (sheet) sheet.style.animation = 'slideSheetUp 0.3s ease reverse forwards';
    setTimeout(() => { root.innerHTML = ''; }, 250);
  } else {
    root.innerHTML = '';
  }
}

// --- Add Habit Modal ---
let newHabitEmoji = '💪';

function showAddHabitModal() {
  newHabitEmoji = '💪';
  showModal(`
    <h2 class="modal-title">New Habit ✨</h2>
    <div class="form-group">
      <label class="form-label">Habit Name</label>
      <input type="text" class="form-input" id="habit-name-input"
        placeholder="e.g. Run 5K, Meditate, Read..." maxlength="30" autocomplete="off">
    </div>
    <div class="form-group">
      <label class="form-label">Icon</label>
      <div class="emoji-picker">
        ${HABIT_EMOJIS.map(e => `
          <div class="emoji-option ${e === newHabitEmoji ? 'selected' : ''}" data-emoji="${e}">${e}</div>
        `).join('')}
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" id="modal-cancel">Cancel</button>
      <button class="btn-primary" id="modal-save" disabled>Add Habit</button>
    </div>
  `);

  const nameInput = $('#habit-name-input');
  const saveBtn = $('#modal-save');
  const cancelBtn = $('#modal-cancel');

  setTimeout(() => nameInput?.focus(), 350);

  nameInput?.addEventListener('input', () => {
    saveBtn.disabled = !nameInput.value.trim();
  });

  nameInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && nameInput.value.trim()) {
      addHabit(nameInput.value.trim(), newHabitEmoji);
    }
  });

  $$('.emoji-option').forEach(el => {
    el.addEventListener('click', () => {
      $$('.emoji-option').forEach(e => e.classList.remove('selected'));
      el.classList.add('selected');
      newHabitEmoji = el.dataset.emoji;
    });
  });

  saveBtn?.addEventListener('click', () => {
    if (nameInput.value.trim()) {
      addHabit(nameInput.value.trim(), newHabitEmoji);
    }
  });

  cancelBtn?.addEventListener('click', closeModal);
}

function addHabit(name, emoji) {
  const habit = {
    id: 'h_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    name,
    emoji,
    animal: state.user.animal,
    createdAt: today(),
  };
  state.habits.push(habit);
  saveState();
  closeModal();
  showToast('✨', `"${name}" added! Let's go!`);
  render();
}

// --- Change Name Modal ---
function showChangeNameModal() {
  showModal(`
    <h2 class="modal-title">Change Name</h2>
    <div class="form-group">
      <input type="text" class="form-input" id="new-name-input"
        placeholder="Your new name" maxlength="20" autocomplete="off"
        value="${state.user.name}">
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" id="modal-cancel">Cancel</button>
      <button class="btn-primary" id="modal-save">Save</button>
    </div>
  `);

  const input = $('#new-name-input');
  const saveBtn = $('#modal-save');
  setTimeout(() => { input?.focus(); input?.select(); }, 350);

  saveBtn?.addEventListener('click', () => {
    if (input.value.trim()) {
      state.user.name = input.value.trim();
      saveState();
      closeModal();
      showToast('✅', 'Name updated!');
      render();
    }
  });

  $('#modal-cancel')?.addEventListener('click', closeModal);
}

// --- Change Animal Modal ---
function showChangeAnimalModal() {
  showModal(`
    <h2 class="modal-title">Spirit Animal</h2>
    <div class="animal-grid" style="margin-bottom:24px;">
      ${ANIMALS.map((a, i) => `
        <div class="animal-option ${state.user.animal === i ? 'selected' : ''}" data-animal="${i}">
          ${a.emoji}
        </div>
      `).join('')}
    </div>
    <div class="animal-name" id="animal-preview">
      ${ANIMALS[state.user.animal].name} the ${ANIMALS[state.user.animal].trait}
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" id="modal-cancel">Cancel</button>
      <button class="btn-primary" id="modal-save">Save</button>
    </div>
  `);

  let selectedAnimal = state.user.animal;

  $$('.animal-option').forEach(el => {
    el.addEventListener('click', () => {
      selectedAnimal = parseInt(el.dataset.animal);
      $$('.animal-option').forEach(e => e.classList.remove('selected'));
      el.classList.add('selected');
      const a = ANIMALS[selectedAnimal];
      const preview = $('#animal-preview');
      if (preview) preview.textContent = `${a.name} the ${a.trait}`;
    });
  });

  $('#modal-save')?.addEventListener('click', () => {
    state.user.animal = selectedAnimal;
    saveState();
    closeModal();
    showToast(ANIMALS[selectedAnimal].emoji, `${ANIMALS[selectedAnimal].name} is now your spirit animal!`);
    render();
  });

  $('#modal-cancel')?.addEventListener('click', closeModal);
}

// --- Add Friend Modal ---
function showAddFriendModal() {
  showModal(`
    <h2 class="modal-title">Add Friend</h2>
    <div class="form-group">
      <label class="form-label">Friend's Name</label>
      <input type="text" class="form-input" id="friend-name-input"
        placeholder="Enter their name" maxlength="20" autocomplete="off">
    </div>
    <div class="form-group">
      <label class="form-label">Their Spirit Animal</label>
      <div class="animal-grid" style="margin-bottom: 8px;">
        ${ANIMALS.map((a, i) => `
          <div class="animal-option ${i === 0 ? 'selected' : ''}" data-animal="${i}">
            ${a.emoji}
          </div>
        `).join('')}
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" id="modal-cancel">Cancel</button>
      <button class="btn-primary" id="modal-save" disabled>Add Friend</button>
    </div>
  `);

  let friendAnimal = 0;
  const nameInput = $('#friend-name-input');
  const saveBtn = $('#modal-save');

  setTimeout(() => nameInput?.focus(), 350);

  nameInput?.addEventListener('input', () => {
    saveBtn.disabled = !nameInput.value.trim();
  });

  $$('.animal-option').forEach(el => {
    el.addEventListener('click', () => {
      friendAnimal = parseInt(el.dataset.animal);
      $$('.animal-option').forEach(e => e.classList.remove('selected'));
      el.classList.add('selected');
    });
  });

  saveBtn?.addEventListener('click', () => {
    if (nameInput.value.trim()) {
      state.friends.push({
        id: 'f_' + Date.now(),
        name: nameInput.value.trim(),
        animal: friendAnimal,
        level: 1,
        online: true,
        habits: [],
        streak: 0,
      });
      saveState();
      closeModal();
      showToast('🤝', `${nameInput.value.trim()} added as a friend!`);
      render();
    }
  });

  $('#modal-cancel')?.addEventListener('click', closeModal);
}

// --- Reset Confirmation ---
function showResetModal() {
  showModal(`
    <h2 class="modal-title">Reset Everything?</h2>
    <p style="text-align:center;color:var(--text-secondary);margin-bottom:24px;line-height:1.6;">
      This will delete all your habits, progress, and XP. Your journey to nirvana will start over. Are you sure?
    </p>
    <div class="modal-actions">
      <button class="btn-secondary" id="modal-cancel">Keep My Data</button>
      <button class="btn-primary" id="modal-confirm" style="background:var(--accent-coral);box-shadow:0 4px 20px rgba(255,79,129,0.4);">Reset</button>
    </div>
  `);

  $('#modal-confirm')?.addEventListener('click', () => {
    localStorage.removeItem('deez-state');
    state = {
      user: null,
      habits: [],
      friends: DEFAULT_FRIENDS,
      xp: 0,
      notifications: [],
      completionLog: {},
    };
    onboardingStep = 0;
    onboardingName = '';
    onboardingAnimal = -1;
    closeModal();
    render();
  });

  $('#modal-cancel')?.addEventListener('click', closeModal);
}

// --- Export ---
function exportData() {
  const data = JSON.stringify(state, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `deez-backup-${today()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('📤', 'Data exported!');
}

// --- Event Attachment ---
function attachPageEvents() {
  // Bottom nav
  $$('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      navigate(btn.dataset.page);
    });
  });

  // Add habit buttons
  $('#add-habit-btn')?.addEventListener('click', showAddHabitModal);
  $('#add-habit-empty-btn')?.addEventListener('click', showAddHabitModal);

  // Habit completion toggle
  $$('.habit-card').forEach(card => {
    card.addEventListener('click', () => {
      const habitId = card.dataset.habitId;
      toggleHabit(habitId, card);
    });
  });

  // Friend actions
  $$('.friend-action-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = btn.dataset.action;
      const friendId = btn.dataset.friendId;
      const friendName = btn.dataset.friendName;

      if (action === 'hifive') {
        showHiFive(friendName);
        state.hifiveCount = (state.hifiveCount || 0) + 1;
        saveState();
      } else if (action === 'poke') {
        showPoke(friendId, friendName);
      }
    });
  });

  // Add friend
  $('#add-friend-btn')?.addEventListener('click', showAddFriendModal);

  // Profile actions
  $('#change-animal-btn')?.addEventListener('click', showChangeAnimalModal);
  $('#change-name-btn')?.addEventListener('click', showChangeNameModal);
  $('#export-btn')?.addEventListener('click', exportData);
  $('#reset-btn')?.addEventListener('click', showResetModal);
}

// --- Toggle Habit ---
function toggleHabit(habitId, cardEl) {
  const todayStr = today();
  if (!state.completionLog[todayStr]) {
    state.completionLog[todayStr] = [];
  }

  const log = state.completionLog[todayStr];
  const index = log.indexOf(habitId);

  if (index >= 0) {
    // Undo completion
    log.splice(index, 1);
    state.xp = Math.max(0, state.xp - 10);
    saveState();
    render();
    return;
  }

  // Complete habit
  log.push(habitId);

  // Calculate XP: base 10 + streak bonus
  const habit = state.habits.find(h => h.id === habitId);
  const streak = getStreak(habit);
  const xpGain = 10 + Math.min(streak * 2, 20);
  state.xp += xpGain;

  saveState();

  // Visual feedback
  if (cardEl) {
    const rect = cardEl.getBoundingClientRect();
    fireConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
  }

  // Check if all habits done
  const allDone = state.habits.every(h => log.includes(h.id));

  if (allDone && state.habits.length > 1) {
    setTimeout(() => {
      showToast('🎉', 'ALL HABITS COMPLETE! Incredible!');
      fireConfetti();
    }, 400);
  } else {
    showToast('⚡', `+${xpGain} XP!`);
  }

  // Check for level up
  const oldLevel = getNirvanaLevel(state.xp - xpGain);
  const newLevel = getNirvanaLevel(state.xp);
  if (newLevel.name !== oldLevel.name) {
    setTimeout(() => {
      showToast(newLevel.icon, `Level up! You've reached ${newLevel.name}!`, 3500);
      fireConfetti();
      fireConfetti();
    }, 600);
  }

  render();
}

// --- Delete habit on long press ---
let longPressTimer = null;
document.addEventListener('pointerdown', (e) => {
  const card = e.target.closest('.habit-card');
  if (!card) return;
  longPressTimer = setTimeout(() => {
    const habitId = card.dataset.habitId;
    const habit = state.habits.find(h => h.id === habitId);
    if (!habit) return;
    showModal(`
      <h2 class="modal-title">Delete "${habit.name}"?</h2>
      <p style="text-align:center;color:var(--text-secondary);margin-bottom:24px;line-height:1.6;">
        This habit and its streak data will be removed.
      </p>
      <div class="modal-actions">
        <button class="btn-secondary" id="modal-cancel">Keep</button>
        <button class="btn-primary" id="modal-confirm" style="background:var(--accent-coral);box-shadow:0 4px 20px rgba(255,79,129,0.4);">Delete</button>
      </div>
    `);

    $('#modal-confirm')?.addEventListener('click', () => {
      state.habits = state.habits.filter(h => h.id !== habitId);
      // Clean from completion logs
      for (const date in state.completionLog) {
        state.completionLog[date] = state.completionLog[date].filter(id => id !== habitId);
        if (state.completionLog[date].length === 0) delete state.completionLog[date];
      }
      saveState();
      closeModal();
      showToast('🗑️', `"${habit.name}" removed`);
      render();
    });

    $('#modal-cancel')?.addEventListener('click', closeModal);
  }, 600);
});

document.addEventListener('pointerup', () => {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
});

document.addEventListener('pointermove', () => {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
});

// --- Init ---
render();
