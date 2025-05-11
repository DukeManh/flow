// History management for the Flow State app
import { musicLabels, MAX_DURATION_MINUTES } from './constants.js';
import { formatDateTime } from './utils.js';
import { getCurrentGoal } from './goals.js';
import { getCurrentProject, getProjectStats, getProjects } from './projects.js';
import storageService from './storage.js';

// Storage keys
const STORAGE_KEYS = {
  SESSION_HISTORY: 'sessionHistory',
  VIEW_MODE: 'historyViewMode'
};

// History elements
let historyList;
let currentVideoID;
let currentViewMode = 'weekly'; // Default to weekly view
let currentPeriodOffset = 0; // Track how many periods (weeks/months) back we're viewing

// Custom tooltip element
let customTooltip;

// Initialize custom tooltip
function initCustomTooltip() {
  // Create tooltip element if it doesn't exist yet
  if (!customTooltip) {
    customTooltip = document.createElement('div');
    customTooltip.className = 'custom-tooltip';
    customTooltip.style.display = 'none';
    document.body.appendChild(customTooltip);
  }
  
  // Add click event listener to document to remove highlights when clicking elsewhere
  document.addEventListener('click', (e) => {
    // Don't remove highlighting if click is on chart bar segment or legend item
    if (e.target.closest('.chart-bar-segment') || e.target.closest('.legend-item')) {
      return;
    }
    
    // Remove project highlighting
    const highlightedSegments = document.querySelectorAll('.project-highlighted');
    if (highlightedSegments.length > 0) {
      // Reset all segments
      const allSegments = document.querySelectorAll('.chart-bar-segment');
      allSegments.forEach(seg => {
        seg.classList.remove('project-highlighted');
        seg.style.opacity = '1';
      });
      
      // Remove active status from all legend items
      document.querySelectorAll('.legend-item').forEach(item => {
        item.classList.remove('active');
      });
      
      // Hide project summary tooltip
      if (customTooltip && customTooltip.classList.contains('project-summary')) {
        customTooltip.classList.remove('project-summary');
        customTooltip.style.display = 'none';
      }
    }
    
    // Hide day summary tooltips (legacy behavior)
    if (customTooltip && customTooltip.classList.contains('day-summary')) {
      customTooltip.classList.remove('day-summary');
      customTooltip.style.display = 'none';
    }
    
    // Remove highlighted class from all bars (legacy behavior)
    const highlightedBars = document.querySelectorAll('.bar-container-highlighted');
    highlightedBars.forEach(bar => {
      bar.classList.remove('bar-container-highlighted');
    });
  });
}

// Storage utility functions
async function getSessionHistoryFromStorage() {
  try {
    return await storageService.getJSON(STORAGE_KEYS.SESSION_HISTORY, []);
  } catch (error) {
    console.error('Error getting session history from storage:', error);
    return [];
  }
}

async function saveSessionHistoryToStorage(history) {
  try {
    await storageService.setJSON(STORAGE_KEYS.SESSION_HISTORY, history);
    return true;
  } catch (error) {
    console.error('Error saving session history to storage:', error);
    return false;
  }
}

