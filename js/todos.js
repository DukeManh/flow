// Todo list management for the Flow State app
import { getCurrentProject, saveProjectTodos } from './projects.js';
import storageService from './storage.js';

// Storage keys
const STORAGE_KEYS = {
  OLD_TODOS: 'flowTodos'
};

// Todo elements
let todoInput, addTodoBtn, todoList;
// Track dragged element and drop position
let draggedItem = null;

// Storage utility functions
async function getOldTodosFromStorage() {
  try {
    const oldTodosString = await storageService.getItem(STORAGE_KEYS.OLD_TODOS);
    if (!oldTodosString) return null;
    
    return JSON.parse(oldTodosString);
  } catch (error) {
    console.error('Error getting old todos from storage:', error);
    return null;
  }
}

async function removeOldTodosFromStorage() {
  try {
    await storageService.removeItem(STORAGE_KEYS.OLD_TODOS);
    return true;
  } catch (error) {
    console.error('Error removing old todos from storage:', error);
    return false;
  }
}

// Initialize todos functionality
export function initTodos() {
  todoInput = document.getElementById('todoInput');
  addTodoBtn = document.getElementById('addTodoBtn');
  todoList = document.getElementById('todoList');

  // Add event listeners
  addTodoBtn.addEventListener('click', async () => { 
    const text = todoInput.value.trim(); 
    if (!text) return; 
    todoList.append(createTodoItem(text)); 
    todoInput.value = ''; 
    todoInput.focus(); 
    await saveTodos(); 
  });
  
  todoInput.addEventListener('keypress', e => { 
    if (e.key === 'Enter') addTodoBtn.click(); 
  });

  // Initialize drag and drop container
  initDragAndDrop();

  // Load todos for current project
  loadTodos();
}

// Initialize drag and drop functionality for the todo list
function initDragAndDrop() {
  // Prevent default behavior for dragover on the todoList container
  todoList.addEventListener('dragover', (e) => {
    e.preventDefault();
    
    // Get the closest li being hovered over
    const targetItem = getDragTarget(e);
    if (!targetItem || targetItem === draggedItem) return;
    
    // Remove previous indicators
    clearDropTargetClasses();
    
    // Determine if we're hovering in the top or bottom half
    const rect = targetItem.getBoundingClientRect();
    const midPoint = rect.top + rect.height / 2;
    
    if (e.clientY < midPoint) {
      targetItem.classList.add('drop-target-above');
    } else {
      targetItem.classList.add('drop-target-below');
    }
  });
  
  // Clear drop target indicators when leaving the drag area
  todoList.addEventListener('dragleave', () => {
    clearDropTargetClasses();
  });
  
  // Handle drop event
  todoList.addEventListener('drop', (e) => {
    e.preventDefault();
    
    // Find the drop target
    const targetItem = getDragTarget(e);
    if (!targetItem || !draggedItem) return;
    
    // Determine if we're dropping above or below the target
    const rect = targetItem.getBoundingClientRect();
    const midPoint = rect.top + rect.height / 2;
    const dropBelow = e.clientY >= midPoint;
    
    // Don't reorder if dropping on self
    if (targetItem !== draggedItem) {
      if (dropBelow) {
        // Insert after target
        if (targetItem.nextElementSibling) {
          todoList.insertBefore(draggedItem, targetItem.nextElementSibling);
        } else {
          todoList.appendChild(draggedItem);
        }
      } else {
        // Insert before target
        todoList.insertBefore(draggedItem, targetItem);
      }
      
      // Save the new order
      saveTodos();
    }
    
    // Cleanup
    clearDropTargetClasses();
    draggedItem.classList.remove('dragging');
    draggedItem = null;
  });
}

// Helper to get the closest todo item being dragged over
function getDragTarget(event) {
  return event.target.closest('#todoList > li');
}

// Helper to clear all drop target classes
function clearDropTargetClasses() {
  todoList.querySelectorAll('li.drop-target-above, li.drop-target-below')
    .forEach(item => {
      item.classList.remove('drop-target-above', 'drop-target-below');
    });
}

