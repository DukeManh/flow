// Constants for the Flow State app

// Timer preset constants
export const TIMER_PRESETS = {
  default: { name: '52/17 (Recommended)', work: 52 * 60, break: 17 * 60 },
  pomodoro: { name: '25/5 (Pomodoro)', work: 25 * 60, break: 5 * 60 },
  deepWork: { name: '90/20 (Deep Work)', work: 90 * 60, break: 20 * 60 },
  starter: { name: '5/5 (Starter)', work: 5 * 60, break: 5 * 60 },
  custom: { name: 'Custom', work: 25 * 60, break: 5 * 60 } // Default values for custom preset
};

// Default timer values
export const WORK = TIMER_PRESETS.default.work; // 52 minutes in seconds
export const BREAK = TIMER_PRESETS.default.break; // 17 minutes in seconds

// YouTube Video IDs
export const REBOOT_VIDEO_ID = 'wL8DVHuWI7Y';
export const BINAURAL_40HZ_VIDEO_ID = '1_G60OdEzXs';
export const BINAURAL_60HZ_VIDEO_ID = 'DHGPl4vJXU4';
export const LOFI_VIDEO_ID = 'jfKfPfyJRdk';
export const WHITE_NOISE_VIDEO_ID = 'nMfPqeZjc2c';
export const TICKING_VIDEO_ID = 'xyCQFLOSWGc';

// Music labels for readable display
export const musicLabels = {
  [BINAURAL_40HZ_VIDEO_ID]: '40Hz Binaural',
  [BINAURAL_60HZ_VIDEO_ID]: '60Hz Binaural',
  [LOFI_VIDEO_ID]: 'lofi hip hop',
  [WHITE_NOISE_VIDEO_ID]: 'White Noise',
  [TICKING_VIDEO_ID]: 'Clock Ticking',
  [REBOOT_VIDEO_ID]: 'Memory Reboot',
};

// Max session duration (3 hours in minutes)
export const MAX_DURATION_MINUTES = 180;