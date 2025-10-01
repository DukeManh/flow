// Todo list management for the Flow State app
import { getCurrentProject, saveProjectTodos } from './projects.js';
import storageService from './storage.js';
import { 
  parsers, 
  autoConvertToStandard, 
  converters, 
  exportCurrentTodos, 
  generateSampleFiles
} from './todoUpload.js';

// Storage keys
const STORAGE_KEYS = {
  OLD_TODOS: 'flowTodos'
};

// Todo status options
export const TODO_STATUSES = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  BLOCKED: 'Blocked',
  TESTING: 'Testing',
  COMPLETED: 'Completed'
};

// Todo elements
let todoInput, addTodoBtn, todoList;
// Track dragged element and drop position
let draggedItem = null;

// Todo upload and import state
let currentImportData = null;
let selectedImportItems = new Set();

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
    
    // Add new todo to the top of the list instead of bottom
    const newTodoItem = createTodoItem(text);
    if (todoList.firstChild) {
      todoList.insertBefore(newTodoItem, todoList.firstChild);
    } else {
      todoList.appendChild(newTodoItem);
    }
    
    todoInput.value = ''; 
    todoInput.focus(); 
    
    // Scroll the new item into view
    newTodoItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    await saveTodos(); 
  });
  
  todoInput.addEventListener('keypress', e => { 
    if (e.key === 'Enter') addTodoBtn.click(); 
  });

  // Initialize drag and drop container
  initDragAndDrop();

  // Initialize upload functionality
  initTodoUpload();

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

// Helper to update todo item status and appearance
function updateTodoStatus(li, status, shouldSave = true) {
  // First, remove all status classes
  li.classList.remove('status-not-started', 'status-in-progress', 'status-blocked', 'status-testing', 'completed');
  
  // Convert status to kebab case for CSS class
  const statusClass = 'status-' + status.toLowerCase().replace(/\s+/g, '-');
  li.classList.add(statusClass);
  
  // Special case for completed status
  if (status === TODO_STATUSES.COMPLETED) {
    li.classList.add('completed');
    li.querySelector('input[type="checkbox"]').checked = true;
  } else {
    li.querySelector('input[type="checkbox"]').checked = false;
  }
  
  // Update the status select
  const statusSelect = li.querySelector('.todo-status-select');
  if (statusSelect) {
    statusSelect.value = status;
  }
  
  // Save todos after status change, but only if requested
  if (shouldSave) {
    saveTodos();
  }
}

// Create a new todo item element
function createTodoItem(text, status = TODO_STATUSES.NOT_STARTED) {
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

  // Create main content wrapper for better mobile layout
  const mainContent = document.createElement('div');
  mainContent.className = 'todo-main-content';
  
  const checkbox = document.createElement('input'); 
  checkbox.type = 'checkbox'; 
  checkbox.addEventListener('change', () => { 
    // When checkbox is checked, update status to Completed
    // When unchecked, update status to Not Started
    updateTodoStatus(li, checkbox.checked ? TODO_STATUSES.COMPLETED : TODO_STATUSES.NOT_STARTED);
  });
  
  // Create status indicator
  const statusIndicator = document.createElement('span');
  statusIndicator.className = 'todo-status-indicator';
  
  const span = document.createElement('span'); 
  span.className = 'todo-text'; 
  span.textContent = text;

  // Add main content elements
  mainContent.append(checkbox, statusIndicator, span);

  // Create controls wrapper for mobile layout
  const controls = document.createElement('div');
  controls.className = 'todo-controls';
  
  // Create status dropdown
  const statusContainer = document.createElement('div');
  statusContainer.className = 'todo-status';
  
  const statusSelect = document.createElement('select');
  statusSelect.className = 'todo-status-select';
  
  // Add options to the select
  Object.values(TODO_STATUSES).forEach(statusValue => {
    const option = document.createElement('option');
    option.value = statusValue;
    option.textContent = statusValue;
    statusSelect.appendChild(option);
  });
  
  // Set initial selected status
  statusSelect.value = status;
  
  // Add change event to the select
  statusSelect.addEventListener('change', () => {
    updateTodoStatus(li, statusSelect.value);
  });
  
  statusContainer.appendChild(statusSelect);
  
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
  
  // Create edit button
  const editBtn = document.createElement('button');
  editBtn.innerHTML = '<i class="fas fa-edit"></i>';
  editBtn.title = 'Edit';
  editBtn.className = 'todo-btn edit-btn';
  editBtn.addEventListener('click', () => enterEditMode(li));
  
  btnContainer.append(upBtn, downBtn, editBtn, removeBtn, dragHandleBtn);
  
  // Add controls elements
  controls.append(statusContainer, btnContainer);
  
  // Add everything to the li
  li.append(mainContent, controls);
  
  // Apply initial status class without saving (passing false as the third parameter)
  updateTodoStatus(li, status, false);
  
  // Add double click event to enter edit mode
  li.addEventListener('dblclick', () => {
    enterEditMode(li);
  });
  
  return li;
}

