const WORK = 52 * 60, BREAK = 17 * 60;
let rem = WORK, onBreak = false, iv, startTime = null;
const timerEl = document.getElementById('timer'), progressEl = document.getElementById('progress');
const startBtn = document.getElementById('startBtn'), pauseBtn = document.getElementById('pauseBtn'), endBtn = document.getElementById('endBtn'), resetBtn = document.getElementById('resetBtn');
const vBtn = document.getElementById('vBtn'), bBtn = document.getElementById('bBtn'), loadBtn = document.getElementById('loadBtn');
const customVidInput = document.getElementById('customVidInput');
const ytPlayer = document.getElementById('ytPlayer');
const datetimeEl = document.getElementById('datetime'), container = document.getElementById('goalContainer');
const todoInput = document.getElementById('todoInput'), addTodoBtn = document.getElementById('addTodoBtn'), todoList = document.getElementById('todoList');
const histList = document.getElementById('historyList');
let currentVideoID = 'wL8DVHuWI7Y';
let isRunning = false;

// Music labels for readable display
const musicLabels = {
  'wL8DVHuWI7Y': 'VØJ, Narvent',
  '1_G60OdEzXs': 'Binaural Beats',
  'sF80I-TQiW0': 'Chill Study Beats',
};

// Load timer state from localStorage
function loadTimerState() {
  const savedState = localStorage.getItem('timerState');
  if (savedState) {
    const state = JSON.parse(savedState);
    rem = state.rem;
    onBreak = state.onBreak;
    startTime = state.startTime;
    isRunning = state.isRunning;
    
    updateDisplay();
    updateBreakUI();
    
    if (isRunning) {
      start(false); // Resume timer without resetting startTime
    } else{
      updateControls()
    }
  }
}

// Save timer state to localStorage
function saveTimerState() {
  const state = {
    rem,
    onBreak,
    startTime,
    isRunning
  };
  localStorage.setItem('timerState', JSON.stringify(state));
}

// Sound controls
const soundToggle = document.getElementById('soundToggle');
const testSoundBtn = document.getElementById('testSoundBtn');
const startSound = document.getElementById('startSound');
const endSound = document.getElementById('endSound');
const pauseSound = document.getElementById('pauseSound');

// Load sound preferences
soundToggle.checked = localStorage.getItem('soundEnabled') !== 'false';

// Sound notification functions
function playSound(audioElement) {
  if (soundToggle.checked) {
    audioElement.currentTime = 0;
    audioElement.play();
  }
}

// Save sound preference
soundToggle.addEventListener('change', () => {
  localStorage.setItem('soundEnabled', soundToggle.checked);
});

// Test sound button
testSoundBtn.addEventListener('click', () => {
  playSound(startSound);
});

// Theme & Distraction
document.getElementById('themeToggle').addEventListener('click', e => {
  document.body.classList.toggle('dark');
  e.target.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
});
document.getElementById('distractionToggle').addEventListener('click', () => {
  document.body.classList.toggle('distraction');
});

// DateTime
function updateDateTime() { const now = new Date(); const opts = { weekday: 'short', month: 'short', day: 'numeric' }; const dateStr = now.toLocaleDateString('en-US', opts); const h = now.getHours() % 12 || 12; const m = String(now.getMinutes()).padStart(2, '0'); datetimeEl.textContent = `${dateStr}   ${h}:${m}`; }
setInterval(updateDateTime, 1000); updateDateTime();

function fmt(s) { return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }

// Goal UI
function renderGoalEditor() {
  container.innerHTML = '<textarea id="goalInput" placeholder="Enter your focus…"></textarea><button id="saveGoalBtn">Save</button>';
  document.getElementById('goalInput').value = localStorage.getItem('flowGoal') || '';
  document.getElementById('saveGoalBtn').addEventListener('click', saveAndDisplay);
}
function renderGoalDisplay() {
  const g = localStorage.getItem('flowGoal') || '';
  container.innerHTML = `<p id="flowGoal">${g}</p><button id="editGoalBtn">Edit</button>`;
  document.getElementById('editGoalBtn').addEventListener('click', renderGoalEditor);
}
function saveAndDisplay() { const val = document.getElementById('goalInput').value; localStorage.setItem('flowGoal', val); renderGoalDisplay(); }

