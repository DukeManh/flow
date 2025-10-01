// Task Planner functionality for the Flow State app
import storageService from './storage.js';
import { formatTime, formatDateTime } from './utils.js';

// Storage keys
const STORAGE_KEYS = {
  PLANNER_TASKS: 'flowPlannerTasks',
  PLANNER_DATE: 'flowPlannerDate'
};

// DOM elements
let plannerDate;
let prevDayBtn;
let todayBtn;
let nextDayBtn;
let plannerStatusIcon;
let plannerStatusText;
let plannerCurrentTime;
let plannerEndTime;
let addPlannerTaskBtn;
let timelineNowIndicator;
let plannerTimeline;
let plannerTaskList;
let clearPlannerBtn;
let exportPlannerBtn;

// Task modal elements
let taskPlannerModal;
let taskModalTitle;
let taskTitle;
let taskDescription;
let taskStartTime;
let taskMinutes;
let taskEndTime;
let taskId;
let deleteTaskBtn;
let cancelTaskBtn;
let saveTaskBtn;

// Task planner state
let currentDate = new Date();
let plannerTasks = [];
let editingTaskId = null;
let clockInterval = null;

// Initialize Task Planner functionality
export function initPlanner() {
  // Get DOM elements
  plannerDate = document.getElementById('plannerDate');
  prevDayBtn = document.getElementById('prevDayBtn');
  todayBtn = document.getElementById('todayBtn');
  nextDayBtn = document.getElementById('nextDayBtn');
  plannerStatusIcon = document.getElementById('plannerStatusIcon');
  plannerStatusText = document.getElementById('plannerStatusText');
  plannerCurrentTime = document.getElementById('plannerCurrentTime');
  plannerEndTime = document.getElementById('plannerEndTime');
  addPlannerTaskBtn = document.getElementById('addPlannerTaskBtn');
  timelineNowIndicator = document.getElementById('timelineNowIndicator');
  plannerTimeline = document.getElementById('plannerTimeline');
  plannerTaskList = document.getElementById('plannerTaskList');
  clearPlannerBtn = document.getElementById('clearPlannerBtn');
  exportPlannerBtn = document.getElementById('exportPlannerBtn');

  // Task modal elements
  taskPlannerModal = document.getElementById('taskPlannerModal');
  taskModalTitle = document.getElementById('taskModalTitle');
  taskTitle = document.getElementById('taskTitle');
  taskDescription = document.getElementById('taskDescription');
  taskStartTime = document.getElementById('taskStartTime');
  taskMinutes = document.getElementById('taskMinutes');
  taskEndTime = document.getElementById('taskEndTime');
  taskId = document.getElementById('taskId');
  deleteTaskBtn = document.getElementById('deleteTaskBtn');
  cancelTaskBtn = document.getElementById('cancelTaskBtn');
  saveTaskBtn = document.getElementById('saveTaskBtn');

  // Set up event listeners
  if (addPlannerTaskBtn) {
    addPlannerTaskBtn.addEventListener('click', openAddTaskModal);
  }

  if (clearPlannerBtn) {
    clearPlannerBtn.addEventListener('click', clearAllTasks);
  }

  if (exportPlannerBtn) {
    exportPlannerBtn.addEventListener('click', exportPlannerData);
  }

  // Navigation event listeners
  if (prevDayBtn) {
    prevDayBtn.addEventListener('click', navigateToPreviousDay);
  }

  if (todayBtn) {
    todayBtn.addEventListener('click', navigateToToday);
  }

  if (nextDayBtn) {
    nextDayBtn.addEventListener('click', navigateToNextDay);
  }

  // Task modal event listeners
  if (taskStartTime) {
    taskStartTime.addEventListener('change', updateEndTime);
  }
  
  if (taskMinutes) {
    taskMinutes.addEventListener('input', updateEndTime);
  }

  if (cancelTaskBtn) {
    cancelTaskBtn.addEventListener('click', closeTaskModal);
  }

  if (saveTaskBtn) {
    saveTaskBtn.addEventListener('click', saveTask);
  }

  if (deleteTaskBtn) {
    deleteTaskBtn.addEventListener('click', deleteTask);
  }

  // Close modal when clicking on X or outside the modal
  document.querySelectorAll('#taskPlannerModal .close-modal').forEach(el => {
    el.addEventListener('click', closeTaskModal);
  });

  window.addEventListener('click', (e) => {
    if (e.target === taskPlannerModal) {
      closeTaskModal();
    }
  });

  // Load tasks from storage
  loadTasks();

  // Start clock
  startClock();

  console.log('Task Planner module initialized');
}