// Initialize history functionality
export function initHistory(videoID) {
  historyList = document.getElementById('historyList');
  currentVideoID = videoID;
  
  // Set up view mode controls
  const weeklyViewBtn = document.getElementById('weeklyViewBtn');
  const monthlyViewBtn = document.getElementById('monthlyViewBtn');
  const prevPeriodBtn = document.getElementById('prevPeriodBtn');
  const nextPeriodBtn = document.getElementById('nextPeriodBtn');
  const currentPeriodBtn = document.getElementById('currentPeriodBtn');
  
  if (weeklyViewBtn && monthlyViewBtn) {
    // Load saved view preference
    storageService.getItem(STORAGE_KEYS.VIEW_MODE).then(savedViewMode => {
      if (savedViewMode) {
        currentViewMode = savedViewMode;
        
        // Update button state based on saved preference
        if (currentViewMode === 'monthly') {
          weeklyViewBtn.classList.remove('active');
          monthlyViewBtn.classList.add('active');
        } else {
          weeklyViewBtn.classList.add('active');
          monthlyViewBtn.classList.remove('active');
        }
      }
      
      // Initial render of productivity chart with saved view mode
      renderProductivityChart();
    });
    
    // Add event listeners for view buttons
    weeklyViewBtn.addEventListener('click', () => {
      if (currentViewMode !== 'weekly') {
        currentViewMode = 'weekly';
        currentPeriodOffset = 0; // Reset offset when changing view mode
        weeklyViewBtn.classList.add('active');
        monthlyViewBtn.classList.remove('active');
        storageService.setItem(STORAGE_KEYS.VIEW_MODE, currentViewMode);
        renderProductivityChart();
      }
    });
    
    monthlyViewBtn.addEventListener('click', () => {
      if (currentViewMode !== 'monthly') {
        currentViewMode = 'monthly';
        currentPeriodOffset = 0; // Reset offset when changing view mode
        monthlyViewBtn.classList.add('active');
        weeklyViewBtn.classList.remove('active');
        storageService.setItem(STORAGE_KEYS.VIEW_MODE, currentViewMode);
        renderProductivityChart();
      }
    });
    
    // Add event listeners for period navigation
    prevPeriodBtn.addEventListener('click', () => {
      currentPeriodOffset++;
      renderProductivityChart();
    });
    
    nextPeriodBtn.addEventListener('click', () => {
      if (currentPeriodOffset > 0) {
        currentPeriodOffset--;
        renderProductivityChart();
      }
    });
    
    currentPeriodBtn.addEventListener('click', () => {
      currentPeriodOffset = 0;
      renderProductivityChart();
    });
  }
  
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
}

// Load history from storage
async function loadHistory() {
  try {
    const history = await getSessionHistoryFromStorage();
    const { projectNames } = await getProjectStats();
    
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
  } catch (error) {
    console.error('Error loading history:', error);
  }
}

// Record a completed session
export async function recordSession(sessionStartTime, todos) {
  try {
    // Only record work sessions, not breaks
    const startTime = sessionStartTime || Date.now();
    const endTime = Date.now();
    
    // Calculate duration with a reasonable maximum
    let duration = Math.round((endTime - startTime) / 60000);
    
    // Cap duration at a reasonable maximum
    if (duration > MAX_DURATION_MINUTES || duration < 0) {
      duration = Math.min(MAX_DURATION_MINUTES, 52); // Use either max or default work session length
    }
    
    // Get current project and goal
    const currentProject = await getCurrentProject();
    const currentGoal = await getCurrentGoal();
    
    const entry = {
      start: startTime,
      end: endTime,
      duration: duration,
      goal: currentGoal,
      music: currentVideoID,
      todos: todos,
      projectId: currentProject ? currentProject.id : 'default',
      projectName: currentProject ? currentProject.name : 'Unassigned'
    };
    
    // Save to storage
    const history = await getSessionHistoryFromStorage();
    history.push(entry);
    await saveSessionHistoryToStorage(history);
    
    // Update UI
    addHistoryEntry(entry);
    
    // Render the chart once after adding the new entry
    renderProductivityChart();
  } catch (error) {
    console.error('Error recording session:', error);
  }
}

// Format duration in minutes to a readable format (converting to hours if needed)
function formatDuration(minutes, compact = true) {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    
    if (compact) {
      // Compact format: 3h 34min
      if (remainingMins === 0) {
        return `${hours}h`;
      } else {
        return `${hours}h ${remainingMins}min`;
      }
    } else {
      // Standard format
      if (remainingMins === 0) {
        return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
      } else {
        return `${hours} ${hours === 1 ? 'hour' : 'hours'} ${remainingMins} min`;
      }
    }
  } else {
    return compact ? `${minutes}min` : `${minutes} min`;
  }
}

