import { useState, useEffect, useCallback } from 'react';
import { getManifest, updateManifest } from '../utils/manifestUtils';
import { Manifest } from '@/types';

type ManifestKey = keyof Manifest;

function useManifestStorage<K extends ManifestKey>(
  key: K,
  initialValue: Manifest[K]
): [Manifest[K], (value: Manifest[K] | ((val: Manifest[K]) => Manifest[K])) => Promise<void>] {
  const [storedValue, setStoredValue] = useState<Manifest[K]>(initialValue);

  // Load initial value from manifest
  useEffect(() => {
    const loadFromManifest = async () => {
      const manifest = await getManifest();
      if (manifest && manifest[key] !== undefined) {
        setStoredValue(manifest[key]);
      }
    };
    loadFromManifest();
  }, [key]);

  // Return a wrapped version of useState's setter function that persists the new value to manifest
  const setValue = useCallback(async (value: Manifest[K] | ((val: Manifest[K]) => Manifest[K])) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save to state
      setStoredValue(valueToStore);
      
      // Save to manifest
      await updateManifest({ [key]: valueToStore });
    } catch (error) {
      console.error(`Error saving to manifest for key ${key}:`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
}

export default useManifestStorage; 
