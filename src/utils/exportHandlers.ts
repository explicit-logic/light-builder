import { Page, Question } from '../types';
import { exportQuizAsZip } from './quizExport';

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

interface ExportQuizParams {
  pages: Page[];
  getQuestionsForPage: (pageId: string) => Question[];
  quizMetadata: {
    name: string;
    description: string;
    timeLimits: {
      globalTimeLimit: number | null;
      pageTimeLimit: number | null;
    };
  };
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

export const handleExportQuizAsZip = async ({ pages, getQuestionsForPage, quizMetadata }: ExportQuizParams): Promise<{ content: Blob; fileName: string }> => {
  const content = await exportQuizAsZip(pages, getQuestionsForPage, {
    name: quizMetadata.name,
    description: quizMetadata.description,
    timeLimits: quizMetadata.timeLimits
  });

  const fileName = `${sanitizeFileName(quizMetadata.name)}.zip`;
  
  return { content, fileName };
}; 
