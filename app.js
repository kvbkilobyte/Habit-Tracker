// =============================================
// HABT — app.js
// =============================================
// localStorage keys:
//   "habits"   → [{ name, done }, ...]
//   "dailyLog" → { "YYYY-MM-DD": { total, completed }, ... }
//
// JS changes from the previous version:
//   - renderHabits() now builds a custom checkbox <div> instead
//     of using the native <input type="checkbox"> visually.
//     The hidden <input> still drives the logic unchanged.
//   - renderAll() also calls updateProgressBar() (new).
//   - updateProgressBar() fills the sidebar progress bar + label.
//   - Date is shown in the page header.
//   - All core logic (save, load, streak, calendar, events) is identical.
// =============================================


// ── 1. Grab elements ────────────────────────────────────────────────────────

const habitInput     = document.getElementById('habit-input');
const addBtn         = document.getElementById('add-btn');
const habitList      = document.getElementById('habit-list');
const errorMsg       = document.getElementById('error-msg');
const emptyMsg       = document.getElementById('empty-msg');
const streakCount    = document.getElementById('streak-count');
const calendarGrid   = document.getElementById('calendar-grid');
const progressFill   = document.getElementById('progress-bar-fill');
const progressLabel  = document.getElementById('progress-label');
const dateDisplay    = document.getElementById('date-display');


// ── 2. Load from localStorage ───────────────────────────────────────────────

let habits   = JSON.parse(localStorage.getItem('habits'))   || [];
let dailyLog = JSON.parse(localStorage.getItem('dailyLog')) || {};


// ── 3. Show today's date in the header ──────────────────────────────────────

function renderDate() {
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  dateDisplay.textContent = now.toLocaleDateString(undefined, options);
}


// ── 4. Helper: YYYY-MM-DD string for today ──────────────────────────────────

function getTodayKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}


// ── 5. Save today's snapshot into dailyLog ──────────────────────────────────
// FIX (Bugs 2 & 3): when all habits are deleted, REMOVE today's dailyLog
// entry rather than returning early. The old early-return left a stale
// entry, so calcStreak() and renderCalendar() kept reading the old value.

function recordToday() {
  const key = getTodayKey();

  if (habits.length === 0) {
    // No habits exist — delete any stored entry for today so the
    // streak resets to 0 and the calendar cell turns grey.
    delete dailyLog[key];
    localStorage.setItem('dailyLog', JSON.stringify(dailyLog));
    return;
  }

  const total     = habits.length;
  const completed = habits.filter(function(h) { return h.done; }).length;
  dailyLog[key]   = { total, completed };
  localStorage.setItem('dailyLog', JSON.stringify(dailyLog));
}


// ── 6. NEW: Update the sidebar progress bar ─────────────────────────────────

function updateProgressBar() {
  const total     = habits.length;
  const completed = habits.filter(function(h) { return h.done; }).length;
  const pct       = total === 0 ? 0 : Math.round((completed / total) * 100);

  progressFill.style.width  = pct + '%';
  progressLabel.textContent = total === 0
    ? 'No habits yet'
    : `${completed} of ${total} done`;
}


// ── 7. Calculate streak ─────────────────────────────────────────────────────

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


// ── 8. Render streak number ─────────────────────────────────────────────────

function renderStreak() {
  streakCount.textContent = calcStreak();
}


// ── 9. Render calendar grid ─────────────────────────────────────────────────

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


// ── 10. Render habit list ────────────────────────────────────────────────────
// CHANGED: each row now has a .custom-check <div> for the styled checkbox.
// The real <input type="checkbox"> is hidden but still used for logic.

function renderHabits() {
  habitList.innerHTML = '';

  // Show/hide empty state
  if (habits.length === 0) {
    emptyMsg.classList.remove('hidden');
  } else {
    emptyMsg.classList.add('hidden');
  }

  habits.forEach(function(habit, index) {
    const li = document.createElement('li');
    li.classList.add('habit-item');
    if (habit.done) li.classList.add('done');

    // SVG checkmark (shown inside .custom-check when done)
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


// ── 11. Save habits to localStorage ────────────────────────────────────────

function saveHabits() {
  localStorage.setItem('habits', JSON.stringify(habits));
}


// ── 12. Master render (unchanged in structure) ─────────────────────────────

function renderAll() {
  renderHabits();
  recordToday();
  updateProgressBar();  // NEW
  renderCalendar();
  renderStreak();
}


// ── 13. Add habit ───────────────────────────────────────────────────────────

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


// ── 14. Enter key ───────────────────────────────────────────────────────────

habitInput.addEventListener('keydown', function(event) {
  if (event.key === 'Enter') addBtn.click();
});


// ── 15. Checkbox + delete (event delegation on the list) ───────────────────
// CHANGED: clicks on the <li> itself toggle the habit (not just the checkbox),
// since the custom checkbox and label are non-interactive visually.

habitList.addEventListener('click', function(event) {

  // Delete button
  if (event.target.classList.contains('delete-btn')) {
    const index = parseInt(event.target.dataset.index);
    habits.splice(index, 1);
    saveHabits();
    renderAll();
    return;  // Stop here so the toggle below doesn't also fire
  }

  // Click anywhere else on the row → toggle the habit
  const li = event.target.closest('.habit-item');
  if (!li) return;

  // Find which habit this row represents via the hidden checkbox id
  const checkbox = li.querySelector('input[type="checkbox"]');
  if (!checkbox) return;

  const index = parseInt(checkbox.id.replace('habit-', ''));
  habits[index].done = !habits[index].done;
  saveHabits();
  renderAll();
});


// ── 16. Initial render on load ──────────────────────────────────────────────

renderDate();
renderAll();