// Todos
function createTodoItem(text) {
  const li = document.createElement('li'); const cb = document.createElement('input'); cb.type = 'checkbox'; cb.addEventListener('change', () => { li.classList.toggle('completed', cb.checked); saveTodos(); });
  const span = document.createElement('span'); span.className = 'todo-text'; span.textContent = text;
  const up = document.createElement('button'); up.textContent = '↑'; up.title = 'Move up'; up.addEventListener('click', () => { const prev = li.previousElementSibling; if (prev) todoList.insertBefore(li, prev); saveTodos(); });
  const down = document.createElement('button'); down.textContent = '↓'; down.title = 'Move down'; down.addEventListener('click', () => { const nxt = li.nextElementSibling; if (nxt) todoList.insertBefore(nxt, li); saveTodos(); });
  const rm = document.createElement('button'); rm.textContent = '✕'; rm.title = 'Remove'; rm.addEventListener('click', () => { li.remove(); saveTodos(); });
  li.append(cb, span, up, down, rm); return li;
}
function saveTodos() { const items = Array.from(todoList.children).map(li => ({ text: li.querySelector('.todo-text').textContent, completed: li.querySelector('input').checked })); localStorage.setItem('flowTodos', JSON.stringify(items)); }
function loadTodos() { JSON.parse(localStorage.getItem('flowTodos') || '[]').forEach(item => { const li = createTodoItem(item.text); if (item.completed) { li.classList.add('completed'); li.querySelector('input').checked = true; } todoList.append(li); }); }
addTodoBtn.addEventListener('click', () => { const t = todoInput.value.trim(); if (!t) return; todoList.append(createTodoItem(t)); todoInput.value = ''; todoInput.focus(); saveTodos(); });
todoInput.addEventListener('keypress', e => { if (e.key === 'Enter') addTodoBtn.click(); });

// Improved History with better formatting
function getMusicLabel(videoId) {
  return musicLabels[videoId] || 'Custom music';
}

function formatDateTime(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}, ${hours}:${minutes}`;
}

function addHistoryEntry({ start, end, duration, goal, music, todos }) {
  const li = document.createElement('li');

  // Create header with time and duration
  const header = document.createElement('div');
  header.className = 'history-header';

  const timeSpan = document.createElement('span');
  timeSpan.textContent = `${formatDateTime(start)} → ${formatDateTime(end)}`;

  const durationSpan = document.createElement('span');
  durationSpan.className = 'history-duration';
  durationSpan.textContent = `${duration} min`;

  header.appendChild(timeSpan);
  header.appendChild(durationSpan);

  // Create details grid
  const details = document.createElement('div');
  details.className = 'history-details';

  // Goal row
  const goalLabel = document.createElement('div');
  goalLabel.className = 'history-label';
  goalLabel.textContent = 'Goal:';

  const goalValue = document.createElement('div');
  goalValue.className = 'history-value';
  goalValue.textContent = goal || 'No goal set';

  // Music row
  const musicLabel = document.createElement('div');
  musicLabel.className = 'history-label';
  musicLabel.textContent = 'Music:';

  const musicValue = document.createElement('div');
  musicValue.className = 'history-value';
  musicValue.textContent = getMusicLabel(music);

  // Tasks row
  const tasksLabel = document.createElement('div');
  tasksLabel.className = 'history-label';
  tasksLabel.textContent = 'Tasks:';

  const tasksValue = document.createElement('div');
  tasksValue.className = 'history-value';
  tasksValue.textContent = `${todos.length} ${todos.length === 1 ? 'task' : 'tasks'}`;

  // Add all elements to the details grid
  details.appendChild(goalLabel);
  details.appendChild(goalValue);
  details.appendChild(musicLabel);
  details.appendChild(musicValue);
  details.appendChild(tasksLabel);
  details.appendChild(tasksValue);

  // Append header and details to list item
  li.appendChild(header);
  li.appendChild(details);

  histList.prepend(li);

  // After adding history entry, update the productivity chart
  renderProductivityChart();
}

function loadHistory() {
  JSON.parse(localStorage.getItem('sessionHistory') || '[]').forEach(addHistoryEntry);
  // Initial render of productivity chart
  renderProductivityChart();
}

// Music switch
function changeVideo(id) { if (!id) return; currentVideoID = id; ytPlayer.src = `https://www.youtube.com/embed/${id}?autoplay=1&loop=1&playlist=${id}`; }
vBtn.addEventListener('click', () => changeVideo('wL8DVHuWI7Y'));
bBtn.addEventListener('click', () => changeVideo('1_G60OdEzXs'));
lBtn.addEventListener('click', () => changeVideo('sF80I-TQiW0'));
loadBtn.addEventListener('click', () => changeVideo(customVidInput.value.trim()));

