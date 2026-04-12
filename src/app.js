/* ============================================
   DEEZ - Reach Nirvana Together
   Built with Framework7 + Capacitor
   ============================================ */

import Framework7 from 'framework7/bundle';
import 'framework7/css/bundle';
import './custom.css';

// --- Platform Detection ---
const isNative = typeof window.Capacitor !== 'undefined' && window.Capacitor.isNativePlatform();

// --- Constants ---
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

const HABIT_EMOJIS = [
  '💪', '🏃', '📚', '🧘', '💧', '🥗', '😴', '✍️',
  '🎵', '🧹', '💊', '🌅', '🧠', '💰', '🎨', '🌿',
  '📱', '🐾', '🍳', '🧘‍♂️', '🚶', '💻', '🎯', '❤️',
];

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
  empty: [
    "Add your first habit and start your journey to nirvana!",
    "Every great journey starts with a single habit. Add one!",
  ],
};

// --- Utilities ---
const today = () => new Date().toISOString().split('T')[0];
function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
function generateId() {
  return 'u_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// --- Nirvana Helpers ---
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
  const idx = NIRVANA_LEVELS.indexOf(level);
  if (idx === NIRVANA_LEVELS.length - 1) return 100;
  const next = NIRVANA_LEVELS[idx + 1];
  return Math.min(100, Math.max(0, ((xp - level.xp) / (next.xp - level.xp)) * 100));
}

