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

// Format a date for logging
function formatDateForLog(date) {
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric',
    year: 'numeric' 
  });
}

// Log calculation details for debugging
function logTimeCalculationDetails(mode, currentPeriod, prevPeriod, daysElapsed, currentTotal, prevTotal) {
  console.log(`--------- ${mode.toUpperCase()} VIEW TIME CALCULATIONS ---------`);
  console.log(`Current period: ${formatDateForLog(currentPeriod.start)} to ${formatDateForLog(currentPeriod.end)}`);
  console.log(`Previous period: ${formatDateForLog(prevPeriod.start)} to ${formatDateForLog(prevPeriod.end)}`);
  console.log(`Days elapsed in current period: ${daysElapsed}`);
  
  // Current period details
  console.log(`\nCURRENT PERIOD DETAILS:`);
  console.log(`Total minutes: ${currentTotal}`);
  
  // Calculate averages based on view mode
  let currentAvg, prevAvg, displayUnit;
  const prevDays = mode === 'weekly' ? 7 : 30; // Previous periods always use full days
  
  if (mode === 'weekly') {
    // For weekly view: daily average
    currentAvg = Math.round(currentTotal / daysElapsed);
    prevAvg = Math.round(prevTotal / prevDays);
    displayUnit = 'day';
    console.log(`Average per day (${currentTotal} / ${daysElapsed}): ${currentAvg} minutes (${formatDuration(currentAvg, true)})`);
  } else {
    // For monthly view: weekly average
    const weeksElapsed = Math.max(1, Math.round(daysElapsed / 7 * 10) / 10); // Round to 1 decimal
    const prevWeeks = Math.round(prevDays / 7);
    currentAvg = Math.round(currentTotal / weeksElapsed);
    prevAvg = Math.round(prevTotal / prevWeeks);
    displayUnit = 'week';
    console.log(`Average per week (${currentTotal} / ${weeksElapsed}): ${currentAvg} minutes (${formatDuration(currentAvg, true)})`);
  }
  
  // Previous period details
  console.log(`\nPREVIOUS PERIOD DETAILS:`);
  console.log(`Total minutes: ${prevTotal}`);
  
  if (mode === 'weekly') {
    console.log(`Average per day (${prevTotal} / ${prevDays}): ${prevAvg} minutes (${formatDuration(prevAvg, true)})`);
  } else {
    const prevWeeks = Math.round(prevDays / 7);
    console.log(`Average per week (${prevTotal} / ${prevWeeks}): ${prevAvg} minutes (${formatDuration(prevAvg, true)})`);
  }
  
  // Comparison calculations based on averages now, not totals
  const avgDiff = currentAvg - prevAvg;
  const percentChange = prevAvg > 0 ? Math.round((avgDiff / prevAvg) * 100) : (currentAvg > 0 ? 100 : 0);
  
  console.log(`\nCOMPARISON (based on averages):`);
  console.log(`Average difference: ${avgDiff} minutes per ${displayUnit}`);
  console.log(`Percent change in average: ${percentChange}%`);
  console.log(`Display text: ${percentChange >= 0 ? '▲' : '▼'} ${Math.abs(percentChange)}% from previous ${mode}`);
  
  // What user sees
  console.log(`\nWHAT USER SEES:`);
  console.log(`Average: ${formatDuration(currentAvg, true)}/${displayUnit}`);
  console.log(`Comparison: ${percentChange >= 0 ? '▲' : '▼'} ${Math.abs(percentChange)}% from previous ${mode}`);
  console.log('---------------------------------------------');
}