// Controls
function updateControls(running) { 
  isRunning = running;
  
  if (onBreak) {
    startBtn.disabled = running;
    startBtn.textContent = running ? "Break Running" : "Start Break";
    pauseBtn.disabled = true;
    pauseBtn.style.display = 'none';
    resetBtn.disabled = true;
    resetBtn.style.display = 'none';
    endBtn.disabled = !running;
    endBtn.textContent = "Skip Break";
  } else {
    startBtn.disabled = running; 
    startBtn.textContent = "Lock In";
    pauseBtn.disabled = !running;
    pauseBtn.style.display = '';
    endBtn.disabled = !running;
    endBtn.textContent = "End";
    resetBtn.disabled = !running;
    resetBtn.style.display = '';
  }
  
  saveTimerState();
}

function updateBreakUI() {
  if (onBreak) {
    timerEl.style.color = 'var(--muted)';
    document.getElementById('timerLabel').textContent = "Break Time";
  } else {
    timerEl.style.color = 'var(--accent)';
    document.getElementById('timerLabel').textContent = "Focus Time";
  }
}

function updateDisplay() {
  timerEl.textContent = fmt(rem);
  
  if (onBreak) {
    // For break, show progress of break time used
    progressEl.style.width = (100 * (BREAK - rem) / BREAK) + '%';
  } else {
    // For work, show progress of work time used
    progressEl.style.width = (100 * (WORK - rem) / WORK) + '%';
  }
  
  saveTimerState();
}

function recordSession() {
  if (!onBreak) { // Only record work sessions, not breaks
    const st = startTime || Date.now(), en = Date.now(), dur = Math.round((en - st) / 60000);
    const hist = JSON.parse(localStorage.getItem('sessionHistory') || '[]');
    const entry = {
      start: st,
      end: en,
      duration: dur,
      goal: localStorage.getItem('flowGoal') || '',
      music: currentVideoID,
      todos: Array.from(todoList.children).map(li => ({
        text: li.querySelector('.todo-text').textContent,
        completed: li.querySelector('input').checked
      }))
    };
    hist.push(entry);
    localStorage.setItem('sessionHistory', JSON.stringify(hist));
    addHistoryEntry(entry);
  }
}

function startBreak() {
  onBreak = true;
  rem = BREAK;
  updateBreakUI();
  updateDisplay();
  updateControls(false);
}

function endBreak() {
  onBreak = false;
  rem = WORK;
  startTime = null;
  clearInterval(iv);
  updateBreakUI();
  updateDisplay();
  updateControls(false);
}

function start(resetStartTime = true) {
  updateControls(true);
  if (resetStartTime && !onBreak) startTime = Date.now();
  iv = setInterval(() => {
    rem--;
    updateDisplay();
    if (rem <= 0) {
      clearInterval(iv);
      
      if (onBreak) {
        // Break ended
        playSound(endSound);
        endBreak();
      } else {
        // Work session ended
        recordSession();
        playSound(endSound);
        startBreak();
      }
    }
  }, 1000);
  playSound(startSound);
}

