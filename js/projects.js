// Project management for the Flow State app

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
  const projects = getProjects();
  if (projects.length === 0) {
    // Create a default project
    createProject('Default Project', "#5D8AA8");
  }
  
  // Load current project or set to the first one
  loadCurrentProject();
  
  // Render project selectors
  renderProjectSelector();
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
  projectModal.style.display = 'block';
  modalProjectName.focus();
}

// Close the project modal
function closeProjectModal() {
  projectModal.style.display = 'none';
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
    createProject(name, selectedColor);
    renderProjectSelector();
    closeProjectModal();
  } else {
    // Alert the user to enter a name
    alert('Please enter a project name.');
    modalProjectName.focus();
  }
}

// Create a new project
export function createProject(name, color = "#5D8AA8") {
  const projects = getProjects();
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
  saveProjects(projects);
  setCurrentProject(id);
  
  return id;
}

// Get all projects
export function getProjects() {
  return JSON.parse(localStorage.getItem('flowProjects') || '[]');
}

// Save all projects
function saveProjects(projects) {
  localStorage.setItem('flowProjects', JSON.stringify(projects));
}

// Get current project
export function getCurrentProject() {
  const projects = getProjects();
  const currentId = localStorage.getItem('currentProjectId');
  
  // Try to find the current project
  if (currentId) {
    const project = projects.find(p => p.id === currentId);
    if (project) return project;
  }
  
  // Fallback to first project or create default
  if (projects.length > 0) {
    setCurrentProject(projects[0].id);
    return projects[0];
  }
  
  // If no projects exist, create a default one
  const defaultId = createProject('Default Project');
  return getProjects().find(p => p.id === defaultId);
}

// Set current project
export function setCurrentProject(id) {
  const projects = getProjects();
  const project = projects.find(p => p.id === id);
  
  if (project) {
    localStorage.setItem('currentProjectId', id);
    currentProjectId = id;
    
    // Update UI displays
    if (projectSelector) {
      projectSelector.value = id;
    }
    
    updateProjectDisplay(project);
    
    return true;
  }
  
  return false;
}

// Save project goal
export function saveProjectGoal(goal) {
  const projects = getProjects();
  const currentProject = getCurrentProject();
  
  if (currentProject) {
    const index = projects.findIndex(p => p.id === currentProject.id);
    if (index !== -1) {
      projects[index].goal = goal;
      saveProjects(projects);
    }
  }
}

// Save project todos
export function saveProjectTodos(todos) {
  const projects = getProjects();
  const currentProject = getCurrentProject();
  
  if (currentProject) {
    const index = projects.findIndex(p => p.id === currentProject.id);
    if (index !== -1) {
      projects[index].todos = todos;
      saveProjects(projects);
    }
  }
}

// Delete a project
export function deleteProject(id) {
  let projects = getProjects();
  
  // Don't delete if it's the only project
  if (projects.length <= 1) {
    return false;
  }
  
  // Filter out the project to delete
  projects = projects.filter(p => p.id !== id);
  saveProjects(projects);
  
  // Update current project if we deleted the current one
  if (localStorage.getItem('currentProjectId') === id) {
    setCurrentProject(projects[0].id);
  }
  
  return true;
}

// Load current project
function loadCurrentProject() {
  const currentProject = getCurrentProject();
  if (currentProject) {
    currentProjectId = currentProject.id;
    updateProjectDisplay(currentProject);
  }
}

// Render the project selector dropdown
export function renderProjectSelector() {
  // Render the old selector (kept for compatibility)
  if (projectSelector) {
    // Clear selector
    projectSelector.innerHTML = '';
    
    // Add all projects as options
    const projects = getProjects();
    projects.forEach(project => {
      const option = document.createElement('option');
      option.value = project.id;
      option.dataset.color = project.color || '#5D8AA8';
      option.textContent = project.name;
      projectSelector.appendChild(option);
    });
    
    // Set current selection
    projectSelector.value = localStorage.getItem('currentProjectId');
    
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
      projectSelector.addEventListener('change', () => {
        // Only allow switching if not in active session
        if (isTimerRunning()) {
          alert('Cannot switch projects during an active focus session.');
          projectSelector.value = localStorage.getItem('currentProjectId');
          return;
        }
        
        setCurrentProject(projectSelector.value);
        
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
    
    // Get current project
    const currentId = localStorage.getItem('currentProjectId');
    
    // Add all projects as options
    const projects = getProjects();
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
      
      // Add to option
      option.appendChild(colorDot);
      option.appendChild(nameSpan);
      
      // Add click handler
      option.addEventListener('click', () => {
        // Only allow switching if not in active session
        if (isTimerRunning()) {
          alert('Cannot switch projects during an active focus session.');
          return;
        }
        
        setCurrentProject(project.id);
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
}

// Check if timer is running
export function isTimerRunning() {
  const timerState = localStorage.getItem('timerState');
  if (!timerState) return false;
  
  return JSON.parse(timerState).isRunning;
}

// Get project stats for productivity chart
export function getProjectStats() {
  const history = JSON.parse(localStorage.getItem('sessionHistory') || '[]');
  const projects = getProjects();
  
  // Create a map of project IDs to their names and colors
  const projectNames = {};
  const projectColors = {};
  
  projects.forEach(project => {
    projectNames[project.id] = project.name;
    projectColors[project.id] = project.color || '#5D8AA8';
  });
  
  // Add default project name for older sessions without projectId
  projectNames['default'] = 'Unassigned';
  projectColors['default'] = 'var(--accent)';
  
  return { history, projectNames, projectColors };
}