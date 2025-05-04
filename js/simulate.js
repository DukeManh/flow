// Simulated project data
const simulatedProjects = [
  {
    id: 'project_1682551231000',
    name: 'Work Project',
    color: '#5D8AA8', // Air Force Blue
    createdAt: Date.now() - (1000 * 60 * 60 * 24 * 10),
    goal: 'Implement new features by end of sprint',
    todos: [
      { text: "Update API documentation", completed: true },
      { text: "Fix login authentication bug", completed: true },
      { text: "Implement user profile page", completed: false },
      { text: "Write unit tests for new features", completed: false },
      { text: "Code review for team members", completed: false }
    ]
  },
  {
    id: 'project_1682551232000',
    name: 'Personal Website',
    color: '#4682B4', // Steel Blue
    createdAt: Date.now() - (1000 * 60 * 60 * 24 * 9),
    goal: 'Update portfolio with latest projects',
    todos: [
      { text: "Redesign homepage layout", completed: true },
      { text: "Add new portfolio projects", completed: true },
      { text: "Update resume PDF", completed: true },
      { text: "Add dark mode toggle", completed: false },
      { text: "Optimize images for faster loading", completed: false }
    ]
  },
  {
    id: 'project_1682551233000',
    name: 'Learning',
    color: '#50C878', // Emerald
    createdAt: Date.now() - (1000 * 60 * 60 * 24 * 8),
    goal: 'Complete React course',
    todos: [
      { text: "Complete useEffect hook tutorial", completed: true },
      { text: "Practice with React context", completed: true },
      { text: "Learn about React performance optimization", completed: false },
      { text: "Build a small project with Next.js", completed: false },
      { text: "Study TypeScript integration with React", completed: false }
    ]
  },
  {
    id: 'project_1682551234000',
    name: 'Side Hustle',
    color: '#9966CC', // Amethyst
    createdAt: Date.now() - (1000 * 60 * 60 * 24 * 7),
    goal: 'Build MVP for client',
    todos: [
      { text: "Design user interface mockups", completed: true },
      { text: "Set up project repository", completed: true },
      { text: "Create database schema", completed: true },
      { text: "Implement authentication system", completed: false },
      { text: "Deploy demo to staging environment", completed: false }
    ]
  }
];

// Store simulated projects
localStorage.setItem('flowProjects', JSON.stringify(simulatedProjects));
localStorage.setItem('currentProjectId', simulatedProjects[0].id);