function pause() {
  const reason = prompt('Why pause? Provide reason:');
  if (!reason || !reason.trim()) {
    alert('Pause cancelled');
    return;
  }
  clearInterval(iv);
  updateControls(false);
  playSound(pauseSound);
}

function endSession() {
  if (onBreak) {
    // Skip break
    if (!confirm('Skip the rest of your break?')) return;
    clearInterval(iv);
    endBreak();
  } else {
    // End work session
    if (!confirm('End session early?')) return;
    clearInterval(iv);
    recordSession();
    playSound(endSound);
    startBreak();
  }
}

function reset() {
  if (!confirm('Reset session?')) return;
  clearInterval(iv);
  rem = WORK;
  startTime = null;
  updateControls(false);
  updateDisplay();
  playSound(pauseSound);
}

startBtn.addEventListener('click', () => { start(); updateDisplay(); });
pauseBtn.addEventListener('click', pause);
endBtn.addEventListener('click', endSession);
resetBtn.addEventListener('click', reset);

// Fixed Productivity Insights Chart - With correct orientation (0 at bottom)
function renderProductivityChart() {
  const chartContainer = document.getElementById('chartContainer');
  chartContainer.innerHTML = '';

  // Get the last 7 days of sessions
  const history = JSON.parse(localStorage.getItem('sessionHistory') || '[]');
  const now = new Date();

  // Create objects for the last 7 days
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    days.push({
      date,
      label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      totalMinutes: 0
    });
  }

  // Calculate total minutes for each day
  history.forEach(session => {
    const sessionDate = new Date(session.start);
    for (let day of days) {
      if (sessionDate.getDate() === day.date.getDate() &&
        sessionDate.getMonth() === day.date.getMonth() &&
        sessionDate.getFullYear() === day.date.getFullYear()) {
        day.totalMinutes += session.duration;
        break;
      }
    }
  });

  // Find the maximum minutes for scaling
  const maxMinutes = Math.max(...days.map(d => d.totalMinutes)) || 60;
  const chartHeight = 180;

  // Add grid lines and labels - FIXED: proper value mapping
  for (let i = 0; i <= 4; i++) {
    // Fix: use (4-i) to properly map values to positions
    const value = Math.round(maxMinutes * (4 - i) / 4);
    const yPos = chartHeight - (chartHeight * i / 4);

    const gridLine = document.createElement('div');
    gridLine.className = 'chart-grid-line';
    gridLine.style.bottom = `${yPos}px`;
    chartContainer.appendChild(gridLine);

    const yLabel = document.createElement('div');
    yLabel.className = 'chart-y-label';
    yLabel.textContent = `${value} min`;
    yLabel.style.bottom = `${yPos}px`;
    chartContainer.appendChild(yLabel);
  }

  // Create bars for each day
  days.forEach((day, index) => {
    const barWidth = (100 / days.length) - 5;
    const barHeight = day.totalMinutes === 0 ? 0 : (day.totalMinutes / maxMinutes) * chartHeight;

    const bar = document.createElement('div');
    bar.className = 'chart-bar';
    bar.style.left = `${(index * (100 / days.length)) + 2.5}%`;
    bar.style.width = `${barWidth}%`;
    bar.style.height = `${barHeight}px`;
    bar.title = `${day.totalMinutes} minutes`;

    const label = document.createElement('div');
    label.className = 'chart-label';
    label.textContent = day.label;
    label.style.left = `${(index * (100 / days.length)) + (barWidth / 2) + 2.5}%`;
    label.style.width = `${barWidth}%`;

    chartContainer.appendChild(bar);
    chartContainer.appendChild(label);
  });
}

function main() {

}

function main() {
  loadTimerState();
  loadTodos();
  const sg = localStorage.getItem('flowGoal')
  sg ? renderGoalDisplay() : renderGoalEditor();
  loadHistory();
}

// Load timer state from localStorage on page load
window.addEventListener('load', main);

// Handle page unload to ensure we save the current state
window.addEventListener('beforeunload', saveTimerState);