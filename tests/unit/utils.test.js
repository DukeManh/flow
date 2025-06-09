import { formatTime, formatDateTime, getPresetDisplayName, updateDocumentTitle } from '../../js/utils.js';

describe('Utils Module', () => {
  test('formatTime converts seconds to MM:SS', () => {
    expect(formatTime(125)).toBe('02:05');
  });

  test('formatDateTime formats timestamp correctly', () => {
    const ts = Date.UTC(2025, 0, 2, 3, 4); // 2025-01-02T03:04:00Z
    expect(formatDateTime(ts)).toBe('2025-01-02, 03:04');
  });

  test('getPresetDisplayName returns expected labels', () => {
    expect(getPresetDisplayName('pomodoro')).toBe('Pomodoro');
    expect(getPresetDisplayName('deepWork')).toBe('Deep Work');
    expect(getPresetDisplayName('unknown')).toBe('52/17 Rule');
  });

  test('updateDocumentTitle sets document title', () => {
    updateDocumentTitle({ remainingTime: 60, onBreak: false, currentPreset: 'pomodoro' });
    expect(document.title).toBe('01:00 - Pomodoro');
  });
});