// Create a new todo item element
function createTodoItem(text) {
  const li = document.createElement('li');
  
  // Make the li draggable
  li.draggable = true;
  
  // Add drag start event
  li.addEventListener('dragstart', (e) => {
    draggedItem = li;
    li.classList.add('dragging');
    
    // Required for Firefox compatibility
    e.dataTransfer.setData('text/plain', '');
    e.dataTransfer.effectAllowed = 'move';
  });
  
  // Add drag end event
  li.addEventListener('dragend', () => {
    li.classList.remove('dragging');
    clearDropTargetClasses();
    draggedItem = null;
  });
  
  const checkbox = document.createElement('input'); 
  checkbox.type = 'checkbox'; 
  checkbox.addEventListener('change', () => { 
    li.classList.toggle('completed', checkbox.checked); 
    saveTodos(); 
  });
  
  const span = document.createElement('span'); 
  span.className = 'todo-text'; 
  span.textContent = text;
  
  const btnContainer = document.createElement('div');
  btnContainer.className = 'todo-buttons';
  
  const upBtn = document.createElement('button'); 
  upBtn.innerHTML = '<i class="fas fa-arrow-up"></i>'; 
  upBtn.title = 'Move up'; 
  upBtn.className = 'todo-btn';
  upBtn.addEventListener('click', () => { 
    const prev = li.previousElementSibling; 
    if (prev) todoList.insertBefore(li, prev); 
    saveTodos(); 
  });
  
  const downBtn = document.createElement('button'); 
  downBtn.innerHTML = '<i class="fas fa-arrow-down"></i>'; 
  downBtn.title = 'Move down'; 
  downBtn.className = 'todo-btn';
  downBtn.addEventListener('click', () => { 
    const next = li.nextElementSibling; 
    if (next) todoList.insertBefore(next, li); 
    saveTodos(); 
  });
  
  const removeBtn = document.createElement('button'); 
  removeBtn.innerHTML = '<i class="fas fa-times"></i>'; 
  removeBtn.title = 'Remove'; 
  removeBtn.className = 'todo-btn remove-btn';
  removeBtn.addEventListener('click', () => { 
    li.remove(); 
    saveTodos(); 
  });
  
  // Add drag handle icon
  const dragHandleBtn = document.createElement('button');
  dragHandleBtn.innerHTML = '<i class="fas fa-grip-lines"></i>';
  dragHandleBtn.title = 'Drag to reorder';
  dragHandleBtn.className = 'todo-btn drag-handle';
  
  btnContainer.append(upBtn, downBtn, removeBtn, dragHandleBtn);
  li.append(checkbox, span, btnContainer); 
  return li;
}

// Save todos to the current project
export async function saveTodos() { 
  const items = Array.from(todoList.children).map(li => ({ 
    text: li.querySelector('.todo-text').textContent, 
    completed: li.querySelector('input').checked 
  }));
  
  // Save to project system
  await saveProjectTodos(items);
}

// Load todos from current project
export async function loadTodos() { 
  // Clear existing todos
  todoList.innerHTML = '';
  
  try {
    const currentProject = await getCurrentProject();
    if (currentProject && currentProject.todos) {
      currentProject.todos.forEach(item => { 
        const li = createTodoItem(item.text); 
        if (item.completed) { 
          li.classList.add('completed'); 
          li.querySelector('input').checked = true; 
        } 
        todoList.append(li); 
      });
    }
  } catch (error) {
    console.error('Error loading todos:', error);
  }
}

// Get current todos
export function getTodos() {
  return Array.from(todoList.children).map(li => ({
    text: li.querySelector('.todo-text').textContent,
    completed: li.querySelector('input').checked
  }));
}

// For legacy compatibility - migrate old todos to project system
export async function migrateTodosToProject() {
  try {
    const oldTodos = await getOldTodosFromStorage();
    if (oldTodos && Array.isArray(oldTodos)) {
      await saveProjectTodos(oldTodos);
      await removeOldTodosFromStorage();
    }
  } catch (error) {
    console.error('Error migrating todos:', error);
  }
}