// Helper to put a todo item in edit mode
function enterEditMode(li) {
  // Prevent editing if already in edit mode
  if (li.classList.contains('editing')) return;

  // Add editing class to the li
  li.classList.add('editing');
  
  // Get the current todo text
  const todoTextElement = li.querySelector('.todo-text');
  const currentText = todoTextElement.textContent;
  
  // Create edit input
  const editInput = document.createElement('input');
  editInput.type = 'text';
  editInput.className = 'todo-edit-input';
  editInput.value = currentText;
  
  // Insert the input before the text element
  li.insertBefore(editInput, todoTextElement);
  
  // Focus on the input
  editInput.focus();
  editInput.select();
  
  // Get button container and normal buttons
  const btnContainer = li.querySelector('.todo-buttons');
  const normalButtons = Array.from(btnContainer.children);
  
  // Hide normal buttons
  normalButtons.forEach(btn => btn.style.display = 'none');
  
  // Create save and cancel buttons
  const saveBtn = document.createElement('button');
  saveBtn.innerHTML = '<i class="fas fa-check"></i>';
  saveBtn.title = 'Save';
  saveBtn.className = 'todo-btn save-edit-btn';
  saveBtn.addEventListener('click', () => saveEdit(li, editInput.value));
  
  const cancelBtn = document.createElement('button');
  cancelBtn.innerHTML = '<i class="fas fa-times"></i>';
  cancelBtn.title = 'Cancel';
  cancelBtn.className = 'todo-btn cancel-edit-btn';
  cancelBtn.addEventListener('click', () => cancelEdit(li));
  
  // Add save and cancel buttons to the container
  btnContainer.appendChild(saveBtn);
  btnContainer.appendChild(cancelBtn);
  
  // Make the todo item temporarily not draggable
  li.draggable = false;
  
  // Handle enter key to save and escape to cancel
  editInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      saveEdit(li, editInput.value);
    } else if (e.key === 'Escape') {
      cancelEdit(li);
    }
  });
}

// Helper to save the edited todo text
function saveEdit(li, newText) {
  // Trim the text to make sure it's not empty
  const trimmedText = newText.trim();
  
  // Don't save if empty
  if (!trimmedText) {
    cancelEdit(li);
    return;
  }
  
  // Get the todo text element
  const todoTextElement = li.querySelector('.todo-text');
  
  // Update the text content
  todoTextElement.textContent = trimmedText;
  
  // Exit edit mode
  exitEditMode(li);
  
  // Save todos to storage
  saveTodos();
}

// Helper to cancel editing and restore original text
function cancelEdit(li) {
  // Exit edit mode without saving
  exitEditMode(li);
}

// Helper to exit edit mode
function exitEditMode(li) {
  // Remove editing class
  li.classList.remove('editing');
  
  // Remove the edit input
  const editInput = li.querySelector('.todo-edit-input');
  if (editInput) {
    editInput.remove();
  }
  
  // Get button container
  const btnContainer = li.querySelector('.todo-buttons');
  
  // Remove save and cancel buttons
  const saveBtn = btnContainer.querySelector('.save-edit-btn');
  const cancelBtn = btnContainer.querySelector('.cancel-edit-btn');
  if (saveBtn) saveBtn.remove();
  if (cancelBtn) cancelBtn.remove();
  
  // Show normal buttons
  const normalButtons = Array.from(btnContainer.children);
  normalButtons.forEach(btn => btn.style.display = '');
  
  // Make the todo item draggable again
  li.draggable = true;
}

// Save todos to the current project
export async function saveTodos() { 
  const items = Array.from(todoList.children).map(li => {
    const statusSelect = li.querySelector('.todo-status-select');
    return { 
      text: li.querySelector('.todo-text').textContent, 
      completed: li.querySelector('input').checked,
      status: statusSelect ? statusSelect.value : TODO_STATUSES.NOT_STARTED
    };
  });
  
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
        // Handle old todo format that doesn't have status
        const status = item.status || (item.completed ? TODO_STATUSES.COMPLETED : TODO_STATUSES.NOT_STARTED);
        const li = createTodoItem(item.text, status); 
        todoList.append(li); 
      });

      // Scroll to first unfinished todo after rendering
      scrollToFirstUnfinishedTodo();
    }
  } catch (error) {
    console.error('Error loading todos:', error);
  }
}

