// Goal management for the Flow State app
import { getCurrentProject, saveProjectGoal } from './projects.js';

// Goal container element
let container;

// Initialize goals functionality
export function initGoals() {
  container = document.getElementById('goalContainer');
  
  // Load existing goal for current project
  loadGoal();
}

// Load goal from current project
export function loadGoal() {
  const currentProject = getCurrentProject();
  if (currentProject && currentProject.goal) {
    renderGoalDisplay(currentProject.goal);
  } else {
    renderGoalEditor('');
  }
}

// Render goal editor UI
function renderGoalEditor(initialValue = '') {
  container.innerHTML = '<textarea id="goalInput" placeholder="Enter your focus…"></textarea><button id="saveGoalBtn">Save</button>';
  document.getElementById('goalInput').value = initialValue;
  document.getElementById('saveGoalBtn').addEventListener('click', saveAndDisplay);
}

// Render goal display UI
function renderGoalDisplay(goal) {
  container.innerHTML = `<p id="flowGoal">${goal}</p><button id="editGoalBtn">Edit</button>`;
  document.getElementById('editGoalBtn').addEventListener('click', () => renderGoalEditor(goal));
}

// Save goal and switch to display mode
function saveAndDisplay() { 
  const val = document.getElementById('goalInput').value; 
  saveProjectGoal(val);
  renderGoalDisplay(val); 
}

// Get current goal
export function getCurrentGoal() {
  const currentProject = getCurrentProject();
  return currentProject ? currentProject.goal : '';
}

// For legacy compatibility - migrate old goal to project system
export function migrateGoalToProject() {
  const oldGoal = localStorage.getItem('flowGoal');
  if (oldGoal) {
    saveProjectGoal(oldGoal);
    localStorage.removeItem('flowGoal');
  }
}