// Display project summary tooltip with comparison to previous period
function showProjectSummaryTooltip(projectName, projectId, totalMinutes, prevPeriodMinutes, viewMode, x, y) {
  if (!customTooltip) return;
  
  // Create tooltip HTML content with rich formatting
  const periodName = viewMode === 'weekly' ? 'week' : 'month';
  const diff = totalMinutes - prevPeriodMinutes;
  const percentChange = prevPeriodMinutes > 0 
    ? Math.round((diff / prevPeriodMinutes) * 100)
    : totalMinutes > 0 ? 100 : 0;
  
  // Calculate daily average
  const daysInPeriod = viewMode === 'weekly' ? 7 : 30;
  const avgMinutesPerDay = Math.round(totalMinutes / daysInPeriod);
  
  // Get period text based on offset
  const periodText = currentPeriodOffset === 0 
    ? `this ${periodName}` 
    : currentPeriodOffset === 1 
      ? `last ${periodName}` 
      : `${currentPeriodOffset} ${periodName}s ago`;
  
  // Create tooltip content with HTML
  let tooltipContent = `<span class="project-title">${projectName}</span>`;
  tooltipContent += `Total: ${formatDuration(totalMinutes, true)} ${periodText}`;
  
  if (avgMinutesPerDay > 0) {
    tooltipContent += `<span class="project-stat">Average: ${formatDuration(avgMinutesPerDay, true)}/day</span>`;
  }
  
  // Add comparison to previous period if we have data
  if (prevPeriodMinutes > 0 || totalMinutes > 0) {
    const changeText = diff === 0 
      ? 'No change'
      : diff > 0 
        ? `▲ ${percentChange}%`
        : `▼ ${Math.abs(percentChange)}%`;
    
    const comparisonPeriodText = currentPeriodOffset === 0 
      ? `Previous ${periodName}` 
      : currentPeriodOffset === 1 
        ? `${periodName} before last` 
        : `${currentPeriodOffset + 1} ${periodName}s ago`;
        
    tooltipContent += `<span class="project-stat">vs ${comparisonPeriodText}: <span class="stat-trend ${diff >= 0 ? 'positive' : 'negative'}">${changeText}</span></span>`;
  }
  
  // Update tooltip
  customTooltip.innerHTML = tooltipContent;
  customTooltip.classList.remove('day-summary');
  customTooltip.classList.add('project-summary', 'tooltip-show');
  customTooltip.style.display = 'block';
  
  // Position tooltip near the cursor
  customTooltip.style.left = `${x + 15}px`;
  customTooltip.style.top = `${y - 40}px`;
  
  // Ensure tooltip stays within viewport
  setTimeout(() => {
    const tooltipRect = customTooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    
    // Adjust horizontal position if needed
    if (tooltipRect.right > viewportWidth - 10) {
      customTooltip.style.left = `${x - tooltipRect.width - 15}px`;
    }
    
    // Adjust vertical position if needed
    if (tooltipRect.top < 10) {
      customTooltip.style.top = `${y + 15}px`;
    }
  }, 10);
}