function getStreak(habit) {
  let streak = 0;
  const d = new Date();
  const todayStr = today();
  const todayDone = state.completionLog[todayStr]?.includes(habit.id);
  if (!todayDone) d.setDate(d.getDate() - 1);
  while (true) {
    const dateStr = d.toISOString().split('T')[0];
    if (state.completionLog[dateStr]?.includes(habit.id)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return streak;
}

function getTotalCompletions() {
  let total = 0;
  for (const date in state.completionLog) total += state.completionLog[date].length;
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

// ============================================
//  STATE
// ============================================

function loadState() {
  try {
    const saved = localStorage.getItem('deez-state');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return null;
}

function saveState() {
  localStorage.setItem('deez-state', JSON.stringify(state));
}

let state = loadState() || {
  user: null,
  userId: generateId(),
  habits: [],
  xp: 0,
  completionLog: {},
  hifiveCount: 0,
  apiUrl: '',
  remoteFriends: [],
  syncEnabled: false,
};

if (!state.userId) {
  state.userId = generateId();
  saveState();
}

// ============================================
//  SYNC ENGINE
// ============================================

let syncing = false;
let syncInterval = null;

async function syncWithSheet() {
  if (!state.user || syncing) return;
  syncing = true;

  try {
    const payload = {
      userId: state.userId,
      name: state.user.name,
      animal: state.user.animal,
      data: {
        habits: state.habits,
        completionLog: state.completionLog,
        xp: state.xp,
        todayCompleted: state.completionLog[today()] || [],
      }
    };

    const res = await fetch('/api/sync', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json();

    if (data.ok) {
      state.remoteFriends = data.users
        .filter(u => u.userId !== state.userId)
        .map(u => {
          const d = u.data || {};
          const habits = (d.habits || []).map(h => ({
            name: h.name,
            emoji: h.emoji,
            done: (d.todayCompleted || []).includes(h.id),
          }));

          let streak = 0;
          if (d.completionLog) {
            const dd = new Date();
            while (true) {
              const ds = dd.toISOString().split('T')[0];
              if (d.completionLog[ds]?.length > 0) {
                streak++;
                dd.setDate(dd.getDate() - 1);
              } else break;
            }
          }

          let online = false;
          if (u.lastSync) {
            const diff = Date.now() - new Date(u.lastSync).getTime();
            online = diff < 5 * 60 * 1000;
          }

          return {
            userId: u.userId,
            name: u.name,
            animal: u.animal,
            xp: d.xp || 0,
            habits,
            streak,
            online,
          };
        });

      if (data.notifications?.length > 0) {
        for (const notif of data.notifications) {
          const animal = ANIMALS[notif.fromAnimal] || ANIMALS[0];
          if (notif.type === 'hifive') {
            showToast('🙌', `${notif.fromName} hi-fived you! ${animal.emoji}`);
          } else if (notif.type === 'poke') {
            showToast('👉', `${notif.fromName} poked you! ${animal.emoji}`);
          }
        }
      }

      saveState();

      // Update friends page if visible
      const friendsTab = document.querySelector('#tab-friends.tab-active');
      if (friendsTab) renderFriends();
    }
  } catch (err) {
    console.warn('Sync error:', err);
  } finally {
    syncing = false;
  }
}

function startSync() {
  if (syncInterval) clearInterval(syncInterval);
  if (state.user) {
    syncWithSheet();
    syncInterval = setInterval(syncWithSheet, 8000);
    state.syncEnabled = true;
    saveState();
  }
}

function stopSync() {
  if (syncInterval) clearInterval(syncInterval);
  syncInterval = null;
  state.syncEnabled = false;
  saveState();
}

async function testApiUrl() {
  try {
    const res = await fetch('/api/ping');
    const data = await res.json();
    return data.ok === true;
  } catch (e) {
    return false;
  }
}

async function sendInteraction(toUserId, type) {
  try {
    await fetch('/api/interact', {
      method: 'POST',
      body: JSON.stringify({
        fromId: state.userId,
        fromName: state.user.name,
        fromAnimal: state.user.animal,
        toId: toUserId,
        type: type,
      }),
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.warn('Interaction send failed:', e);
  }
}

// ============================================
//  CONFETTI
// ============================================

let confettiCanvas, confettiCtx;
let confettiParticles = [];
let confettiRunning = false;

function setupConfetti() {
  confettiCanvas = document.getElementById('confetti-canvas');
  confettiCtx = confettiCanvas.getContext('2d');
  function resize() {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);
}

function fireConfetti(x, y) {
  const colors = ['#ff6b35', '#ff4f81', '#a855f7', '#4ade80', '#fbbf24', '#60a5fa', '#2dd4bf'];
  for (let i = 0; i < 40; i++) {
    const angle = (Math.PI * 2 * i) / 40 + (Math.random() - 0.5);
    const speed = 4 + Math.random() * 6;
    confettiParticles.push({
      x: x || window.innerWidth / 2, y: y || window.innerHeight / 2,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 4 + Math.random() * 4, life: 1,
      decay: 0.015 + Math.random() * 0.01,
      rotation: Math.random() * 360, rotationSpeed: (Math.random() - 0.5) * 10,
    });
  }
  if (!confettiRunning) { confettiRunning = true; animateConfetti(); }
}

function animateConfetti() {
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  confettiParticles = confettiParticles.filter(p => p.life > 0);
  for (const p of confettiParticles) {
    p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.vx *= 0.99;
    p.life -= p.decay; p.rotation += p.rotationSpeed;
    confettiCtx.save();
    confettiCtx.translate(p.x, p.y);
    confettiCtx.rotate((p.rotation * Math.PI) / 180);
    confettiCtx.globalAlpha = p.life;
    confettiCtx.fillStyle = p.color;
    confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
    confettiCtx.restore();
  }
  if (confettiParticles.length > 0) requestAnimationFrame(animateConfetti);
  else { confettiRunning = false; confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height); }
}

// ============================================
//  HAPTICS
// ============================================

async function triggerHaptic(style = 'medium') {
  if (!isNative) return;
  try {
    const Haptics = window.Capacitor?.Plugins?.Haptics;
    if (!Haptics) return;
    const map = { light: 'LIGHT', medium: 'MEDIUM', heavy: 'HEAVY' };
    await Haptics.impact({ style: map[style] || 'MEDIUM' });
  } catch (e) {}
}

// ============================================
//  FRAMEWORK7 APP
// ============================================

let f7app = null;

function showToast(icon, message, duration = 2500) {
  if (f7app) {
    f7app.toast.create({
      text: `${icon}  ${message}`,
      position: 'top',
      closeTimeout: duration,
      cssClass: 'deez-toast',
    }).open();
  }
}

// ============================================
//  ONBOARDING
// ============================================

let onboardingStep = 0;
let onboardingName = '';
let onboardingAnimal = -1;

function showOnboarding() {
  const appEl = document.getElementById('app');
  renderOnboardingStep(appEl);
}

function renderOnboardingStep(container) {
  if (onboardingStep === 0) {
    container.innerHTML = `
      <div class="onboarding">
        <div class="onboarding-logo">🪷</div>
        <h1 class="onboarding-title">Deez</h1>
        <p class="onboarding-sub">Reach nirvana together with your friends. Track habits. Send vibes. Ascend.</p>
        <div class="onboarding-form">
          <h2>What's your name?</h2>
          <input type="text" class="onboarding-input" id="name-input"
            placeholder="Enter your name" maxlength="20" autocomplete="off" value="${onboardingName}">
          <button class="button button-fill button-large button-round" id="next-btn"
            ${onboardingName.trim().length < 1 ? 'disabled' : ''}>Continue</button>
        </div>
      </div>`;

    const nameInput = document.getElementById('name-input');
    const nextBtn = document.getElementById('next-btn');
    nameInput.focus();
    nameInput.addEventListener('input', (e) => {
      onboardingName = e.target.value;
      nextBtn.disabled = onboardingName.trim().length < 1;
    });
    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && onboardingName.trim().length >= 1) {
        onboardingStep = 1;
        renderOnboardingStep(container);
      }
    });
    nextBtn.addEventListener('click', () => {
      if (onboardingName.trim().length >= 1) {
        onboardingStep = 1;
        renderOnboardingStep(container);
      }
    });
  } else if (onboardingStep === 1) {
    container.innerHTML = `
      <div class="onboarding">
        <div class="onboarding-logo">🪷</div>
        <h1 class="onboarding-title">Deez</h1>
        <p class="onboarding-sub">Choose your spirit animal. They'll be your companion on the path to nirvana.</p>
        <div class="onboarding-form">
          <h2>Pick your spirit animal</h2>
          <div class="animal-grid">
            ${ANIMALS.map((a, i) => `
              <button class="animal-btn ${onboardingAnimal === i ? 'selected' : ''}" data-idx="${i}">${a.emoji}</button>
            `).join('')}
          </div>
          <div class="animal-label">
            ${onboardingAnimal >= 0 ? `${ANIMALS[onboardingAnimal].name} the ${ANIMALS[onboardingAnimal].trait}` : 'Tap to choose'}
          </div>
          <button class="button button-fill button-large button-round" id="next-btn-2"
            ${onboardingAnimal < 0 ? 'disabled' : ''}>Continue</button>
        </div>
      </div>`;

    document.querySelectorAll('.animal-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        onboardingAnimal = parseInt(btn.dataset.idx);
        renderOnboardingStep(container);
      });
    });
    document.getElementById('next-btn-2')?.addEventListener('click', () => {
      if (onboardingAnimal >= 0) {
        onboardingStep = 2;
        renderOnboardingStep(container);
      }
    });
  } else {
    finishOnboarding();
  }
}

