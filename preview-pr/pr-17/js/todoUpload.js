// Todo upload management for the Flow State app
import { getTodos, TODO_STATUSES } from './todos.js';
import { getCurrentProject } from './projects.js';

// Conversion functions
export const converters = {
  // Convert current todos format to standard format
  fromCurrentTodos: (currentTodos) => {
    const todos = currentTodos.map((item, index) => ({
      id: `current-${index}-${Date.now()}`,
      text: item.text,
      status: item.status || (item.completed ? TODO_STATUSES.COMPLETED : TODO_STATUSES.NOT_STARTED),
      completed: item.completed || false,
      category: 'General',
      metadata: {
        originalIndex: index
      }
    }));

    return {
      version: '1.0',
      source: 'current_export',
      todos: todos,
      metadata: {
        createdAt: new Date().toISOString(),
        description: 'Current todos export',
        tags: ['export']
      }
    };
  },

  // Convert standard format back to current todos format
  toCurrentTodos: (standardFormat) => {
    return standardFormat.todos.map(item => ({
      text: item.text,
      status: item.status || TODO_STATUSES.NOT_STARTED,
      completed: item.completed || false
    }));
  }
};

// Helper function to convert date strings to ISO format
function convertDateToISO(dateString) {
  try {
    // Handle various date formats
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      // Try parsing common formats like "Feb 28", "Mar 1", etc.
      const currentYear = new Date().getFullYear();
      const parsedDate = new Date(`${dateString} ${currentYear}`);
      
      if (!isNaN(parsedDate.getTime())) {
        // If the parsed date is in the past, assume next year
        if (parsedDate < new Date()) {
          parsedDate.setFullYear(currentYear + 1);
        }
        return parsedDate.toISOString().split('T')[0];
      }
      
      return null;
    }
    
    return date.toISOString().split('T')[0]; // Return just the date part
  } catch (error) {
    console.warn('Could not parse date:', dateString);
    return null;
  }
}

// File parsing functions
export const parsers = {
  // Parse JSON file
  parseJSON: async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          resolve(data);
        } catch (error) {
          reject(new Error('Invalid JSON format'));
        }
      };
      reader.onerror = () => reject(new Error('Error reading file'));
      reader.readAsText(file);
    });
  },

  // Parse CSV file
  parseCSV: async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const lines = text.split('\n').filter(line => line.trim());
          
          if (lines.length < 2) {
            throw new Error('CSV file must have at least a header row and one data row');
          }
          
          // Parse headers (handle quoted values)
          const headerLine = lines[0];
          const headers = parseCSVLine(headerLine).map(h => h.toLowerCase().trim());
          
          // Find column indices
          const taskIndex = findColumnIndex(headers, ['task', 'todo', 'item', 'description', 'text']);
          const categoryIndex = findColumnIndex(headers, ['category', 'type', 'group']);
          const dueDateIndex = findColumnIndex(headers, ['due date', 'duedate', 'date', 'deadline']);
          const notesIndex = findColumnIndex(headers, ['notes', 'note', 'description', 'comment']);
          
          if (taskIndex === -1) {
            throw new Error('CSV must have a column for tasks (Task, Todo, Item, Description, or Text)');
          }
          
          const todos = lines.slice(1).map((line, index) => {
            const values = parseCSVLine(line);
            
            const todo = {
              id: `csv-${index}-${Date.now()}`,
              text: values[taskIndex] || `Task ${index + 1}`,
              status: TODO_STATUSES.NOT_STARTED,
              completed: false,
              category: 'Imported'
            };

            // Map additional columns if they exist
            if (categoryIndex !== -1 && values[categoryIndex]) {
              todo.category = values[categoryIndex].trim();
            }
            
            if (dueDateIndex !== -1 && values[dueDateIndex]) {
              const dueDate = convertDateToISO(values[dueDateIndex]);
              if (dueDate) {
                todo.dueDate = dueDate;
              }
            }
            
            if (notesIndex !== -1 && values[notesIndex]) {
              todo.notes = values[notesIndex].trim();
            }

            return todo;
          }).filter(todo => todo.text.trim()); // Filter out empty tasks

          resolve({
            version: '1.0',
            source: 'csv_import',
            todos: todos,
            metadata: {
              createdAt: new Date().toISOString(),
              description: `CSV Import from ${file.name}`,
              tags: ['csv', 'import']
            }
          });
        } catch (error) {
          reject(new Error(`Error parsing CSV file: ${error.message}`));
        }
      };
      reader.onerror = () => reject(new Error('Error reading file'));
      reader.readAsText(file);
    });
  }
};

// Helper function to parse a CSV line (handles quoted values)
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip the next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add the last field
  result.push(current.trim());
  
  return result;
}

// Helper function to find column index by multiple possible names
function findColumnIndex(headers, possibleNames) {
  for (const name of possibleNames) {
    const index = headers.indexOf(name);
    if (index !== -1) return index;
  }
  return -1;
}

// Auto-detect format and convert
export async function autoConvertToStandard(data, filename = '') {
  // Check if it's already in standard format
  if (data.version && data.todos && Array.isArray(data.todos)) {
    return data;
  }

  // Check if it's simple todos array
  if (Array.isArray(data) && data.length > 0 && data[0].text) {
    return {
      version: '1.0',
      source: 'simple_import',
      todos: data.map((item, index) => ({
        id: `simple-${index}-${Date.now()}`,
        text: item.text,
        status: item.status || TODO_STATUSES.NOT_STARTED,
        completed: item.completed || false,
        category: 'Imported'
      })),
      metadata: {
        createdAt: new Date().toISOString(),
        description: `Import from ${filename}`,
        tags: ['import']
      }
    };
  }

  throw new Error('Unrecognized format. Please ensure your file contains valid todo data.');
}

// Export current todos in CSV format
export async function exportCurrentTodos() {
  const currentTodos = getTodos();
  
  // CSV headers
  const headers = ['Task', 'Category', 'Priority', 'Due Date', 'Notes'];
  
  // Convert todos to CSV rows
  const rows = currentTodos.map(todo => {
    const task = `"${todo.text.replace(/"/g, '""')}"`;
    const category = '"General"'; // Default category
    const priority = '"normal"'; // Default priority since we removed priority features
    const dueDate = '""'; // No due date in current system
    const notes = '""'; // No notes in current system
    
    return [task, category, priority, dueDate, notes].join(',');
  });
  
  // Combine headers and rows
  const csvContent = [headers.join(','), ...rows].join('\n');
  
  return {
    content: csvContent,
    filename: `todos-export-${new Date().toISOString().split('T')[0]}.csv`,
    contentType: 'text/csv'
  };
}

// Generate sample files for download
export function generateSampleFiles() {
  const sampleCSV = `Task,Category,Priority,Due Date,Notes
"Complete project proposal","Work","high","2025-08-01","Include budget and timeline"
"Review code changes","Development","normal","","Team review needed"
"Schedule team meeting","Management","normal","2025-07-30","Discuss Q3 goals"
"Update documentation","Development","low","2025-08-05","API documentation updates"
"Prepare quarterly report","Business","high","2025-07-28","Financial summary required"`;

  return {
    csv: sampleCSV
  };
}