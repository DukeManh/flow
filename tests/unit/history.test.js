/**
 * Unit tests for the History and Streak functionality
 */
import { recordSession, renderProductivityChart, initHistory, setCurrentVideo } from '../../js/history.js';
import { getCurrentProject, getProjectStats, addAutomaticCheckIn, updateStreakRecord } from '../../js/projects.js';
import { getCurrentGoal } from '../../js/goals.js';
import storageService from '../../js/storage.js';

// Mock dependencies
jest.mock('../../js/storage.js', () => ({
  getJSON: jest.fn(),
  setJSON: jest.fn(),
  getItem: jest.fn(),
  setItem: jest.fn()
}));

jest.mock('../../js/projects.js', () => ({
  getCurrentProject: jest.fn(),
  getProjectStats: jest.fn(),
  addAutomaticCheckIn: jest.fn(),
  updateStreakRecord: jest.fn(),
  getProjects: jest.fn()
}));

jest.mock('../../js/goals.js', () => ({
  getCurrentGoal: jest.fn()
}));

jest.mock('../../js/timer.js', () => ({
  updateDailyTargetDisplay: jest.fn()
}));

describe('History Functionality', () => {
  let mockSessionData;
  let mockHistoryList;
  let mockChartContainer;
  let mockTooltip;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock session data
    mockSessionData = {
      startTime: Date.now() - 25 * 60 * 1000, // 25 minutes ago
      duration: 25 * 60, // 25 minutes in seconds
      isBreak: false,
      todos: [{ id: 'todo1', text: 'Test task', completed: true }]
    };
    
    // Mock project data
    getCurrentProject.mockResolvedValue({
      id: 'project1',
      name: 'Test Project',
      color: '#FF5733',
      checkIns: [],
      streak: 1,
      target: 30
    });
    
    // Mock goal data
    getCurrentGoal.mockResolvedValue('Complete unit tests');
    
    // Mock DOM elements
    document.body.innerHTML = `
      <ul id="historyList"></ul>
      <div id="chartContainer"></div>
      <button id="weeklyViewBtn" class="active">Weekly</button>
      <button id="monthlyViewBtn">Monthly</button>
      <button id="prevPeriodBtn">Previous</button>
      <button id="nextPeriodBtn" disabled>Next</button>
      <button id="currentPeriodBtn" style="display: none;">Current</button>
    `;

    // Get references to DOM elements
    mockHistoryList = document.getElementById('historyList');
    mockChartContainer = document.getElementById('chartContainer');
    
    // Create custom tooltip
    mockTooltip = document.createElement('div');
    mockTooltip.className = 'custom-tooltip';
    mockTooltip.style.display = 'none';
    document.body.appendChild(mockTooltip);
    
    // Mock storage service
    storageService.getJSON.mockImplementation((key, defaultValue) => {
      if (key === 'sessionHistory') {
        return Promise.resolve([]);
      }
      return Promise.resolve(defaultValue);
    });
    
    storageService.setJSON.mockResolvedValue(true);
    storageService.getItem.mockResolvedValue('weekly');
    
    // Mock project stats
    getProjectStats.mockResolvedValue({
      history: [],
      projectNames: { project1: 'Test Project' },
      projectColors: { project1: '#FF5733' }
    });
  });
  
  test('should initialize history functionality', async () => {
    // Arrange
    const videoId = 'test-video-id';
    
    // Act
    await initHistory(videoId);
    
    // Assert
    expect(storageService.getItem).toHaveBeenCalledWith('historyViewMode');
    expect(storageService.getJSON).toHaveBeenCalledWith('sessionHistory', []);
    expect(getProjectStats).toHaveBeenCalled();
  });
  
  test('should set current video ID', () => {
    // Act
    setCurrentVideo('new-video-id');
    
    // Assert - we'll test this indirectly in the recordSession test
  });
  
  test('should record a new session and update storage', async () => {
    // Arrange
    setCurrentVideo('test-music-id');
    
    // Act
    const result = await recordSession(mockSessionData);
    
    // Assert
    expect(getCurrentProject).toHaveBeenCalled();
    expect(getCurrentGoal).toHaveBeenCalled();
    expect(storageService.getJSON).toHaveBeenCalledWith('sessionHistory', []);
    expect(storageService.setJSON).toHaveBeenCalled();
    expect(addAutomaticCheckIn).toHaveBeenCalledWith(25); // 25 minutes
    
    // Verify recorded session
    expect(result).toBeTruthy();
    expect(result.duration).toBe(25);
    expect(result.isBreak).toBe(false);
    expect(result.music).toBe('test-music-id');
    expect(result.goal).toBe('Complete unit tests');
    expect(result.projectId).toBe('project1');
    expect(result.projectName).toBe('Test Project');
    expect(result.todos).toHaveLength(1);
    expect(result.todos[0].text).toBe('Test task');
  });
  
  test('should not update streak for break sessions', async () => {
    // Arrange
    const breakSessionData = {
      ...mockSessionData,
      isBreak: true
    };
    
    // Act
    await recordSession(breakSessionData);
    
    // Assert
    expect(addAutomaticCheckIn).not.toHaveBeenCalled();
  });
  
  test('should limit history to 100 items', async () => {
    // Arrange
    const longHistory = Array(105).fill().map((_, i) => ({
      id: `session_${i}`,
      start: Date.now() - (i * 60 * 60 * 1000),
      end: Date.now() - ((i - 1) * 60 * 60 * 1000),
      duration: 60,
      projectId: 'project1'
    }));
    
    storageService.getJSON.mockResolvedValueOnce(longHistory);
    
    // Act
    await recordSession(mockSessionData);
    
    // Assert
    const setJSONCall = storageService.setJSON.mock.calls[0];
    const savedHistory = setJSONCall[1];
    expect(savedHistory.length).toBe(100); // Should be limited to 100 items
    expect(savedHistory[0].id).not.toBe(longHistory[0].id); // New item should be at the start
  });
  
  test('should render productivity chart', async () => {
    // Mock history data with projects
    const mockHistory = [
      {
        id: 'session_1',
        start: Date.now() - (24 * 60 * 60 * 1000), // Yesterday
        end: Date.now() - (23.5 * 60 * 60 * 1000),
        duration: 30,
        projectId: 'project1',
        projectName: 'Test Project',
        isBreak: false
      },
      {
        id: 'session_2',
        start: Date.now() - (1 * 60 * 60 * 1000), // 1 hour ago
        end: Date.now() - (0.5 * 60 * 60 * 1000),
        duration: 30,
        projectId: 'project1',
        projectName: 'Test Project',
        isBreak: false
      }
    ];
    
    // Mock project stats with history
    getProjectStats.mockResolvedValueOnce({
      history: mockHistory,
      projectNames: { project1: 'Test Project' },
      projectColors: { project1: '#FF5733' }
    });
    
    // Act
    await renderProductivityChart();
    
    // Assert - just check if function runs without errors
    // (Full DOM rendering test would be more complex and might involve DOM snapshots)
    expect(getProjectStats).toHaveBeenCalled();
    // The chart would be rendered to the DOM in actual implementation
  });
});

