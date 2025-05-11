// Project management for the Flow State app
import storageService from './storage.js';
import { updateDailyTargetDisplay } from './timer.js';

// Storage keys
const STORAGE_KEYS = {
  PROJECTS: 'flowProjects',
  CURRENT_PROJECT_ID: 'currentProjectId',
  TIMER_STATE: 'timerState',
  SESSION_HISTORY: 'sessionHistory'
};

// Project data structure and state
let currentProjectId = null;
let projectCard;
let projectSelector;
let projectDropdown;
let projectDropdownBtn;
let projectDropdownContent;
let currentProjectName;
let projectColorDot;
let newProjectBtn;
let projectNameInput;
let projectFormContainer;
let selectedColor = "#5D8AA8"; // Default color
let projectModal;
let modalProjectName;
let modalSaveProjectBtn;
let closeModalBtn;
let colorOptions;
let modalColorOptions;

// Project colors with nicer shades that work well with themes
const PROJECT_COLORS = [
  "#5D8AA8", // Air Force Blue
  "#E15D44", // Burnt Sienna
  "#50C878", // Emerald
  "#9966CC", // Amethyst
  "#F08080", // Light Coral
  "#F4A460", // Sandy Brown
  "#4682B4", // Steel Blue
  "#6B8E23"  // Olive Drab
];

// Storage utility functions
async function getProjectsFromStorage() {
  try {
    return await storageService.getJSON(STORAGE_KEYS.PROJECTS, []);
  } catch (error) {
    console.error('Error getting projects from storage:', error);
    return [];
  }
}

async function saveProjectsToStorage(projects) {
  try {
    await storageService.setJSON(STORAGE_KEYS.PROJECTS, projects);
    return true;
  } catch (error) {
    console.error('Error saving projects to storage:', error);
    return false;
  }
}

async function getCurrentProjectIdFromStorage() {
  try {
    return await storageService.getItem(STORAGE_KEYS.CURRENT_PROJECT_ID);
  } catch (error) {
    console.error('Error getting current project ID from storage:', error);
    return null;
  }
}

async function saveCurrentProjectIdToStorage(id) {
  try {
    await storageService.setItem(STORAGE_KEYS.CURRENT_PROJECT_ID, id);
    return true;
  } catch (error) {
    console.error('Error saving current project ID to storage:', error);
    return false;
  }
}

async function getTimerStateFromStorage() {
  try {
    return await storageService.getJSON(STORAGE_KEYS.TIMER_STATE);
  } catch (error) {
    console.error('Error getting timer state from storage:', error);
    return null;
  }
}

async function getSessionHistoryFromStorage() {
  try {
    return await storageService.getJSON(STORAGE_KEYS.SESSION_HISTORY, []);
  } catch (error) {
    console.error('Error getting session history from storage:', error);
    return [];
  }
}

// Initialize projects functionality
export function initProjects() {
  // Get DOM elements
  projectCard = document.getElementById('projectCard');
  projectSelector = document.getElementById('projectSelector');
  projectDropdown = document.querySelector('.project-dropdown');
  projectDropdownBtn = document.getElementById('projectDropdownBtn');
  projectDropdownContent = document.getElementById('projectDropdownContent');
  currentProjectName = document.querySelector('.current-project-name');
  projectColorDot = document.querySelector('.project-color-dot');
  newProjectBtn = document.getElementById('newProjectBtn');
  projectNameInput = document.getElementById('projectNameInput');
  projectFormContainer = document.getElementById('projectFormContainer');
  projectModal = document.getElementById('projectModal');
  modalProjectName = document.getElementById('modalProjectName');
  modalSaveProjectBtn = document.getElementById('modalSaveProjectBtn');
  closeModalBtn = document.querySelector('.close-modal');
  colorOptions = document.querySelectorAll('.color-option');
  modalColorOptions = document.querySelectorAll('.modal-color-options .color-option');
  
  // Set up event listeners
  if (newProjectBtn) {
    newProjectBtn.addEventListener('click', openProjectModal);
  }
  
  // Setup dropdown toggle
  if (projectDropdownBtn) {
    projectDropdownBtn.addEventListener('click', toggleProjectDropdown);
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!projectDropdown.contains(e.target)) {
        projectDropdown.classList.remove('active');
      }
    });
  }
  
  // Setup modal close button
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeProjectModal);
  }

  // Setup color options in the modal
  modalColorOptions.forEach(option => {
    option.addEventListener('click', () => {
      selectColor(option);
    });
  });

  // Setup save button in the modal
  if (modalSaveProjectBtn) {
    modalSaveProjectBtn.addEventListener('click', createProjectFromModal);
  }

  // Close modal on outside click
  window.addEventListener('click', (e) => {
    if (e.target === projectModal) {
      closeProjectModal();
    }
  });
  
  // Create target focus time and check-in section
  createTargetAndCheckInSection();
  
  // Initialize projects if none exist
  getProjects().then(projects => {
    if (projects.length === 0) {
      // Create a default project
      createProject('Default Project', "#5D8AA8");
    }
  
    // Load current project or set to the first one
    loadCurrentProject();
  
    // Render project selectors
    renderProjectSelector();
  });
}