function finishOnboarding() {
  state.user = {
    name: onboardingName.trim(),
    animal: onboardingAnimal,
    joinDate: today(),
  };
  saveState();

  showMainApp();
  fireConfetti();
  showToast('🎉', `Welcome, ${state.user.name}! Your journey begins!`);
  startSync();
}

// ============================================
//  MAIN APP SHELL
// ============================================

function showMainApp() {
  const appEl = document.getElementById('app');
  appEl.innerHTML = `
    <div class="view view-main safe-areas">
      <div class="page page-current">
        <div class="page-content tabs" style="padding-bottom:0">
          <div id="tab-home" class="tab tab-active" style="display:block;overflow-y:auto;height:100%;padding-bottom:calc(60px + env(safe-area-inset-bottom, 0px) + 16px)"></div>
          <div id="tab-friends" class="tab" style="display:none;overflow-y:auto;height:100%;padding-bottom:calc(60px + env(safe-area-inset-bottom, 0px) + 16px)"></div>
          <div id="tab-stats" class="tab" style="display:none;overflow-y:auto;height:100%;padding-bottom:calc(60px + env(safe-area-inset-bottom, 0px) + 16px)"></div>
          <div id="tab-profile" class="tab" style="display:none;overflow-y:auto;height:100%;padding-bottom:calc(60px + env(safe-area-inset-bottom, 0px) + 16px)"></div>
        </div>
        <div class="toolbar toolbar-bottom tabbar tabbar-icons no-shadow">
          <div class="toolbar-inner">
            <a href="#tab-home" class="tab-link tab-link-active">
              <i class="icon tab-icon">🏠</i>
              <span class="tabbar-label">Home</span>
            </a>
            <a href="#tab-friends" class="tab-link">
              <i class="icon tab-icon">👥</i>
              <span class="tabbar-label">Friends</span>
            </a>
            <a href="#tab-stats" class="tab-link">
              <i class="icon tab-icon">📊</i>
              <span class="tabbar-label">Stats</span>
            </a>
            <a href="#tab-profile" class="tab-link">
              <i class="icon tab-icon">✨</i>
              <span class="tabbar-label">Profile</span>
            </a>
          </div>
        </div>
      </div>
    </div>`;

  // Tab switching
  document.querySelectorAll('.tab-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').replace('#', '');

      // Update active states
      document.querySelectorAll('.tab-link').forEach(l => l.classList.remove('tab-link-active'));
      link.classList.add('tab-link-active');

      document.querySelectorAll('.tab').forEach(t => {
        t.classList.remove('tab-active');
        t.style.display = 'none';
      });

      const target = document.getElementById(targetId);
      target.classList.add('tab-active');
      target.style.display = 'block';

      // Render content on tab switch
      if (targetId === 'tab-home') renderDashboard();
      else if (targetId === 'tab-friends') renderFriends();
      else if (targetId === 'tab-stats') renderStats();
      else if (targetId === 'tab-profile') renderProfile();
    });
  });

  renderDashboard();
  renderFloatingAnimals();
  startSync();
}

// ============================================
//  DASHBOARD
// ============================================

