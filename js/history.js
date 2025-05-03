// History management for the Flow State app
import { musicLabels, MAX_DURATION_MINUTES } from './constants.js';
import { formatDateTime } from './utils.js';
import { getCurrentGoal } from './goals.js';

// History elements
let historyList;
let currentVideoID;

// Initialize history functionality
export function initHistory(videoID) {
  historyList = document.getElementById('historyList');
  currentVideoID = videoID;
  
  // Load saved history
  loadHistory();
}

// Set current video ID for recording
export function setCurrentVideo(videoID) {
  currentVideoID = videoID;
}

// Get music label for readable display
function getMusicLabel(videoId) {
  return musicLabels[videoId] || 'Custom music';
}

// Add a history entry to the UI
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

  historyList.prepend(li);

  // After adding history entry, update the productivity chart
  renderProductivityChart();
}

// Load history from localStorage
function loadHistory() {
  JSON.parse(localStorage.getItem('sessionHistory') || '[]').forEach(addHistoryEntry);
  
  // Initial render of productivity chart
  renderProductivityChart();
}

// Record a completed session
export function recordSession(sessionStartTime, todos) {
  // Only record work sessions, not breaks
  const startTime = sessionStartTime || Date.now();
  const endTime = Date.now();
  
  // Calculate duration with a reasonable maximum
  let duration = Math.round((endTime - startTime) / 60000);
  
  // Cap duration at a reasonable maximum
  if (duration > MAX_DURATION_MINUTES || duration < 0) {
    duration = Math.min(MAX_DURATION_MINUTES, 52); // Use either max or default work session length
  }
  
  const entry = {
    start: startTime,
    end: endTime,
    duration: duration,
    goal: getCurrentGoal(),
    music: currentVideoID,
    todos: todos
  };
  
  // Save to localStorage
  const history = JSON.parse(localStorage.getItem('sessionHistory') || '[]');
  history.push(entry);
  localStorage.setItem('sessionHistory', JSON.stringify(history));
  
  // Update UI
  addHistoryEntry(entry);
}

// Render productivity chart
export function renderProductivityChart() {
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

  // Add grid lines and labels
  for (let i = 0; i <= 4; i++) {
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