// Toggle project dropdown visibility
function toggleProjectDropdown(e) {
  e.stopPropagation();
  projectDropdown.classList.toggle('active');
}

// Update the selected project in the dropdown display
function updateProjectDisplay(project) {
  if (!currentProjectName || !projectColorDot) return;
  
  currentProjectName.textContent = project.name;
  projectColorDot.style.backgroundColor = project.color || "#5D8AA8";
}

// Open the project modal
function openProjectModal() {
  // Reset modal values
  modalProjectName.value = '';
  selectedColor = PROJECT_COLORS[0];
  
  // Reset color selections
  modalColorOptions.forEach(option => {
    option.classList.remove('selected');
    if (option.dataset.color === selectedColor) {
      option.classList.add('selected');
    }
  });
  
  // Show modal
  projectModal.classList.add('active');
  projectModal.style.display = 'flex';
  
  // Prevent background scrolling
  document.body.style.overflow = 'hidden';
  
  // Focus on the input field
  setTimeout(() => modalProjectName.focus(), 100);
}

// Close the project modal
function closeProjectModal() {
  projectModal.classList.remove('active');
  projectModal.style.display = 'none';
  
  // Restore background scrolling
  document.body.style.overflow = '';
}

// Select a color from the color options
function selectColor(colorOption) {
  // Remove selected class from all options
  modalColorOptions.forEach(option => {
    option.classList.remove('selected');
  });
  
  // Add selected class to the clicked option
  colorOption.classList.add('selected');
  
  // Save the selected color value
  selectedColor = colorOption.dataset.color;
}

// Create a project from the modal
function createProjectFromModal() {
  const name = modalProjectName.value.trim();
  if (name) {
    createProject(name, selectedColor).then((id) => {
      renderProjectSelector();
      closeProjectModal();
      
      // Reload goals and todos for the newly created project
      if (window.reloadProjectData) {
        window.reloadProjectData();
      }
    });
  } else {
    // Alert the user to enter a name
    alert('Please enter a project name.');
    modalProjectName.focus();
  }
}

// Create a new project
export async function createProject(name, color = "#5D8AA8") {
  const projects = await getProjects();
  const id = 'project_' + Date.now();
  
  const newProject = {
    id,
    name,
    color,
    createdAt: Date.now(),
    goal: '',
    todos: [],
    // New properties for target focus time and check-ins
    targetFocusTime: 0, // Daily target in minutes
    checkIns: [],       // Array of daily check-in objects
    streak: 0,          // Consecutive days meeting target
    lastCheckIn: null   // Timestamp of last check-in
  };
  
  projects.push(newProject);
  await saveProjects(projects);
  await setCurrentProject(id);
  
  return id;
}

// Get all projects
export async function getProjects() {
  return await getProjectsFromStorage();
}

// Save all projects
async function saveProjects(projects) {
  return await saveProjectsToStorage(projects);
}

// Get current project
export async function getCurrentProject() {
  const projects = await getProjects();
  
  try {
    const currentId = await getCurrentProjectIdFromStorage();
    
    // Try to find the current project
    if (currentId) {
      const project = projects.find(p => p.id === currentId);
      if (project) return project;
    }
    
    // Fallback to first project if one exists
    if (projects.length > 0) {
      await setCurrentProject(projects[0].id);
      return projects[0];
    }
    
    // If no projects exist at all, create a default one
    // But first check if any projects got created in the meantime
    const refreshedProjects = await getProjects();
    if (refreshedProjects.length > 0) {
      await setCurrentProject(refreshedProjects[0].id);
      return refreshedProjects[0];
    }
    
    // Create a default project as last resort
    console.log('No projects found, creating default project');
    const defaultId = await createProject('Default Project');
    const updatedProjects = await getProjects();
    return updatedProjects.find(p => p.id === defaultId);
  } catch (error) {
    console.error('Error getting current project:', error);
    
    // Fallback to first project if available
    if (projects.length > 0) {
      return projects[0];
    }
    
    // Last resort fallback
    return {
      id: 'default',
      name: 'Default Project',
      color: "#5D8AA8",
      createdAt: Date.now(),
      goal: '',
      todos: []
    };
  }
}