function renderDashboard() {
  const el = document.getElementById('tab-home');
  if (!el) return;

  const animal = ANIMALS[state.user.animal];
  const todayDone = state.completionLog[today()] || [];
  const allDone = state.habits.length > 0 && todayDone.length >= state.habits.length;
  const timeOfDay = getTimeOfDay();
  const mascotMsg = state.habits.length === 0
    ? randomFrom(MASCOT_MESSAGES.empty)
    : allDone ? randomFrom(MASCOT_MESSAGES.allDone) : randomFrom(MASCOT_MESSAGES[timeOfDay]);

  el.innerHTML = `
    <div class="navbar">
      <div class="navbar-bg"></div>
      <div class="navbar-inner">
        <div class="title"><span class="bounce" style="display:inline-block;animation:bounce 2s ease-in-out infinite">${animal.emoji}</span> Today</div>
        <div class="right">
          <a class="link" id="add-habit-btn" style="font-size:24px;cursor:pointer">＋</a>
        </div>
      </div>
    </div>

    <div class="block" style="margin-top:8px">
      <div class="card">
        <div class="card-content card-content-padding">
          <div class="nirvana-header">
            <div class="nirvana-level">
              <span class="nirvana-icon">${getNirvanaLevel(state.xp).icon}</span>
              <div>
                <strong>${getNirvanaLevel(state.xp).name}</strong>
                <small>Path to Nirvana</small>
              </div>
            </div>
            <div class="nirvana-xp"><strong>${state.xp}</strong> XP</div>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width: ${getNirvanaProgress(state.xp)}%"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="block" style="margin-top:0">
      <div class="card">
        <div class="card-content card-content-padding">
          <div class="mascot-row">
            <span class="mascot-avatar">${animal.emoji}</span>
            <div class="mascot-text"><strong>${animal.name} says:</strong> ${mascotMsg}</div>
          </div>
        </div>
      </div>
    </div>

    ${state.habits.length > 0 ? `
      <div class="block-title" style="display:flex;justify-content:space-between;align-items:center">
        <span>Habits</span>
        <span style="font-size:13px;color:var(--deez-text-muted);font-weight:500">${todayDone.length}/${state.habits.length}</span>
      </div>
      <div class="block" style="margin-top:0">
        ${state.habits.map((habit, i) => {
          const done = todayDone.includes(habit.id);
          const streak = getStreak(habit);
          return `
            <div class="card habit-card habit-card-delay-${i + 1} ${done ? 'completed' : ''}" data-habit-id="${habit.id}">
              <div class="card-content card-content-padding">
                <div class="habit-row">
                  <div class="habit-check ${done ? 'checked' : ''}">${done ? '✓' : ''}</div>
                  <span class="habit-emoji">${habit.emoji}</span>
                  <div class="habit-info">
                    <div class="habit-name">${habit.name}</div>
                    ${streak > 0 ? `<div class="habit-streak">🔥 ${streak} day${streak !== 1 ? 's' : ''}</div>` : ''}
                  </div>
                </div>
              </div>
            </div>`;
        }).join('')}
      </div>
    ` : `
      <div class="empty-state">
        <div class="empty-state-icon">${animal.emoji}</div>
        <h3>No habits yet!</h3>
        <p>${animal.name} is waiting for you to start your journey. Add your first habit!</p>
        <button class="button button-fill button-large button-round" id="add-habit-empty-btn">Add First Habit ✨</button>
      </div>
    `}`;

  // Event listeners
  document.getElementById('add-habit-btn')?.addEventListener('click', showAddHabitModal);
  document.getElementById('add-habit-empty-btn')?.addEventListener('click', showAddHabitModal);

  el.querySelectorAll('.habit-card').forEach(card => {
    card.addEventListener('click', () => toggleHabit(card.dataset.habitId, card));
  });

  // Long press to delete
  el.querySelectorAll('.habit-card').forEach(card => {
    let timer = null;
    card.addEventListener('pointerdown', () => {
      timer = setTimeout(() => {
        const habitId = card.dataset.habitId;
        const habit = state.habits.find(h => h.id === habitId);
        if (!habit || !f7app) return;
        f7app.dialog.confirm(
          'This habit and its streak will be removed.',
          `Delete "${habit.name}"?`,
          function () {
            state.habits = state.habits.filter(h => h.id !== habitId);
            for (const date in state.completionLog) {
              state.completionLog[date] = state.completionLog[date].filter(id => id !== habitId);
              if (state.completionLog[date].length === 0) delete state.completionLog[date];
            }
            saveState();
            showToast('🗑️', `"${habit.name}" removed`);
            renderDashboard();
            syncWithSheet();
          }
        );
      }, 600);
    });
    card.addEventListener('pointerup', () => { clearTimeout(timer); timer = null; });
    card.addEventListener('pointermove', () => { clearTimeout(timer); timer = null; });
  });
}

// ============================================
//  FRIENDS
// ============================================

