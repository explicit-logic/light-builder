import type { Manifest } from '@/types';

const CACHE_NAME = 'quiz-builder-cache';
const MANIFEST_KEY = '/manifest.json';

export const getManifest = async (): Promise<Manifest | null> => {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(MANIFEST_KEY);
    if (!response) return null;
    return await response.json();
  } catch (error) {
    console.error('Failed to get manifest:', error);
    return null;
  }
};

export const updateManifest = async (manifest: Partial<Manifest>): Promise<void> => {
  try {
    const cache = await caches.open(CACHE_NAME);
    const currentManifest: Manifest = await getManifest() || {
      pageOrder: [],
      activePage: '',
      name: '',
      description: '',
      globalTimeLimit: null,
      pageTimeLimit: null,
      totalPages: 0,
      totalQuestions: 0,
    };
    
    const updatedManifest = {
      ...currentManifest,
      ...manifest
    };
    
    const response = new Response(JSON.stringify(updatedManifest));
    await cache.put(MANIFEST_KEY, response);
  } catch (error) {
    console.error('Failed to update manifest:', error);
  }
};

export const clearManifest = async (): Promise<void> => {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.delete(MANIFEST_KEY);
  } catch (error) {
    console.error('Failed to clear manifest:', error);
  }
}; 
