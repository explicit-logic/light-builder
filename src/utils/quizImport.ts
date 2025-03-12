import JSZip from 'jszip';
import { Question, PageOrderItem } from '../types';
import { cachePageData } from './cacheUtils';


interface ImportedQuiz {
  pages: PageOrderItem[];
  questions: Record<string, Question>;
  answers: Record<string, string[]>;
  globalTimeLimit: number | null;
  pageTimeLimit: number | null;
  name: string;
  description: string;
}

// Helper function to process image URLs from imported files
const processImageUrls = async (
  zip: JSZip,
  question: Question,
  pageId: string
): Promise<Question> => {
  if (!question.image || !question.image.startsWith('assets/')) {
    return question;
  }

  try {
    const imagePath = `quiz/${pageId}/${question.image}`;
    const imageFile = zip.file(imagePath);
    
    if (!imageFile) {
      console.warn(`Image not found in zip: ${imagePath}`);
      return { ...question, image: null };
    }

    const imageBlob = await imageFile.async('blob');
    const imageUrl = URL.createObjectURL(imageBlob);
    return { ...question, image: imageUrl };
  } catch (error) {
    console.error('Failed to process image:', error);
    return { ...question, image: null };
  }
};

export const importQuizFromZip = async (file: File): Promise<ImportedQuiz> => {
  const zip = await JSZip.loadAsync(file);
  const manifest = zip.file('quiz/manifest.json');
  
  if (!manifest) {
    throw new Error('Invalid quiz file: manifest.json not found');
  }

  const manifestData = JSON.parse(await manifest.async('text'));
  const pages: PageOrderItem[] = [];
  const questions: Record<string, Question> = {};
  const answers: Record<string, string[]> = {};

  // Process each page
  for (const pageInfo of manifestData.pageOrder) {
    const pageConfigFile = zip.file(`quiz/${pageInfo.configFile}`);
    const answersFile = zip.file(`quiz/${pageInfo.answersFile}`);
    
    if (!pageConfigFile) {
      console.warn(`Page config not found: ${pageInfo.configFile}`);
      continue;
    }

    const pageData = JSON.parse(await pageConfigFile.async('text'));
    
    // Process questions and their images
    const processedQuestions = await Promise.all(
      pageData.questions.map(async (q: Question) => {
        const processedQuestion = await processImageUrls(zip, q, pageInfo.id);
        questions[processedQuestion.id] = processedQuestion;
        return processedQuestion.id;
      })
    );

    // Create page object
    const page: PageOrderItem = {
      id: pageInfo.id,
      title: pageInfo.title,
      configFile: '',
    };
    pages.push(page);

    // Process answers if available
    if (answersFile) {
      const pageAnswers = JSON.parse(await answersFile.async('text'));
      Object.assign(answers, pageAnswers);
    }

    // Cache the page data (except for the first page which will be loaded into state)
    if (pages.length > 1) {
      const pageQuestions = processedQuestions.reduce((acc, qId) => {
        if (questions[qId]) {
          acc[qId] = questions[qId];
        }
        return acc;
      }, {} as Record<string, Question>);

      const pageAnswers = processedQuestions.reduce((acc, qId) => {
        if (answers[qId]) {
          acc[qId] = answers[qId];
        }
        return acc;
      }, {} as Record<string, string[]>);

      await cachePageData(page.id, {
        questions: pageQuestions,
        answers: pageAnswers
      });

      // Remove the cached page data from the return object to save memory
      processedQuestions.forEach(qId => {
        delete questions[qId];
        delete answers[qId];
      });
    }
  }

  return {
    pages,
    questions,  // Will only contain first page questions
    answers,    // Will only contain first page answers
    globalTimeLimit: manifestData.globalTimeLimit || null,
    pageTimeLimit: manifestData.pageTimeLimit || null,
    name: manifestData.name || 'Untitled Quiz',
    description: manifestData.description || ''
  };
}; 
