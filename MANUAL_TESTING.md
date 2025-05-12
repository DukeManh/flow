# Flow State App - Manual Testing Guide

This document outlines the manual testing procedures for the Flow State app to complement automated testing. Manual testing is essential for validating user experience, visual consistency, and complex interactions that are difficult to automate.

## Prerequisites

- Test on multiple devices:
  - Desktop: Chrome, Firefox, Safari, Edge
  - Mobile: iOS Safari, Android Chrome
  - Tablet: iPad, Android tablet
- Test in both light and dark mode
- Test in both standalone PWA and browser modes

## Core Functionality Test Checklist

### 1. Timer System

| Test ID | Test Description | Steps | Expected Result | Status |
|---------|-----------------|-------|-----------------|--------|
| TM-01 | Start timer | 1. Click start button | Timer starts counting down from 52:00 | ⬜ |
| TM-02 | Pause timer | 1. Start timer<br>2. Click pause button | Timer pauses at current time | ⬜ |
| TM-03 | Resume timer | 1. Pause timer<br>2. Click start button | Timer resumes from paused time | ⬜ |
| TM-04 | Reset timer | 1. Start timer<br>2. Click reset button | Timer resets to 52:00 | ⬜ |
| TM-05 | Work session completion | 1. Start timer<br>2. Allow timer to reach 0:00 | Break timer starts at 17:00, notification appears | ⬜ |
| TM-06 | Break session completion | 1. Complete work session<br>2. Allow break timer to reach 0:00 | Work timer resets to 52:00, notification appears | ⬜ |
| TM-07 | Timer persistence | 1. Start timer<br>2. Refresh page | Timer continues from where it left off | ⬜ |
| TM-08 | Exit warning | 1. Start timer<br>2. Try to close tab/window | Warning dialog appears | ⬜ |
| TM-09 | Background running | 1. Start timer<br>2. Switch to another tab for several minutes<br>3. Return to app | Timer has progressed correctly | ⬜ |

### 2. Project System

| Test ID | Test Description | Steps | Expected Result | Status |
|---------|-----------------|-------|-----------------|--------|
| PR-01 | Create new project | 1. Click "+" button<br>2. Enter project name<br>3. Select color<br>4. Save | New project appears in project list | ⬜ |
| PR-02 | Switch between projects | 1. Create multiple projects<br>2. Select a different project | UI updates to show selected project data | ⬜ |
| PR-03 | Delete project | 1. Click delete icon on a project<br>2. Confirm deletion | Project is removed from list | ⬜ |
| PR-04 | Cannot delete during active timer | 1. Start timer<br>2. Try to delete current project | Error message appears | ⬜ |
| PR-05 | Project color applied | 1. Create project with specific color<br>2. Observe UI elements | Project color reflected in UI elements | ⬜ |

### 3. Todo List

| Test ID | Test Description | Steps | Expected Result | Status |
|---------|-----------------|-------|-----------------|--------|
| TD-01 | Add todo | 1. Type text in input field<br>2. Press Enter or click "+" | New todo added to list | ⬜ |
| TD-02 | Complete todo | 1. Click checkbox next to todo | Todo marked as complete | ⬜ |
| TD-03 | Delete todo | 1. Click delete icon next to todo | Todo removed from list | ⬜ |
| TD-04 | Reorder todos | 1. Drag and drop a todo to new position | Todo order updated accordingly | ⬜ |
| TD-05 | Project-specific todos | 1. Add todos to different projects<br>2. Switch between projects | Each project shows its own todos | ⬜ |

### 4. Goals System

| Test ID | Test Description | Steps | Expected Result | Status |
|---------|-----------------|-------|-----------------|--------|
| GL-01 | Set goal | 1. Click in goal area<br>2. Enter goal text<br>3. Save | Goal displays in goal card | ⬜ |
| GL-02 | Edit goal | 1. Click edit on existing goal<br>2. Change text<br>3. Save | Goal text updates | ⬜ |
| GL-03 | Project-specific goals | 1. Set goals for different projects<br>2. Switch between projects | Each project shows its own goal | ⬜ |

### 5. History and Stats

| Test ID | Test Description | Steps | Expected Result | Status |
|---------|-----------------|-------|-----------------|--------|
| HS-01 | Session recording | 1. Complete a timer session<br>2. Check history tab | Session appears in history list | ⬜ |
| HS-02 | Project filtering | 1. Complete sessions with different projects<br>2. Check history with filters | History filtered correctly by project | ⬜ |
| HS-03 | Weekly/monthly view | 1. Navigate between weekly/monthly views | Data displays correctly for selected period | ⬜ |
| HS-04 | Streak tracking | 1. Complete sessions on consecutive days<br>2. Check streak counter | Streak count increases correctly | ⬜ |

### 6. Theme System

