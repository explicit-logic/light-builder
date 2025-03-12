import { Question } from '../types';

const CACHE_NAME = 'quiz-builder-cache';

interface PageCache {
  questions: Question[];
  answers: Record<string, string[]>;
}

export const cachePageData = async (pageId: string, data: PageCache): Promise<void> => {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = new Response(JSON.stringify(data));
    await cache.put(`/page/${pageId}`, response);
  } catch (error) {
    console.error('Failed to cache page data:', error);
  }
};

export const getCachedPageData = async (pageId: string): Promise<PageCache | null> => {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(`/page/${pageId}`);
    if (!response) return null;
    return await response.json();
  } catch (error) {
    console.error('Failed to get cached page data:', error);
    return null;
  }
};

export const deleteCachedPage = async (pageId: string): Promise<void> => {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.delete(`/page/${pageId}`);
  } catch (error) {
    console.error('Failed to delete cached page:', error);
  }
};

export const clearAllCache = async (): Promise<void> => {
  try {
    await caches.delete(CACHE_NAME);
  } catch (error) {
    console.error('Failed to clear cache:', error);
  }
}; 
