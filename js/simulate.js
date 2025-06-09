// Simulation script for Flow State app
// This generates mock project and session data for testing

// Simulated project data
const simulatedProjects = [
  {
    id: 'project_1682551231000',
    name: 'Work Project',
    color: '#5D8AA8', // Air Force Blue
    createdAt: Date.now() - (1000 * 60 * 60 * 24 * 30),
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
    createdAt: Date.now() - (1000 * 60 * 60 * 24 * 28),
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
    createdAt: Date.now() - (1000 * 60 * 60 * 24 * 25),
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
    createdAt: Date.now() - (1000 * 60 * 60 * 24 * 20),
    goal: 'Build MVP for client',
    todos: [
      { text: "Design user interface mockups", completed: true },
      { text: "Set up project repository", completed: true },
      { text: "Create database schema", completed: true },
      { text: "Implement authentication system", completed: false },
      { text: "Deploy demo to staging environment", completed: false }
    ]
  },
  {
    id: 'project_1682551235000',
    name: 'Health & Fitness',
    color: '#FF7F50', // Coral
    createdAt: Date.now() - (1000 * 60 * 60 * 24 * 15),
    goal: 'Establish consistent workout routine',
    todos: [
      { text: "Create weekly workout schedule", completed: true },
      { text: "Research nutrition plan", completed: true },
      { text: "Set up progress tracking system", completed: false },
      { text: "Find workout buddy", completed: false },
      { text: "Buy new exercise equipment", completed: false }
    ]
  }
];

// Store simulated projects
localStorage.setItem('flowProjects', JSON.stringify(simulatedProjects));
localStorage.setItem('currentProjectId', simulatedProjects[0].id);

// Music options for simulated sessions (YouTube video IDs)
const musicOptions = [
  'wL8DVHuWI7Y', // lofi hip hop
  '1_G60OdEzXs', // relaxing music
  'jfKfPfyJRdk', // lofi girl
  '5qap5aO4i9A', // lofi beats
  'DWcJFNfaw9c'  // piano music
];

// Common goals for each project
const projectGoals = {
  [simulatedProjects[0].id]: [
    "Sprint planning", 
    "Code review", 
    "Bug fixing", 
    "Feature implementation", 
    "Documentation", 
    "Client meeting prep",
    "API development",
    "UI refinement"
  ],
  [simulatedProjects[1].id]: [
    "Website redesign", 
    "Add new portfolio items", 
    "Blog writing", 
    "SEO optimization", 
    "Update contact form",
    "Social media integration",
    "Improve responsive layout"
  ],
  [simulatedProjects[2].id]: [
    "Complete React tutorial", 
    "Study algorithms", 
    "Practice coding problems", 
    "Watch educational videos", 
    "Read documentation",
    "Build sample projects",
    "Take notes on new concepts"
  ],
  [simulatedProjects[3].id]: [
    "Client mockups", 
    "MVP development", 
    "Email marketing", 
    "Pitch deck creation", 
    "Financial planning",
    "Market research",
    "User testing"
  ],
  [simulatedProjects[4].id]: [
    "Workout session", 
    "Meal planning", 
    "Progress tracking", 
    "Research new exercises", 
    "Meditation practice",
    "Recovery planning",
    "Goal setting"
  ]
};

// Sample todos for each project
const projectTodos = {
  [simulatedProjects[0].id]: [
    ["Update documentation", "Fix bug in login page"],
    ["Create API endpoint", "Update database schema"],
    ["Code review for PR #123", "Fix failing tests"],
    ["Implement user profile", "Add validation for forms"],
    ["Team meeting notes", "Set up CI/CD pipeline"]
  ],
  [simulatedProjects[1].id]: [
    ["Update bio section", "Add new project showcase"],
    ["Optimize images", "Fix mobile layout"],
    ["Write new blog post", "Update contact information"],
    ["Add analytics tracking", "Improve page load speed"],
    ["Design new logo", "Update color scheme"]
  ],
  [simulatedProjects[2].id]: [
    ["Complete module 3 exercises", "Watch tutorial videos"],
    ["Implement sample app", "Read React documentation"],
    ["Practice with hooks", "Learn about Redux"],
    ["Solve coding challenge", "Take notes on new concepts"],
    ["Research best practices", "Set up test environment"]
  ],
  [simulatedProjects[3].id]: [
    ["Create wireframes", "Client call notes"],
    ["Develop login page", "Set up database"],
    ["Design logo options", "Create pricing structure"],
    ["Compile market research", "Build demo for client"],
    ["Outline marketing strategy", "Define MVP features"]
  ],
  [simulatedProjects[4].id]: [
    ["Research protein intake", "Plan weekly workouts"],
    ["Track measurements", "Create progress chart"],
    ["Research supplements", "Plan grocery list"],
    ["Schedule workout sessions", "Set monthly goals"],
    ["Find healthy recipes", "Research recovery techniques"]
  ]
};