// Load tasks from storage
async function loadTasks() {
  try {
    // Get stored date or default to today
    const storedDate = await storageService.getItem(STORAGE_KEYS.PLANNER_DATE);
    
    if (storedDate) {
      currentDate = new Date(storedDate);
    } else {
      currentDate = new Date();
      // Don't reset time - keep the full date for proper comparison
    }
    
    // Format and display date
    if (plannerDate) {
      plannerDate.textContent = formatPlannerDate(currentDate);
    }
    
    // Load tasks for the current date
    const allTasks = await storageService.getJSON(STORAGE_KEYS.PLANNER_TASKS, []);
    
    // Filter tasks for the current date
    const dateStr = formatDateForStorage(currentDate);
    plannerTasks = allTasks.filter(task => task.date === dateStr);
    
    // Sort tasks by start time
    plannerTasks.sort((a, b) => {
      return getTimeInMinutes(a.startTime) - getTimeInMinutes(b.startTime);
    });
    
    renderTasks();
    updatePlannerStatus();
    
  } catch (error) {
    console.error('Error loading tasks:', error);
  }
}

// Helper function to format date for storage (consistent YYYY-MM-DD format)
function formatDateForStorage(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Format the planner date for display
function formatPlannerDate(date) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Use the same date formatting for comparison
  const dateStr = formatDateForStorage(date);
  const todayStr = formatDateForStorage(today);
  const tomorrowStr = formatDateForStorage(tomorrow);
  const yesterdayStr = formatDateForStorage(yesterday);
  
  if (dateStr === todayStr) {
    return 'Today';
  } else if (dateStr === tomorrowStr) {
    return 'Tomorrow';
  } else if (dateStr === yesterdayStr) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }
}

// Convert time string (HH:MM) to minutes since midnight
function getTimeInMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Calculate end time based on start time and duration
function calculateEndTime(startTime, durationMinutes) {
  const [hours, minutes] = startTime.split(':').map(Number);
  
  let totalMinutes = hours * 60 + minutes + Number(durationMinutes);
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
}

// Update end time in the modal
function updateEndTime() {
  if (taskStartTime && taskMinutes && taskEndTime) {
    const startTimeValue = taskStartTime.value;
    const minutesValue = taskMinutes.value;
    
    if (startTimeValue && minutesValue) {
      const endTime = calculateEndTime(startTimeValue, minutesValue);
      taskEndTime.textContent = endTime;
    }
  }
}

// Open the Add Task modal
function openAddTaskModal() {
  editingTaskId = null;
  taskId.value = '';
  
  // Set default title
  taskModalTitle.textContent = 'Add Task Block';
  
  // Clear previous values
  taskTitle.value = '';
  taskDescription.value = '';
  
  // Set default start time - either end of last task or next 15-min interval
  let defaultStartTime;
  
  if (plannerTasks.length > 0) {
    // Find the task with the latest end time
    const lastTask = plannerTasks.reduce((latest, task) => {
      const taskEndMinutes = getTimeInMinutes(task.startTime) + Number(task.durationMinutes);
      const latestEndMinutes = getTimeInMinutes(latest.startTime) + Number(latest.durationMinutes);
      return taskEndMinutes > latestEndMinutes ? task : latest;
    });
    
    // Set start time to the end time of the last task
    const lastTaskEndMinutes = getTimeInMinutes(lastTask.startTime) + Number(lastTask.durationMinutes);
    const hours = Math.floor(lastTaskEndMinutes / 60);
    const minutes = lastTaskEndMinutes % 60;
    defaultStartTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  } else {
    // No existing tasks, use next 15-min interval
    const now = new Date();
    const minutes = Math.ceil(now.getMinutes() / 15) * 15;
    now.setMinutes(minutes, 0, 0);
    defaultStartTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  }
  
  taskStartTime.value = defaultStartTime;
  taskMinutes.value = '30';
  
  // Update end time
  updateEndTime();
  
  // Hide delete button for new tasks
  deleteTaskBtn.style.display = 'none';
  
  // Show the modal
  taskPlannerModal.style.display = 'flex';
  
  // Focus the title input
  setTimeout(() => taskTitle.focus(), 100);
}

