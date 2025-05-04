// Goal management for the Flow State app
import { getCurrentProject, saveProjectGoal } from './projects.js';
import storageService from './storage.js';

// Goal container element
let container;

// Initialize goals functionality
export function initGoals() {
  container = document.getElementById('goalContainer');
  
  // Load existing goal for current project
  loadGoal();
}

// Load goal from current project
export async function loadGoal() {
  try {
    const currentProject = await getCurrentProject();
    if (currentProject && currentProject.goal) {
      renderGoalDisplay(currentProject.goal);
    } else {
      renderGoalEditor('');
    }
  } catch (error) {
    console.error('Error loading goal:', error);
    renderGoalEditor(''); // Fallback to empty editor
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
async function saveAndDisplay() { 
  const val = document.getElementById('goalInput').value; 
  try {
    await saveProjectGoal(val);
    renderGoalDisplay(val);
  } catch (error) {
    console.error('Error saving goal:', error);
    alert('There was an error saving your goal. Please try again.');
  }
}

// Get current goal
export async function getCurrentGoal() {
  try {
    const currentProject = await getCurrentProject();
    return currentProject ? currentProject.goal : '';
  } catch (error) {
    console.error('Error getting current goal:', error);
    return '';
  }
}

// For legacy compatibility - migrate old goal to project system
export async function migrateGoalToProject() {
  try {
    const oldGoal = await storageService.getItem('flowGoal');
    if (oldGoal) {
      await saveProjectGoal(oldGoal);
      await storageService.removeItem('flowGoal');
    }
  } catch (error) {
    console.error('Error migrating goal to project system:', error);
  }
}