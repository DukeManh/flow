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