// Open the Edit Task modal
function openEditTaskModal(task) {
  // Check if the task is in the past (not today or future)
  const today = new Date();
  // Fix: Parse date string in local timezone to avoid UTC conversion issues
  const taskDateParts = task.date.split('-');
  const taskDate = new Date(parseInt(taskDateParts[0]), parseInt(taskDateParts[1]) - 1, parseInt(taskDateParts[2]));
  const todayStr = formatDateForStorage(today);
  const taskDateStr = formatDateForStorage(taskDate);
  
  // If task is in the past, don't allow editing - just return silently
  if (taskDateStr < todayStr) {
    return;
  }
  
  editingTaskId = task.id;
  taskId.value = task.id;
  
  // Set title
  taskModalTitle.textContent = 'Edit Task Block';
  
  // Set values
  taskTitle.value = task.title;
  taskDescription.value = task.description || '';
  taskStartTime.value = task.startTime;
  taskMinutes.value = task.durationMinutes;
  
  // Update end time
  updateEndTime();
  
  // Show delete button for existing tasks
  deleteTaskBtn.style.display = 'inline-block';
  
  // Show the modal
  taskPlannerModal.style.display = 'flex';
  
  // Focus the title input
  setTimeout(() => taskTitle.focus(), 100);
}

// Close the Task modal
function closeTaskModal() {
  taskPlannerModal.style.display = 'none';
}

// Save a task
async function saveTask() {
  // Validate form
  if (!taskTitle.value.trim()) {
    alert('Please enter a task title');
    return;
  }
  
  if (!taskStartTime.value) {
    alert('Please select a start time');
    return;
  }
  
  if (!taskMinutes.value || Number(taskMinutes.value) < 5) {
    alert('Please enter a valid duration (at least 5 minutes)');
    return;
  }
  
  // Create the task object
  const task = {
    id: editingTaskId || 'task_' + Date.now(),
    date: formatDateForStorage(currentDate), // Fix: Use consistent date formatting
    title: taskTitle.value.trim(),
    description: taskDescription.value.trim(),
    startTime: taskStartTime.value,
    durationMinutes: Number(taskMinutes.value),
    endTime: calculateEndTime(taskStartTime.value, taskMinutes.value),
    completed: false
  };
  
  try {
    // Get all tasks
    const allTasks = await storageService.getJSON(STORAGE_KEYS.PLANNER_TASKS, []);
    
    if (editingTaskId) {
      // Update existing task
      const taskIndex = allTasks.findIndex(t => t.id === editingTaskId);
      if (taskIndex !== -1) {
        allTasks[taskIndex] = task;
      }
    } else {
      // Add new task
      allTasks.push(task);
    }
    
    // Save to storage
    await storageService.setJSON(STORAGE_KEYS.PLANNER_TASKS, allTasks);
    
    // Update the local task list and render
    const dateStr = formatDateForStorage(currentDate); // Fix: Use consistent date formatting
    plannerTasks = allTasks.filter(t => t.date === dateStr);
    
    // Sort tasks by start time
    plannerTasks.sort((a, b) => {
      return getTimeInMinutes(a.startTime) - getTimeInMinutes(b.startTime);
    });
    
    renderTasks();
    updatePlannerStatus();
    closeTaskModal();
    
  } catch (error) {
    console.error('Error saving task:', error);
    alert('Failed to save task. Please try again.');
  }
}

// Delete a task
async function deleteTask() {
  if (!editingTaskId) return;
  
  if (!confirm('Are you sure you want to delete this task?')) return;
  
  try {
    // Get all tasks
    const allTasks = await storageService.getJSON(STORAGE_KEYS.PLANNER_TASKS, []);
    
    // Remove the task
    const taskIndex = allTasks.findIndex(t => t.id === editingTaskId);
    if (taskIndex !== -1) {
      allTasks.splice(taskIndex, 1);
    }
    
    // Save to storage
    await storageService.setJSON(STORAGE_KEYS.PLANNER_TASKS, allTasks);
    
    // Update the local task list and render
    const dateStr = formatDateForStorage(currentDate); // Fix: Use consistent date formatting
    plannerTasks = allTasks.filter(t => t.date === dateStr);
    renderTasks();
    updatePlannerStatus();
    closeTaskModal();
    
  } catch (error) {
    console.error('Error deleting task:', error);
    alert('Failed to delete task. Please try again.');
  }
}