// Helper function to scroll to the first unfinished todo
function scrollToFirstUnfinishedTodo() {
  // Find the first todo that is not completed
  const firstUnfinishedTodo = Array.from(todoList.children).find(li => {
    const checkbox = li.querySelector('input[type="checkbox"]');
    return checkbox && !checkbox.checked;
  });

  if (firstUnfinishedTodo) {
    // Calculate the position within the todo list container
    const todoListRect = todoList.getBoundingClientRect();
    const todoItemRect = firstUnfinishedTodo.getBoundingClientRect();
    
    // Calculate the scroll position within the todo list
    const scrollTop = firstUnfinishedTodo.offsetTop - todoList.offsetTop;
    
    // Smooth scroll within the todo list container only
    todoList.scrollTo({
      top: scrollTop,
      behavior: 'smooth'
    });
  } else {
    // If all todos are completed, scroll to the top of the todo list
    todoList.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
}

// Get current todos
export function getTodos() {
  return Array.from(todoList.children).map(li => {
    const statusSelect = li.querySelector('.todo-status-select');
    return {
      text: li.querySelector('.todo-text').textContent,
      completed: li.querySelector('input').checked,
      status: statusSelect ? statusSelect.value : TODO_STATUSES.NOT_STARTED
    };
  });
}

// For legacy compatibility - migrate old todos to project system
export async function migrateTodosToProject() {
  try {
    const oldTodos = await getOldTodosFromStorage();
    if (oldTodos && Array.isArray(oldTodos)) {
      // Add status to old todos based on completed flag
      const updatedTodos = oldTodos.map(todo => ({
        ...todo,
        status: todo.completed ? TODO_STATUSES.COMPLETED : TODO_STATUSES.NOT_STARTED
      }));
      await saveProjectTodos(updatedTodos);
      await removeOldTodosFromStorage();
    }
  } catch (error) {
    console.error('Error migrating todos:', error);
  }
}

// Initialize todo upload functionality
function initTodoUpload() {
  const uploadBtn = document.getElementById('uploadTodosBtn');
  const exportBtn = document.getElementById('exportTodosBtn');
  const fileInput = document.getElementById('todoFileInput');
  const importModal = document.getElementById('todoImportModal');
  const closeModalBtns = importModal.querySelectorAll('.close-modal');
  
  // Upload button click - show modal immediately
  uploadBtn?.addEventListener('click', () => {
    showImportModal();
  });

  // Export button click - export as CSV
  exportBtn?.addEventListener('click', async () => {
    try {
      const exportData = await exportCurrentTodos();
      downloadFile(
        exportData.content,
        exportData.filename,
        exportData.contentType
      );
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export todos. Please try again.');
    }
  });

  // File input change
  fileInput?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      await handleFileUpload(file);
      // Clear the input so the same file can be uploaded again
      fileInput.value = '';
    } catch (error) {
      console.error('File upload failed:', error);
      alert(`Failed to process file: ${error.message}`);
    }
  });

  // Modal close events
  closeModalBtns.forEach(btn => {
    btn.addEventListener('click', closeImportModal);
  });

  // Click outside modal to close
  importModal?.addEventListener('click', (e) => {
    if (e.target === importModal) {
      closeImportModal();
    }
  });

  // Initialize import modal functionality
  initImportModal();
}

