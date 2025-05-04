// History management for the Flow State app
import { musicLabels, MAX_DURATION_MINUTES } from './constants.js';
import { formatDateTime } from './utils.js';
import { getCurrentGoal } from './goals.js';
import { getCurrentProject, getProjectStats } from './projects.js';

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
function addHistoryEntry({ start, end, duration, goal, music, todos, projectId, projectName }) {
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

  // Project row (new)
  const projectLabel = document.createElement('div');
  projectLabel.className = 'history-label';
  projectLabel.textContent = 'Project:';

  const projectValue = document.createElement('div');
  projectValue.className = 'history-value';
  projectValue.textContent = projectName || 'Unassigned';

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
  details.appendChild(projectLabel);
  details.appendChild(projectValue);
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
  const history = JSON.parse(localStorage.getItem('sessionHistory') || '[]');
  const { projectNames } = getProjectStats();
  
  // Add project name to history entries when displaying
  history.forEach(entry => {
    const displayEntry = { ...entry };
    
    // Add project name if projectId exists
    if (entry.projectId) {
      displayEntry.projectName = projectNames[entry.projectId] || 'Unknown Project';
    } else {
      displayEntry.projectName = 'Unassigned';
    }
    
    addHistoryEntry(displayEntry);
  });
  
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
  
  // Get current project
  const currentProject = getCurrentProject();
  
  const entry = {
    start: startTime,
    end: endTime,
    duration: duration,
    goal: getCurrentGoal(),
    music: currentVideoID,
    todos: todos,
    projectId: currentProject ? currentProject.id : 'default',
    projectName: currentProject ? currentProject.name : 'Unassigned'
  };
  
  // Save to localStorage
  const history = JSON.parse(localStorage.getItem('sessionHistory') || '[]');
  history.push(entry);
  localStorage.setItem('sessionHistory', JSON.stringify(history));
  
  // Update UI
  addHistoryEntry(entry);
}

// Render productivity chart with stacked bars by project
export function renderProductivityChart() {
  const chartContainer = document.getElementById('chartContainer');
  if (!chartContainer) return;
  
  chartContainer.innerHTML = '';

  // Get project stats and history
  const { history, projectNames, projectColors } = getProjectStats();
  const now = new Date();

  // Create objects for the last 7 days
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    days.push({
      date,
      label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      totalMinutes: 0,
      projectMinutes: {} // To store minutes by project
    });
  }

  // Calculate minutes for each project for each day
  history.forEach(session => {
    const sessionDate = new Date(session.start);
    for (let day of days) {
      if (sessionDate.getDate() === day.date.getDate() &&
        sessionDate.getMonth() === day.date.getMonth() &&
        sessionDate.getFullYear() === day.date.getFullYear()) {
        
        // Add to total minutes
        day.totalMinutes += session.duration;
        
        // Add to project-specific minutes
        const projectId = session.projectId || 'default';
        if (!day.projectMinutes[projectId]) {
          day.projectMinutes[projectId] = 0;
        }
        day.projectMinutes[projectId] += session.duration;
        
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

  // Create stacked bars for each day
  days.forEach((day, index) => {
    const barWidth = (100 / days.length) - 5;
    let currentHeight = 0;
    
    // Add label for day
    const label = document.createElement('div');
    label.className = 'chart-label';
    label.textContent = day.label;
    label.style.left = `${(index * (100 / days.length)) + (barWidth / 2) + 2.5}%`;
    label.style.width = `${barWidth}%`;
    chartContainer.appendChild(label);
    
    // If no minutes for this day, skip bar creation
    if (day.totalMinutes === 0) return;
    
    // Create a bar segment for each project
    for (const [projectId, minutes] of Object.entries(day.projectMinutes)) {
      const segmentHeight = (minutes / maxMinutes) * chartHeight;
      
      // Skip tiny segments
      if (segmentHeight < 2) continue;
      
      const segment = document.createElement('div');
      segment.className = 'chart-bar-segment';
      segment.style.left = `${(index * (100 / days.length)) + 2.5}%`;
      segment.style.width = `${barWidth}%`;
      segment.style.height = `${segmentHeight}px`;
      segment.style.bottom = `${currentHeight}px`; // Stack from bottom
      
      // Use the project's color from projectColors
      segment.style.backgroundColor = projectColors[projectId] || 'var(--accent)';
      
      // Add tooltip
      const projectName = projectNames[projectId] || 'Unassigned';
      segment.title = `${projectName}: ${minutes} minutes`;
      
      chartContainer.appendChild(segment);
      
      // Update current height for next segment
      currentHeight += segmentHeight;
    }
  });
  
  // Add legend for projects
  createChartLegend(chartContainer, projectNames, projectColors);
}

// Create a legend for the chart
function createChartLegend(container, projectNames, projectColors) {
  // Remove any existing legend first
  const existingLegend = document.querySelector('.chart-legend');
  if (existingLegend) {
    existingLegend.remove();
  }
  
  // Get all days data to find which projects actually have data
  const history = JSON.parse(localStorage.getItem('sessionHistory') || '[]');
  const now = new Date();
  
  // Find projects that have data in the last 7 days
  const projectsWithData = new Set();
  
  history.forEach(session => {
    const sessionDate = new Date(session.start);
    const daysDiff = Math.floor((now - sessionDate) / (1000 * 60 * 60 * 24));
    
    // Only include sessions from the last 7 days
    if (daysDiff < 7) {
      const projectId = session.projectId || 'default';
      projectsWithData.add(projectId);
    }
  });
  
  // Don't show legend if no project has data
  if (projectsWithData.size === 0) return;
  
  const legend = document.createElement('div');
  legend.className = 'chart-legend';
  
  // Add legend items only for projects with data
  for (const projectId of projectsWithData) {
    // Skip if project doesn't exist in projectNames (safety check)
    if (!projectNames[projectId]) continue;
    
    const legendItem = document.createElement('div');
    legendItem.className = 'legend-item';
    
    const colorSwatch = document.createElement('div');
    colorSwatch.className = 'legend-color';
    colorSwatch.style.backgroundColor = projectColors[projectId] || 'var(--accent)';
    
    const nameSpan = document.createElement('span');
    nameSpan.textContent = projectNames[projectId];
    
    legendItem.appendChild(colorSwatch);
    legendItem.appendChild(nameSpan);
    legend.appendChild(legendItem);
  }
  
  container.parentNode.appendChild(legend);
}