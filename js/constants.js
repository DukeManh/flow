// Constants for the Flow State app

// Timer constants
export const WORK = 52 * 60; // 52 minutes in seconds
export const BREAK = 17 * 60; // 17 minutes in seconds

// YouTube Video IDs
export const REBOOT_VIDEO_ID = 'wL8DVHuWI7Y';
export const BEATS_VIDEO_ID = '1_G60OdEzXs';
export const LOFI_VIDEO_ID = 'sF80I-TQiW0';
export const WHITE_NOISE_VIDEO_ID = 'nMfPqeZjc2c';
export const TICKING_VIDEO_ID = 'xyCQFLOSWGc';

// Music labels for readable display
export const musicLabels = {
  [BEATS_VIDEO_ID]: 'Binaural Beats',
  [LOFI_VIDEO_ID]: 'Chill Study Beats',
  [WHITE_NOISE_VIDEO_ID]: 'White Noise',
  [TICKING_VIDEO_ID]: 'Ticking',
  [REBOOT_VIDEO_ID]: 'Memory Reboot',
};

// Max session duration (3 hours in minutes)
export const MAX_DURATION_MINUTES = 180;