| Test ID | Test Description | Steps | Expected Result | Status |
|---------|-----------------|-------|-----------------|--------|
| TH-01 | Change theme | 1. Open theme selector<br>2. Select a different theme | UI updates to reflect new theme colors | ⬜ |
| TH-02 | Theme persistence | 1. Select theme<br>2. Refresh page | Selected theme is maintained | ⬜ |
| TH-03 | System theme detection | 1. Change system dark/light mode<br>2. Open app | App respects system preference (if selected) | ⬜ |

### 7. PWA Features

| Test ID | Test Description | Steps | Expected Result | Status |
|---------|-----------------|-------|-----------------|--------|
| PW-01 | Installation prompt | 1. Visit site multiple times<br>2. Observe UI | Installation prompt appears | ⬜ |
| PW-02 | Install as PWA | 1. Click "Add to Home Screen"<br>2. Complete installation | App installs successfully | ⬜ |
| PW-03 | Offline functionality | 1. Install PWA<br>2. Disable internet<br>3. Launch app | App works offline | ⬜ |
| PW-04 | Splash screen | 1. Install as PWA<br>2. Launch from home screen | Splash screen displays before app loads | ⬜ |

### 8. Music/Sound Features

| Test ID | Test Description | Steps | Expected Result | Status |
|---------|-----------------|-------|-----------------|--------|
| MS-01 | Play preset music | 1. Click on music preset buttons | Correct music player loads and plays | ⬜ |
| MS-02 | Custom YouTube URL | 1. Enter YouTube URL<br>2. Load video | Custom video loads and plays | ⬜ |
| MS-03 | Sound notifications | 1. Toggle sound on/off<br>2. Complete a session | Notification sounds play or don't as expected | ⬜ |
| MS-04 | Music persistence | 1. Select music<br>2. Refresh page | Selected music option is maintained | ⬜ |

### 9. Focus Mode

| Test ID | Test Description | Steps | Expected Result | Status |
|---------|-----------------|-------|-----------------|--------|
| FM-01 | Enter focus mode | 1. Navigate to focus mode | Distraction-free UI displays | ⬜ |
| FM-02 | Timer in focus mode | 1. Use timer in focus mode | Timer functions normally | ⬜ |
| FM-03 | Exit focus mode | 1. Click exit button | Returns to main interface | ⬜ |

## Device-Specific Testing

### Mobile/Responsive Testing

| Test ID | Test Description | Steps | Expected Result | Status |
|---------|-----------------|-------|-----------------|--------|
| RS-01 | Mobile navigation | 1. View on mobile<br>2. Use bottom navigation | Navigates between sections | ⬜ |
| RS-02 | Swipe navigation | 1. View on mobile<br>2. Swipe left/right | Navigates between sections | ⬜ |
| RS-03 | Landscape orientation | 1. Rotate device to landscape | UI adjusts appropriately | ⬜ |
| RS-04 | Various screen sizes | 1. Test on multiple device sizes | UI adapts correctly | ⬜ |

### Browser Compatibility

| Test ID | Test Description | Browser | Expected Result | Status |
|---------|-----------------|---------|-----------------|--------|
| BC-01 | Core functionality | Chrome | All features work correctly | ⬜ |
| BC-02 | Core functionality | Firefox | All features work correctly | ⬜ |
| BC-03 | Core functionality | Safari | All features work correctly | ⬜ |
| BC-04 | Core functionality | Edge | All features work correctly | ⬜ |
| BC-05 | Mobile functionality | iOS Safari | All features work correctly | ⬜ |
| BC-06 | Mobile functionality | Android Chrome | All features work correctly | ⬜ |

## Performance Testing

| Test ID | Test Description | Steps | Expected Result | Status |
|---------|-----------------|-------|-----------------|--------|
| PF-01 | Initial load time | 1. Measure time to load app | Under 3 seconds on average connections | ⬜ |
| PF-02 | Animation smoothness | 1. Observe page transition animations | No stuttering or frame drops | ⬜ |
| PF-03 | Long-term usage | 1. Use app continuously for 30+ minutes | No memory leaks or performance degradation | ⬜ |

## Accessibility Testing

| Test ID | Test Description | Steps | Expected Result | Status |
|---------|-----------------|-------|-----------------|--------|
| AC-01 | Keyboard navigation | 1. Navigate using only keyboard | All functions accessible via keyboard | ⬜ |
| AC-02 | Screen reader | 1. Use with screen reader | Content is properly announced | ⬜ |
| AC-03 | Color contrast | 1. Check contrast in all themes | Meets WCAG AA standards | ⬜ |

## Regression Testing

Before each release, rerun all critical path tests (marked with ⭐) to ensure core functionality isn't broken.

## Test Completion Checklist

- [ ] All critical tests passed
- [ ] All major browsers tested
- [ ] Mobile and desktop devices tested
- [ ] PWA functionality verified
- [ ] Offline functionality verified
- [ ] Performance is acceptable

## Bug Reporting Template

When reporting bugs, include:

1. Test ID (if applicable)
2. Device/browser information
3. Steps to reproduce
4. Expected result
5. Actual result
6. Screenshots/videos if applicable

---

Last updated: May 11, 2025