// Simulated history data with project IDs
const simulatedData = [
  {
    start: Date.now() - (1000 * 60 * 60 * 24 * 0), // Today
    end: Date.now() - (1000 * 60 * 60 * 23),
    duration: 45,
    goal: "Complete project documentation",
    music: "wL8DVHuWI7Y",
    projectId: simulatedProjects[0].id, // Work Project
    projectName: simulatedProjects[0].name,
    todos: [
      { text: "Write introduction", completed: true },
      { text: "Add code examples", completed: true }
    ]
  },
  {
    start: Date.now() - (1000 * 60 * 60 * 24 * 0) + 10000, // Also today
    end: Date.now() - (1000 * 60 * 60 * 21),
    duration: 30,
    goal: "Update personal website",
    music: "wL8DVHuWI7Y",
    projectId: simulatedProjects[1].id, // Personal Website
    projectName: simulatedProjects[1].name,
    todos: [
      { text: "Add new portfolio items", completed: true },
      { text: "Update bio section", completed: true }
    ]
  },
  {
    start: Date.now() - (1000 * 60 * 60 * 24 * 1), // Yesterday
    end: Date.now() - (1000 * 60 * 60 * 24 * 1 + 3600000),
    duration: 40,
    goal: "Frontend development",
    music: "1_G60OdEzXs",
    projectId: simulatedProjects[0].id, // Work Project
    projectName: simulatedProjects[0].name,
    todos: [
      { text: "Style navigation bar", completed: true },
      { text: "Fix responsive layout", completed: false }
    ]
  },
  {
    start: Date.now() - (1000 * 60 * 60 * 24 * 1) + 10000, // Also yesterday
    end: Date.now() - (1000 * 60 * 60 * 24 * 1 + 2400000),
    duration: 20,
    goal: "Study React hooks",
    music: "jfKfPfyJRdk",
    projectId: simulatedProjects[2].id, // Learning
    projectName: simulatedProjects[2].name,
    todos: [
      { text: "Complete useEffect tutorial", completed: true },
      { text: "Practice with custom hooks", completed: false }
    ]
  },
  {
    start: Date.now() - (1000 * 60 * 60 * 24 * 2), // 2 days ago
    end: Date.now() - (1000 * 60 * 60 * 24 * 2 + 1800000),
    duration: 30,
    goal: "Bug fixing",
    music: "wL8DVHuWI7Y",
    projectId: simulatedProjects[0].id, // Work Project
    projectName: simulatedProjects[0].name,
    todos: [
      { text: "Fix login issue", completed: true }
    ]
  },
  {
    start: Date.now() - (1000 * 60 * 60 * 24 * 2) + 10000, // Also 2 days ago
    end: Date.now() - (1000 * 60 * 60 * 24 * 2 + 3000000),
    duration: 35,
    goal: "Client meeting prep",
    music: "wL8DVHuWI7Y",
    projectId: simulatedProjects[3].id, // Side Hustle
    projectName: simulatedProjects[3].name,
    todos: [
      { text: "Create presentation", completed: true },
      { text: "Prepare demo", completed: true }
    ]
  },
  {
    start: Date.now() - (1000 * 60 * 60 * 24 * 3), // 3 days ago
    end: Date.now() - (1000 * 60 * 60 * 24 * 3 + 4200000),
    duration: 70,
    goal: "Research new features",
    music: "1_G60OdEzXs",
    projectId: simulatedProjects[0].id, // Work Project
    projectName: simulatedProjects[0].name,
    todos: [
      { text: "Explore AI integration", completed: true },
      { text: "Test new API", completed: true }
    ]
  },
  {
    start: Date.now() - (1000 * 60 * 60 * 24 * 4), // 4 days ago
    end: Date.now() - (1000 * 60 * 60 * 24 * 4 + 3000000),
    duration: 50,
    goal: "Learn node.js middleware",
    music: "jfKfPfyJRdk",
    projectId: simulatedProjects[2].id, // Learning
    projectName: simulatedProjects[2].name,
    todos: [
      { text: "Read documentation", completed: true },
      { text: "Build sample app", completed: false }
    ]
  },
  {
    start: Date.now() - (1000 * 60 * 60 * 24 * 5), // 5 days ago
    end: Date.now() - (1000 * 60 * 60 * 24 * 5 + 3000000),
    duration: 50,
    goal: "Planning sprint",
    music: "wL8DVHuWI7Y",
    projectId: simulatedProjects[0].id, // Work Project
    projectName: simulatedProjects[0].name,
    todos: [
      { text: "Create JIRA tickets", completed: true },
      { text: "Assign priorities", completed: true }
    ]
  },
  {
    start: Date.now() - (1000 * 60 * 60 * 24 * 5) + 10000, // Also 5 days ago
    end: Date.now() - (1000 * 60 * 60 * 24 * 5 + 1800000),
    duration: 25,
    goal: "Client mockups",
    music: "1_G60OdEzXs",
    projectId: simulatedProjects[3].id, // Side Hustle
    projectName: simulatedProjects[3].name,
    todos: [
      { text: "Design landing page", completed: true }
    ]
  },
  {
    start: Date.now() - (1000 * 60 * 60 * 24 * 6), // 6 days ago
    end: Date.now() - (1000 * 60 * 60 * 24 * 6 + 5400000),
    duration: 90,
    goal: "Full stack implementation",
    music: "1_G60OdEzXs",
    projectId: simulatedProjects[0].id, // Work Project
    projectName: simulatedProjects[0].name,
    todos: [
      { text: "Connect database", completed: true },
      { text: "Set up API routes", completed: true },
      { text: "Implement frontend", completed: false }
    ]
  },
  {
    start: Date.now() - (1000 * 60 * 60 * 24 * 6) + 10000, // Also 6 days ago
    end: Date.now() - (1000 * 60 * 60 * 24 * 6 + 3600000),
    duration: 45,
    goal: "Continue React course",
    music: "jfKfPfyJRdk",
    projectId: simulatedProjects[2].id, // Learning
    projectName: simulatedProjects[2].name,
    todos: [
      { text: "Complete module 3", completed: true },
      { text: "Start module 4", completed: true }
    ]
  }
];

// Store simulated history data
localStorage.setItem('sessionHistory', JSON.stringify(simulatedData));

console.log('Simulated data has been loaded!');
console.log('Projects:', simulatedProjects.length);
console.log('History entries:', simulatedData.length);