// Set current project
export async function setCurrentProject(id) {
  const projects = await getProjects();
  const project = projects.find(p => p.id === id);
  
  if (project) {
    const success = await saveCurrentProjectIdToStorage(id);
    if (success) {
      currentProjectId = id;
      
      // Update UI displays
      if (projectSelector) {
        projectSelector.value = id;
      }
      
      updateProjectDisplay(project);
      
      return true;
    }
  }
  
  return false;
}

// Save project goal
export async function saveProjectGoal(goal) {
  const projects = await getProjects();
  const currentProject = await getCurrentProject();
  
  if (currentProject) {
    const index = projects.findIndex(p => p.id === currentProject.id);
    if (index !== -1) {
      projects[index].goal = goal;
      return await saveProjects(projects);
    }
  }
  return false;
}

// Save project todos
export async function saveProjectTodos(todos) {
  const projects = await getProjects();
  const currentProject = await getCurrentProject();
  
  if (currentProject) {
    const index = projects.findIndex(p => p.id === currentProject.id);
    if (index !== -1) {
      projects[index].todos = todos;
      return await saveProjects(projects);
    }
  }
  return false;
}

// Delete a project
export async function deleteProject(id) {
  let projects = await getProjects();
  
  // Don't delete if it's the only project
  if (projects.length <= 1) {
    return false;
  }
  
  // Get the project to delete before removing it
  const projectToDelete = projects.find(p => p.id === id);
  
  // Filter out the project to delete
  projects = projects.filter(p => p.id !== id);
  const saveSuccess = await saveProjects(projects);
  
  if (saveSuccess) {
    // Update current project if we deleted the current one
    const currentId = await getCurrentProjectIdFromStorage();
    if (currentId === id) {
      await setCurrentProject(projects[0].id);
    }
    
    return true;
  }
  
  return false;
}

// Load current project
async function loadCurrentProject() {
  const currentProject = await getCurrentProject();
  if (currentProject) {
    currentProjectId = currentProject.id;
    updateProjectDisplay(currentProject);
  }
}

