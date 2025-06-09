import { initMusic, getCurrentVideoID } from '../../js/music.js';
import { LOFI_VIDEO_ID, WHITE_NOISE_VIDEO_ID } from '../../js/constants.js';
import storageService from '../../js/storage.js';
import { initAdBlocker } from '../../js/adBlocker.js';
import { setCurrentVideo } from '../../js/history.js';

jest.mock('../../js/storage.js', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock('../../js/adBlocker.js', () => ({
  initAdBlocker: jest.fn(),
}));

jest.mock('../../js/history.js', () => ({
  setCurrentVideo: jest.fn(),
}));

describe('Music Module', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <iframe id="ytPlayer"></iframe>
      <input id="customVidInput" />
      <button id="vBtn"></button>
      <button id="b4Btn"></button>
      <button id="b6Btn"></button>
      <button id="lBtn"></button>
      <button id="wBtn"></button>
      <button id="tBtn"></button>
      <button id="loadBtn"></button>
    `;
    storageService.getItem.mockReset();
    storageService.setItem.mockReset();
  });

  test('initializes with default video when none saved', async () => {
    storageService.getItem.mockResolvedValueOnce(null);
    const id = await initMusic();
    expect(id).toBe(WHITE_NOISE_VIDEO_ID);
    const player = document.getElementById('ytPlayer');
    expect(player.src).toContain(WHITE_NOISE_VIDEO_ID);
  });

  test('changes video on button click', async () => {
    storageService.getItem.mockResolvedValueOnce(null);
    await initMusic();

    jest.useFakeTimers();
    document.getElementById('lBtn').click();
    jest.runAllTimers();

    const player = document.getElementById('ytPlayer');
    expect(player.src).toContain(LOFI_VIDEO_ID);
    expect(getCurrentVideoID()).toBe(LOFI_VIDEO_ID);
    expect(storageService.setItem).toHaveBeenCalledWith('lastVideoID', LOFI_VIDEO_ID);
    jest.useRealTimers();
  });
});