// Show import modal (initially showing format help)
function showImportModal(file = null, importData = null) {
  const modal = document.getElementById('todoImportModal');
  const formatHelp = document.getElementById('formatHelp');
  const importInfo = document.getElementById('importInfo');
  const importPreview = document.getElementById('importPreview');
  const importOptions = document.getElementById('importOptions');
  const importActions = document.getElementById('importActions');

  if (file && importData) {
    // Show file info and preview
    formatHelp.style.display = 'none';
    importInfo.style.display = 'block';
    importPreview.style.display = 'block';
    importOptions.style.display = 'block';
    importActions.style.display = 'block';

    // Update file info
    const fileName = document.getElementById('importFileName');
    const fileStats = document.getElementById('importFileStats');
    fileName.textContent = file.name;
    const stats = [
      `${importData.todos.length} items`,
      `${(file.size / 1024).toFixed(1)} KB`,
      importData.source.replace('_', ' ')
    ];
    fileStats.textContent = stats.join(' • ');

    // Generate preview
    const previewList = document.getElementById('importPreviewList');
    generatePreview(importData.todos, previewList);

    // Reset selections
    selectedImportItems.clear();
    updateSelectedCount();
  } else {
    // Show format help
    formatHelp.style.display = 'block';
    importInfo.style.display = 'none';
    importPreview.style.display = 'none';
    importOptions.style.display = 'none';
    importActions.style.display = 'none';
  }

  // Show modal
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

// Generate preview list with multi-select support
function generatePreview(todos, container) {
  if (!todos.length) {
    container.innerHTML = '<p class="no-preview">No items to import</p>';
    return;
  }

  const fragment = document.createDocumentFragment();
  
  // Add selection help text
  const helpText = document.createElement('div');
  helpText.className = 'selection-help';
  helpText.textContent = 'Click to select items. Hold Shift and click to select ranges.';
  fragment.appendChild(helpText);
  
  todos.forEach((todo, index) => {
    const item = document.createElement('div');
    item.className = 'preview-item';
    item.dataset.index = index;
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'preview-checkbox';
    checkbox.checked = true; // Default to selected
    
    const content = document.createElement('div');
    content.className = 'preview-content';
    
    const text = document.createElement('div');
    text.className = 'preview-text';
    text.textContent = todo.text;
    
    const meta = document.createElement('div');
    meta.className = 'preview-meta';
    
    // Add category tag
    if (todo.category) {
      const categoryTag = document.createElement('span');
      categoryTag.className = 'preview-tag category';
      categoryTag.textContent = todo.category;
      meta.appendChild(categoryTag);
    }
    
    // Add due date if available
    if (todo.dueDate) {
      const dueDateTag = document.createElement('span');
      dueDateTag.className = 'preview-tag';
      dueDateTag.textContent = new Date(todo.dueDate).toLocaleDateString();
      meta.appendChild(dueDateTag);
    }
    
    content.appendChild(text);
    if (meta.children.length > 0) {
      content.appendChild(meta);
    }
    
    item.appendChild(checkbox);
    item.appendChild(content);
    
    // Initially select all items
    selectedImportItems.add(index);
    item.classList.add('selected');
    
    // Add multi-select event handlers
    setupMultiSelectHandlers(item, checkbox, index);
    
    fragment.appendChild(item);
  });
  
  container.innerHTML = '';
  container.appendChild(fragment);
}

// Multi-select state
let lastSelectedIndex = -1;
let isShiftSelecting = false;

// Setup multi-select handlers for preview items
function setupMultiSelectHandlers(item, checkbox, index) {
  // Checkbox change handler
  checkbox.addEventListener('change', (e) => {
    e.stopPropagation();
    updateItemSelection(index, checkbox.checked);
    lastSelectedIndex = index;
    updateSelectedCount();
  });
  
  // Item click handler for multi-select
  item.addEventListener('click', (e) => {
    if (e.target === checkbox) return; // Skip if clicking checkbox directly
    
    const isShiftPressed = e.shiftKey;
    
    if (isShiftPressed && lastSelectedIndex !== -1) {
      // Range selection
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      
      // Clear previous range selection styles
      document.querySelectorAll('.preview-item.range-selected').forEach(item => {
        item.classList.remove('range-selected');
      });
      
      // Select range
      for (let i = start; i <= end; i++) {
        const targetCheckbox = document.querySelector(`.preview-item[data-index="${i}"] .preview-checkbox`);
        if (targetCheckbox) {
          targetCheckbox.checked = true;
          updateItemSelection(i, true);
          
          // Add range selection styling
          const targetItem = document.querySelector(`.preview-item[data-index="${i}"]`);
          if (targetItem && i !== index) {
            targetItem.classList.add('range-selected');
          }
        }
      }
    } else {
      // Single selection toggle
      checkbox.checked = !checkbox.checked;
      updateItemSelection(index, checkbox.checked);
    }
    
    // Update last selected and add styling
    document.querySelectorAll('.preview-item.last-selected').forEach(item => {
      item.classList.remove('last-selected');
    });
    item.classList.add('last-selected');
    lastSelectedIndex = index;
    
    updateSelectedCount();
  });
}

// Update item selection state
function updateItemSelection(index, isSelected) {
  const item = document.querySelector(`.preview-item[data-index="${index}"]`);
  
  if (isSelected) {
    selectedImportItems.add(index);
    item.classList.add('selected');
  } else {
    selectedImportItems.delete(index);
    item.classList.remove('selected');
  }
}

// Update selected count and button state
function updateSelectedCount() {
  const countElement = document.getElementById('selectedCount');
  const confirmBtn = document.getElementById('confirmImportBtn');
  
  const count = selectedImportItems.size;
  countElement.textContent = count;
  confirmBtn.disabled = count === 0;
}

// Perform the actual import
async function performImport() {
  if (!currentImportData || selectedImportItems.size === 0) {
    throw new Error('No items selected for import');
  }

  const importMode = document.querySelector('input[name="importMode"]:checked')?.value || 'append';
  const selectedTodos = Array.from(selectedImportItems).map(index => currentImportData.todos[index]);
  
  // Convert to current todo format
  const newTodos = converters.toCurrentTodos({ todos: selectedTodos });
  
  if (importMode === 'replace') {
    // Replace all current todos
    todoList.innerHTML = '';
    newTodos.forEach(todo => {
      const li = createTodoItem(todo.text, todo.status);
      todoList.appendChild(li);
    });
  } else {
    // Append to existing todos
    newTodos.forEach(todo => {
      const li = createTodoItem(todo.text, todo.status);
      todoList.appendChild(li);
    });
  }
  
  // Save to storage
  await saveTodos();
  
  // Show success message
  const importedCount = selectedTodos.length;
  const message = importMode === 'replace' 
    ? `Replaced all todos with ${importedCount} imported items`
    : `Added ${importedCount} new todos`;
    
  console.log(message);
}

// Close import modal
function closeImportModal() {
  const modal = document.getElementById('todoImportModal');
  modal.style.display = 'none';
  document.body.style.overflow = '';
  
  // Clear data
  currentImportData = null;
  selectedImportItems.clear();
  lastSelectedIndex = -1;
}

// Initialize import modal event handlers
function initImportModal() {
  const browseFileBtn = document.getElementById('browseFileBtn');
  const downloadSampleBtn = document.getElementById('downloadSampleBtn');
  const fileInput = document.getElementById('todoFileInput');
  const selectAllBtn = document.getElementById('selectAllBtn');
  const selectNoneBtn = document.getElementById('selectNoneBtn');
  const cancelBtn = document.getElementById('cancelImportBtn');
  const confirmBtn = document.getElementById('confirmImportBtn');
  
  // Browse file button
  browseFileBtn?.addEventListener('click', () => {
    fileInput.click();
  });
  
  // Download sample button
  downloadSampleBtn?.addEventListener('click', () => {
    const sampleFiles = generateSampleFiles();
    downloadFile(
      sampleFiles.csv,
      'sample-todos.csv',
      'text/csv'
    );
  });
  
  selectAllBtn?.addEventListener('click', () => {
    const checkboxes = document.querySelectorAll('.preview-checkbox');
    checkboxes.forEach((checkbox, index) => {
      checkbox.checked = true;
      selectedImportItems.add(index);
      checkbox.closest('.preview-item').classList.add('selected');
    });
    updateSelectedCount();
  });
  
  selectNoneBtn?.addEventListener('click', () => {
    const checkboxes = document.querySelectorAll('.preview-checkbox');
    checkboxes.forEach((checkbox, index) => {
      checkbox.checked = false;
      selectedImportItems.delete(index);
      checkbox.closest('.preview-item').classList.remove('selected');
    });
    updateSelectedCount();
  });
  
  cancelBtn?.addEventListener('click', closeImportModal);
  
  confirmBtn?.addEventListener('click', async () => {
    try {
      await performImport();
      closeImportModal();
    } catch (error) {
      console.error('Import failed:', error);
      alert(`Import failed: ${error.message}`);
    }
  });
}

// Handle file upload and processing
async function handleFileUpload(file) {
  try {
    let data;
    
    // Parse file based on type
    if (file.name.endsWith('.json')) {
      data = await parsers.parseJSON(file);
    } else if (file.name.endsWith('.csv')) {
      data = await parsers.parseCSV(file);
    } else {
      throw new Error('Unsupported file format. Please use CSV files.');
    }

    // Convert to standard format
    const standardData = await autoConvertToStandard(data, file.name);
    
    // Store for import
    currentImportData = standardData;
    
    // Show import modal with preview
    showImportModal(file, standardData);
    
  } catch (error) {
    throw new Error(`Error processing file: ${error.message}`);
  }
}

// Utility function to download files
function downloadFile (content, filename, contentType) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}