// Render productivity chart with stacked bars by project
export async function renderProductivityChart() {
  const chartContainer = document.getElementById('chartContainer');
  const chartTitle = document.getElementById('chartTitle');
  if (!chartContainer) return;
  
  chartContainer.innerHTML = '';

  // Initialize custom tooltip
  initCustomTooltip();

  // Get project stats and history
  const { history, projectNames, projectColors } = await getProjectStats();
  
  // Create a base date accounting for periodOffset
  const now = new Date();
  // Apply period offset to the start date
  const offsetDays = currentViewMode === 'weekly' ? (currentPeriodOffset * 7) : (currentPeriodOffset * 30);
  // Adjust the current date based on period offset
  now.setDate(now.getDate() - offsetDays);

  // Create objects for the days based on view mode
  const days = [];
  
  // Update next period button state
  const nextPeriodBtn = document.getElementById('nextPeriodBtn');
  if (nextPeriodBtn) {
    nextPeriodBtn.disabled = currentPeriodOffset === 0;
    nextPeriodBtn.style.opacity = currentPeriodOffset === 0 ? '0.5' : '1';
  }
  
  // Update current period button text
  const currentPeriodBtn = document.getElementById('currentPeriodBtn');
  if (currentPeriodBtn) {
    currentPeriodBtn.textContent = currentPeriodOffset === 0 ? 'Today' : 'Current';
    currentPeriodBtn.style.display = currentPeriodOffset === 0 ? 'none' : 'inline-block';
  }
  
  // Declare variables for previous periods outside the conditional blocks
  let prevWeekDays = [];
  let prevMonthDays = [];
  
  if (currentViewMode === 'weekly') {
    // Weekly view - 7 days starting from offset date
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 6); // Start from 6 days before 'now'
    
    // Calculate period start and end dates for title
    const periodStart = new Date(startDate);
    const periodEnd = new Date(now);
    
    // Format date range for title (May 1 - May 7, 2023)
    const dateRangeText = `${periodStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${periodEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      days.push({
        date,
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
        totalMinutes: 0,
        projectMinutes: {} // To store minutes by project
      });
    }
    
    // Previous period (for comparison) - week before current period
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() - 7 + i); // 7 days before the start date
      prevWeekDays.push({
        date,
        totalMinutes: 0,
        projectMinutes: {}
      });
    }
    
    // Populate current week data
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
    
    // Populate previous week data
    history.forEach(session => {
      const sessionDate = new Date(session.start);
      for (let day of prevWeekDays) {
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
    
    // Calculate weekly comparison data
    const currentWeekTotal = days.reduce((sum, day) => sum + day.totalMinutes, 0);
    const prevWeekTotal = prevWeekDays.reduce((sum, day) => sum + day.totalMinutes, 0);
    const weeklyDiff = currentWeekTotal - prevWeekTotal;
    const weeklyPercentChange = prevWeekTotal > 0 
      ? Math.round((weeklyDiff / prevWeekTotal) * 100) 
      : currentWeekTotal > 0 ? 100 : 0;
      
    // Update chart title with comparison and date range
    if (chartTitle) {
      const changeText = weeklyDiff === 0 
        ? 'No change from previous week'
        : weeklyDiff > 0 
          ? `▲ ${weeklyPercentChange}% from previous week`
          : `▼ ${Math.abs(weeklyPercentChange)}% from previous week`;
          
      const avgDailyMinutes = Math.round(currentWeekTotal / 7);
      chartTitle.innerHTML = `Focus Time by Project - ${dateRangeText} <span class="chart-comparison ${weeklyDiff >= 0 ? 'positive' : 'negative'}">${changeText}</span>`;
    }
  } else {
    // Monthly view - last ~30 days with offset
    const daysToShow = 30;
    
    // Calculate period start and end dates for title
    const periodStart = new Date(now);
    periodStart.setDate(periodStart.getDate() - (daysToShow - 1)); // Start from 29 days before 'now'
    const periodEnd = new Date(now);
    
    // Format date range for title (May 1 - May 30, 2023)
    const dateRangeText = `${periodStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${periodEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // For monthly view, only show labels for first day of week (Sunday)
      let label = '';
      if (date.getDay() === 0) { // Sunday (start of week)
        label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      
      days.push({
        date,
        label,
        totalMinutes: 0,
        projectMinutes: {} // To store minutes by project
      });
    }
    
    // Previous period (for comparison) - the 30 days before the current period
    for (let i = 0; i < daysToShow; i++) {
      const date = new Date(periodStart);
      date.setDate(date.getDate() - i - 1); // Days before the start date
      
      prevMonthDays.push({
        date,
        totalMinutes: 0,
        projectMinutes: {}
      });
    }
    
    // Populate current month data
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
    
    // Populate previous month data
    history.forEach(session => {
      const sessionDate = new Date(session.start);
      for (let day of prevMonthDays) {
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
    
    // Calculate monthly comparison data
    const currentMonthTotal = days.reduce((sum, day) => sum + day.totalMinutes, 0);
    const prevMonthTotal = prevMonthDays.reduce((sum, day) => sum + day.totalMinutes, 0);
    const monthlyDiff = currentMonthTotal - prevMonthTotal;
    const monthlyPercentChange = prevMonthTotal > 0 
      ? Math.round((monthlyDiff / prevMonthTotal) * 100) 
      : currentMonthTotal > 0 ? 100 : 0;
      
    // Update chart title with comparison and date range
    if (chartTitle) {
      const changeText = monthlyDiff >= 0 
          ? `▲ ${monthlyPercentChange}% from previous month`
          : `▼ ${Math.abs(monthlyPercentChange)}% from previous month`;
          
      const avgDailyMinutes = Math.round(currentMonthTotal / 30);
      chartTitle.innerHTML = `Focus Time by Project - ${dateRangeText} <span class="chart-comparison ${monthlyDiff >= 0 ? 'positive' : 'negative'}">${changeText}</span>`;
    }
  }
  
  // Find the maximum minutes for scaling
  const maxMinutes = Math.max(...days.map(d => d.totalMinutes)) || 60;
  const chartHeight = 220; // Increased height

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
    yLabel.textContent = formatDuration(value);
    yLabel.style.bottom = `${yPos}px`;
    chartContainer.appendChild(yLabel);
  }

  // Calculate bar width based on view mode and number of days
  const barWidth = currentViewMode === 'weekly' 
    ? (100 / days.length) - 5  // Weekly view - keep the original spacing
    : (100 / days.length) - 0.5; // Monthly view - much less spacing for thicker bars
  
  const barSpacing = currentViewMode === 'weekly' 
    ? 2.5  // Weekly view - original spacing
    : 0.25; // Monthly view - minimal spacing for thicker bars
  
  // Track project-specific data for both current and previous periods
  const projectTotals = {};
  const prevPeriodProjectTotals = {};
  
  // Calculate totals for current period
  days.forEach(day => {
    Object.entries(day.projectMinutes).forEach(([projectId, minutes]) => {
      projectTotals[projectId] = (projectTotals[projectId] || 0) + minutes;
    });
  });
  
  // Calculate totals for previous period
  if (currentViewMode === 'weekly' && prevWeekDays) {
    prevWeekDays.forEach(day => {
      Object.entries(day.projectMinutes).forEach(([projectId, minutes]) => {
        prevPeriodProjectTotals[projectId] = (prevPeriodProjectTotals[projectId] || 0) + minutes;
      });
    });
  } else if (currentViewMode === 'monthly' && prevMonthDays) {
    prevMonthDays.forEach(day => {
      Object.entries(day.projectMinutes).forEach(([projectId, minutes]) => {
        prevPeriodProjectTotals[projectId] = (prevPeriodProjectTotals[projectId] || 0) + minutes;
      });
    });
  }
  
  // Create stacked bars for each day
  let visibleBarCount = 0; // Counter for visible bars
  days.forEach((day, index) => {
    let currentHeight = 0;
    
    // Add label for day - smaller for monthly view
    const label = document.createElement('div');
    label.className = 'chart-label';
    if (currentViewMode === 'monthly') {
      label.classList.add('monthly-label');
    }
    
    label.textContent = day.label;
    label.style.left = `${(index * (100 / days.length)) + (barWidth / 2) + barSpacing}%`;
    label.style.width = `${barWidth}%`;
    chartContainer.appendChild(label);
    
    // If no minutes for this day, skip bar creation
    if (day.totalMinutes === 0) return;
    
    // Create a container for the entire day's bar stack
    const barContainer = document.createElement('div');
    barContainer.className = 'bar-container';
    barContainer.style.left = `${(index * (100 / days.length)) + barSpacing}%`;
    barContainer.style.width = `${barWidth}%`;
    barContainer.dataset.date = day.date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    barContainer.dataset.totalMinutes = day.totalMinutes;
    chartContainer.appendChild(barContainer);
    
    // Total height for the entire bar
    const totalBarHeight = (day.totalMinutes / maxMinutes) * chartHeight;
    barContainer.style.height = `${totalBarHeight}px`;
    
    // Create a bar segment for each project
    for (const [projectId, minutes] of Object.entries(day.projectMinutes)) {
      const segmentHeight = (minutes / maxMinutes) * chartHeight;
      const percentage = Math.round((minutes / day.totalMinutes) * 100);
      
      // Skip tiny segments
      if (segmentHeight < 2) continue;
      
      const segment = document.createElement('div');
      segment.className = 'chart-bar-segment';
      segment.dataset.projectId = projectId;
      segment.style.width = '100%';
      segment.style.height = `${segmentHeight}px`;
      segment.style.bottom = `${currentHeight}px`; // Stack from bottom
      
      // Use the project's color from projectColors
      segment.style.backgroundColor = projectColors[projectId] || 'var(--accent)';
      
      // Store tooltip data with percentage
      const projectName = projectNames[projectId] || 'Unassigned';
      segment.dataset.tooltip = `${projectName}: ${minutes} min (${percentage}%)`;
      segment.dataset.date = day.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      segment.dataset.projectName = projectName;
      
      // Add mouse events for custom tooltip
      segment.addEventListener('mousemove', (e) => {
        // Only show segment tooltip if no project is highlighted
        if (customTooltip && !document.querySelector('.project-highlighted')) {
          // Show date in tooltip for monthly view
          const tooltipText = currentViewMode === 'monthly' 
            ? `${segment.dataset.date} - ${segment.dataset.tooltip}`
            : segment.dataset.tooltip;
            
          customTooltip.textContent = tooltipText;
          customTooltip.classList.remove('day-summary', 'project-summary');
          customTooltip.classList.add('tooltip-show');
          customTooltip.style.display = 'block';
          customTooltip.style.left = `${e.pageX + 10}px`;
          customTooltip.style.top = `${e.pageY + 10}px`;
          
          // Store current tooltip position for potential click
          segment.dataset.tooltipX = e.pageX + 10;
          segment.dataset.tooltipY = e.pageY + 10;
          
          // Prevent tooltip from going off-screen
          setTimeout(() => {
            const tooltipRect = customTooltip.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            
            if (tooltipRect.right > viewportWidth - 10) {
              const newLeft = e.pageX - tooltipRect.width - 10;
              customTooltip.style.left = `${newLeft}px`;
              segment.dataset.tooltipX = newLeft;
            }
          }, 0);
        }
      });
      
      segment.addEventListener('mouseleave', () => {
        // Only hide tooltip if no project is highlighted
        if (customTooltip && !document.querySelector('.project-highlighted')) {
          customTooltip.style.display = 'none';
          customTooltip.classList.remove('tooltip-show');
        }
      });
      
      // Add click event to highlight all segments of the same project
      segment.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent event bubbling
        
        const selectedProjectId = segment.dataset.projectId;
        const isAlreadyHighlighted = document.querySelector(`.chart-bar-segment[data-project-id="${selectedProjectId}"].project-highlighted`);
        
        // Remove highlighting from all segments
        const allSegments = document.querySelectorAll('.chart-bar-segment');
        allSegments.forEach(seg => {
          seg.classList.remove('project-highlighted');
          // Reset segment opacity
          seg.style.opacity = '1';
        });
        
        // Toggle highlighting for this project
        if (!isAlreadyHighlighted) {
          // Highlight all segments of this project
          const projectSegments = document.querySelectorAll(`.chart-bar-segment[data-project-id="${selectedProjectId}"]`);
          projectSegments.forEach(seg => {
            seg.classList.add('project-highlighted');
          });
          
          // Dim other project segments
          allSegments.forEach(seg => {
            if (!seg.classList.contains('project-highlighted')) {
              seg.style.opacity = '0.3';
            }
          });
          
          // Show project summary tooltip
          showProjectSummaryTooltip(
            segment.dataset.projectName,
            selectedProjectId,
            projectTotals[selectedProjectId] || 0,
            prevPeriodProjectTotals[selectedProjectId] || 0,
            currentViewMode,
            e.pageX,
            e.pageY
          );
        } else {
          // Hide tooltip when unhighlighting
          customTooltip.style.display = 'none';
        }
      });
      
      barContainer.appendChild(segment);
      
      // Update current height for next segment
      currentHeight += segmentHeight;
    }
    
    // Only assign animation index to bars that have a significant height
    // This way we skip incrementing the animation sequence for very short or empty bars
    if (day.totalMinutes > 0 && (day.totalMinutes / maxMinutes) * chartHeight > 5) {
      // Only animate bars that are tall enough to be noticeable (more than 5px)
      barContainer.style.setProperty('--bar-index', visibleBarCount++);
    } else {
      // For short or empty bars, animate them all at once with the first group
      barContainer.style.setProperty('--bar-index', 0);
    }
  });
  
  // Add legend for projects
  createChartLegend(chartContainer, projectNames, projectColors);

  // Set up Intersection Observer to start animation when chart becomes visible
  setupChartAnimationObserver(chartContainer);
}

// Set up an Intersection Observer to trigger animations when chart is visible
function setupChartAnimationObserver(chartContainer) {
  // First, make sure all bar containers are in their pre-animation state
  const barContainers = chartContainer.querySelectorAll('.bar-container');
  barContainers.forEach(container => {
    container.classList.add('bar-container-paused');
  });
  
  // Create the observer
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      // When chart container becomes visible
      if (entry.isIntersecting) {
        // Start animations by removing the paused class
        barContainers.forEach(container => {
          container.classList.remove('bar-container-paused');
          container.classList.add('bar-container-animated');
        });
        
        // Disconnect observer after animation is triggered
        observer.disconnect();
      }
    });
  }, {
    // Start animation when at least 25% of the chart is visible
    threshold: 0.25
  });
  
  // Start observing the chart container
  observer.observe(chartContainer);
}