// Render the project selector dropdown
export async function renderProjectSelector() {
  try {
    // Get all projects and current project ID
    const projects = await getProjects();
    const currentId = await getCurrentProjectIdFromStorage();
    
    // Render the old selector (kept for compatibility)
    if (projectSelector) {
      // Clear selector
      projectSelector.innerHTML = '';
      
      // Add all projects as options
      projects.forEach(project => {
        const option = document.createElement('option');
        option.value = project.id;
        option.dataset.color = project.color || '#5D8AA8';
        option.textContent = project.name;
        projectSelector.appendChild(option);
      });
      
      // Set current selection
      projectSelector.value = currentId;
      
      // Apply color indicators to options
      Array.from(projectSelector.options).forEach(option => {
        const color = option.dataset.color;
        if (color) {
          option.style.background = `linear-gradient(to right, ${color} 0%, ${color} 5px, transparent 5px, transparent 100%)`;
          option.style.paddingLeft = '15px';
        }
      });
      
      // Add change handler if not already added
      if (!projectSelector.hasChangeListener) {
        projectSelector.addEventListener('change', async () => {
          // Only allow switching if not in active session
          if (await isTimerRunning()) {
            alert('Cannot switch projects during an active focus session.');
            projectSelector.value = await getCurrentProjectIdFromStorage();
            return;
          }
          
          await setCurrentProject(projectSelector.value);
          
          // Reload goals and todos
          if (window.reloadProjectData) {
            window.reloadProjectData();
          }
        });
        
        projectSelector.hasChangeListener = true;
      }
    }
    
    // Render the new theme-style dropdown
    if (projectDropdownContent) {
      // Clear content
      projectDropdownContent.innerHTML = '';
      
      // Add all projects as options
      projects.forEach(project => {
        const option = document.createElement('div');
        option.className = 'project-option';
        if (project.id === currentId) {
          option.classList.add('active');
        }
        
        // Create color dot
        const colorDot = document.createElement('span');
        colorDot.className = 'project-color-dot';
        colorDot.style.backgroundColor = project.color || '#5D8AA8';
        
        // Create name span
        const nameSpan = document.createElement('span');
        nameSpan.textContent = project.name;
        
        // Create wrapper for name and dot
        const nameWrapper = document.createElement('div');
        nameWrapper.className = 'project-name-wrapper';
        nameWrapper.appendChild(colorDot);
        nameWrapper.appendChild(nameSpan);
        
        // Create delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'project-delete-btn';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.title = 'Delete project';
        
        // Add delete handler with confirmation
        deleteBtn.addEventListener('click', async (e) => {
          e.stopPropagation(); // Prevent triggering the parent click handler
          
          // Don't allow deleting the last project
          if (projects.length <= 1) {
            alert('Cannot delete the only project. Create another project first.');
            return;
          }
          
          // Don't allow deleting during an active session
          if (await isTimerRunning()) {
            alert('Cannot delete a project during an active focus session.');
            return;
          }
          
          // Show confirmation dialog
          const isConfirmed = confirm(
            `Are you sure to permanently delete "${project.name}"?\n\nThis will also permanently delete its goals and tasks.`
          );
          
          if (isConfirmed) {
            const success = await deleteProject(project.id);
            if (success) {
              // Re-render the selector
              renderProjectSelector();
              
              // Reload goals and todos
              if (window.reloadProjectData) {
                window.reloadProjectData();
              }
            } else {
              alert('Failed to delete project. Please try again.');
            }
          }
        });
        
        // Add to option
        option.appendChild(nameWrapper);
        option.appendChild(deleteBtn);
        
        // Add click handler for selecting project
        option.addEventListener('click', async (e) => {
          // Don't trigger if the click was on the delete button
          if (e.target.closest('.project-delete-btn')) {
            return;
          }
          
          // Only allow switching if not in active session
          if (await isTimerRunning()) {
            alert('Cannot switch projects during an active focus session.');
            return;
          }
          
          await setCurrentProject(project.id);
          projectDropdown.classList.remove('active');
          
          // Update the old selector too
          if (projectSelector) {
            projectSelector.value = project.id;
          }
          
          // Reload goals and todos
          if (window.reloadProjectData) {
            window.reloadProjectData();
          }
        });
        
        projectDropdownContent.appendChild(option);
      });
      
      // Update the current selection display
      const currentProject = projects.find(p => p.id === currentId);
      if (currentProject) {
        updateProjectDisplay(currentProject);
      }
    }
  } catch (error) {
    console.error('Error rendering project selector:', error);
  }
}

// Check if timer is running
export async function isTimerRunning() {
  const timerState = await getTimerStateFromStorage();
  return timerState ? timerState.isRunning : false;
}

// Get project stats for productivity chart
export async function getProjectStats() {
  try {
    const history = await getSessionHistoryFromStorage();
    const projects = await getProjects();
    
    // Create a map of project IDs to their names and colors
    const projectNames = {};
    const projectColors = {};
    
    // Create a map of active project IDs for quick lookup
    const activeProjectIds = new Set(projects.map(p => p.id));
    
    // Add active projects
    projects.forEach(project => {
      projectNames[project.id] = project.name;
      projectColors[project.id] = project.color || '#5D8AA8';
    });
    
    // Find any projects in history that no longer exist in the active projects list
    const historyProjectIds = new Set();
    history.forEach(session => {
      if (session.projectId) {
        historyProjectIds.add(session.projectId);
      }
    });
    
    // For each project ID in history that's not in active projects,
    // create a generic deleted project entry with neutral color
    historyProjectIds.forEach(projectId => {
      if (!activeProjectIds.has(projectId) && projectId !== 'default') {
        // Use the project name from history if available, otherwise generic name
        const projectEntry = history.find(h => h.projectId === projectId);
        const projectName = projectEntry?.projectName || 'Unknown Project';
        
        projectNames[projectId] = projectName;
        projectColors[projectId] = '#888888'; // Neutral gray for deleted projects
      }
    });
    
    // Add default project name for older sessions without projectId
    projectNames['default'] = 'Unassigned';
    projectColors['default'] = 'var(--accent)';
    
    return { history, projectNames, projectColors, deletedProjects: historyProjectIds };
  } catch (error) {
    console.error('Error getting project stats:', error);
    return { history: [], projectNames: {}, projectColors: {}, deletedProjects: new Set() };
  }
}