function getFriendsList() {
  return state.remoteFriends;
}

function renderFriends() {
  const el = document.getElementById('tab-friends');
  if (!el) return;

  const friends = getFriendsList();

  el.innerHTML = `
    <div class="navbar">
      <div class="navbar-bg"></div>
      <div class="navbar-inner">
        <div class="title">🤝 Friends</div>
        <div class="right"><span style="font-size:12px;color:var(--deez-accent-green);display:flex;align-items:center;gap:4px"><span class="status-dot"></span>Live</span></div>
      </div>
    </div>

    ${friends.length === 0 ? `
      <div class="empty-state">
        <div class="empty-state-icon">👥</div>
        <h3>No friends yet!</h3>
        <p>Share the app with your friends so they can join the journey to nirvana.</p>
      </div>
    ` : ''}

    <div class="block">
      ${friends.map((friend, i) => {
        const friendAnimal = ANIMALS[friend.animal] || ANIMALS[0];
        const friendLevel = getNirvanaLevel(friend.xp || 0);
        return `
          <div class="card friend-card friend-card-delay-${i + 1}" data-friend-id="${friend.id || friend.userId}">
            <div class="card-content card-content-padding">
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
                ${(friend.habits || []).map(h => `
                  <span class="friend-chip ${h.done ? 'done' : ''}">${h.emoji} ${h.name} ${h.done ? '✓' : ''}</span>
                `).join('')}
                ${(!friend.habits || friend.habits.length === 0) ? '<span class="friend-chip">No habits yet</span>' : ''}
              </div>
              <div class="friend-actions">
                <button class="btn-hifive" data-action="hifive" data-friend-id="${friend.id || friend.userId}" data-friend-name="${friend.name}" data-friend-userid="${friend.userId || ''}">🙌 Hi Five</button>
                <button class="btn-poke" data-action="poke" data-friend-id="${friend.id || friend.userId}" data-friend-name="${friend.name}" data-friend-userid="${friend.userId || ''}">👉 Poke</button>
              </div>
            </div>
          </div>`;
      }).join('')}
    </div>

    `;


  el.querySelectorAll('.btn-hifive, .btn-poke').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const friendId = btn.dataset.friendId;
      const friendName = btn.dataset.friendName;
      const friendUserId = btn.dataset.friendUserid;
      if (btn.dataset.action === 'hifive') {
        showHiFive(friendName, friendUserId);
      } else {
        showPoke(friendId, friendName, friendUserId);
      }
    });
  });
}

function showHiFive(friendName, friendUserId) {
  const overlay = document.createElement('div');
  overlay.className = 'hifive-overlay';
  overlay.innerHTML = '<div class="hifive-hand">🙌</div>';
  document.body.appendChild(overlay);
  fireConfetti();
  triggerHaptic('heavy');
  showToast('🙌', `You hi-fived ${friendName}!`);
  setTimeout(() => overlay.remove(), 800);

  if (friendUserId && state.apiUrl) sendInteraction(friendUserId, 'hifive');
  state.hifiveCount = (state.hifiveCount || 0) + 1;
  saveState();
}

function showPoke(friendId, friendName, friendUserId) {
  const card = document.querySelector(`[data-friend-id="${friendId}"]`);
  if (card) {
    card.classList.remove('poke-shake');
    void card.offsetWidth;
    card.classList.add('poke-shake');
  }
  triggerHaptic('medium');
  showToast('👉', `You poked ${friendName}! They'll feel that!`);
  if (friendUserId && state.apiUrl) sendInteraction(friendUserId, 'poke');
}

// ============================================
//  STATS
// ============================================