// Clear all tasks for the current date
async function clearAllTasks() {
  if (!confirm('Are you sure you want to clear all tasks for this day?')) return;
  
  try {
    // Get all tasks
    const allTasks = await storageService.getJSON(STORAGE_KEYS.PLANNER_TASKS, []);
    
    // Filter out tasks for the current date
    const dateStr = formatDateForStorage(currentDate); // Fix: Use consistent date formatting
    const filteredTasks = allTasks.filter(t => t.date !== dateStr);
    
    // Save to storage
    await storageService.setJSON(STORAGE_KEYS.PLANNER_TASKS, filteredTasks);
    
    // Clear the local task list and render
    plannerTasks = [];
    renderTasks();
    updatePlannerStatus();
    
  } catch (error) {
    console.error('Error clearing tasks:', error);
    alert('Failed to clear tasks. Please try again.');
  }
}

// Change the planner date
async function changePlannerDate() {
  const newDate = prompt('Enter date (YYYY-MM-DD):', 
    currentDate.toISOString().split('T')[0]);
  
  if (!newDate) return;
  
  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
    alert('Please enter a valid date in YYYY-MM-DD format');
    return;
  }
  
  try {
    // Set new date
    currentDate = new Date(newDate);
    
    // Store the selected date
    await storageService.setItem(STORAGE_KEYS.PLANNER_DATE, currentDate.toISOString());
    
    // Update display
    plannerDate.textContent = formatPlannerDate(currentDate);
    
    // Load tasks for the new date
    loadTasks();
    
  } catch (error) {
    console.error('Error changing date:', error);
    alert('Failed to change date. Please try again.');
  }
}

// Navigation functions
async function navigateToPreviousDay() {
  const prevDay = new Date(currentDate);
  prevDay.setDate(prevDay.getDate() - 1);
  await navigateToDate(prevDay);
}

async function navigateToToday() {
  await navigateToDate(new Date());
}

async function navigateToNextDay() {
  const nextDay = new Date(currentDate);
  nextDay.setDate(nextDay.getDate() + 1);
  await navigateToDate(nextDay);
}

async function navigateToDate(newDate) {
  try {
    // Set the new date
    currentDate = new Date(newDate);
    
    // Store the selected date
    await storageService.setItem(STORAGE_KEYS.PLANNER_DATE, currentDate.toISOString());
    
    // Update display
    if (plannerDate) {
      plannerDate.textContent = formatPlannerDate(currentDate);
    }
    
    // Load tasks for the new date
    await loadTasks();
    
  } catch (error) {
    console.error('Error navigating to date:', error);
    alert('Failed to change date. Please try again.');
  }
}

// Export planner data
function exportPlannerData() {
  try {
    const dateStr = currentDate.toISOString().split('T')[0];
    const fileName = `flow-planner-${dateStr}.json`;
    
    // Create export data
    const exportData = {
      date: dateStr,
      tasks: plannerTasks,
      exportDate: new Date().toISOString()
    };
    
    // Convert to JSON string
    const jsonStr = JSON.stringify(exportData, null, 2);
    
    // Create downloadable link
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonStr);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", fileName);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    
  } catch (error) {
    console.error('Error exporting data:', error);
    alert('Failed to export data. Please try again.');
  }
}