// Generate random session data for the past 30 days
function generateSimulatedHistory(days = 30) {
  const history = [];
  const now = Date.now();
  
  // Generate sessions for each day
  for (let day = 0; day < days; day++) {
    // Calculate the date for this day (days ago from now)
    const dayStart = now - (1000 * 60 * 60 * 24 * day);
    
    // Generate random number of sessions per day (0-4)
    // More likely to have sessions on weekdays, fewer on weekends
    const dayOfWeek = new Date(dayStart).getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Determine session count based on day of week (more on weekdays)
    const sessionCount = isWeekend 
      ? Math.floor(Math.random() * 3) // 0-2 sessions on weekends
      : Math.floor(Math.random() * 4) + 1; // 1-4 sessions on weekdays
    
    // Generate each session for this day
    for (let s = 0; s < sessionCount; s++) {
      // Randomly select a project (with some weighting toward work projects on weekdays)
      let projectIndex;
      if (isWeekend) {
        // More personal projects on weekends
        projectIndex = Math.floor(Math.random() * simulatedProjects.length);
      } else {
        // More work on weekdays - higher chance of work project
        const workProjectBias = Math.random() < 0.6;
        projectIndex = workProjectBias ? 0 : Math.floor(Math.random() * simulatedProjects.length);
      }
      
      const project = simulatedProjects[projectIndex];
      
      // Randomize session start time within the day
      // Spread throughout waking hours (8am - 10pm)
      const wakeHours = isWeekend ? 10 : 8; // Wake up later on weekends
      const startHour = wakeHours + Math.floor(Math.random() * 14);
      const startMinute = Math.floor(Math.random() * 60);
      
      const dayDate = new Date(dayStart);
      dayDate.setHours(startHour, startMinute, 0, 0);
      const sessionStart = dayDate.getTime();
      
      // Randomize duration (15-90 minutes)
      // Slightly longer sessions for work projects
      const minDuration = 15;
      const maxDuration = project.id === simulatedProjects[0].id ? 90 : 60;
      const duration = minDuration + Math.floor(Math.random() * (maxDuration - minDuration + 1));
      
      // Calculate end time
      const sessionEnd = sessionStart + (duration * 60 * 1000);
      
      // Select a random goal for the project
      const goals = projectGoals[project.id];
      const goal = goals[Math.floor(Math.random() * goals.length)];
      
      // Select random todos for the project
      const todoOptions = projectTodos[project.id];
      const todoSet = todoOptions[Math.floor(Math.random() * todoOptions.length)];
      
      // Determine if todos are completed (more likely if session was longer)
      const todos = todoSet.map(text => {
        // Longer sessions have higher completion probability
        const completionProbability = duration > 45 ? 0.8 : 0.5;
        return { 
          text, 
          completed: Math.random() < completionProbability
        };
      });
      
      // Select random music
      const music = musicOptions[Math.floor(Math.random() * musicOptions.length)];
      
      // Create session object
      const session = {
        start: sessionStart,
        end: sessionEnd,
        duration,
        goal,
        music,
        projectId: project.id,
        projectName: project.name,
        todos
      };
      
      history.push(session);
    }
  }
  
  // Sort by start time (most recent first)
  history.sort((a, b) => b.start - a.start);
  
  return history;
}

