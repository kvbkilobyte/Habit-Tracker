// =============================================
// HABT — app.js
// =============================================
// localStorage keys:
//   "habits"        → [{ name, done }, ...]
//   "dailyLog"      → { "YYYY-MM-DD": { total, completed }, ... }
//   "lastActiveDate"→ "YYYY-MM-DD"  ← NEW: tracks which day was last seen
//
// Daily reset logic (the fix for this session):
//   On every page load we compare today's date to lastActiveDate.
//   If they differ, midnight has passed — we:
//     1. Write yesterday's final state into dailyLog (preserves history).
//     2. Reset every habit's done flag to false.
//     3. Save habits and update lastActiveDate to today.
//   This happens before any render, so the UI always opens on a clean day.
// =============================================


// ── 1. Grab elements ────────────────────────────────────────────────────────

const habitInput    = document.getElementById('habit-input');
const addBtn        = document.getElementById('add-btn');
const habitList     = document.getElementById('habit-list');
const errorMsg      = document.getElementById('error-msg');
const emptyMsg      = document.getElementById('empty-msg');
const streakCount   = document.getElementById('streak-count');
const calendarGrid  = document.getElementById('calendar-grid');
const progressFill  = document.getElementById('progress-bar-fill');
const progressLabel = document.getElementById('progress-label');
const dateDisplay   = document.getElementById('date-display');


// ── 2. Load from localStorage ───────────────────────────────────────────────

let habits   = JSON.parse(localStorage.getItem('habits'))   || [];
let dailyLog = JSON.parse(localStorage.getItem('dailyLog')) || {};


// ── 3. Date helpers ─────────────────────────────────────────────────────────

function getTodayKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function renderDate() {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  dateDisplay.textContent = new Date().toLocaleDateString(undefined, options);
}


// ── 4. Daily reset ──────────────────────────────────────────────────────────

function applyDailyResetIfNeeded() {
  const todayKey       = getTodayKey();
  const lastActiveDate = localStorage.getItem('lastActiveDate');

  if (!lastActiveDate) {
    localStorage.setItem('lastActiveDate', todayKey);
    return;
  }

  if (lastActiveDate === todayKey) {
    return;
  }

  if (habits.length > 0) {
    const total     = habits.length;
    const completed = habits.filter(function(h) { return h.done; }).length;
    dailyLog[lastActiveDate] = { total: total, completed: completed };
    localStorage.setItem('dailyLog', JSON.stringify(dailyLog));
  }

  habits = habits.map(function(habit) {
    return { name: habit.name, done: false };
  });
  localStorage.setItem('habits', JSON.stringify(habits));

  localStorage.setItem('lastActiveDate', todayKey);
}


// ── 5. Record today's snapshot into dailyLog ────────────────────────────────

function recordToday() {
  const key = getTodayKey();

  if (habits.length === 0) {
    delete dailyLog[key];
    localStorage.setItem('dailyLog', JSON.stringify(dailyLog));
    return;
  }

  const total     = habits.length;
  const completed = habits.filter(function(h) { return h.done; }).length;
  dailyLog[key]   = { total: total, completed: completed };
  localStorage.setItem('dailyLog', JSON.stringify(dailyLog));
}


// ── 6. Sidebar progress bar ─────────────────────────────────────────────────

function updateProgressBar() {
  const total     = habits.length;
  const completed = habits.filter(function(h) { return h.done; }).length;
  const pct       = total === 0 ? 0 : Math.round((completed / total) * 100);

  progressFill.style.width  = pct + '%';
  progressLabel.textContent = total === 0
    ? 'No habits yet'
    : `${completed} of ${total} done`;
}


// ── 7. Streak calculation ────────────────────────────────────────────────────

function calcStreak() {
  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0')
    ].join('-');

    const entry = dailyLog[key];
    if (!entry) break;
    if (entry.completed === entry.total && entry.total > 0) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function renderStreak() {
  streakCount.textContent = calcStreak();
}


// ── 8. Calendar grid (30 days) ──────────────────────────────────────────────

function renderCalendar() {
  calendarGrid.innerHTML = '';
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const y   = d.getFullYear();
    const m   = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const key = `${y}-${m}-${day}`;

    const cell = document.createElement('div');
    cell.classList.add('day-cell');
    cell.setAttribute('data-date', `${day}/${m}`);

    const entry = dailyLog[key];
    if (entry) {
      if (entry.completed === entry.total && entry.total > 0) {
        cell.classList.add('success');
      } else {
        cell.classList.add('fail');
      }
    }

    calendarGrid.appendChild(cell);
  }
}


// ── 9. Habit list ───────────────────────────────────────────────────────────

function renderHabits() {
  habitList.innerHTML = '';

  if (habits.length === 0) {
    emptyMsg.classList.remove('hidden');
  } else {
    emptyMsg.classList.add('hidden');
  }

  habits.forEach(function(habit, index) {
    const li = document.createElement('li');
    li.classList.add('habit-item');
    if (habit.done) li.classList.add('done');

    const checkSVG = `<svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polyline points="1.5,6 4.5,9.5 10.5,2.5"/>
    </svg>`;

    li.innerHTML = `
      <input
        type="checkbox"
        id="habit-${index}"
        ${habit.done ? 'checked' : ''}
      />
      <div class="custom-check">${checkSVG}</div>
      <label for="habit-${index}">${habit.name}</label>
      <button class="delete-btn" data-index="${index}" title="Delete habit">×</button>
    `;

    habitList.appendChild(li);
  });
}


// ── 10. Save habits ─────────────────────────────────────────────────────────

function saveHabits() {
  localStorage.setItem('habits', JSON.stringify(habits));
}


// ── 11. Master render ───────────────────────────────────────────────────────

function renderAll() {
  renderHabits();
  recordToday();
  updateProgressBar();
  renderCalendar();
  renderStreak();
}


// ── 12. Add habit ───────────────────────────────────────────────────────────

addBtn.addEventListener('click', function() {
  const name = habitInput.value.trim();
  if (name === '') {
    errorMsg.classList.remove('hidden');
    return;
  }
  errorMsg.classList.add('hidden');
  habits.push({ name: name, done: false });
  saveHabits();
  renderAll();
  habitInput.value = '';
  habitInput.focus();
});


// ── 13. Enter key shortcut ──────────────────────────────────────────────────

habitInput.addEventListener('keydown', function(event) {
  if (event.key === 'Enter') addBtn.click();
});


// ── 14. Toggle + delete (event delegation) ──────────────────────────────────

habitList.addEventListener('click', function(event) {

  if (event.target.classList.contains('delete-btn')) {
    const index = parseInt(event.target.dataset.index);
    habits.splice(index, 1);
    saveHabits();
    renderAll();
    return;
  }

  const li = event.target.closest('.habit-item');
  if (!li) return;

  const checkbox = li.querySelector('input[type="checkbox"]');
  if (!checkbox) return;

  const index = parseInt(checkbox.id.replace('habit-', ''));
  habits[index].done = !habits[index].done;
  saveHabits();
  renderAll();
});


// ── 15. Startup sequence ────────────────────────────────────────────────────

applyDailyResetIfNeeded();
renderDate();
renderAll();