function renderStats() {
  const el = document.getElementById('tab-stats');
  if (!el) return;

  const totalCompletions = getTotalCompletions();
  const longestStreak = getLongestStreak();
  const daysActive = getDaysActive();
  const todayDone = (state.completionLog[today()] || []).length;

  const heatmapDays = [];
  const now = new Date();
  const dayOfWeek = now.getDay();
  for (let i = 34 + dayOfWeek; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i + dayOfWeek);
    const dateStr = d.toISOString().split('T')[0];
    const isFuture = d > now;
    const count = state.completionLog[dateStr]?.length || 0;
    let level = 0;
    if (!isFuture && count > 0) {
      if (count >= 4) level = 4; else if (count >= 3) level = 3;
      else if (count >= 2) level = 2; else level = 1;
    }
    heatmapDays.push({ date: dateStr, level, isFuture, count });
  }

  const achievements = [
    { icon: '🌅', name: 'First Dawn', unlocked: totalCompletions >= 1 },
    { icon: '🔥', name: 'On Fire', unlocked: longestStreak >= 3 },
    { icon: '⚡', name: 'Lightning', unlocked: longestStreak >= 7 },
    { icon: '🏔️', name: 'Summit', unlocked: longestStreak >= 14 },
    { icon: '👑', name: 'Royalty', unlocked: longestStreak >= 30 },
    { icon: '💎', name: 'Diamond', unlocked: totalCompletions >= 50 },
    { icon: '🌟', name: 'All Star', unlocked: state.habits.length > 0 && todayDone >= state.habits.length },
    { icon: '🫂', name: 'Social', unlocked: (state.hifiveCount || 0) >= 1 },
    { icon: '🐾', name: 'Pack Lead', unlocked: state.habits.length >= 5 },
    { icon: '🪷', name: 'Nirvana', unlocked: state.xp >= 4500 },
  ];

  el.innerHTML = `
    <div class="navbar">
      <div class="navbar-bg"></div>
      <div class="navbar-inner">
        <div class="title">📊 Stats</div>
      </div>
    </div>

    <div class="block">
      <div class="stats-grid">
        <div class="stat-card stat-card-delay-1"><div class="stat-value fire">${longestStreak}</div><div class="stat-label">🔥 Best Streak</div></div>
        <div class="stat-card stat-card-delay-2"><div class="stat-value green">${totalCompletions}</div><div class="stat-label">✅ Completions</div></div>
        <div class="stat-card stat-card-delay-3"><div class="stat-value purple">${daysActive}</div><div class="stat-label">📅 Days Active</div></div>
        <div class="stat-card stat-card-delay-4"><div class="stat-value teal">${state.xp}</div><div class="stat-label">⚡ Total XP</div></div>
      </div>

      <div class="heatmap-card">
        <h3>🗓️ Activity</h3>
        <div class="heatmap-grid">
          ${heatmapDays.map(d => `<div class="heatmap-cell ${d.isFuture ? 'future' : d.level > 0 ? 'level-' + d.level : ''}" title="${d.date}: ${d.count}"></div>`).join('')}
        </div>
        <div class="heatmap-labels"><span>5 weeks ago</span><span>Today</span></div>
      </div>

      <div class="block-title" style="display:flex;justify-content:space-between;align-items:center;padding:0;margin-bottom:16px">
        <span style="font-family:'Fredoka',sans-serif;font-size:18px">🏆 Achievements</span>
        <span style="font-size:13px;color:var(--deez-text-muted)">${achievements.filter(a => a.unlocked).length}/${achievements.length}</span>
      </div>
      <div class="achievements-grid">
        ${achievements.map(a => `
          <div class="achievement ${a.unlocked ? '' : 'locked'}">
            <span class="achievement-icon">${a.icon}</span>
            <span class="achievement-name">${a.name}</span>
          </div>
        `).join('')}
      </div>
    </div>`;
}

// ============================================
//  PROFILE
// ============================================

