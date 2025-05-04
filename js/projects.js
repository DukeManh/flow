// Project management for the Flow State app
import storageService from './storage.js';

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
    todos: []
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
            `Are you sure you want to delete permanently "${project.name}"?\n\nThis will also permanently delete its goals and tasks.`
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