// Render tasks in the UI
function renderTasks() {
  if (!plannerTimeline || !plannerTaskList) return;
  
  // Clear previous tasks
  plannerTimeline.innerHTML = '';
  plannerTaskList.innerHTML = '';
  
  // Also clear any existing time markers from the main timeline container
  const plannerTimelineContainer = document.querySelector('.planner-timeline');
  if (plannerTimelineContainer) {
    const existingMarkers = plannerTimelineContainer.querySelector('.timeline-time-markers');
    if (existingMarkers) {
      existingMarkers.remove();
    }
  }
  
  if (plannerTasks.length === 0) {
    plannerTaskList.innerHTML = `
      <div class="empty-state">
        <p><strong>No tasks planned.</strong></p>
      </div>
    `;
    
    // Set end time to empty
    if (plannerEndTime) {
      plannerEndTime.textContent = '--:--';
    }
    
    // Show general time markers even when no tasks
    showGeneralTimeMarkers(plannerTimelineContainer);
    
    return;
  }
  
  // Update end time to show when the last task ends
  if (plannerEndTime) {
    const lastTask = [...plannerTasks].sort((a, b) => {
      return getTimeInMinutes(b.endTime) - getTimeInMinutes(a.endTime);
    })[0];
    
    plannerEndTime.textContent = lastTask ? lastTask.endTime : '--:--';
  }
  
  // Calculate timeline width
  const earliestTaskTime = Math.min(...plannerTasks.map(task => getTimeInMinutes(task.startTime)));
  const latestTaskEndTime = Math.max(...plannerTasks.map(task => 
    getTimeInMinutes(task.startTime) + Number(task.durationMinutes)));
  
  // Add buffer time
  const timelineStartMinutes = Math.max(0, earliestTaskTime - 30);
  const timelineEndMinutes = latestTaskEndTime + 30;
  const timelineWidth = timelineEndMinutes - timelineStartMinutes;
  
  // Create time markers container
  const timeMarkersContainer = document.createElement('div');
  timeMarkersContainer.className = 'timeline-time-markers';
  
  // Generate time markers every hour
  const startHour = Math.floor(timelineStartMinutes / 60);
  const endHour = Math.ceil(timelineEndMinutes / 60);
  
  for (let hour = startHour; hour <= endHour; hour++) {
    const hourMinutes = hour * 60;
    
    // Only show markers within the timeline range
    if (hourMinutes >= timelineStartMinutes && hourMinutes <= timelineEndMinutes) {
      const position = ((hourMinutes - timelineStartMinutes) / timelineWidth) * 100;
      
      const marker = document.createElement('div');
      marker.className = 'timeline-time-marker';
      marker.style.left = `${position}%`;
      
      // Format hour display (12-hour format with AM/PM)
      let displayHour = hour;
      let ampm = 'AM';
      
      if (hour === 0) {
        displayHour = 12;
        ampm = 'AM'; // Midnight should be 12AM
      } else if (hour < 12) {
        ampm = 'AM';
      } else if (hour === 12) {
        ampm = 'PM';
      } else {
        displayHour = hour - 12;
        ampm = 'PM';
      }
      
      marker.textContent = `${displayHour}${ampm}`;
      timeMarkersContainer.appendChild(marker);
    }
  }
  
  // Current time in minutes and today's date (declare these early)
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const today = new Date();
  
  // Position the now indicator if the current date is today
  if (currentDate.toDateString() === today.toDateString() && timelineNowIndicator) {
    // Only show the now indicator if current time is within the timeline range
    if (currentMinutes >= timelineStartMinutes && currentMinutes <= timelineEndMinutes) {
      const position = ((currentMinutes - timelineStartMinutes) / timelineWidth) * 100;
      timelineNowIndicator.style.left = `${position}%`;
      timelineNowIndicator.style.display = 'block';
    } else {
      timelineNowIndicator.style.display = 'none';
    }
  } else if (timelineNowIndicator) {
    timelineNowIndicator.style.display = 'none';
  }
  
  // Function to detect overlapping tasks and assign stack levels
  function calculateTaskLevels(tasks, timelineStartMinutes, timelineWidth) {
    const taskLevels = [];
    const levels = []; // Array to track occupied time ranges for each level
    
    // Sort tasks by start time for processing
    const sortedTasks = [...tasks].sort((a, b) => getTimeInMinutes(a.startTime) - getTimeInMinutes(b.startTime));
    
    sortedTasks.forEach((task, index) => {
      const taskStart = getTimeInMinutes(task.startTime);
      const taskEnd = taskStart + Number(task.durationMinutes);
      
      // Find the first level where this task doesn't overlap
      let assignedLevel = 0;
      while (assignedLevel < levels.length) {
        const levelRanges = levels[assignedLevel];
        const hasOverlap = levelRanges.some(range => 
          (taskStart < range.end && taskEnd > range.start)
        );
        
        if (!hasOverlap) {
          break;
        }
        assignedLevel++;
      }
      
      // Create new level if needed
      if (assignedLevel >= levels.length) {
        levels.push([]);
      }
      
      // Add this task's time range to the assigned level
      levels[assignedLevel].push({ start: taskStart, end: taskEnd });
      
      // Store the level assignment
      taskLevels.push({
        task: task,
        level: assignedLevel,
        originalIndex: tasks.indexOf(task)
      });
    });
    
    return taskLevels;
  }

  // Render tasks on timeline and in list
  const taskLevels = calculateTaskLevels(plannerTasks, timelineStartMinutes, timelineWidth);
  
  taskLevels.forEach(({ task, level }) => {
    // Create timeline block
    const taskBlock = document.createElement('div');
    taskBlock.className = 'timeline-task';
    taskBlock.dataset.id = task.id;
    
    // Calculate position and width
    const startPos = ((getTimeInMinutes(task.startTime) - timelineStartMinutes) / timelineWidth) * 100;
    const taskWidth = (task.durationMinutes / timelineWidth) * 100;
    
    taskBlock.style.left = `${startPos}%`;
    taskBlock.style.width = `${taskWidth}%`;
    
    // Position vertically based on stack level
    const taskHeight = 25; // Height of each task block
    const stackSpacing = 2; // Space between stacked tasks
    const topOffset = 5; // Initial offset from top
    taskBlock.style.top = `${topOffset + level * (taskHeight + stackSpacing)}px`;
    
    // Check if task is in the past
    const taskDateParts = task.date.split('-');
    const taskDate = new Date(parseInt(taskDateParts[0]), parseInt(taskDateParts[1]) - 1, parseInt(taskDateParts[2]));
    const todayStr = formatDateForStorage(today);
    const taskDateStr = formatDateForStorage(taskDate);
    const isPastTask = taskDateStr < todayStr;
    
    // Add classes based on status
    if (task.completed) {
      taskBlock.classList.add('completed');
    } else {
      // Check if the task is current
      if (currentDate.toDateString() === today.toDateString()) {
        const taskStartMinutes = getTimeInMinutes(task.startTime);
        const taskEndMinutes = taskStartMinutes + Number(task.durationMinutes);
        
        if (currentMinutes >= taskStartMinutes && currentMinutes < taskEndMinutes) {
          taskBlock.classList.add('current');
        } else if (currentMinutes > taskEndMinutes && !task.completed) {
          taskBlock.classList.add('overdue');
        }
      }
    }
    
    // Add past task styling if applicable
    if (isPastTask) {
      taskBlock.classList.add('past-task');
    }
    
    // Add tooltip with task details
    const tooltipText = task.description ? 
      `${task.title}\n${task.startTime} - ${task.endTime} (${task.durationMinutes} min)\n\nDescription: ${task.description}` :
      `${task.title}\n${task.startTime} - ${task.endTime} (${task.durationMinutes} min)`;
    taskBlock.title = tooltipText;
    
    // Add click handler
    taskBlock.addEventListener('click', () => {
      openEditTaskModal(task);
    });
    
    plannerTimeline.appendChild(taskBlock);
  });

  // Render task list items (unchanged from original logic)
  plannerTasks.forEach(task => {
    // Check if task is in the past (calculate for each task in list)
    const taskDateParts = task.date.split('-');
    const taskDate = new Date(parseInt(taskDateParts[0]), parseInt(taskDateParts[1]) - 1, parseInt(taskDateParts[2]));
    const todayStr = formatDateForStorage(today);
    const taskDateStr = formatDateForStorage(taskDate);
    const isPastTask = taskDateStr < todayStr;
    
    // Create list item
    const taskItem = document.createElement('div');
    taskItem.className = 'planner-task';
    taskItem.dataset.id = task.id;
    
    // Add classes based on status
    if (task.completed) {
      taskItem.classList.add('completed');
    } else {
      // Check if the task is current
      if (currentDate.toDateString() === today.toDateString()) {
        const taskStartMinutes = getTimeInMinutes(task.startTime);
        const taskEndMinutes = taskStartMinutes + Number(task.durationMinutes);
        
        if (currentMinutes >= taskStartMinutes && currentMinutes < taskEndMinutes) {
          taskItem.classList.add('current');
        } else if (currentMinutes > taskEndMinutes && !task.completed) {
          taskItem.classList.add('overdue');
        }
      }
    }
    
    // Add past task styling if applicable
    if (isPastTask) {
      taskItem.classList.add('past-task');
    }
    
    // Create task details - hide action buttons for past tasks
    const actionsHtml = isPastTask ? '' : `
      <div class="task-actions">
        <button class="task-action-btn task-edit-btn" title="Edit">
          <i class="fas fa-edit"></i>
        </button>
        <button class="task-action-btn task-toggle-btn" title="${task.completed ? 'Mark Incomplete' : 'Mark Complete'}">
          <i class="fas fa-${task.completed ? 'undo' : 'check'}"></i>
        </button>
      </div>
    `;
    
    taskItem.innerHTML = `
      <div class="task-details">
        <div class="task-title">${task.title}</div>
        <div class="task-time">
          <span>${task.startTime} - ${task.endTime}</span>
          ${task.description ? `<span class="task-description-indicator"> • Notes</span>` : ''}
          ${isPastTask ? `<span class="past-indicator"> • Past</span>` : ''}
        </div>
      </div>
      ${actionsHtml}
    `;
    
    // Add tooltip to task list item (define tooltipText here)
    const tooltipText = task.description ? 
      `${task.title}\n${task.startTime} - ${task.endTime} (${task.durationMinutes} min)\n\nDescription: ${task.description}` :
      `${task.title}\n${task.startTime} - ${task.endTime} (${task.durationMinutes} min)`;
    taskItem.title = tooltipText;
    
    // Add event listeners only for non-past tasks
    if (!isPastTask) {
      const editBtn = taskItem.querySelector('.task-edit-btn');
      if (editBtn) {
        editBtn.addEventListener('click', () => {
          openEditTaskModal(task);
        });
      }
      
      const toggleBtn = taskItem.querySelector('.task-toggle-btn');
      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
          toggleTaskCompletion(task);
        });
      }
      
      // Add click handler for the entire task item
      taskItem.addEventListener('click', (e) => {
        // Only trigger if not clicking a button
        if (!e.target.closest('.task-action-btn')) {
          openEditTaskModal(task);
        }
      });
    } else {
      // For past tasks, remove pointer cursor and don't add click handlers
      taskItem.style.cursor = 'default';
    }
    
    plannerTaskList.appendChild(taskItem);
  });
  
  // Add time markers to the main planner timeline container (not the timeline-container)
  if (plannerTimelineContainer) {
    plannerTimelineContainer.appendChild(timeMarkersContainer);
  }

  // Scroll to first unfinished task after rendering
  scrollToFirstUnfinishedTask();
}

