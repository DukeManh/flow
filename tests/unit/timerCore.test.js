/**
 * Unit tests for the Timer Core functionality
 */
import { TimerCore, createTimerState } from '../../js/timerCore.js';
import { TIMER_PRESETS } from '../../js/constants.js';

// Mock the sound module
jest.mock('../../js/sound.js', () => ({
  playSound: jest.fn(),
  getStartSound: jest.fn(() => ({ play: jest.fn() })),
  getEndSound: jest.fn(() => ({ play: jest.fn() })),
  getPauseSound: jest.fn(() => ({ play: jest.fn() }))
}));

describe('TimerCore', () => {
  let timerCore;
  let mockUpdateFn;
  let mockCompleteFn;
  
  beforeEach(() => {
    jest.useFakeTimers();
    mockUpdateFn = jest.fn();
    mockCompleteFn = jest.fn();
    timerCore = new TimerCore(mockUpdateFn, mockCompleteFn);
    
    // Mock DOM elements
    document.body.innerHTML = `
      <div id="timer">00:00</div>
      <div id="progress" style="width: 0%"></div>
    `;
  });
  
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });
  
  test('should initialize with default state', () => {
    expect(timerCore.state).toEqual(createTimerState());
    expect(timerCore.state.isRunning).toBe(false);
    expect(timerCore.state.workDuration).toBe(TIMER_PRESETS.default.work);
    expect(timerCore.state.breakDuration).toBe(TIMER_PRESETS.default.break);
  });
  
  test('should update state when start is called', () => {
    timerCore.start();
    expect(timerCore.state.isRunning).toBe(true);
    expect(timerCore.state.startTime).not.toBeNull();
  });
  
  test('should update state when pause is called', () => {
    timerCore.start();
    timerCore.pause();
    expect(timerCore.state.isRunning).toBe(false);
  });
  
  test('should reset the timer state', () => {
    timerCore.start();
    jest.advanceTimersByTime(5000); // Advance 5 seconds
    timerCore.reset();
    expect(timerCore.state.isRunning).toBe(false);
    expect(timerCore.state.remainingTime).toBe(TIMER_PRESETS.default.work);
  });
  
  test('should call update function with correct values', () => {
    timerCore.start();
    jest.advanceTimersByTime(1000); // Advance 1 second
    expect(mockUpdateFn).toHaveBeenCalled();
    // First parameter should be the formatted time string
    expect(mockUpdateFn.mock.calls[0][0]).toMatch(/\d+:\d+/);
    // Second parameter should be the progress percentage
    expect(mockUpdateFn.mock.calls[0][1]).toBeGreaterThanOrEqual(0);
    expect(mockUpdateFn.mock.calls[0][1]).toBeLessThanOrEqual(100);
  });
  
  test('should call complete function when timer reaches zero', () => {
    // Set a shorter duration for testing
    timerCore.state.remainingTime = 2;
    timerCore.start();
    jest.advanceTimersByTime(2000); // Advance 2 seconds
    expect(mockCompleteFn).toHaveBeenCalled();
  });
  
  test('should toggle between work and break sessions', () => {
    // Set a short work duration
    timerCore.state.remainingTime = 2;
    timerCore.state.workDuration = 2;
    timerCore.state.breakDuration = 3;
    
    // Start work session
    timerCore.start();
    expect(timerCore.state.onBreak).toBe(false);
    
    // Complete work session
    jest.advanceTimersByTime(2000); // Advance 2 seconds
    expect(mockCompleteFn).toHaveBeenCalledTimes(1);
    expect(timerCore.state.onBreak).toBe(true);
    expect(timerCore.state.remainingTime).toBe(3); // Break duration
    
    // Reset mock and start break session
    mockCompleteFn.mockClear();
    timerCore.start();
    
    // Complete break session
    jest.advanceTimersByTime(3000); // Advance 3 seconds
    expect(mockCompleteFn).toHaveBeenCalledTimes(1);
    expect(timerCore.state.onBreak).toBe(false);
    expect(timerCore.state.remainingTime).toBe(2); // Back to work duration
  });
  
  test('should use custom timer presets', () => {
    timerCore.changePreset('pomodoro');
    expect(timerCore.state.workDuration).toBe(TIMER_PRESETS.pomodoro.work);
    expect(timerCore.state.breakDuration).toBe(TIMER_PRESETS.pomodoro.break);
    expect(timerCore.state.remainingTime).toBe(TIMER_PRESETS.pomodoro.work);
  });
});