// Generate streak data for projects based on session history
function generateProjectStreaks(sessionHistory) {
  const streakData = {};
  const projectDays = {};
  
  // Initialize project days tracking
  simulatedProjects.forEach(project => {
    projectDays[project.id] = {};
  });
  
  // Process session history to determine which days each project had activity
  sessionHistory.forEach(session => {
    const projectId = session.projectId;
    const sessionDate = new Date(session.start);
    const dateStr = sessionDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Mark this day as having activity for this project
    if (projectDays[projectId]) {
      projectDays[projectId][dateStr] = true;
    }
  });
  
  // Calculate streaks for each project based on the activity days
  simulatedProjects.forEach(project => {
    const projectId = project.id;
    const days = projectDays[projectId];
    const calendarData = {};
    
    // Get sorted dates to calculate streaks properly
    const sortedDates = Object.keys(days).sort();
    
    // Fill in the last 30 days for the calendar
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      calendarData[dateStr] = days[dateStr] || false;
    }
    
    // Calculate current streak (consecutive days from today/yesterday backward)
    let currentStreak = 0;
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayDate = new Date();
    yesterdayDate.setDate(today.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];
    
    // Check if streak includes today or yesterday (to allow for not having logged today yet)
    const hasToday = days[todayStr];
    const hasYesterday = days[yesterdayStr];
    
    // Start counting from today or yesterday, whichever makes sense
    let currentDay = hasToday ? todayStr : (hasYesterday ? yesterdayStr : null);
    
    if (currentDay) {
      currentStreak = 1; // Start with 1 for today/yesterday
      
      // Count backwards from the starting day
      let checkDate = new Date(currentDay);
      checkDate.setDate(checkDate.getDate() - 1);
      
      while (true) {
        const checkDateStr = checkDate.toISOString().split('T')[0];
        if (days[checkDateStr]) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }
    
    // Calculate highest streak
    let highestStreak = 0;
    let currentCount = 0;
    let streakStart = null;
    let streakEnd = null;
    let highestStreakStart = null;
    let highestStreakEnd = null;
    
    for (let i = 0; i < sortedDates.length; i++) {
      const currentDate = sortedDates[i];
      
      if (i === 0) {
        // Start first streak
        currentCount = 1;
        streakStart = currentDate;
        streakEnd = currentDate;
      } else {
        // Check if this date is consecutive with previous
        const prevDate = new Date(sortedDates[i-1]);
        const currDate = new Date(currentDate);
        prevDate.setDate(prevDate.getDate() + 1);
        
        if (prevDate.toISOString().split('T')[0] === currDate.toISOString().split('T')[0]) {
          // Consecutive day, extend streak
          currentCount++;
          streakEnd = currentDate;
        } else {
          // Streak broken, check if it was the highest
          if (currentCount > highestStreak) {
            highestStreak = currentCount;
            highestStreakStart = streakStart;
            highestStreakEnd = streakEnd;
          }
          
          // Start new streak
          currentCount = 1;
          streakStart = currentDate;
          streakEnd = currentDate;
        }
      }
    }
    
    // Check if the final streak is the highest
    if (currentCount > highestStreak) {
      highestStreak = currentCount;
      highestStreakStart = streakStart;
      highestStreakEnd = streakEnd;
    }
    
    // Count total days with check-ins
    const totalDaysWithCheckin = Object.keys(days).length;
    
    // Store streak data for this project
    streakData[projectId] = {
      currentStreak,
      highestStreak,
      highestStreakStart: highestStreakStart || null,
      highestStreakEnd: highestStreakEnd || null,
      totalDaysWithCheckin,
      calendar: calendarData
    };
  });
  
  return streakData;
}

// Generate and store simulated history data
const simulatedData = generateSimulatedHistory(70);
localStorage.setItem('sessionHistory', JSON.stringify(simulatedData));

// Generate streak data based on the session history
const streakData = generateProjectStreaks(simulatedData);
localStorage.setItem('streakData', JSON.stringify(streakData));

console.log('Simulated data has been loaded!');
console.log('Projects:', simulatedProjects.length);
console.log('History entries:', simulatedData.length);
console.log('Streak data generated for', Object.keys(streakData).length, 'projects');

// Log breakdown of sessions by project
const projectCounts = {};
simulatedProjects.forEach(p => projectCounts[p.name] = 0);

simulatedData.forEach(session => {
  projectCounts[session.projectName] = (projectCounts[session.projectName] || 0) + 1;
});

console.log('Sessions by project:');
Object.entries(projectCounts).forEach(([project, count]) => {
  console.log(`- ${project}: ${count} sessions`);
});

// Log date range
const oldestDate = new Date(simulatedData[simulatedData.length - 1].start);
const newestDate = new Date(simulatedData[0].start);
console.log(`Date range: ${oldestDate.toLocaleDateString()} to ${newestDate.toLocaleDateString()}`);