function renderProfile() {
  const el = document.getElementById('tab-profile');
  if (!el) return;

  const animal = ANIMALS[state.user.animal];
  const level = getNirvanaLevel(state.xp);

  el.innerHTML = `
    <div class="navbar">
      <div class="navbar-bg"></div>
      <div class="navbar-inner">
        <div class="title">✨ Profile</div>
      </div>
    </div>

    <div class="profile-hero">
      <div class="profile-avatar">${animal.emoji}</div>
      <div class="profile-name">${state.user.name}</div>
      <div class="profile-joined">Joined ${formatDate(state.user.joinDate)}</div>
      <div class="profile-level-badge">${level.icon} ${level.name} · ${state.xp} XP</div>
    </div>

    <div class="block" style="margin-top:0">
      <div class="profile-stats-grid">
        <div class="profile-stat"><div class="profile-stat-value">${state.habits.length}</div><div class="profile-stat-label">Habits</div></div>
        <div class="profile-stat"><div class="profile-stat-value">${state.remoteFriends.length || getFriendsList().length}</div><div class="profile-stat-label">Friends</div></div>
        <div class="profile-stat"><div class="profile-stat-value">${getLongestStreak()}</div><div class="profile-stat-label">Best Streak</div></div>
      </div>
    </div>

    <div class="list inset">
      <ul>
        <li>
          <a class="item-link item-content" id="change-animal-btn">
            <div class="item-media" style="font-size:22px">${animal.emoji}</div>
            <div class="item-inner">
              <div class="item-title">Spirit Animal</div>
              <div class="item-after">${animal.name}</div>
            </div>
          </a>
        </li>
        <li>
          <a class="item-link item-content" id="change-name-btn">
            <div class="item-media" style="font-size:22px">✏️</div>
            <div class="item-inner">
              <div class="item-title">Change Name</div>
              <div class="item-after">${state.user.name}</div>
            </div>
          </a>
        </li>
        <li>
          <a class="item-link item-content" id="export-btn">
            <div class="item-media" style="font-size:22px">📤</div>
            <div class="item-inner">
              <div class="item-title">Export Data</div>
            </div>
          </a>
        </li>
      </ul>
    </div>

    <div class="list inset danger-zone" style="margin-top:24px">
      <ul>
        <li>
          <a class="item-link item-content" id="reset-btn">
            <div class="item-media" style="font-size:22px">🗑️</div>
            <div class="item-inner">
              <div class="item-title" style="color:var(--deez-accent-coral)">Reset Everything</div>
            </div>
          </a>
        </li>
      </ul>
    </div>`;

  // Event listeners
  document.getElementById('change-animal-btn')?.addEventListener('click', showChangeAnimalModal);
  document.getElementById('change-name-btn')?.addEventListener('click', showChangeNameModal);
  document.getElementById('export-btn')?.addEventListener('click', exportData);
  document.getElementById('reset-btn')?.addEventListener('click', showResetModal);
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `deez-backup-${today()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('📤', 'Data exported!');
}

// ============================================
//  MODALS (Framework7 Sheets)
// ============================================

let currentSheet = null;

function closeSheet() {
  if (currentSheet) {
    currentSheet.close();
    currentSheet.destroy();
    currentSheet = null;
  }
}

function openSheet(html, onOpened) {
  closeSheet();
  currentSheet = f7app.sheet.create({
    content: `
      <div class="sheet-modal" style="height:auto;max-height:85vh;border-radius:24px 24px 0 0;background:#1c1230">
        <div class="toolbar">
          <div class="toolbar-inner">
            <div class="left"></div>
            <div class="right"><a class="link sheet-close" style="color:var(--deez-accent-purple)">Done</a></div>
          </div>
        </div>
        <div class="sheet-modal-inner" style="overflow-y:auto;padding:0 20px calc(20px + env(safe-area-inset-bottom, 0px))">
          ${html}
        </div>
      </div>`,
    on: { opened: onOpened },
    backdrop: true,
    closeByBackdropClick: true,
    closeByOutsideClick: true,
  });
  currentSheet.open();
}

// --- Add Habit ---
function showAddHabitModal() {
  let selectedEmoji = '💪';

  openSheet(`
    <h2 class="sheet-title">New Habit ✨</h2>
    <div class="list no-hairlines" style="margin:0">
      <ul>
        <li class="item-content item-input">
          <div class="item-inner">
            <div class="item-title item-label" style="color:var(--deez-text-secondary)">Name</div>
            <div class="item-input-wrap">
              <input type="text" id="habit-name-input" placeholder="e.g. Run 5K, Meditate..." maxlength="30" style="color:#f0eaf8">
            </div>
          </div>
        </li>
      </ul>
    </div>
    <div style="margin:16px 0 8px;font-size:13px;font-weight:600;color:var(--deez-text-secondary);text-transform:uppercase;letter-spacing:0.5px">Icon</div>
    <div class="emoji-grid">
      ${HABIT_EMOJIS.map(e => `<button class="emoji-btn ${e === selectedEmoji ? 'selected' : ''}" data-emoji="${e}">${e}</button>`).join('')}
    </div>
    <button class="button button-fill button-large button-round" id="save-habit-btn" disabled style="margin-top:20px;width:100%">Add Habit</button>
  `, function () {
    const input = document.getElementById('habit-name-input');
    const saveBtn = document.getElementById('save-habit-btn');
    setTimeout(() => input?.focus(), 100);

    input?.addEventListener('input', () => { saveBtn.disabled = !input.value.trim(); });
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        addHabit(input.value.trim(), selectedEmoji);
      }
    });

    document.querySelectorAll('.emoji-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedEmoji = btn.dataset.emoji;
      });
    });

    saveBtn?.addEventListener('click', () => {
      if (input.value.trim()) addHabit(input.value.trim(), selectedEmoji);
    });
  });
}

function addHabit(name, emoji) {
  state.habits.push({
    id: 'h_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    name, emoji, animal: state.user.animal, createdAt: today(),
  });
  saveState();
  closeSheet();
  showToast('✨', `"${name}" added! Let's go!`);
  renderDashboard();
  syncWithSheet();
}

// --- Change Name ---
function showChangeNameModal() {
  openSheet(`
    <h2 class="sheet-title">Change Name</h2>
    <div class="list no-hairlines" style="margin:0">
      <ul>
        <li class="item-content item-input">
          <div class="item-inner">
            <div class="item-input-wrap">
              <input type="text" id="new-name-input" placeholder="Your new name" maxlength="20" value="${state.user.name}" style="color:#f0eaf8">
            </div>
          </div>
        </li>
      </ul>
    </div>
    <button class="button button-fill button-large button-round" id="save-name-btn" style="margin-top:20px;width:100%">Save</button>
  `, function () {
    const input = document.getElementById('new-name-input');
    setTimeout(() => { input?.focus(); input?.select(); }, 100);
    document.getElementById('save-name-btn')?.addEventListener('click', () => {
      if (input.value.trim()) {
        state.user.name = input.value.trim();
        saveState();
        closeSheet();
        showToast('✅', 'Name updated!');
        renderProfile();
        syncWithSheet();
      }
    });
  });
}