// Clean up duplicate projects
export async function cleanupDuplicateProjects() {
  const projects = await getProjects();
  
  // Check if we have duplicate Default Projects
  const defaultProjects = projects.filter(p => p.name === 'Default Project');
  
  if (defaultProjects.length > 1) {
    console.log(`Found ${defaultProjects.length} Default Projects, cleaning up...`);
    
    // Keep only the oldest Default Project
    const sortedDefaults = [...defaultProjects].sort((a, b) => a.createdAt - b.createdAt);
    const keepProject = sortedDefaults[0];
    
    // Get the current project ID
    const currentId = await getCurrentProjectIdFromStorage();
    
    // Filter out duplicate default projects, keep the oldest one
    const cleanedProjects = projects.filter(p => 
      p.id === keepProject.id || p.name !== 'Default Project'
    );
    
    // Save the cleaned projects list
    await saveProjects(cleanedProjects);
    
    // If current project was one of the removed ones, set to the kept one
    if (defaultProjects.some(p => p.id === currentId && p.id !== keepProject.id)) {
      await setCurrentProject(keepProject.id);
    }
    
    // Re-render the project selector
    await renderProjectSelector();
    
    console.log(`Cleaned up duplicate Default Projects, keeping ${keepProject.id}`);
    return true;
  }
  
  return false;
}

// Set a daily target focus time for the current project
export async function setTargetFocusTime(minutes) {
  const projects = await getProjects();
  const currentProject = await getCurrentProject();
  
  if (currentProject) {
    const index = projects.findIndex(p => p.id === currentProject.id);
    if (index !== -1) {
      projects[index].targetFocusTime = minutes;
      return await saveProjects(projects);
    }
  }
  return false;
}

// Add a daily check-in for the current project
export async function addDailyCheckIn(reflectionText) {
  const projects = await getProjects();
  const currentProject = await getCurrentProject();
  
  if (!currentProject) return false;
  
  const index = projects.findIndex(p => p.id === currentProject.id);
  if (index === -1) return false;
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  
  // Get today's total focus time from history
  const { history } = await getProjectStats();
  const todayFocusTime = calculateTodayFocusTime(history, currentProject.id);
  
  // Check if target was met
  const targetMet = currentProject.targetFocusTime > 0 && 
                   todayFocusTime >= currentProject.targetFocusTime;
  
  // Update streak
  let streak = currentProject.streak || 0;
  
  // Check if last check-in was yesterday to maintain streak
  const lastDate = currentProject.lastCheckIn ? new Date(currentProject.lastCheckIn) : null;
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const isConsecutiveDay = lastDate && 
                          lastDate.getFullYear() === yesterday.getFullYear() &&
                          lastDate.getMonth() === yesterday.getMonth() &&
                          lastDate.getDate() === yesterday.getDate();
  
  if (targetMet) {
    // Increment streak only if this is a consecutive day or first check-in
    if (isConsecutiveDay || !lastDate) {
      streak++;
    }
  } else if (!isConsecutiveDay) {
    // Reset streak if target not met and not a consecutive day
    streak = 0;
  }
  
  // Create check-in object
  const checkIn = {
    date: today,
    focusTime: todayFocusTime,
    targetMet,
    reflection: reflectionText,
    streak
  };
  
  // Add to check-ins array (limited to last 30)
  if (!projects[index].checkIns) {
    projects[index].checkIns = [];
  }
  
  projects[index].checkIns.push(checkIn);
  
  // Limit to last 30 check-ins
  if (projects[index].checkIns.length > 30) {
    projects[index].checkIns = projects[index].checkIns.slice(-30);
  }
  
  // Update last check-in and streak
  projects[index].lastCheckIn = today;
  projects[index].streak = streak;
  
  return await saveProjects(projects);
}