// Display project summary tooltip with comparison to previous period
function showProjectSummaryTooltip(projectName, projectId, totalMinutes, prevPeriodMinutes, viewMode, x, y) {
  if (!customTooltip) return;
  
  // Create tooltip HTML content with rich formatting
  const periodName = viewMode === 'weekly' ? 'week' : 'month';
  
  // Calculate the number of days that have elapsed
  const today = new Date();
  let daysInPeriod;
  
  if (currentPeriodOffset === 0) {
    // For current week/month, use only elapsed days
    if (viewMode === 'weekly') {
      // For current week: days elapsed so far (Sun = 0, Mon = 1, etc.)
      daysInPeriod = today.getDay() + 1;  // +1 to include today
    } else {
      // For current month: current day of month
      daysInPeriod = today.getDate();
    }
  } else {
    // For past periods, use all days
    daysInPeriod = viewMode === 'weekly' ? 7 : 30;
  }
  
  // Calculate averages differently based on view mode
  let avgValue, prevAvgValue, displayUnit;
  
  if (viewMode === 'weekly') {
    // For weekly view: calculate daily average
    avgValue = daysInPeriod > 0 ? Math.round(totalMinutes / daysInPeriod) : 0;
    prevAvgValue = Math.round(prevPeriodMinutes / 7); // Previous week always uses full 7 days
    displayUnit = 'day';
  } else {
    // For monthly view: calculate weekly average
    const weeksElapsed = Math.max(1, Math.round(daysInPeriod / 7 * 10) / 10); // Round to 1 decimal
    avgValue = weeksElapsed > 0 ? Math.round(totalMinutes / weeksElapsed) : 0;
    
    // Previous month always uses approx 4 weeks (or actual days / 7)
    const prevDays = 30; // Approximate for previous month
    const prevWeeks = Math.round(prevDays / 7);
    prevAvgValue = Math.round(prevPeriodMinutes / prevWeeks);
    displayUnit = 'week';
  }
  
  // Calculate percentage change based on averages
  const avgDiff = avgValue - prevAvgValue;
  const percentChange = prevAvgValue > 0 
    ? Math.round((avgDiff / prevAvgValue) * 100)
    : avgValue > 0 ? 100 : 0;
  
  // Get period text based on offset
  const periodText = currentPeriodOffset === 0 
    ? `this ${periodName}` 
    : currentPeriodOffset === 1 
      ? `last ${periodName}` 
      : `${currentPeriodOffset} ${periodName}s ago`;
  
  // Create tooltip content with HTML
  let tooltipContent = `<span class="project-title">${projectName}</span>`;
  tooltipContent += `Total: ${formatDuration(totalMinutes, true)} ${periodText}`;
  
  if (avgValue > 0) {
    tooltipContent += `<span class="project-stat">Average: ${formatDuration(avgValue, true)}/${displayUnit}</span>`;
  }
  
  // Add comparison to previous period if we have data
  if (prevAvgValue > 0 || avgValue > 0) {
    const changeText = avgDiff === 0 
      ? 'No change'
      : avgDiff > 0 
        ? `▲ ${percentChange}%`
        : `▼ ${Math.abs(percentChange)}%`;
    
    const comparisonPeriodText = currentPeriodOffset === 0 
      ? `Previous ${periodName}` 
      : currentPeriodOffset === 1 
        ? `${periodName} before last` 
        : `${currentPeriodOffset + 1} ${periodName}s ago`;
        
    tooltipContent += `<span class="project-stat">vs ${comparisonPeriodText}: <span class="stat-trend ${avgDiff >= 0 ? 'positive' : 'negative'}">${changeText}</span></span>`;
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
  
  // Create objects for the days based on view mode
  const days = [];
  
  if (currentViewMode === 'weekly') {
    // Weekly view - show the current calendar week
    
    // Calculate the start and end of the current week (Sunday to Saturday) with offset
    const startOfWeek = new Date(now);
    
    // Apply period offset (in weeks)
    startOfWeek.setDate(startOfWeek.getDate() - (7 * currentPeriodOffset));
    
    // Go to start of this week (Sunday)
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    // Set to beginning of the day
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Calculate end of the week (Saturday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    // Set to end of the day
    endOfWeek.setHours(23, 59, 59, 999);
    
    // Format date range for title (May 1 - May 7, 2023)
    const dateRangeText = `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    
    // Create day objects for the current week
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);
      days.push({
        date,
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
        totalMinutes: 0,
        projectMinutes: {} // To store minutes by project
      });
    }
    
    // Calculate the previous week for comparison
    const startOfPrevWeek = new Date(startOfWeek);
    startOfPrevWeek.setDate(startOfPrevWeek.getDate() - 7);
    
    // Create day objects for the previous week
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfPrevWeek);
      date.setDate(date.getDate() + i);
      prevWeekDays.push({
        date,
        totalMinutes: 0,
        projectMinutes: {}
      });
    }
    
    // Populate current week data
    history.forEach(session => {
      const sessionDate = new Date(session.start);
      
      // Check if session is within current week range
      if (sessionDate >= startOfWeek && sessionDate <= endOfWeek) {
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
      }
      
      // Check if session is within previous week range
      const startOfPrevWeekTime = startOfPrevWeek.getTime();
      const endOfPrevWeekTime = startOfWeek.getTime() - 1; // Just before current week starts
      const sessionTime = sessionDate.getTime();
      
      if (sessionTime >= startOfPrevWeekTime && sessionTime <= endOfPrevWeekTime) {
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
      }
    });
    
    // Calculate weekly comparison data
    const currentWeekTotal = days.reduce((sum, day) => sum + day.totalMinutes, 0);
    const prevWeekTotal = prevWeekDays.reduce((sum, day) => sum + day.totalMinutes, 0);
    
    // Calculate the number of days that have passed so far in the current week
    const today = new Date();
    let daysElapsed;
    
    if (currentPeriodOffset === 0) {
      // For current week, count days elapsed so far (including today)
      const startOfCurrentWeek = new Date(today);
      startOfCurrentWeek.setDate(startOfCurrentWeek.getDate() - startOfCurrentWeek.getDay()); // Go to Sunday
      startOfCurrentWeek.setHours(0, 0, 0, 0);
      
      // Calculate days elapsed including today (add 1 since getDay() is 0-indexed)
      daysElapsed = today.getDay() + 1;
    } else {
      // For past weeks, use all 7 days
      daysElapsed = 7;
    }
    
    // Calculate daily averages
    const currentDailyAvg = daysElapsed > 0 ? Math.round(currentWeekTotal / daysElapsed) : 0;
    const prevDailyAvg = Math.round(prevWeekTotal / 7); // Previous week always uses full 7 days
    
    // Calculate percentage change based on daily averages, not total
    const avgDailyDiff = currentDailyAvg - prevDailyAvg;
    const weeklyPercentChange = prevDailyAvg > 0 
      ? Math.round((avgDailyDiff / prevDailyAvg) * 100) 
      : currentDailyAvg > 0 ? 100 : 0;
      
    // Update chart title with comparison and date range
    if (chartTitle) {
      // Log detailed calculations for the weekly view
      logTimeCalculationDetails(
        'weekly', 
        { start: startOfWeek, end: endOfWeek },
        { start: startOfPrevWeek, end: new Date(startOfWeek.getTime() - 1) },
        daysElapsed,
        currentWeekTotal,
        prevWeekTotal
      );
      
      // Show "This Week" for current week, otherwise show date range
      const titlePrefix = currentPeriodOffset === 0 
        ? `This Week` 
        : `${dateRangeText}`;
      
      // Format the title with combined average - no brackets around date
      const titleText = `<div>Average ${titlePrefix}</div><div>${formatDuration(currentDailyAvg, true)} / day</div>`;
      
      // Add comparison as a separate element
      const comparisonText = avgDailyDiff === 0 
        ? 'No change from last week'
        : avgDailyDiff > 0 
          ? `▲ ${weeklyPercentChange}% from last week`
          : `▼ ${Math.abs(weeklyPercentChange)}% from last week`;
      
      chartTitle.innerHTML = `${titleText} <span class="chart-comparison ${avgDailyDiff >= 0 ? 'positive' : 'negative'}">${comparisonText}</span>`;
    }
  } else {
    // Monthly view - show the current calendar month
    
    // Calculate start of the month (1st day) with offset
    const startOfMonth = new Date(now);
    
    // Apply period offset (in months)
    startOfMonth.setMonth(startOfMonth.getMonth() - currentPeriodOffset);
    
    // Set to 1st day of the month
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    // Calculate end of the month (last day)
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0); // Last day of current month
    endOfMonth.setHours(23, 59, 59, 999);
    
    // Get number of days in the month
    const daysInMonth = endOfMonth.getDate();
    
    // Format date range for title (May 2023)
    const monthYearText = startOfMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    // Create day objects for each day in the month
    for (let i = 0; i < daysInMonth; i++) {
      const date = new Date(startOfMonth);
      date.setDate(i + 1);
      
      // For monthly view, only show labels for first day of week (Sunday) or 1st of month
      let label = '';
      if (date.getDay() === 0 || date.getDate() === 1) { // Sunday or 1st day
        label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      
      days.push({
        date,
        label,
        totalMinutes: 0,
        projectMinutes: {} // To store minutes by project
      });
    }
    
    // Calculate the previous month for comparison
    const startOfPrevMonth = new Date(startOfMonth);
    startOfPrevMonth.setMonth(startOfPrevMonth.getMonth() - 1);
    
    const endOfPrevMonth = new Date(startOfMonth);
    endOfPrevMonth.setDate(0); // Last day of previous month
    endOfPrevMonth.setHours(23, 59, 59, 999);
    
    const daysInPrevMonth = endOfPrevMonth.getDate();
    
    // Create day objects for each day in the previous month
    for (let i = 0; i < daysInPrevMonth; i++) {
      const date = new Date(startOfPrevMonth);
      date.setDate(i + 1);
      prevMonthDays.push({
        date,
        totalMinutes: 0,
        projectMinutes: {}
      });
    }
    
    // Populate current month data
    history.forEach(session => {
      const sessionDate = new Date(session.start);
      
      // Check if session is within current month range
      if (sessionDate >= startOfMonth && sessionDate <= endOfMonth) {
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
      }
      
      // Check if session is within previous month range
      const startOfPrevMonthTime = startOfPrevMonth.getTime();
      const endOfPrevMonthTime = endOfPrevMonth.getTime();
      const sessionTime = sessionDate.getTime();
      
      if (sessionTime >= startOfPrevMonthTime && sessionTime <= endOfPrevMonthTime) {
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
      }
    });
    
    // Calculate monthly comparison data
    const currentMonthTotal = days.reduce((sum, day) => sum + day.totalMinutes, 0);
    const prevMonthTotal = prevMonthDays.reduce((sum, day) => sum + day.totalMinutes, 0);
    
    // Calculate the number of days that have passed so far in the current month
    const today = new Date();
    let daysElapsed;
    
    if (currentPeriodOffset === 0) {
      // For current month, count days elapsed so far (including today)
      daysElapsed = today.getDate();
    } else {
      // For past months, use all days in the month
      daysElapsed = daysInMonth;
    }
    
    // Calculate weekly averages instead of daily averages
    const weeksElapsed = Math.max(1, Math.round(daysElapsed / 7 * 10) / 10); // Round to 1 decimal
    const weeksInPrevMonth = Math.ceil(daysInPrevMonth / 7);
    
    const currentWeeklyAvg = Math.round(currentMonthTotal / weeksElapsed);
    const prevWeeklyAvg = Math.round(prevMonthTotal / weeksInPrevMonth);
    
    // Calculate percentage change based on weekly averages, not total
    const avgWeeklyDiff = currentWeeklyAvg - prevWeeklyAvg;
    const monthlyPercentChange = prevWeeklyAvg > 0 
      ? Math.round((avgWeeklyDiff / prevWeeklyAvg) * 100) 
      : currentWeeklyAvg > 0 ? 100 : 0;
      
    // Update chart title with comparison and month/year
    if (chartTitle) {
      // Log detailed calculations for the monthly view
      logTimeCalculationDetails(
        'monthly', 
        { start: startOfMonth, end: endOfMonth },
        { start: startOfPrevMonth, end: endOfPrevMonth },
        daysElapsed,
        currentMonthTotal,
        prevMonthTotal
      );
      
      // Show "This Month" for current month, otherwise show month and year
      const titlePrefix = currentPeriodOffset === 0 
        ? `This Month` 
        : `${monthYearText}`;
      
      // Format the title with combined average - no brackets around date
      const titleText = `<div>Average ${titlePrefix}</div><div>${formatDuration(currentWeeklyAvg, true)} / week</div>`;
      
      // Add comparison as a separate element
      const comparisonText = avgWeeklyDiff === 0 
          ? 'No change from last month'
          : avgWeeklyDiff >= 0 
            ? `▲ ${monthlyPercentChange}% from last month`
            : `▼ ${Math.abs(monthlyPercentChange)}% from last month`;
      
      chartTitle.innerHTML = `${titleText} <span class="chart-comparison ${avgWeeklyDiff >= 0 ? 'positive' : 'negative'}">${comparisonText}</span>`;
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
  
  // Calculate start of the current period based on view mode and offset
  let startOfPeriod;
  let endOfPeriod;
  
  if (currentViewMode === 'weekly') {
    // Weekly view - current calendar week with offset
    startOfPeriod = new Date(now);
    
    // Apply period offset (in weeks)
    startOfPeriod.setDate(startOfPeriod.getDate() - (7 * currentPeriodOffset));
    
    // Go to start of this week (Sunday)
    startOfPeriod.setDate(startOfPeriod.getDate() - startOfPeriod.getDay());
    // Set to beginning of the day
    startOfPeriod.setHours(0, 0, 0, 0);
    
    // Calculate end of the week (Saturday)
    endOfPeriod = new Date(startOfPeriod);
    endOfPeriod.setDate(endOfPeriod.getDate() + 6);
    // Set to end of the day
    endOfPeriod.setHours(23, 59, 59, 999);
  } else {
    // Monthly view - current calendar month with offset
    startOfPeriod = new Date(now);
    
    // Apply period offset (in months)
    startOfPeriod.setMonth(startOfPeriod.getMonth() - currentPeriodOffset);
    
    // Set to 1st day of the month
    startOfPeriod.setDate(1);
    startOfPeriod.setHours(0, 0, 0, 0);
    
    // Calculate end of the month (last day)
    endOfPeriod = new Date(startOfPeriod);
    endOfPeriod.setMonth(endOfPeriod.getMonth() + 1);
    endOfPeriod.setDate(0); // Last day of current month
    endOfPeriod.setHours(23, 59, 59, 999);
  }
  
  // Track project totals for the current and previous periods
  const projectTotals = {};
  const prevPeriodProjectTotals = {};
  
  // Calculate start of the previous period
  let startOfPrevPeriod;
  let endOfPrevPeriod;
  
  if (currentViewMode === 'weekly') {
    // Previous week
    startOfPrevPeriod = new Date(startOfPeriod);
    startOfPrevPeriod.setDate(startOfPrevPeriod.getDate() - 7);
    
    endOfPrevPeriod = new Date(startOfPrevPeriod);
    endOfPrevPeriod.setDate(endOfPrevPeriod.getDate() + 6);
    endOfPrevPeriod.setHours(23, 59, 59, 999);
  } else {
    // Previous month
    startOfPrevPeriod = new Date(startOfPeriod);
    startOfPrevPeriod.setMonth(startOfPrevPeriod.getMonth() - 1);
    
    endOfPrevPeriod = new Date(startOfPeriod);
    endOfPrevPeriod.setDate(0); // Last day of previous month
    endOfPrevPeriod.setHours(23, 59, 59, 999);
  }
  
  // Process all history entries
  history.forEach(session => {
    const sessionDate = new Date(session.start);
    const projectId = session.projectId || 'default';
    
    // Check if session is in the current period
    if (sessionDate >= startOfPeriod && sessionDate <= endOfPeriod) {
      projectsWithData.add(projectId);
      
      // Add to project totals for current period
      projectTotals[projectId] = (projectTotals[projectId] || 0) + session.duration;
    }
    
    // Check if session is in the previous period
    if (sessionDate >= startOfPrevPeriod && sessionDate <= endOfPrevPeriod) {
      // Add to project totals for previous period
      prevPeriodProjectTotals[projectId] = (prevPeriodProjectTotals[projectId] || 0) + session.duration;
    }
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