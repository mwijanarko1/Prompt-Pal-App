import { by, device, expect, element } from 'detox';

describe('Home Screen', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('should display user stats', async () => {
    await expect(element(by.text('Level'))).toBeVisible();
    await expect(element(by.text('XP'))).toBeVisible();
    await expect(element(by.text('Streak'))).toBeVisible();
  });

  it('should navigate to game on module press', async () => {
    await element(by.text('Start Creating')).tap();
    await expect(element(by.id('game-screen'))).toBeVisible();
  });

  it('should show learning modules section', async () => {
    await expect(element(by.text('Learning Modules'))).toBeVisible();
  });

  it('should navigate to library on view all tap', async () => {
    await element(by.text('View All')).tap();
    await expect(element(by.id('library-screen'))).toBeVisible();
  });
});
