// Goal management for the Flow State app

// Goal container element
let container;

// Initialize goals functionality
export function initGoals() {
  container = document.getElementById('goalContainer');
  
  // Load existing goal or show editor
  const savedGoal = localStorage.getItem('flowGoal');
  if (savedGoal) {
    renderGoalDisplay();
  } else {
    renderGoalEditor();
  }
}

// Render goal editor UI
function renderGoalEditor() {
  container.innerHTML = '<textarea id="goalInput" placeholder="Enter your focus…"></textarea><button id="saveGoalBtn">Save</button>';
  document.getElementById('goalInput').value = localStorage.getItem('flowGoal') || '';
  document.getElementById('saveGoalBtn').addEventListener('click', saveAndDisplay);
}

// Render goal display UI
function renderGoalDisplay() {
  const goal = localStorage.getItem('flowGoal') || '';
  container.innerHTML = `<p id="flowGoal">${goal}</p><button id="editGoalBtn">Edit</button>`;
  document.getElementById('editGoalBtn').addEventListener('click', renderGoalEditor);
}

// Save goal and switch to display mode
function saveAndDisplay() { 
  const val = document.getElementById('goalInput').value; 
  localStorage.setItem('flowGoal', val); 
  renderGoalDisplay(); 
}

// Get current goal
export function getCurrentGoal() {
  return localStorage.getItem('flowGoal') || '';
}