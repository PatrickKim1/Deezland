/* ============================================
   DEEZ - Reach Nirvana Together
   Now with real multiplayer via Google Sheets!
   ============================================ */

// Auto-detect API URL: use the same origin when served by server.py
const API_URL = window.location.protocol !== 'file:'
  ? window.location.origin + '/api'
  : '';

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

// --- Utility ---
const today = () => new Date().toISOString().split('T')[0];
function $(sel, parent = document) { return parent.querySelector(sel); }
function $$(sel, parent = document) { return [...parent.querySelectorAll(sel)]; }
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
  // Multiplayer
  apiUrl: '',
  remoteFriends: [],
  syncEnabled: false,
};

// Ensure userId exists (for old states)
if (!state.userId) {
  state.userId = generateId();
  saveState();
}

let currentPage = 'dashboard';
let syncing = false;
let syncInterval = null;

// ============================================
//  SYNC ENGINE (Google Sheets)
// ============================================

async function syncWithSheet() {
  const url = API_URL || state.apiUrl;
  if (!url || !state.user || syncing) return;
  syncing = true;

  try {
    const payload = {
      action: 'sync',
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

    const res = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json();

    if (data.ok) {
      // Update remote friends (everyone except me)
      state.remoteFriends = data.users
        .filter(u => u.userId !== state.userId)
        .map(u => {
          const d = u.data || {};
          const habits = (d.habits || []).map(h => ({
            name: h.name,
            emoji: h.emoji,
            done: (d.todayCompleted || []).includes(h.id),
          }));

          // Calculate streak-ish from their completionLog
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

          // Check if they were active in the last 5 minutes
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

      // Handle notifications
      if (data.notifications?.length > 0) {
        for (const notif of data.notifications) {
          const animal = ANIMALS[notif.fromAnimal] || ANIMALS[0];
          if (notif.type === 'hifive') {
            showToast('🙌', `${notif.fromName} hi-fived you! ${animal.emoji}`);
          } else if (notif.type === 'poke') {
            showToast('👉', `${notif.fromName} poked you! ${animal.emoji}`);
          }
        }
        // Re-render friends page if we're on it
        if (currentPage === 'friends') render();
      }

      saveState();

      // Silently update friends list if on that page
      if (currentPage === 'friends') {
        const content = $('#page-content');
        if (content) {
          content.innerHTML = renderFriends();
          attachPageEvents();
        }
      }
    }
  } catch (err) {
    console.warn('Sync error:', err);
  } finally {
    syncing = false;
  }
}

function startSync() {
  if (syncInterval) clearInterval(syncInterval);
  const url = API_URL || state.apiUrl;
  if (url && state.user) {
    syncWithSheet(); // Initial sync
    syncInterval = setInterval(syncWithSheet, 8000); // Every 8 seconds
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

async function testApiUrl(url) {
  try {
    const testUrl = url.includes('/api') ? url + '?action=ping' : url + '?action=ping';
    const res = await fetch(testUrl);
    const data = await res.json();
    return data.ok === true;
  } catch (e) {
    return false;
  }
}

async function sendInteraction(toUserId, type) {
  const url = API_URL || state.apiUrl;
  if (!url) return;
  try {
    await fetch(url, {
      method: 'POST',
      body: JSON.stringify({
        action: 'interact',
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
//  TOAST
// ============================================

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

// ============================================
//  HI-FIVE & POKE ANIMATIONS
// ============================================

function showHiFive(friendName, friendUserId) {
  const overlay = document.createElement('div');
  overlay.className = 'hifive-overlay';
  overlay.innerHTML = '<div class="hifive-hand">🙌</div>';
  document.body.appendChild(overlay);
  fireConfetti();
  showToast('🙌', `You hi-fived ${friendName}!`);
  setTimeout(() => overlay.remove(), 800);

  if (friendUserId && state.apiUrl) {
    sendInteraction(friendUserId, 'hifive');
  }
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
  showToast('👉', `You poked ${friendName}! They'll feel that!`);

  if (friendUserId && state.apiUrl) {
    sendInteraction(friendUserId, 'poke');
  }
}

// ============================================
//  ROUTER & RENDER
// ============================================

function navigate(page) {
  currentPage = page;
  render();
}

function render() {
  const app = document.getElementById('app');
  if (!state.user) {
    app.innerHTML = renderOnboarding();
    attachOnboardingEvents();
    return;
  }
  app.innerHTML = `
    <div class="main-layout">
      <div class="page-content" id="page-content">${renderPage()}</div>
      ${renderBottomNav()}
    </div>
  `;
  attachPageEvents();
  renderFloatingAnimals();
}

// ============================================
//  ONBOARDING
// ============================================

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
            placeholder="Enter your name" maxlength="20" autocomplete="off" value="${onboardingName}">
          <button class="btn-primary" id="next-btn" ${onboardingName.trim().length < 1 ? 'disabled' : ''}>Continue</button>
        </div>
      </div>`;
  }
  if (onboardingStep === 1) {
    return `
      <div class="onboarding">
        <div class="onboarding-logo">🪷</div>
        <h1>Deez</h1>
        <p class="onboarding-subtitle">Choose your spirit animal. They'll be your companion on the path to nirvana.</p>
        <div class="onboarding-step">
          <h2>Pick your spirit animal</h2>
          <div class="animal-grid">
            ${ANIMALS.map((a, i) => `
              <div class="animal-option ${onboardingAnimal === i ? 'selected' : ''}" data-animal="${i}">${a.emoji}</div>
            `).join('')}
          </div>
          <div class="animal-name">
            ${onboardingAnimal >= 0 ? `${ANIMALS[onboardingAnimal].name} the ${ANIMALS[onboardingAnimal].trait}` : 'Tap to choose'}
          </div>
          <button class="btn-primary" id="next-btn-2" ${onboardingAnimal < 0 ? 'disabled' : ''}>Continue</button>
        </div>
      </div>`;
  }
  // Step 2: Join a group (optional)
  return `
    <div class="onboarding">
      <div class="onboarding-logo">🤝</div>
      <h1>Join Friends</h1>
      <p class="onboarding-subtitle">Paste a group link to connect with friends, or skip to go solo for now.</p>
      <div class="onboarding-step">
        <h2>Group Link</h2>
        <input type="text" class="onboarding-input" id="api-input"
          placeholder="Paste the group URL here" autocomplete="off" style="font-size:14px;">
        <p style="color:var(--text-muted);font-size:12px;margin-top:12px;line-height:1.5;">
          Don't have one? Ask a friend to set up a Google Sheet backend, or tap Skip to use Deez solo.
        </p>
        <button class="btn-primary" id="start-btn">Connect & Start 🚀</button>
        <button class="btn-secondary" id="skip-btn" style="width:100%;margin-top:12px;">Skip — Go Solo</button>
      </div>
    </div>`;
}

function attachOnboardingEvents() {
  // Step 0: Name
  const nameInput = $('#name-input');
  const nextBtn = $('#next-btn');
  if (nameInput) {
    nameInput.focus();
    nameInput.addEventListener('input', (e) => {
      onboardingName = e.target.value;
      if (nextBtn) nextBtn.disabled = onboardingName.trim().length < 1;
    });
    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && onboardingName.trim().length >= 1) { onboardingStep = 1; render(); }
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (onboardingName.trim().length >= 1) { onboardingStep = 1; render(); }
    });
  }

  // Step 1: Animal
  $$('.animal-option').forEach(el => {
    el.addEventListener('click', () => {
      onboardingAnimal = parseInt(el.dataset.animal);
      render();
    });
  });
  const nextBtn2 = $('#next-btn-2');
  if (nextBtn2) {
    nextBtn2.addEventListener('click', () => {
      if (onboardingAnimal >= 0) { onboardingStep = 2; render(); }
    });
  }

  // Step 2: Group URL
  const startBtn = $('#start-btn');
  const skipBtn = $('#skip-btn');
  const apiInput = $('#api-input');

  if (startBtn) {
    startBtn.addEventListener('click', async () => {
      const url = apiInput?.value?.trim();
      if (!url) {
        showToast('⚠️', 'Paste a group URL or tap Skip');
        return;
      }
      startBtn.disabled = true;
      startBtn.textContent = 'Testing connection...';
      const ok = await testApiUrl(url);
      if (ok) {
        finishOnboarding(url);
      } else {
        showToast('❌', 'Could not connect. Check the URL and try again.');
        startBtn.disabled = false;
        startBtn.textContent = 'Connect & Start 🚀';
      }
    });
  }

  if (skipBtn) {
    skipBtn.addEventListener('click', () => finishOnboarding(''));
  }
}

function finishOnboarding(apiUrl) {
  state.user = {
    name: onboardingName.trim(),
    animal: onboardingAnimal,
    joinDate: today(),
  };
  state.apiUrl = apiUrl;
  saveState();
  fireConfetti();
  if (apiUrl) {
    showToast('🎉', `Welcome, ${state.user.name}! You're connected!`);
    startSync();
  } else {
    showToast('🎉', `Welcome, ${state.user.name}! Your journey begins!`);
  }
  render();
}

// ============================================
//  PAGES
// ============================================

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
  let mascotMsg = state.habits.length === 0
    ? randomFrom(MASCOT_MESSAGES.empty)
    : allDone ? randomFrom(MASCOT_MESSAGES.allDone) : randomFrom(MASCOT_MESSAGES[timeOfDay]);

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
        <div class="mascot-text"><p><strong>${animal.name} says:</strong> ${mascotMsg}</p></div>
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
            <div class="habit-card ${done ? 'completed' : ''} habit-card-delay-${i + 1}" data-habit-id="${habit.id}">
              <div class="habit-checkbox ${done ? 'check-pop' : ''}">${done ? '✓' : ''}</div>
              <span class="habit-emoji">${habit.emoji}</span>
              <div class="habit-info">
                <div class="habit-name">${habit.name}</div>
                ${streak > 0 ? `<div class="habit-streak"><span class="streak-fire">🔥</span> ${streak} day${streak !== 1 ? 's' : ''}</div>` : ''}
              </div>
              <span class="habit-animal">${ANIMALS[habit.animal || state.user.animal].emoji}</span>
            </div>`;
        }).join('')}
      </div>
    ` : `
      <div class="empty-state">
        <div class="empty-state-icon">${animal.emoji}</div>
        <h3>No habits yet!</h3>
        <p>${animal.name} is waiting for you to start your journey. Add your first habit!</p>
        <button class="btn-primary" id="add-habit-empty-btn">Add First Habit ✨</button>
      </div>
    `}`;
}

// --- Friends ---
function renderFriends() {
  const friends = getFriendsList();
  const isConnected = !!(API_URL || state.apiUrl);

  return `
    <div class="page-header">
      <h1>🤝 Friends</h1>
      ${isConnected ? '<div class="header-actions"><span style="font-size:12px;color:var(--accent-green);display:flex;align-items:center;gap:4px;"><span class="status-dot"></span>Live</span></div>' : ''}
    </div>

    ${!isConnected ? `
      <div class="empty-state" style="padding-top:20px;padding-bottom:20px;">
        <div class="empty-state-icon">🔗</div>
        <h3>Connect with friends!</h3>
        <p>Run server.py to enable multiplayer, or paste a group URL.</p>
        <button class="btn-primary" id="setup-group-btn">Setup Guide</button>
        <button class="btn-secondary" style="margin-top:12px;" id="join-group-btn">Join Existing Group</button>
      </div>
      <div class="section-header"><h2>Demo Friends</h2></div>
    ` : ''}

    <div class="friends-list">
      ${friends.map((friend, i) => {
        const friendAnimal = ANIMALS[friend.animal] || ANIMALS[0];
        const friendLevel = getNirvanaLevel(friend.xp || friend.level * 200 || 0);
        return `
          <div class="friend-card friend-card-delay-${i + 1}" data-friend-id="${friend.id || friend.userId}">
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
                <span class="friend-habit-pill ${h.done ? 'done' : ''}">${h.emoji} ${h.name} ${h.done ? '✓' : ''}</span>
              `).join('')}
              ${(!friend.habits || friend.habits.length === 0) ? '<span class="friend-habit-pill">No habits yet</span>' : ''}
            </div>
            <div class="friend-actions">
              <button class="friend-action-btn btn-hifive" data-action="hifive"
                data-friend-id="${friend.id || friend.userId}"
                data-friend-name="${friend.name}"
                data-friend-userid="${friend.userId || ''}">
                🙌 Hi Five
              </button>
              <button class="friend-action-btn btn-poke" data-action="poke"
                data-friend-id="${friend.id || friend.userId}"
                data-friend-name="${friend.name}"
                data-friend-userid="${friend.userId || ''}">
                👉 Poke
              </button>
            </div>
          </div>`;
      }).join('')}
    </div>

    ${isConnected ? `
      <div style="padding: 20px;">
        <button class="btn-secondary" style="width: 100%;" id="share-group-btn">📋 Share Group Link</button>
      </div>
    ` : ''}
  `;
}

function getFriendsList() {
  if ((API_URL || state.apiUrl) && state.remoteFriends.length > 0) {
    return state.remoteFriends;
  }
  // Demo friends when not connected
  return [
    { id: 'f1', name: 'Alex', animal: 3, level: 4, online: true, xp: 800,
      habits: [{ name: 'Run 5K', emoji: '🏃', done: true }, { name: 'Read', emoji: '📚', done: true }, { name: 'Meditate', emoji: '🧘', done: false }], streak: 12 },
    { id: 'f2', name: 'Jordan', animal: 7, level: 6, online: true, xp: 1200,
      habits: [{ name: 'Gym', emoji: '💪', done: true }, { name: 'Journal', emoji: '✍️', done: true }, { name: 'No sugar', emoji: '🥗', done: true }], streak: 28 },
    { id: 'f3', name: 'Sam', animal: 0, level: 2, online: false, xp: 200,
      habits: [{ name: 'Walk dog', emoji: '🐾', done: true }, { name: 'Drink water', emoji: '💧', done: false }], streak: 3 },
    { id: 'f4', name: 'Riley', animal: 5, level: 8, online: true, xp: 2900,
      habits: [{ name: 'Code 1hr', emoji: '💻', done: true }, { name: 'Exercise', emoji: '🏃', done: true }, { name: 'Cook', emoji: '🍳', done: true }], streak: 45 },
  ];
}

// --- Stats ---
function renderStats() {
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

  return `
    <div class="page-header"><h1>📊 Stats</h1></div>
    <div class="stats-grid">
      <div class="stat-card stat-card-delay-1"><div class="stat-value fire">${longestStreak}</div><div class="stat-label">🔥 Best Streak</div></div>
      <div class="stat-card stat-card-delay-2"><div class="stat-value green">${totalCompletions}</div><div class="stat-label">✅ Completions</div></div>
      <div class="stat-card stat-card-delay-3"><div class="stat-value purple">${daysActive}</div><div class="stat-label">📅 Days Active</div></div>
      <div class="stat-card stat-card-delay-4"><div class="stat-value teal">${state.xp}</div><div class="stat-label">⚡ Total XP</div></div>
    </div>
    <div class="heatmap-section">
      <div class="heatmap-card">
        <h3>🗓️ Activity</h3>
        <div class="heatmap-grid">
          ${heatmapDays.map(d => `<div class="heatmap-cell ${d.isFuture ? 'future' : d.level > 0 ? 'level-' + d.level : ''}" title="${d.date}: ${d.count}"></div>`).join('')}
        </div>
        <div class="heatmap-labels"><span>5 weeks ago</span><span>Today</span></div>
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
    </div>`;
}

// --- Profile ---
function renderProfile() {
  const animal = ANIMALS[state.user.animal];
  const level = getNirvanaLevel(state.xp);
  const isConnected = !!(API_URL || state.apiUrl);

  return `
    <div class="page-header"><h1>✨ Profile</h1></div>
    <div class="profile-hero">
      <div class="profile-avatar">${animal.emoji}</div>
      <div class="profile-name">${state.user.name}</div>
      <div class="profile-joined">Joined ${formatDate(state.user.joinDate)}</div>
      <div class="profile-level-badge">${level.icon} ${level.name} · ${state.xp} XP</div>
    </div>
    <div class="profile-stats">
      <div class="profile-stat"><div class="profile-stat-value">${state.habits.length}</div><div class="profile-stat-label">Habits</div></div>
      <div class="profile-stat"><div class="profile-stat-value">${state.remoteFriends.length || getFriendsList().length}</div><div class="profile-stat-label">Friends</div></div>
      <div class="profile-stat"><div class="profile-stat-value">${getLongestStreak()}</div><div class="profile-stat-label">Best Streak</div></div>
    </div>
    <div class="profile-actions">
      <button class="profile-action" id="group-settings-btn">
        <span class="profile-action-icon">${isConnected ? '🟢' : '🔗'}</span>
        <div class="profile-action-text">
          <strong>Group Connection</strong>
          <span>${isConnected ? 'Connected — syncing with friends' : 'Not connected — tap to join a group'}</span>
        </div>
        <span class="profile-action-arrow">›</span>
      </button>
      <button class="profile-action" id="change-animal-btn">
        <span class="profile-action-icon">${animal.emoji}</span>
        <div class="profile-action-text"><strong>Spirit Animal</strong><span>${animal.name} the ${animal.trait}</span></div>
        <span class="profile-action-arrow">›</span>
      </button>
      <button class="profile-action" id="change-name-btn">
        <span class="profile-action-icon">✏️</span>
        <div class="profile-action-text"><strong>Change Name</strong><span>${state.user.name}</span></div>
        <span class="profile-action-arrow">›</span>
      </button>
      <button class="profile-action" id="export-btn">
        <span class="profile-action-icon">📤</span>
        <div class="profile-action-text"><strong>Export Data</strong><span>Download your journey</span></div>
        <span class="profile-action-arrow">›</span>
      </button>
      <div class="danger-zone">
        <button class="profile-action" id="reset-btn">
          <span class="profile-action-icon">🗑️</span>
          <div class="profile-action-text"><strong style="color: var(--accent-coral);">Reset Everything</strong><span>Start fresh from the beginning</span></div>
          <span class="profile-action-arrow">›</span>
        </button>
      </div>
    </div>`;
}

// ============================================
//  BOTTOM NAV
// ============================================

function renderBottomNav() {
  const pages = [
    { id: 'dashboard', icon: '🏠', label: 'Home' },
    { id: 'friends', icon: '👥', label: 'Friends' },
    { id: 'stats', icon: '📊', label: 'Stats' },
    { id: 'profile', icon: '✨', label: 'Profile' },
  ];
  return `<nav class="bottom-nav">
    ${pages.map(p => `
      <button class="nav-item ${currentPage === p.id ? 'active' : ''}" data-page="${p.id}">
        <span class="nav-icon">${p.icon}</span>
        <span class="nav-label">${p.label}</span>
      </button>
    `).join('')}
  </nav>`;
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
    el.style.left = '0'; el.style.top = '0';
    container.appendChild(el);
  }
  document.body.appendChild(container);
}

// ============================================
//  MODALS
// ============================================

function showModal(content) {
  const root = document.getElementById('modal-root');
  root.innerHTML = `
    <div class="modal-overlay" id="modal-overlay">
      <div class="modal-sheet"><div class="modal-handle"></div>${content}</div>
    </div>`;
  const overlay = $('#modal-overlay');
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
}

function closeModal() {
  const root = document.getElementById('modal-root');
  const overlay = root.querySelector('.modal-overlay');
  if (overlay) {
    overlay.style.animation = 'fadeIn 0.2s ease reverse forwards';
    const sheet = overlay.querySelector('.modal-sheet');
    if (sheet) sheet.style.animation = 'slideSheetUp 0.3s ease reverse forwards';
    setTimeout(() => { root.innerHTML = ''; }, 250);
  } else root.innerHTML = '';
}

// --- Add Habit ---
let newHabitEmoji = '💪';

function showAddHabitModal() {
  newHabitEmoji = '💪';
  showModal(`
    <h2 class="modal-title">New Habit ✨</h2>
    <div class="form-group">
      <label class="form-label">Habit Name</label>
      <input type="text" class="form-input" id="habit-name-input" placeholder="e.g. Run 5K, Meditate, Read..." maxlength="30" autocomplete="off">
    </div>
    <div class="form-group">
      <label class="form-label">Icon</label>
      <div class="emoji-picker">
        ${HABIT_EMOJIS.map(e => `<div class="emoji-option ${e === newHabitEmoji ? 'selected' : ''}" data-emoji="${e}">${e}</div>`).join('')}
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" id="modal-cancel">Cancel</button>
      <button class="btn-primary" id="modal-save" disabled>Add Habit</button>
    </div>
  `);
  const nameInput = $('#habit-name-input');
  const saveBtn = $('#modal-save');
  setTimeout(() => nameInput?.focus(), 350);
  nameInput?.addEventListener('input', () => { saveBtn.disabled = !nameInput.value.trim(); });
  nameInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && nameInput.value.trim()) addHabit(nameInput.value.trim(), newHabitEmoji);
  });
  $$('.emoji-option').forEach(el => {
    el.addEventListener('click', () => {
      $$('.emoji-option').forEach(e => e.classList.remove('selected'));
      el.classList.add('selected');
      newHabitEmoji = el.dataset.emoji;
    });
  });
  $('#modal-save')?.addEventListener('click', () => { if (nameInput.value.trim()) addHabit(nameInput.value.trim(), newHabitEmoji); });
  $('#modal-cancel')?.addEventListener('click', closeModal);
}

function addHabit(name, emoji) {
  state.habits.push({
    id: 'h_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    name, emoji, animal: state.user.animal, createdAt: today(),
  });
  saveState();
  closeModal();
  showToast('✨', `"${name}" added! Let's go!`);
  render();
  syncWithSheet();
}

// --- Group Settings Modal ---
function showGroupModal() {
  const isConnected = !!state.apiUrl;
  showModal(`
    <h2 class="modal-title">${isConnected ? 'Group Settings' : 'Connect to Group'}</h2>
    ${isConnected ? `
      <div style="text-align:center;margin-bottom:20px;">
        <div style="font-size:48px;margin-bottom:8px;">🟢</div>
        <p style="color:var(--accent-green);font-weight:600;">Connected & Syncing</p>
        <p style="color:var(--text-muted);font-size:12px;margin-top:4px;">${state.remoteFriends.length} friend${state.remoteFriends.length !== 1 ? 's' : ''} in group</p>
      </div>
      <div class="form-group">
        <label class="form-label">Group URL</label>
        <input type="text" class="form-input" id="api-url-display" value="${state.apiUrl}" readonly style="font-size:12px;color:var(--text-secondary);">
      </div>
      <div class="modal-actions">
        <button class="btn-secondary" id="copy-url-btn">📋 Copy Link</button>
        <button class="btn-primary" id="disconnect-btn" style="background:var(--accent-coral);box-shadow:0 4px 20px rgba(255,79,129,0.4);">Disconnect</button>
      </div>
    ` : `
      <p style="color:var(--text-secondary);font-size:14px;text-align:center;line-height:1.6;margin-bottom:20px;">
        To connect with friends, you need a Google Sheet backend.<br>
        Check <strong>backend.gs</strong> in the project for setup instructions.
      </p>
      <div class="form-group">
        <label class="form-label">Group URL</label>
        <input type="text" class="form-input" id="api-url-input" placeholder="Paste the Google Apps Script URL" autocomplete="off" style="font-size:14px;">
      </div>
      <div class="modal-actions">
        <button class="btn-secondary" id="modal-cancel">Cancel</button>
        <button class="btn-primary" id="connect-btn">Connect</button>
      </div>
    `}
  `);

  if (isConnected) {
    $('#copy-url-btn')?.addEventListener('click', () => {
      navigator.clipboard?.writeText(state.apiUrl).then(() => showToast('📋', 'Group link copied!'));
    });
    $('#disconnect-btn')?.addEventListener('click', () => {
      state.apiUrl = '';
      state.remoteFriends = [];
      stopSync();
      saveState();
      closeModal();
      showToast('👋', 'Disconnected from group');
      render();
    });
  } else {
    $('#connect-btn')?.addEventListener('click', async () => {
      const url = $('#api-url-input')?.value?.trim();
      if (!url) { showToast('⚠️', 'Paste a URL first'); return; }
      const btn = $('#connect-btn');
      btn.disabled = true; btn.textContent = 'Testing...';
      const ok = await testApiUrl(url);
      if (ok) {
        state.apiUrl = url;
        saveState();
        closeModal();
        showToast('🎉', 'Connected! Syncing with friends...');
        startSync();
        render();
      } else {
        showToast('❌', 'Could not connect. Check the URL.');
        btn.disabled = false; btn.textContent = 'Connect';
      }
    });
    $('#modal-cancel')?.addEventListener('click', closeModal);
  }
}

// --- Setup Guide Modal ---
function showSetupGuideModal() {
  showModal(`
    <h2 class="modal-title">Set Up a Group 🛠️</h2>
    <div style="color:var(--text-secondary);font-size:14px;line-height:1.8;">
      <p><strong style="color:var(--text-primary);">Quick setup (2 min):</strong></p>
      <ol style="padding-left:20px;margin:12px 0;">
        <li>Go to <strong>sheets.new</strong> in your browser</li>
        <li>Click <strong>Extensions → Apps Script</strong></li>
        <li>Delete the default code</li>
        <li>Copy the code from <strong>backend.gs</strong></li>
        <li>Click <strong>Deploy → New deployment</strong></li>
        <li>Select <strong>Web app</strong></li>
        <li>Set "Who has access" to <strong>Anyone</strong></li>
        <li>Click <strong>Deploy</strong>, authorize, and copy the URL</li>
      </ol>
      <p>Share that URL with your friends!</p>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" id="modal-cancel">Got it</button>
      <button class="btn-primary" id="open-sheets-btn">Open Google Sheets</button>
    </div>
  `);
  $('#modal-cancel')?.addEventListener('click', closeModal);
  $('#open-sheets-btn')?.addEventListener('click', () => {
    window.open('https://sheets.new', '_blank');
  });
}

// --- Other Modals ---
function showChangeNameModal() {
  showModal(`
    <h2 class="modal-title">Change Name</h2>
    <div class="form-group">
      <input type="text" class="form-input" id="new-name-input" placeholder="Your new name" maxlength="20" autocomplete="off" value="${state.user.name}">
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" id="modal-cancel">Cancel</button>
      <button class="btn-primary" id="modal-save">Save</button>
    </div>
  `);
  const input = $('#new-name-input');
  setTimeout(() => { input?.focus(); input?.select(); }, 350);
  $('#modal-save')?.addEventListener('click', () => {
    if (input.value.trim()) {
      state.user.name = input.value.trim();
      saveState(); closeModal();
      showToast('✅', 'Name updated!');
      render(); syncWithSheet();
    }
  });
  $('#modal-cancel')?.addEventListener('click', closeModal);
}

function showChangeAnimalModal() {
  showModal(`
    <h2 class="modal-title">Spirit Animal</h2>
    <div class="animal-grid" style="margin-bottom:24px;">
      ${ANIMALS.map((a, i) => `<div class="animal-option ${state.user.animal === i ? 'selected' : ''}" data-animal="${i}">${a.emoji}</div>`).join('')}
    </div>
    <div class="animal-name" id="animal-preview">${ANIMALS[state.user.animal].name} the ${ANIMALS[state.user.animal].trait}</div>
    <div class="modal-actions">
      <button class="btn-secondary" id="modal-cancel">Cancel</button>
      <button class="btn-primary" id="modal-save">Save</button>
    </div>
  `);
  let selected = state.user.animal;
  $$('.animal-option').forEach(el => {
    el.addEventListener('click', () => {
      selected = parseInt(el.dataset.animal);
      $$('.animal-option').forEach(e => e.classList.remove('selected'));
      el.classList.add('selected');
      const a = ANIMALS[selected];
      const p = $('#animal-preview');
      if (p) p.textContent = `${a.name} the ${a.trait}`;
    });
  });
  $('#modal-save')?.addEventListener('click', () => {
    state.user.animal = selected;
    saveState(); closeModal();
    showToast(ANIMALS[selected].emoji, `${ANIMALS[selected].name} is now your spirit animal!`);
    render(); syncWithSheet();
  });
  $('#modal-cancel')?.addEventListener('click', closeModal);
}

function showResetModal() {
  showModal(`
    <h2 class="modal-title">Reset Everything?</h2>
    <p style="text-align:center;color:var(--text-secondary);margin-bottom:24px;line-height:1.6;">
      This will delete all your habits, progress, and XP. Your journey to nirvana will start over.
    </p>
    <div class="modal-actions">
      <button class="btn-secondary" id="modal-cancel">Keep My Data</button>
      <button class="btn-primary" id="modal-confirm" style="background:var(--accent-coral);box-shadow:0 4px 20px rgba(255,79,129,0.4);">Reset</button>
    </div>
  `);
  $('#modal-confirm')?.addEventListener('click', () => {
    stopSync();
    localStorage.removeItem('deez-state');
    state = { user: null, userId: generateId(), habits: [], xp: 0, completionLog: {}, hifiveCount: 0, apiUrl: '', remoteFriends: [], syncEnabled: false };
    onboardingStep = 0; onboardingName = ''; onboardingAnimal = -1;
    closeModal(); render();
  });
  $('#modal-cancel')?.addEventListener('click', closeModal);
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
//  EVENT ATTACHMENT
// ============================================

function attachPageEvents() {
  // Bottom nav
  $$('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.page));
  });

  // Dashboard
  $('#add-habit-btn')?.addEventListener('click', showAddHabitModal);
  $('#add-habit-empty-btn')?.addEventListener('click', showAddHabitModal);

  // Habit toggles
  $$('.habit-card').forEach(card => {
    card.addEventListener('click', () => toggleHabit(card.dataset.habitId, card));
  });

  // Friends actions
  $$('.friend-action-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = btn.dataset.action;
      const friendId = btn.dataset.friendId;
      const friendName = btn.dataset.friendName;
      const friendUserId = btn.dataset.friendUserid;
      if (action === 'hifive') showHiFive(friendName, friendUserId);
      else if (action === 'poke') showPoke(friendId, friendName, friendUserId);
    });
  });

  // Friends page buttons
  $('#setup-group-btn')?.addEventListener('click', showSetupGuideModal);
  $('#join-group-btn')?.addEventListener('click', showGroupModal);
  $('#share-group-btn')?.addEventListener('click', () => {
    if (navigator.share) {
      navigator.share({ title: 'Join me on Deez!', text: 'Track habits together. Paste this link in Deez:', url: state.apiUrl });
    } else {
      navigator.clipboard?.writeText(state.apiUrl).then(() => showToast('📋', 'Group link copied!'));
    }
  });

  // Profile
  $('#group-settings-btn')?.addEventListener('click', showGroupModal);
  $('#change-animal-btn')?.addEventListener('click', showChangeAnimalModal);
  $('#change-name-btn')?.addEventListener('click', showChangeNameModal);
  $('#export-btn')?.addEventListener('click', exportData);
  $('#reset-btn')?.addEventListener('click', showResetModal);
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
    saveState(); render(); syncWithSheet();
    return;
  }

  log.push(habitId);
  const habit = state.habits.find(h => h.id === habitId);
  const streak = getStreak(habit);
  const xpGain = 10 + Math.min(streak * 2, 20);
  state.xp += xpGain;
  saveState();

  if (cardEl) {
    const rect = cardEl.getBoundingClientRect();
    fireConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
  }

  const allDone = state.habits.every(h => log.includes(h.id));
  if (allDone && state.habits.length > 1) {
    setTimeout(() => { showToast('🎉', 'ALL HABITS COMPLETE! Incredible!'); fireConfetti(); }, 400);
  } else {
    showToast('⚡', `+${xpGain} XP!`);
  }

  const oldLevel = getNirvanaLevel(state.xp - xpGain);
  const newLevel = getNirvanaLevel(state.xp);
  if (newLevel.name !== oldLevel.name) {
    setTimeout(() => { showToast(newLevel.icon, `Level up! ${newLevel.name}!`, 3500); fireConfetti(); fireConfetti(); }, 600);
  }

  render();
  syncWithSheet();
}