// Add automatic check-in for the current project
export async function addAutomaticCheckIn(focusTime) {
  // Convert to seconds if needed (in case minutes are passed)
  const focusTimeInSeconds = focusTime > 100 ? focusTime : focusTime * 60;
  
  // Only register check-in if the focus time is at least 5 minutes (300 seconds)
  if (focusTimeInSeconds < 300) return false;
  
  const projects = await getProjects();
  const currentProject = await getCurrentProject();
  
  if (!currentProject) return false;
  
  const index = projects.findIndex(p => p.id === currentProject.id);
  if (index === -1) return false;
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  
  // Get today's total focus time from history
  const { history } = await getProjectStats();
  const todayFocusTime = calculateTodayFocusTime(history, currentProject.id);
  
  // Check if target was met
  const targetMet = currentProject.targetFocusTime > 0 && 
                   todayFocusTime >= currentProject.targetFocusTime;
  
  // Update streak
  let streak = currentProject.streak || 0;
  
  // Check if last check-in was yesterday to maintain streak
  const lastDate = currentProject.lastCheckIn ? new Date(currentProject.lastCheckIn) : null;
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const isConsecutiveDay = lastDate && 
                          lastDate.getFullYear() === yesterday.getFullYear() &&
                          lastDate.getMonth() === yesterday.getMonth() &&
                          lastDate.getDate() === yesterday.getDate();
  
  // For today's check-ins, always increment streak if target is met
  // This allows streaks to be updated in real-time during the day
  const isToday = lastDate && 
                  lastDate.getFullYear() === now.getFullYear() &&
                  lastDate.getMonth() === now.getMonth() &&
                  lastDate.getDate() === now.getDate();
  
  if (targetMet) {
    // Increment streak if this is first check-in, a consecutive day, or target was just met today
    if (!lastDate || isConsecutiveDay || (isToday && projects[index].streak === streak)) {
      streak++;
    }
  } else if (!isConsecutiveDay && !isToday) {
    // Reset streak if target not met and not a consecutive day or today
    streak = 0;
  }
  
  // Create auto check-in object
  const checkIn = {
    date: today,
    focusTime: todayFocusTime,
    targetMet,
    automatic: true,
    streak
  };
  
  // Add to check-ins array (limited to last 30)
  if (!projects[index].checkIns) {
    projects[index].checkIns = [];
  }
  
  // Check if we already have a check-in for today
  const todayCheckInIndex = projects[index].checkIns.findIndex(
    c => new Date(c.date).toDateString() === new Date(today).toDateString()
  );
  
  if (todayCheckInIndex >= 0) {
    // Update existing check-in for today
    projects[index].checkIns[todayCheckInIndex] = checkIn;
  } else {
    // Add new check-in
    projects[index].checkIns.push(checkIn);
    
    // Limit to last 30 check-ins
    if (projects[index].checkIns.length > 30) {
      projects[index].checkIns = projects[index].checkIns.slice(-30);
    }
  }
  
  // Update last check-in and streak
  projects[index].lastCheckIn = today;
  projects[index].streak = streak;
  
  const saveResult = await saveProjects(projects);
  
  // Update UI
  if (saveResult) {
    updateDailyTargetDisplay();
    updateStreakRecord();
  }
  
  return saveResult;
}

// Get check-ins for the current project
export async function getProjectCheckIns() {
  const currentProject = await getCurrentProject();
  return currentProject?.checkIns || [];
}

// Utility function to calculate today's focus time for a project
function calculateTodayFocusTime(history, projectId) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
  
  return history
    .filter(session => 
      session.projectId === projectId && 
      session.start >= startOfDay && 
      session.start <= endOfDay)
    .reduce((total, session) => total + session.duration, 0);
}

