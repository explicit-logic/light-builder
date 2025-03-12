import JSZip from 'jszip';
import { Question, Page } from '@/types';

// Helper function to fetch and convert blob URLs to array buffers
const fetchImageAsBuffer = async (blobUrl: string): Promise<ArrayBuffer | null> => {
  try {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    return await blob.arrayBuffer();
  } catch (error) {
    console.error('Failed to fetch image:', error);
    return null;
  }
};

interface TimeLimitOptions {
  globalTimeLimit: number | null;
  pageTimeLimit: number | null;
}

interface QuizMetadata {
  name: string;
  description: string;
  timeLimits?: TimeLimitOptions;
}

// Helper function to prepare a question for export
const prepareQuestionForExport = (question: Question, answers: Record<string, string[]>): Question => {
  const { options, ...rest } = question;
  return {
    ...rest,
    options: options?.map(({ id, text }) => ({ id, text }))
  };
};

// Function to extract correct answers from questions
const extractAnswers = (questions: Question[]): Record<string, string[]> => {
  const answers: Record<string, string[]> = {};
  
  questions.forEach(question => {
    if (!answers[question.id]) {
      answers[question.id] = [];
    }
  });
  
  return answers;
};

// Generate JSON for a single page
export const generatePageJson = (
  pageId: string,
  page: Page | undefined,
  getQuestionsForPage: (pageId: string) => Question[],
  pageTimeLimit: number | null,
  answers: Record<string, string[]>
): string => {
  if (!page) return '{}';

  const questions = getQuestionsForPage(pageId);
  const exportedQuestions = questions.map(q => prepareQuestionForExport(q, answers));

  return JSON.stringify({
    id: page.id,
    title: page.title,
    questions: exportedQuestions,
    answers,
    timeLimit: pageTimeLimit
  }, null, 2);
};

// Generate JSON for the entire quiz
export const generateFullQuizJson = (
  pages: Page[],
  getQuestionsForPage: (pageId: string) => Question[],
  metadata: {
    name: string;
    description: string;
    timeLimits: {
      globalTimeLimit: number | null;
      pageTimeLimit: number | null;
    };
  },
  answers: Record<string, string[]>
): string => {
  const exportedPages = pages.map(page => {
    const questions = getQuestionsForPage(page.id);
    const exportedQuestions = questions.map(q => prepareQuestionForExport(q, answers));
    return {
      ...page,
      questions: exportedQuestions,
      answers: Object.fromEntries(
        Object.entries(answers).filter(([qId]) => 
          questions.some(q => q.id === qId)
        )
      )
    };
  });

  return JSON.stringify({
    name: metadata.name,
    description: metadata.description,
    globalTimeLimit: metadata.timeLimits.globalTimeLimit,
    pageTimeLimit: metadata.timeLimits.pageTimeLimit,
    pages: exportedPages
  }, null, 2);
};

// Export quiz as ZIP archive containing JSON files and images for each page
export const exportQuizAsZip = async (
  pages: Page[],
  getQuestionsForPage: (pageId: string) => Question[],
  metadata: QuizMetadata,
  answers: Record<string, string[]>
): Promise<Blob> => {
  const zip = new JSZip();
  
  // Create a folder for the quiz
  const quizFolder = zip.folder("quiz");
  if (!quizFolder) throw new Error('Failed to create quiz folder');

  // Process each page
  for (const page of pages) {
    // Create a folder for this page
    const pageFolder = quizFolder.folder(page.id);
    if (!pageFolder) continue;

    // Get the questions for this page
    const pageQuestions = getQuestionsForPage(page.id);
    
    // Create assets folder for images
    const assetsFolder = pageFolder.folder("assets");
    if (!assetsFolder) continue;

    // Process and store images, update question references
    const processedQuestions = await Promise.all(pageQuestions.map(async (question) => {
      const { options, ...cleanQuestion } = { ...question };
      
      if (cleanQuestion.image && cleanQuestion.image.startsWith('blob:')) {
        // Generate a filename for the image
        const imageExtension = 'png'; // Default extension, you might want to detect actual type
        const imageFileName = `${question.id}.${imageExtension}`;
        
        // Fetch and store the image
        const imageBuffer = await fetchImageAsBuffer(cleanQuestion.image);
        if (imageBuffer) {
          assetsFolder.file(imageFileName, imageBuffer);
          // Update the image reference in the question
          cleanQuestion.image = `assets/${imageFileName}`;
        } else {
          cleanQuestion.image = null;
        }
      }
      
      // Add back options without isCorrect if they exist
      if (options) {
        (cleanQuestion as Question).options = options.map(({ id, text }) => ({ id, text }));
      }
      
      return cleanQuestion as Question;
    }));

    // Create the page JSON with processed questions
    const pageData = {
      id: page.id,
      title: page.title,
      questions: processedQuestions
    };
    
    // Add the page config file
    pageFolder.file("page_config.json", JSON.stringify(pageData, null, 2));

    // Get answers for this page's questions
    const pageAnswers: Record<string, string[]> = {};
    pageQuestions.forEach(question => {
      if (answers[question.id]) {
        pageAnswers[question.id] = answers[question.id];
      }
    });

    // Add answers file if there are any answers
    if (Object.keys(pageAnswers).length > 0) {
      pageFolder.file("answers.json", JSON.stringify(pageAnswers, null, 2));
    }
  }

  // Add a manifest file with quiz structure
  const manifest = {
    name: metadata.name,
    description: metadata.description,
    totalPages: pages.length,
    totalQuestions: pages.reduce((count, page) => count + getQuestionsForPage(page.id).length, 0),
    globalTimeLimit: metadata.timeLimits?.globalTimeLimit || null,
    pageTimeLimit: metadata.timeLimits?.pageTimeLimit || null,
    pageOrder: pages.map(page => ({
      id: page.id,
      title: page.title,
      configFile: `${page.id}/page_config.json`,
      answersFile: `${page.id}/answers.json`
    }))
  };
  quizFolder.file("manifest.json", JSON.stringify(manifest, null, 2));

  // Generate the zip file
  return await zip.generateAsync({ type: "blob" });
}; 
