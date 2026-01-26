import { FileSystem } from 'expo-file-system';

const MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function cacheImage(uri: string): Promise<string> {
  if (!uri || uri.trim() === '') {
    throw new Error('Invalid URI: URI cannot be empty');
  }

  const filename = uri.split('/').pop() || 'image';
  const cacheDirectory = FileSystem.cacheDirectory || '';
  const path = `${cacheDirectory}${filename}`;

  // Check if cached and not expired
  const info = await FileSystem.getInfoAsync(path);
  if (info.exists && info.modificationTime) {
    const age = Date.now() - info.modificationTime;
    if (age < CACHE_EXPIRY_MS) {
      return path;
    }
  }

  // Download and cache
  await FileSystem.downloadAsync(uri, path);
  return path;
}

export async function clearImageCache(): Promise<void> {
  const cacheDirectory = FileSystem.cacheDirectory || '';
  const files = await FileSystem.readDirectoryAsync(cacheDirectory);
  
  for (const file of files) {
    await FileSystem.deleteAsync(cacheDirectory + file);
  }
}