// Create the target focus time and check-in UI
function createTargetAndCheckInSection() {
  // Get the target settings container in the goal card
  const targetSettings = document.getElementById('targetSettings');
  if (!targetSettings) return;
  
  // Add event listeners for the target focus time editing
  const targetInput = document.getElementById('targetFocusInput');
  const saveTargetBtn = document.getElementById('saveTargetBtn');
  
  if (targetInput && saveTargetBtn) {
    // Set up save/edit button event listener
    if (!saveTargetBtn.hasEventListener) {
      saveTargetBtn.addEventListener('click', async () => {
        if (targetInput.disabled) {
          // Currently in display mode, switch to edit mode
          targetInput.disabled = false;
          saveTargetBtn.textContent = 'Save';
          targetInput.focus();
        } else {
          // Currently in edit mode, save the value and switch to display mode
          const value = parseInt(targetInput.value);
          if (isNaN(value) || value < 1) {
            alert('Please enter a valid target (minimum 1 minute)');
            return;
          }
          
          if (value > 480) {
            alert('Maximum target is 8 hours (480 minutes) per day');
            targetInput.value = 480;
            return;
          }
          
          // Get the current project name for the confirmation message
          const currentProject = await getCurrentProject();
          const projectName = currentProject?.name || 'current project';
          
          const success = await setTargetFocusTime(value);
          if (success) {
            // Switch back to display mode
            targetInput.disabled = true;
            saveTargetBtn.textContent = 'Edit';
            
            updateDailyTargetDisplay();
            updateStreakRecord();
          } else {
            alert('Failed to set target focus time. Please try again.');
          }
        }
      });
      saveTargetBtn.hasEventListener = true;
    }
  }
  
  // Get the check-in card for streak display only
  const checkInCard = document.getElementById('checkInCard');
  if (!checkInCard) return;
  
  // Create streak record section for the check-in card
  const streakRecord = document.getElementById('streakRecord');
  if (!streakRecord) {
    const newStreakRecord = document.createElement('div');
    newStreakRecord.className = 'streak-record';
    newStreakRecord.id = 'streakRecord';
    checkInCard.appendChild(newStreakRecord);
  }
  
  // Load current target and streak data
  loadProjectTargetAndCheckIns();
}

// Load target focus time and check-ins for the current project
async function loadProjectTargetAndCheckIns() {
  try {
    const currentProject = await getCurrentProject();
    
    // Update target input field
    const targetInput = document.getElementById('targetFocusInput');
    const saveTargetBtn = document.getElementById('saveTargetBtn');
    
    if (targetInput && currentProject) {
      // Set the value in the input field
      if (currentProject.targetFocusTime) {
        targetInput.value = currentProject.targetFocusTime;
        targetInput.placeholder = `${currentProject.targetFocusTime} minutes`;
      } else {
        targetInput.value = "";
        targetInput.placeholder = "No target set";
      }
      
      // Ensure input is disabled in display mode
      targetInput.disabled = true;
      
      // Set button text to "Edit"
      if (saveTargetBtn) {
        saveTargetBtn.textContent = 'Edit';
      }
    }
    
    // Update streak record display
    updateStreakRecord();
    
    // Update daily target indicator in timer
    updateDailyTargetDisplay();
  } catch (error) {
    console.error('Error loading target and check-ins:', error);
  }
}

