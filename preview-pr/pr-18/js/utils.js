// Format seconds to MM:SS display format
export function formatTime(seconds) {
  return String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + 
         String(seconds % 60).padStart(2, '0');
}

// Format datetime for history display
export function formatDateTime(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}, ${hours}:${minutes}`;
}

// Get timer preset display name
export function getPresetDisplayName(presetKey) {
  switch(presetKey) {
    case 'pomodoro':
      return 'Pomodoro';
    case 'deepWork':
      return 'Deep Work';
    case 'custom':
      return 'Custom';
    default:
      return '52/17 Rule';
  }
}

// Update document title with timer information
export function updateDocumentTitle(params) {
  const { 
    remainingTime,
    onBreak,
    currentPreset,
  } = params;
  
  const presetName = getPresetDisplayName(currentPreset);
  const modeName = onBreak ? "Break Time!" : `${presetName}`;
  document.title = `${formatTime(remainingTime)} - ${modeName}`;
}