// Helper function to scroll to the first unfinished task
function scrollToFirstUnfinishedTask() {
  // Find the first task that is not completed
  const firstUnfinishedTask = Array.from(plannerTaskList.children).find(taskItem => {
    return !taskItem.classList.contains('completed') && !taskItem.classList.contains('past-task');
  });

  if (firstUnfinishedTask) {
    // Calculate the scroll position within the task list container
    const scrollTop = firstUnfinishedTask.offsetTop - plannerTaskList.offsetTop;
    
    // Smooth scroll within the task list container only
    plannerTaskList.scrollTo({
      top: scrollTop,
      behavior: 'smooth'
    });
  } else {
    // If all tasks are completed or in the past, scroll to the top of the task list
    plannerTaskList.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
}

// Toggle task completion status
async function toggleTaskCompletion(task) {
  try {
    // Get all tasks
    const allTasks = await storageService.getJSON(STORAGE_KEYS.PLANNER_TASKS, []);
    
    // Find and update the task
    const taskIndex = allTasks.findIndex(t => t.id === task.id);
    if (taskIndex !== -1) {
      allTasks[taskIndex].completed = !allTasks[taskIndex].completed;
      
      // Save to storage
      await storageService.setJSON(STORAGE_KEYS.PLANNER_TASKS, allTasks);
      
      // Update the local task
      task.completed = allTasks[taskIndex].completed;
      
      // Re-render
      renderTasks();
      updatePlannerStatus();
    }
  } catch (error) {
    console.error('Error toggling task completion:', error);
  }
}

// Update planner status (on track, behind, ahead)
function updatePlannerStatus() {
  if (!plannerStatusIcon || !plannerStatusText) return;
  
  // Only show status for today
  const today = new Date();
  if (currentDate.toDateString() !== today.toDateString() || plannerTasks.length === 0) {
    plannerStatusIcon.innerHTML = '<i class="fas fa-circle"></i>';
    plannerStatusIcon.style.color = 'var(--text-secondary)';
    plannerStatusText.textContent = 'No active plan';
    return;
  }
  
  // Count completed tasks
  const completedTasks = plannerTasks.filter(task => task.completed).length;
  
  // Count overdue tasks
  const currentMinutes = today.getHours() * 60 + today.getMinutes();
  const overdueTasks = plannerTasks.filter(task => {
    const taskEndMinutes = getTimeInMinutes(task.startTime) + Number(task.durationMinutes);
    return currentMinutes > taskEndMinutes && !task.completed;
  }).length;
  
  // Calculate expected completed tasks based on current time
  let expectedCompleted = 0;
  plannerTasks.forEach(task => {
    const taskEndMinutes = getTimeInMinutes(task.startTime) + Number(task.durationMinutes);
    if (currentMinutes > taskEndMinutes) {
      expectedCompleted++;
    }
  });
  
  // Determine status
  if (overdueTasks > 0) {
    plannerStatusIcon.innerHTML = '<i class="fas fa-circle"></i>';
    plannerStatusIcon.classList.add('behind');
    plannerStatusText.textContent = `Behind (${overdueTasks} overdue)`;
  } else if (completedTasks > expectedCompleted) {
    plannerStatusIcon.innerHTML = '<i class="fas fa-circle"></i>';
    plannerStatusIcon.classList.add('ahead');
    plannerStatusText.textContent = 'Ahead of schedule';
  } else {
    plannerStatusIcon.innerHTML = '<i class="fas fa-circle"></i>';
    plannerStatusIcon.classList.add('on-track');
    plannerStatusText.textContent = 'On track';
  }
}

// Start real-time clock
function startClock() {
  // Clear any existing interval
  if (clockInterval) {
    clearInterval(clockInterval);
  }
  
  // Update immediately
  updateClock();
  
  // Update every minute
  clockInterval = setInterval(updateClock, 60000);
}

// Update the clock and timeline now indicator
function updateClock() {
  if (!plannerCurrentTime) return;
  
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  
  // Update current time display
  plannerCurrentTime.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  
  // Update timeline and task status
  renderTasks();
  updatePlannerStatus();
}

// Function to show general time markers when no tasks are present
function showGeneralTimeMarkers(plannerTimelineContainer) {
  if (!plannerTimelineContainer) return;
  
  // Create time markers container
  const timeMarkersContainer = document.createElement('div');
  timeMarkersContainer.className = 'timeline-time-markers';
  
  // Show a general 12-hour timeline (6 AM to 10 PM)
  const startHour = 6;  // 6 AM
  const endHour = 22;   // 10 PM
  
  // Calculate total width for positioning
  const totalHours = endHour - startHour;
  
  for (let hour = startHour; hour <= endHour; hour += 2) { // Every 2 hours
    const position = ((hour - startHour) / totalHours) * 100;
    
    const marker = document.createElement('div');
    marker.className = 'timeline-time-marker general-marker';
    marker.style.left = `${position}%`;
    
    // Format hour display (12-hour format with AM/PM)
    let displayHour = hour;
    let ampm = 'AM';
    
    if (hour === 0) {
      displayHour = 12;
      ampm = 'AM';
    } else if (hour < 12) {
      ampm = 'AM';
    } else if (hour === 12) {
      ampm = 'PM';
    } else {
      displayHour = hour - 12;
      ampm = 'PM';
    }
    
    marker.textContent = `${displayHour}${ampm}`;
    timeMarkersContainer.appendChild(marker);
  }
  
  // Position the now indicator for today
  const now = new Date();
  const today = new Date();
  
  if (currentDate.toDateString() === today.toDateString() && timelineNowIndicator) {
    const currentHour = now.getHours() + (now.getMinutes() / 60);
    
    // Only show indicator if current time is within our general timeline range
    if (currentHour >= startHour && currentHour <= endHour) {
      const position = ((currentHour - startHour) / totalHours) * 100;
      timelineNowIndicator.style.left = `${position}%`;
      timelineNowIndicator.style.display = 'block';
    } else {
      timelineNowIndicator.style.display = 'none';
    }
  } else if (timelineNowIndicator) {
    timelineNowIndicator.style.display = 'none';
  }
  
  // Add placeholder text in the timeline area
  const placeholderText = document.createElement('div');
  placeholderText.className = 'timeline-placeholder';
  placeholderText.innerHTML = `
    <div class="timeline-placeholder-content">
      <span class="placeholder-icon">📅</span>
      <span class="placeholder-text">Click "Add Block" to schedule your first task</span>
    </div>
  `;
  
  plannerTimeline.appendChild(placeholderText);
  plannerTimelineContainer.appendChild(timeMarkersContainer);
}