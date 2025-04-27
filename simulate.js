const simulatedData = [
  {
    start: Date.now() - (1000 * 60 * 60 * 24 * 0), // Today
    end: Date.now() - (1000 * 60 * 60 * 23),
    duration: 45,
    goal: "Complete project documentation",
    music: "wL8DVHuWI7Y",
    todos: [
      { text: "Write introduction", completed: true },
      { text: "Add code examples", completed: true }
    ]
  },
  {
    start: Date.now() - (1000 * 60 * 60 * 24 * 1), // Yesterday
    end: Date.now() - (1000 * 60 * 60 * 24 * 1 + 3600000),
    duration: 60,
    goal: "Frontend development",
    music: "1_G60OdEzXs",
    todos: [
      { text: "Style navigation bar", completed: true },
      { text: "Fix responsive layout", completed: false }
    ]
  },
  {
    start: Date.now() - (1000 * 60 * 60 * 24 * 2), // 2 days ago
    end: Date.now() - (1000 * 60 * 60 * 24 * 2 + 1800000),
    duration: 30,
    goal: "Bug fixing",
    music: "wL8DVHuWI7Y",
    todos: [
      { text: "Fix login issue", completed: true }
    ]
  },
  {
    start: Date.now() - (1000 * 60 * 60 * 24 * 3), // 3 days ago
    end: Date.now() - (1000 * 60 * 60 * 24 * 3 + 4200000),
    duration: 70,
    goal: "Research new features",
    music: "1_G60OdEzXs",
    todos: [
      { text: "Explore AI integration", completed: true },
      { text: "Test new API", completed: true }
    ]
  },
  {
    start: Date.now() - (1000 * 60 * 60 * 24 * 5), // 5 days ago
    end: Date.now() - (1000 * 60 * 60 * 24 * 5 + 3000000),
    duration: 50,
    goal: "Planning sprint",
    music: "wL8DVHuWI7Y",
    todos: [
      { text: "Create JIRA tickets", completed: true },
      { text: "Assign priorities", completed: true }
    ]
  },
  {
    start: Date.now() - (1000 * 60 * 60 * 24 * 6), // 6 days ago
    end: Date.now() - (1000 * 60 * 60 * 24 * 6 + 5400000),
    duration: 90,
    goal: "Full stack implementation",
    music: "1_G60OdEzXs",
    todos: [
      { text: "Connect database", completed: true },
      { text: "Set up API routes", completed: true },
      { text: "Implement frontend", completed: false }
    ]
  }
];

localStorage.setItem('sessionHistory', JSON.stringify(simulatedData));