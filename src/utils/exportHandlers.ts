import JSZip from 'jszip';
import { getManifest } from './manifestUtils';
import { getCachedPageData } from './cacheUtils';

// Transliteration map for Cyrillic characters
const cyrillicToLatin: { [key: string]: string } = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
  'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
  'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
  'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
  'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
  // Uppercase Cyrillic
  'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
  'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
  'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
  'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch',
  'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
};

interface ExportResult {
  content: Blob;
  fileName: string;
}

// Sanitize quiz name for filename
const sanitizeFileName = (name: string): string => {
  // Transliterate Cyrillic characters
  const transliterated = name
    .split('')
    .map(char => cyrillicToLatin[char] || char)
    .join('');

  // Replace invalid filename characters with underscores and convert to lowercase
  const sanitized = transliterated
    .trim()
    .toLowerCase() // Convert to lowercase
    // Replace slashes, backslashes, and other invalid filename characters
    .replace(/[/\\?%*:|"<>]/g, '_')
    // Replace multiple spaces/underscores with single underscore
    .replace(/[\s_]+/g, '_');
  
  // If name is empty after sanitization, use default name
  return sanitized || 'quiz';
};

export const handleExportQuizAsZip = async (): Promise<ExportResult> => {
  const zip = new JSZip();
  const manifest = await getManifest();

  if (!manifest) {
    throw new Error('No quiz data found to export');
  }

  // Add manifest.json
  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  // Add page files
  for (const page of manifest.pageOrder) {
    const pageData = await getCachedPageData(page.id);
    if (pageData) {
      zip.file(`pages/${page.id}.json`, JSON.stringify({
        questions: Object.values(pageData.questions),
        answers: pageData.answers
      }, null, 2));
    }
  }

  // Generate zip file
  const content = await zip.generateAsync({ type: 'blob' });
  const fileName = `${sanitizeFileName(manifest.name)}.zip`;

  return {
    content,
    fileName
  };
}; 