// Create a legend for the chart
async function createChartLegend(container, projectNames, projectColors) {
  // Remove ALL existing legends from the DOM
  const existingLegends = document.querySelectorAll('.chart-legend');
  existingLegends.forEach(legend => legend.remove());
  
  // Get all days data to find which projects actually have data
  const history = await getSessionHistoryFromStorage();
  const now = new Date();
  const activeProjects = await getProjects();
  
  // Create a set of active project IDs for quick lookup
  const activeProjectIds = new Set(activeProjects.map(p => p.id));
  
  // Find projects that have data in the relevant time range
  const projectsWithData = new Set();
  
  // Set time range based on view mode
  const daysToLookBack = currentViewMode === 'weekly' ? 7 : 30;
  
  // Track project-specific data for the current period (needed for tooltips)
  const projectTotals = {};
  const prevPeriodProjectTotals = {};
  
  // Populate project totals for current and previous periods
  const days = [];
  const prevDays = [];
  
  // Apply period offset to current date
  const offsetNow = new Date();
  const offsetDays = currentViewMode === 'weekly' ? (currentPeriodOffset * 7) : (currentPeriodOffset * 30);
  offsetNow.setDate(offsetNow.getDate() - offsetDays);
  
  // Create day objects for current period
  for (let i = daysToLookBack - 1; i >= 0; i--) {
    const date = new Date(offsetNow);
    date.setDate(date.getDate() - i);
    days.push({
      date,
      projectMinutes: {}
    });
  }
  
  // Create day objects for previous period
  for (let i = daysToLookBack * 2 - 1; i >= daysToLookBack; i--) {
    const date = new Date(offsetNow);
    date.setDate(date.getDate() - i);
    prevDays.push({
      date,
      projectMinutes: {}
    });
  }
  
  // Populate current period data
  history.forEach(session => {
    const sessionDate = new Date(session.start);
    const daysDiff = Math.floor((offsetNow - sessionDate) / (1000 * 60 * 60 * 24));
    
    // Add project to active set if in the current period
    if (daysDiff < daysToLookBack) {
      const projectId = session.projectId || 'default';
      projectsWithData.add(projectId);
    }
    
    // Populate current period totals
    for (let day of days) {
      if (sessionDate.getDate() === day.date.getDate() &&
          sessionDate.getMonth() === day.date.getMonth() &&
          sessionDate.getFullYear() === day.date.getFullYear()) {
        
        const projectId = session.projectId || 'default';
        if (!day.projectMinutes[projectId]) {
          day.projectMinutes[projectId] = 0;
        }
        day.projectMinutes[projectId] += session.duration;
        break;
      }
    }
    
    // Populate previous period totals
    for (let day of prevDays) {
      if (sessionDate.getDate() === day.date.getDate() &&
          sessionDate.getMonth() === day.date.getMonth() &&
          sessionDate.getFullYear() === day.date.getFullYear()) {
        
        const projectId = session.projectId || 'default';
        if (!day.projectMinutes[projectId]) {
          day.projectMinutes[projectId] = 0;
        }
        day.projectMinutes[projectId] += session.duration;
        break;
      }
    }
  });
  
  // Calculate project totals for current period
  days.forEach(day => {
    Object.entries(day.projectMinutes).forEach(([projectId, minutes]) => {
      projectTotals[projectId] = (projectTotals[projectId] || 0) + minutes;
    });
  });
  
  // Calculate project totals for previous period
  prevDays.forEach(day => {
    Object.entries(day.projectMinutes).forEach(([projectId, minutes]) => {
      prevPeriodProjectTotals[projectId] = (prevPeriodProjectTotals[projectId] || 0) + minutes;
    });
  });
  
  // Don't show legend if no project has data
  if (projectsWithData.size === 0) return;
  
  const legend = document.createElement('div');
  legend.className = 'chart-legend';
  legend.id = 'productivityChartLegend'; // Add an ID for easier selection
  
  // Add legend items only for projects with data
  for (const projectId of projectsWithData) {
    // Skip if project doesn't exist in projectNames (safety check)
    if (!projectNames[projectId]) continue;
    
    const legendItem = document.createElement('div');
    legendItem.className = 'legend-item';
    legendItem.dataset.projectId = projectId;
    
    // Make legend item clickable to highlight corresponding bars
    legendItem.style.cursor = 'pointer';
    
    // Check if this is a deleted project
    const isDeleted = !activeProjectIds.has(projectId) && projectId !== 'default';
    
    const colorSwatch = document.createElement('div');
    colorSwatch.className = 'legend-color';
    colorSwatch.style.backgroundColor = projectColors[projectId];
    
    // For deleted projects, add an X inside the color dot
    if (isDeleted) {
      legendItem.classList.add('deleted-project');
      
      // Add X directly inside the color dot
      const xMark = document.createElement('span');
      xMark.className = 'color-x-mark';
      xMark.innerHTML = '&#10005;'; // X symbol
      colorSwatch.appendChild(xMark);
    }
    
    const nameSpan = document.createElement('span');
    nameSpan.textContent = projectNames[projectId];
    
    legendItem.appendChild(colorSwatch);
    legendItem.appendChild(nameSpan);
    
    // Add click event to highlight project bars
    legendItem.addEventListener('click', (e) => {
      // Check if this project is already highlighted
      const isAlreadyHighlighted = legendItem.classList.contains('active');
      
      // Remove highlighting from all segments and reset all legend items
      const allSegments = document.querySelectorAll('.chart-bar-segment');
      allSegments.forEach(seg => {
        seg.classList.remove('project-highlighted');
        seg.style.opacity = '1';
      });
      
      // Remove active status from all legend items
      document.querySelectorAll('.legend-item').forEach(item => {
        item.classList.remove('active');
      });
      
      // Hide any existing tooltip
      if (customTooltip) {
        customTooltip.style.display = 'none';
      }
      
      // Toggle highlighting - only highlight if it wasn't already highlighted
      if (!isAlreadyHighlighted) {
        // Highlight all segments of this project
        const projectSegments = document.querySelectorAll(`.chart-bar-segment[data-project-id="${projectId}"]`);
        projectSegments.forEach(seg => {
          seg.classList.add('project-highlighted');
        });
        
        // Dim other project segments
        allSegments.forEach(seg => {
          if (!seg.classList.contains('project-highlighted')) {
            seg.style.opacity = '0.3';
          }
        });
        
        // Mark this legend item as active
        legendItem.classList.add('active');
        
        // Show project summary tooltip
        showProjectSummaryTooltip(
          projectNames[projectId],
          projectId,
          projectTotals[projectId] || 0,
          prevPeriodProjectTotals[projectId] || 0,
          currentViewMode,
          e.pageX,
          e.pageY
        );
      }
      // If it was already highlighted, we've already removed the highlighting
      // and reset everything above, so no further action needed here
    });
    
    legend.appendChild(legendItem);
  }
  
  // Ensure we add the legend to a consistent location
  const chartSection = document.querySelector('#insightsCard') || container.parentNode;
  chartSection.appendChild(legend);
}