// --- Long press to delete habit ---
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
      <p style="text-align:center;color:var(--text-secondary);margin-bottom:24px;">This habit and its streak will be removed.</p>
      <div class="modal-actions">
        <button class="btn-secondary" id="modal-cancel">Keep</button>
        <button class="btn-primary" id="modal-confirm" style="background:var(--accent-coral);box-shadow:0 4px 20px rgba(255,79,129,0.4);">Delete</button>
      </div>
    `);
    $('#modal-confirm')?.addEventListener('click', () => {
      state.habits = state.habits.filter(h => h.id !== habitId);
      for (const date in state.completionLog) {
        state.completionLog[date] = state.completionLog[date].filter(id => id !== habitId);
        if (state.completionLog[date].length === 0) delete state.completionLog[date];
      }
      saveState(); closeModal();
      showToast('🗑️', `"${habit.name}" removed`);
      render(); syncWithSheet();
    });
    $('#modal-cancel')?.addEventListener('click', closeModal);
  }, 600);
});
document.addEventListener('pointerup', () => { if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; } });
document.addEventListener('pointermove', () => { if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; } });

// ============================================
//  INIT
// ============================================

render();

// Auto-start sync when served by server.py or previously connected
if ((API_URL || state.apiUrl) && state.user) {
  startSync();
}