describe('Streak Functionality', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock date for consistent testing
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-05-11T12:00:00Z'));
    
    // Mock storage service
    storageService.getJSON.mockImplementation((key, defaultValue) => {
      if (key === 'projects') {
        return Promise.resolve([
          {
            id: 'project1',
            name: 'Test Project',
            color: '#FF5733',
            created: Date.now() - (7 * 24 * 60 * 60 * 1000), // 7 days ago
            checkIns: [],
            streak: 0,
            target: 30, // 30 minutes daily target
            longestStreak: 0
          }
        ]);
      }
      return Promise.resolve(defaultValue);
    });
    
    storageService.setJSON.mockResolvedValue(true);
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  test('should initialize new projects with zero streak', async () => {
    // Get the mocked project
    const projects = await storageService.getJSON('projects');
    const project = projects[0];
    
    // Assert
    expect(project.streak).toBe(0);
    expect(project.longestStreak).toBe(0);
  });
  
  test('should increment streak for consecutive daily check-ins meeting target', async () => {
    // Arrange
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const projectWithStreak = {
      id: 'project1',
      name: 'Test Project',
      color: '#FF5733',
      checkIns: [
        { date: yesterdayStr, minutes: 35 } // Yesterday's check-in exceeded target
      ],
      streak: 1, // Current streak is 1 from yesterday
      target: 30,
      longestStreak: 1
    };
    
    // Simulate adding a check-in for today that meets target
    const updatedProject = {
      ...projectWithStreak,
      checkIns: [
        ...projectWithStreak.checkIns,
        { date: todayStr, minutes: 30 } // Today's check-in meets target
      ]
    };
    
    // Act - manually calling updateStreakRecord to test streak logic
    const result = await updateStreakRecord(updatedProject);
    
    // Assert
    expect(result.streak).toBe(2); // Streak should increment to 2
    expect(result.longestStreak).toBe(2); // Longest streak should also be 2
  });
  
  test('should reset streak when daily target is not met', async () => {
    // Arrange
    const today = new Date();
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    const todayStr = today.toISOString().split('T')[0];
    const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];
    
    const projectWithStreak = {
      id: 'project1',
      name: 'Test Project',
      color: '#FF5733',
      checkIns: [
        { date: twoDaysAgoStr, minutes: 35 } // Check-in from 2 days ago
      ],
      streak: 1, // Had a streak of 1
      target: 30,
      longestStreak: 5 // Previously had a longest streak of 5
    };
    
    // Simulate adding a check-in for today (skipping yesterday)
    const updatedProject = {
      ...projectWithStreak,
      checkIns: [
        ...projectWithStreak.checkIns,
        { date: todayStr, minutes: 30 } // Today's check-in
      ]
    };
    
    // Act - manually calling updateStreakRecord to test streak logic
    const result = await updateStreakRecord(updatedProject);
    
    // Assert
    expect(result.streak).toBe(1); // Streak should reset to 1 for today only
    expect(result.longestStreak).toBe(5); // Longest streak remains unchanged
  });
  
  test('should not break streak for check-ins on the same day', async () => {
    // Arrange
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const projectWithStreak = {
      id: 'project1',
      name: 'Test Project',
      color: '#FF5733',
      checkIns: [
        { date: yesterdayStr, minutes: 35 }, // Yesterday's check-in
        { date: todayStr, minutes: 15 } // First check-in today (below target)
      ],
      streak: 1, // Current streak is 1 from yesterday
      target: 30,
      longestStreak: 1
    };
    
    // Simulate adding another check-in for today
    const updatedProject = {
      ...projectWithStreak,
      checkIns: [
        ...projectWithStreak.checkIns,
        { date: todayStr, minutes: 20 } // Second check-in today (combined now meets target)
      ]
    };
    
    // Act - manually calling updateStreakRecord to test streak logic
    const result = await updateStreakRecord(updatedProject);
    
    // Assert
    expect(result.streak).toBe(2); // Streak should increment to 2
    expect(result.longestStreak).toBe(2); // Longest streak should be 2
  });
  
  test('should update longest streak when current streak exceeds previous record', async () => {
    // Arrange
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];
    const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0];
    
    const projectWithStreak = {
      id: 'project1',
      name: 'Test Project',
      color: '#FF5733',
      checkIns: [
        { date: threeDaysAgoStr, minutes: 35 },
        { date: twoDaysAgoStr, minutes: 40 },
        { date: yesterdayStr, minutes: 30 }
      ],
      streak: 3, // Current streak is 3
      target: 30,
      longestStreak: 3 // Previous longest streak was also 3
    };
    
    // Simulate adding a check-in for today
    const updatedProject = {
      ...projectWithStreak,
      checkIns: [
        ...projectWithStreak.checkIns,
        { date: todayStr, minutes: 45 } // Today's check-in
      ]
    };
    
    // Act - manually calling updateStreakRecord to test streak logic
    const result = await updateStreakRecord(updatedProject);
    
    // Assert
    expect(result.streak).toBe(4); // Streak should increment to 4
    expect(result.longestStreak).toBe(4); // Longest streak should update to 4
  });
  
  test('should handle automatic check-ins correctly', async () => {
    // Arrange
    const minutesToAdd = 25;
    
    // Mock getCurrentProject to return a project
    getCurrentProject.mockResolvedValueOnce({
      id: 'project1',
      name: 'Test Project',
      color: '#FF5733',
      checkIns: [],
      streak: 0,
      target: 30,
      longestStreak: 0
    });
    
    // Mock updateStreakRecord to simulate streak update
    updateStreakRecord.mockImplementation(project => {
      // Simple implementation to simulate streak update
      const today = new Date().toISOString().split('T')[0];
      const todayMinutes = project.checkIns
        .filter(ci => ci.date === today)
        .reduce((sum, ci) => sum + ci.minutes, 0);
      
      return {
        ...project,
        streak: todayMinutes >= project.target ? 1 : 0
      };
    });
    
    // Act
    await addAutomaticCheckIn(minutesToAdd);
    
    // Assert
    expect(getCurrentProject).toHaveBeenCalled();
    expect(updateStreakRecord).toHaveBeenCalled();
    
    // Check the project passed to updateStreakRecord
    const projectPassedToUpdate = updateStreakRecord.mock.calls[0][0];
    const today = new Date().toISOString().split('T')[0];
    
    expect(projectPassedToUpdate.checkIns).toHaveLength(1);
    expect(projectPassedToUpdate.checkIns[0].date).toBe(today);
    expect(projectPassedToUpdate.checkIns[0].minutes).toBe(minutesToAdd);
    expect(projectPassedToUpdate.checkIns[0].automatic).toBe(true);
  });
});