// --- Change Animal ---
function showChangeAnimalModal() {
  let selected = state.user.animal;

  openSheet(`
    <h2 class="sheet-title">Spirit Animal</h2>
    <div class="animal-grid" style="margin-bottom:16px">
      ${ANIMALS.map((a, i) => `<button class="animal-btn ${state.user.animal === i ? 'selected' : ''}" data-idx="${i}">${a.emoji}</button>`).join('')}
    </div>
    <div class="animal-label" id="animal-preview">${ANIMALS[state.user.animal].name} the ${ANIMALS[state.user.animal].trait}</div>
    <button class="button button-fill button-large button-round" id="save-animal-btn" style="margin-top:16px;width:100%">Save</button>
  `, function () {
    document.querySelectorAll('.animal-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        selected = parseInt(btn.dataset.idx);
        document.querySelectorAll('.animal-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        const p = document.getElementById('animal-preview');
        if (p) p.textContent = `${ANIMALS[selected].name} the ${ANIMALS[selected].trait}`;
      });
    });
    document.getElementById('save-animal-btn')?.addEventListener('click', () => {
      state.user.animal = selected;
      saveState();
      closeSheet();
      showToast(ANIMALS[selected].emoji, `${ANIMALS[selected].name} is now your spirit animal!`);
      renderProfile();
      syncWithSheet();
    });
  });
}

// --- Reset ---
function showResetModal() {
  if (!f7app) return;
  f7app.dialog.confirm(
    'This will delete all your habits, progress, and XP. Your journey to nirvana will start over.',
    'Reset Everything?',
    function () {
      stopSync();
      localStorage.removeItem('deez-state');
      state = { user: null, userId: generateId(), habits: [], xp: 0, completionLog: {}, hifiveCount: 0, apiUrl: '', remoteFriends: [], syncEnabled: false };
      onboardingStep = 0;
      onboardingName = '';
      onboardingAnimal = -1;
      showOnboarding();
    }
  );
}

// ============================================
//  HABIT TOGGLE
// ============================================

function toggleHabit(habitId, cardEl) {
  const todayStr = today();
  if (!state.completionLog[todayStr]) state.completionLog[todayStr] = [];
  const log = state.completionLog[todayStr];
  const index = log.indexOf(habitId);

  if (index >= 0) {
    log.splice(index, 1);
    state.xp = Math.max(0, state.xp - 10);
    saveState();
    renderDashboard();
    syncWithSheet();
    return;
  }

  log.push(habitId);
  const habit = state.habits.find(h => h.id === habitId);
  const streak = getStreak(habit);
  const xpGain = 10 + Math.min(streak * 2, 20);
  state.xp += xpGain;
  saveState();

  triggerHaptic('medium');

  if (cardEl) {
    const rect = cardEl.getBoundingClientRect();
    fireConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
  }

  const allDone = state.habits.every(h => log.includes(h.id));
  if (allDone && state.habits.length > 1) {
    triggerHaptic('heavy');
    setTimeout(() => { showToast('🎉', 'ALL HABITS COMPLETE! Incredible!'); fireConfetti(); }, 400);
  } else {
    showToast('⚡', `+${xpGain} XP!`);
  }

  const oldLevel = getNirvanaLevel(state.xp - xpGain);
  const newLevel = getNirvanaLevel(state.xp);
  if (newLevel.name !== oldLevel.name) {
    setTimeout(() => { showToast(newLevel.icon, `Level up! ${newLevel.name}!`, 3500); fireConfetti(); fireConfetti(); }, 600);
  }

  renderDashboard();
  syncWithSheet();
}

// ============================================
//  FLOATING ANIMALS
// ============================================

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

// ============================================
//  NATIVE INIT
// ============================================

async function initNative() {
  if (!isNative) return;
  try {
    const StatusBar = window.Capacitor?.Plugins?.StatusBar;
    if (StatusBar) {
      await StatusBar.setStyle({ style: 'DARK' });
      await StatusBar.setBackgroundColor({ color: '#0f0a1a' });
    }
  } catch (e) {}
  try {
    const SplashScreen = window.Capacitor?.Plugins?.SplashScreen;
    if (SplashScreen) await SplashScreen.hide();
  } catch (e) {}
}

// ============================================
//  INIT
// ============================================

function init() {
  setupConfetti();

  f7app = new Framework7({
    el: '#app',
    name: 'Deez',
    theme: 'auto',
    darkMode: true,
    colors: { primary: '#a855f7' },
  });

  if (state.user) {
    showMainApp();
  } else {
    showOnboarding();
  }

  initNative();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
