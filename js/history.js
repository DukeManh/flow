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
    // If click is not on a bar container or its children, remove all highlights
    if (!e.target.closest('.bar-container')) {
      // Remove highlighted class from all bars
      const highlightedBars = document.querySelectorAll('.bar-container-highlighted');
      highlightedBars.forEach(bar => bar.classList.remove('bar-container-highlighted'));
      
      // Hide tooltip if showing day summary
      if (customTooltip && customTooltip.classList.contains('day-summary')) {
        customTooltip.classList.remove('day-summary');
        customTooltip.style.display = 'none';
      }
    }
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
        weeklyViewBtn.classList.add('active');
        monthlyViewBtn.classList.remove('active');
        storageService.setItem(STORAGE_KEYS.VIEW_MODE, currentViewMode);
        renderProductivityChart();
      }
    });
    
    monthlyViewBtn.addEventListener('click', () => {
      if (currentViewMode !== 'monthly') {
        currentViewMode = 'monthly';
        monthlyViewBtn.classList.add('active');
        weeklyViewBtn.classList.remove('active');
        storageService.setItem(STORAGE_KEYS.VIEW_MODE, currentViewMode);
        renderProductivityChart();
      }
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
  const now = new Date();

  // Create objects for the days based on view mode
  const days = [];
  
  if (currentViewMode === 'weekly') {
    // Weekly view - last 7 days
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
    
    // Update chart title
    if (chartTitle) {
      chartTitle.textContent = 'Focus Time by Project - Last 7 Days';
    }
  } else {
    // Monthly view - last ~30 days
    const daysToShow = 30;
    
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
    
    // Update chart title
    if (chartTitle) {
      chartTitle.textContent = 'Focus Time by Project - Last 30 Days';
    }
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
    yLabel.textContent = `${value} min`;
    yLabel.style.bottom = `${yPos}px`;
    chartContainer.appendChild(yLabel);
  }

  // Calculate bar width based on view mode and number of days
  const barWidth = (100 / days.length) - (currentViewMode === 'weekly' ? 5 : 1);
  const barSpacing = currentViewMode === 'weekly' ? 2.5 : 0.5;
  
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
    
    // Add click event to the bar container to highlight and show day summary
    barContainer.addEventListener('click', (e) => {
      e.stopPropagation(); // Stop propagation to prevent document handler from immediately removing highlight
      
      // Remove highlighted class from all other bars
      const allBars = document.querySelectorAll('.bar-container');
      allBars.forEach(bar => {
        if (bar !== barContainer) {
          bar.classList.remove('bar-container-highlighted');
        }
      });
      
      // Toggle highlight on this bar
      const wasHighlighted = barContainer.classList.contains('bar-container-highlighted');
      barContainer.classList.toggle('bar-container-highlighted');
      
      // If highlighted, show day summary tooltip
      if (!wasHighlighted) { // Only add if it wasn't already highlighted
        const dateStr = barContainer.dataset.date;
        const totalMinutes = barContainer.dataset.totalMinutes;
        
        // Show simplified tooltip with just date and total minutes
        customTooltip.textContent = `${dateStr}: ${totalMinutes} total minutes`;
        customTooltip.classList.add('day-summary');
        
        // Keep tooltip visible
        customTooltip.style.display = 'block';
        
        // Use existing tooltip position from the bar container if available
        if (barContainer.dataset.lastTooltipX && barContainer.dataset.lastTooltipY) {
          customTooltip.style.left = `${barContainer.dataset.lastTooltipX}px`;
          customTooltip.style.top = `${barContainer.dataset.lastTooltipY}px`;
        } else {
          // Fall back to click position if tooltip position not saved
          customTooltip.style.left = `${e.pageX + 10}px`;
          customTooltip.style.top = `${e.pageY + 10}px`;
          
          // Adjust position to ensure tooltip is visible within viewport
          setTimeout(() => {
            const tooltipRect = customTooltip.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            
            // Check if tooltip is off the right edge
            if (tooltipRect.right > viewportWidth - 10) {
              customTooltip.style.left = `${e.pageX - tooltipRect.width - 10}px`;
            }
          }, 10);
        }
      } else {
        // If not highlighted (toggled off), hide the tooltip
        customTooltip.classList.remove('day-summary');
        customTooltip.style.display = 'none';
      }
    });
    
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
      segment.style.width = '100%';
      segment.style.height = `${segmentHeight}px`;
      segment.style.bottom = `${currentHeight}px`; // Stack from bottom
      
      // Use the project's color from projectColors
      segment.style.backgroundColor = projectColors[projectId] || 'var(--accent)';
      
      // Store tooltip data with percentage
      const projectName = projectNames[projectId] || 'Unassigned';
      segment.dataset.tooltip = `${projectName}: ${minutes} min (${percentage}%)`;
      segment.dataset.date = day.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      
      // Add mouse events for custom tooltip
      segment.addEventListener('mousemove', (e) => {
        // Only show segment tooltip if the bar is not highlighted
        if (customTooltip && !barContainer.classList.contains('bar-container-highlighted')) {
          // Show date in tooltip for monthly view
          const tooltipText = currentViewMode === 'monthly' 
            ? `${segment.dataset.date} - ${segment.dataset.tooltip}`
            : segment.dataset.tooltip;
            
          customTooltip.textContent = tooltipText;
          customTooltip.classList.remove('day-summary');
          customTooltip.classList.add('tooltip-show');
          customTooltip.style.display = 'block';
          customTooltip.style.left = `${e.pageX + 10}px`;
          customTooltip.style.top = `${e.pageY + 10}px`;
          
          // Store current tooltip position on the bar container itself
          // This ensures we always have the latest position even when moving between segments
          barContainer.dataset.lastTooltipX = e.pageX + 10;
          barContainer.dataset.lastTooltipY = e.pageY + 10;
          
          // Prevent tooltip from going off-screen
          setTimeout(() => {
            const tooltipRect = customTooltip.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            
            if (tooltipRect.right > viewportWidth - 10) {
              const newLeft = e.pageX - tooltipRect.width - 10;
              customTooltip.style.left = `${newLeft}px`;
              barContainer.dataset.lastTooltipX = newLeft; // Update stored position
            }
          }, 0);
        }
      });
      
      segment.addEventListener('mouseleave', () => {
        // Only hide tooltip if the bar is not highlighted
        if (customTooltip && !barContainer.classList.contains('bar-container-highlighted')) {
          customTooltip.style.display = 'none';
          customTooltip.classList.remove('tooltip-show');
        }
      });
      
      // Make sure tooltip doesn't flicker when moving between segments
      segment.addEventListener('mouseenter', (e) => {
        if (barContainer.classList.contains('bar-container-highlighted')) {
          e.stopPropagation();
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
  
  history.forEach(session => {
    const sessionDate = new Date(session.start);
    const daysDiff = Math.floor((now - sessionDate) / (1000 * 60 * 60 * 24));
    
    // Only include sessions from the relevant time range
    if (daysDiff < daysToLookBack) {
      const projectId = session.projectId || 'default';
      projectsWithData.add(projectId);
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
    
    legend.appendChild(legendItem);
  }
  
  // Ensure we add the legend to a consistent location
  const chartSection = document.querySelector('#insightsCard') || container.parentNode;
  chartSection.appendChild(legend);
}