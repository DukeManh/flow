// Todo list management for the Flow State app

// Todo elements
let todoInput, addTodoBtn, todoList;

// Initialize todos functionality
export function initTodos() {
  todoInput = document.getElementById('todoInput');
  addTodoBtn = document.getElementById('addTodoBtn');
  todoList = document.getElementById('todoList');

  // Add event listeners
  addTodoBtn.addEventListener('click', () => { 
    const text = todoInput.value.trim(); 
    if (!text) return; 
    todoList.append(createTodoItem(text)); 
    todoInput.value = ''; 
    todoInput.focus(); 
    saveTodos(); 
  });
  
  todoInput.addEventListener('keypress', e => { 
    if (e.key === 'Enter') addTodoBtn.click(); 
  });

  // Load saved todos
  loadTodos();
}

// Create a new todo item element
function createTodoItem(text) {
  const li = document.createElement('li'); 
  
  const checkbox = document.createElement('input'); 
  checkbox.type = 'checkbox'; 
  checkbox.addEventListener('change', () => { 
    li.classList.toggle('completed', checkbox.checked); 
    saveTodos(); 
  });
  
  const span = document.createElement('span'); 
  span.className = 'todo-text'; 
  span.textContent = text;
  
  const upBtn = document.createElement('button'); 
  upBtn.textContent = '↑'; 
  upBtn.title = 'Move up'; 
  upBtn.addEventListener('click', () => { 
    const prev = li.previousElementSibling; 
    if (prev) todoList.insertBefore(li, prev); 
    saveTodos(); 
  });
  
  const downBtn = document.createElement('button'); 
  downBtn.textContent = '↓'; 
  downBtn.title = 'Move down'; 
  downBtn.addEventListener('click', () => { 
    const next = li.nextElementSibling; 
    if (next) todoList.insertBefore(next, li); 
    saveTodos(); 
  });
  
  const removeBtn = document.createElement('button'); 
  removeBtn.textContent = '✕'; 
  removeBtn.title = 'Remove'; 
  removeBtn.addEventListener('click', () => { 
    li.remove(); 
    saveTodos(); 
  });
  
  li.append(checkbox, span, upBtn, downBtn, removeBtn); 
  return li;
}

// Save todos to localStorage
function saveTodos() { 
  const items = Array.from(todoList.children).map(li => ({ 
    text: li.querySelector('.todo-text').textContent, 
    completed: li.querySelector('input').checked 
  }));
  localStorage.setItem('flowTodos', JSON.stringify(items)); 
}

// Load todos from localStorage
function loadTodos() { 
  JSON.parse(localStorage.getItem('flowTodos') || '[]').forEach(item => { 
    const li = createTodoItem(item.text); 
    if (item.completed) { 
      li.classList.add('completed'); 
      li.querySelector('input').checked = true; 
    } 
    todoList.append(li); 
  });
}

// Get current todos
export function getTodos() {
  return Array.from(todoList.children).map(li => ({
    text: li.querySelector('.todo-text').textContent,
    completed: li.querySelector('input').checked
  }));
}