// Update streak record display in check-in card
export async function updateStreakRecord() {
  try {
    const streakRecord = document.getElementById('streakRecord');
    if (!streakRecord) return;
    
    const currentProject = await getCurrentProject();
    if (!currentProject) return;
    
    // Find the highest streak ever achieved
    let highestStreak = currentProject.streak || 0;
    
    if (currentProject.checkIns && currentProject.checkIns.length > 0) {
      const maxStreakInCheckIns = Math.max(...currentProject.checkIns.map(c => c.streak || 0));
      highestStreak = Math.max(highestStreak, maxStreakInCheckIns);
    }
    
    // Get check-in history for the past 2 weeks to display in calendar
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    twoWeeksAgo.setHours(0, 0, 0, 0);
    
    // Get check-ins for the last 14 days
    const recentCheckIns = {};
    
    if (currentProject.checkIns) {
      currentProject.checkIns.forEach(checkIn => {
        const checkInDate = new Date(checkIn.date);
        // Create object with date as key and check-in as value
        recentCheckIns[checkInDate.toDateString()] = checkIn;
      });
    }
    
    // Calculate streak consistency - what percentage of the last 30 days hit target
    let daysWithCheckIns = 0;
    let daysWithTargetMet = 0;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);
    
    // Count days from 30 days ago until yesterday (not including today)
    for (let d = new Date(thirtyDaysAgo); d < now; d.setDate(d.getDate() + 1)) {
      const dateString = d.toDateString();
      if (recentCheckIns[dateString]) {
        daysWithCheckIns++;
        if (recentCheckIns[dateString].targetMet) {
          daysWithTargetMet++;
        }
      }
    }
    
    const consistency = daysWithCheckIns > 0 
      ? Math.round((daysWithTargetMet / 30) * 100) 
      : 0;
    
    // Get today's check-in if exists
    const todayCheckIn = recentCheckIns[now.toDateString()];
    const todayTargetMet = todayCheckIn?.targetMet || false;
    
    // Calculate next milestone
    const nextMilestone = highestStreak > 0 
      ? Math.ceil(highestStreak / 5) * 5 
      : 5;
    
    // Create last week's calendar with day labels
    let calendarHTML = '';
    const dayAbbreviations = ['M', 'T', 'W', 'T', 'F', 'S', 'S']; // Mon-Sun abbreviations
    
    for (let i = 6; i >= 0; i--) {
      const calDate = new Date();
      calDate.setDate(calDate.getDate() - i);
      const dateString = calDate.toDateString();
      const hasCheckIn = !!recentCheckIns[dateString];
      const targetMet = hasCheckIn && recentCheckIns[dateString].targetMet;
      const dayIndex = (calDate.getDay() + 6) % 7; // Convert to Mon-Sun (0-6)
      
      calendarHTML += `<div class="calendar-day ${targetMet ? 'target-met' : ''}" 
        title="${calDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}${
          targetMet ? ' - Target met' : (hasCheckIn ? ' - Target not met' : ' - No activity')
        }">${dayAbbreviations[dayIndex]}</div>`;
    }
    
    // Get today's focus progress
    const { history } = await getProjectStats();
    const todayFocusTime = calculateTodayFocusTime(history, currentProject.id);
    const targetProgress = currentProject.targetFocusTime > 0 
      ? Math.min(100, Math.round((todayFocusTime / currentProject.targetFocusTime) * 100)) 
      : 0;
    
    // Create streak message based on current streak
    let streakMessage = '';
    if (currentProject.streak === 0) {
      streakMessage = `Start your streak today by meeting your daily focus target!`;
    } else if (currentProject.streak === 1) {
      streakMessage = `Great start! You've met your focus target for 1 day.`;
    } else if (currentProject.streak <= 3) {
      streakMessage = `You're building momentum with a ${currentProject.streak}-day streak!`;
    } else if (currentProject.streak <= 7) {
      streakMessage = `Impressive! You've maintained your streak for a week!`;
    } else if (currentProject.streak <= 20) {
      streakMessage = `Amazing discipline! Keep your ${currentProject.streak}-day streak going!`;
    } else {
      streakMessage = `Extraordinary focus! Your ${currentProject.streak}-day streak shows incredible dedication!`;
    }
    
    // Format streak record display with enhanced UI
    streakRecord.innerHTML = `
      <div class="streak-record-container">
        <div class="current-streak">
          <h3>Current Streak</h3>
          <div class="streak-value">${currentProject.streak || 0}<span class="streak-flame">🔥</span></div>
          <div class="streak-label">consecutive days</div>
          ${currentProject.lastCheckIn ? 
            `<div class="streak-date">Last: ${new Date(currentProject.lastCheckIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>` : ''}
        </div>
        
        <div class="highest-streak">
          <h3>Record Streak</h3>
          <div class="streak-value">${highestStreak}<span class="streak-flame">🔥</span></div>
          <div class="streak-label">best run</div>
          <div class="streak-info">
            <i class="fas fa-trophy"></i> Next milestone: ${nextMilestone} days
          </div>
        </div>
        
        <div class="streak-stats">
          <h3>Today's Progress</h3>
          ${currentProject.targetFocusTime > 0 ? `
            <div class="streak-progress-container">
              <div class="streak-progress-bar" style="width: ${targetProgress}%"></div>
            </div>
            <div class="streak-label">
              ${todayFocusTime} of ${currentProject.targetFocusTime} minutes
              ${todayTargetMet ? '<p style="color: var(--accent)"> ✓ Target met!</p>' : ''}
            </div>
          ` : `
            <div class="streak-label" style="margin-top: 15px">No target set for this project</div>
          `}
          <div class="streak-calendar" title="Past 7 days">
            ${calendarHTML}
          </div>
        </div>
      </div>
      
      <div class="streak-message">
        ${streakMessage}
      </div>
      
      <div class="streak-additional-stats">
        <div class="stat-item">
          <div class="stat-value">${consistency}%</div>
          <div class="stat-label">Monthly Consistency</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${daysWithTargetMet}</div>
          <div class="stat-label">Days Target Met (30 days)</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${currentProject.checkIns?.length || 0}</div>
          <div class="stat-label">Total Check-ins</div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error updating streak record:', error);
  }
}