import { Audio } from 'expo-av';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

/* -----------------------------
   Sound Settings Store
-------------------------------- */

interface SoundSettingsState {
  soundsEnabled: boolean;
  toggleSounds: () => void;
}

const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(name);
    } catch {
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(name, value);
    } catch {}
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(name);
    } catch {}
  },
};

export const useSoundSettings = create<SoundSettingsState>()(
  persist(
    (set) => ({
      soundsEnabled: true, // Default to enabled
      toggleSounds: () => {
        set((state) => ({ soundsEnabled: !state.soundsEnabled }));
      },
    }),
    {
      name: 'promptpal-sound-settings',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);

/* -----------------------------
   Sound Manager
-------------------------------- */

class SoundManager {
  private sounds: { [key: string]: Audio.Sound | null } = {};
  private isInitialized = false;

  /**
   * Initialize audio mode
   */
  async initialize() {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
      this.isInitialized = true;
    } catch (error) {
      console.warn('[Sounds] Failed to initialize audio:', error);
    }
  }

  /**
   * Load a sound (placeholder - in production, load actual audio files)
   */
  private async loadSound(name: string): Promise<Audio.Sound | null> {
    // Placeholder: In production, you would load actual audio files
    // For now, we'll create silent sounds as placeholders
    try {
      // This is a placeholder - replace with actual audio file loading
      // Example: const { sound } = await Audio.Sound.createAsync(require(`../assets/sounds/${name}.mp3`));
      
      // For now, return null (sounds will be silent until actual files are added)
      return null;
    } catch (error) {
      console.warn(`[Sounds] Failed to load sound ${name}:`, error);
      return null;
    }
  }

  /**
   * Play a sound effect
   */
  async play(soundName: 'success' | 'error' | 'button' | 'levelComplete') {
    const { soundsEnabled } = useSoundSettings.getState();
    
    if (!soundsEnabled || !this.isInitialized) {
      return;
    }

    try {
      // Load sound if not already loaded
      if (!this.sounds[soundName]) {
        this.sounds[soundName] = await this.loadSound(soundName);
      }

      const sound = this.sounds[soundName];
      if (sound) {
        // Reset to beginning and play
        await sound.setPositionAsync(0);
        await sound.playAsync();
      }
    } catch (error) {
      console.warn(`[Sounds] Failed to play ${soundName}:`, error);
    }
  }

  /**
   * Stop a specific sound
   */
  async stop(soundName: 'success' | 'error' | 'button' | 'levelComplete') {
    try {
      const sound = this.sounds[soundName];
      if (sound) {
        await sound.stopAsync();
      }
    } catch (error) {
      console.warn(`[Sounds] Failed to stop ${soundName}:`, error);
    }
  }

  /**
   * Stop all sounds
   */
  async stopAll() {
    try {
      await Promise.all(
        Object.values(this.sounds)
          .filter(Boolean)
          .map((sound) => sound?.stopAsync())
      );
    } catch (error) {
      console.warn('[Sounds] Failed to stop all sounds:', error);
    }
  }

  /**
   * Unload all sounds (cleanup)
   */
  async unloadAll() {
    try {
      await Promise.all(
        Object.entries(this.sounds).map(async ([name, sound]) => {
          if (sound) {
            await sound.unloadAsync();
            this.sounds[name] = null;
          }
        })
      );
    } catch (error) {
      console.warn('[Sounds] Failed to unload sounds:', error);
    }
  }
}

// Export singleton instance
export const soundManager = new SoundManager();

/* -----------------------------
   Convenience Functions
-------------------------------- */

/**
 * Play success sound
 */
export const playSuccess = () => soundManager.play('success');

/**
 * Play error sound
 */
export const playError = () => soundManager.play('error');

/**
 * Play button click sound
 */
export const playButton = () => soundManager.play('button');

/**
 * Play level complete sound
 */
export const playLevelComplete = () => soundManager.play('levelComplete');

/**
 * Initialize sound system (call this in your app startup)
 */
export const initializeSounds = async () => {
  await soundManager.initialize();
};

/**
 * Cleanup sounds (call this when app unmounts)
 */
export const cleanupSounds = async () => {
  await soundManager.unloadAll();
};