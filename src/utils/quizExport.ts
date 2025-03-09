import JSZip from 'jszip';
import { Question, Page } from '../types';

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

// Function to get all pages with their questions as a complete quiz
export const generateFullQuizJson = (
  pages: Page[], 
  getQuestionsForPage: (pageId: string) => Question[],
  metadata: QuizMetadata
) => {
  const quizData = {
    name: metadata.name,
    description: metadata.description,
    pages: pages.map(page => {
      const pageQuestions = getQuestionsForPage(page.id);
      
      return {
        id: page.id,
        title: page.title,
        questions: pageQuestions.map(q => {
          // Create a clean version of the question without circular references
          // and without the blob URLs for images (which won't work when exported)
          const cleanQuestion = { ...q };
          
          // Replace blob URLs with a placeholder
          if (cleanQuestion.image && cleanQuestion.image.startsWith('blob:')) {
            cleanQuestion.image = '[Image data not included in JSON]';
          }
          
          return cleanQuestion;
        })
      };
    }),
    globalTimeLimit: metadata.timeLimits?.globalTimeLimit || null,
    pageTimeLimit: metadata.timeLimits?.pageTimeLimit || null
  };
  
  return JSON.stringify(quizData, null, 2);
};

// Function to generate JSON for a single page
export const generatePageJson = (
  pageId: string, 
  page: Page | undefined, 
  getQuestionsForPage: (pageId: string) => Question[],
  timeLimit: number | null
) => {
  if (!page) return '{}';
  
  const pageQuestions = getQuestionsForPage(pageId);
  
  const pageData = {
    id: page.id,
    title: page.title,
    timeLimit: timeLimit,
    questions: pageQuestions.map(q => {
      // Create a clean version of the question without circular references
      // and without the blob URLs for images (which won't work when exported)
      const cleanQuestion = { ...q };
      
      // Replace blob URLs with a placeholder
      if (cleanQuestion.image && cleanQuestion.image.startsWith('blob:')) {
        cleanQuestion.image = '[Image data not included in JSON]';
      }
      
      return cleanQuestion;
    })
  };
  
  return JSON.stringify(pageData, null, 2);
};

// Export quiz as ZIP archive containing JSON files and images for each page
export const exportQuizAsZip = async (
  pages: Page[],
  getQuestionsForPage: (pageId: string) => Question[],
  metadata: QuizMetadata
): Promise<Blob> => {
  const zip = new JSZip();
  
  // Create a folder for the quiz
  const quizFolder = zip.folder("quiz");
  if (!quizFolder) throw new Error('Failed to create quiz folder');

  // Process each page
  for (const page of pages) {
    // Create a folder for this page
    const pageFolder = quizFolder.folder(`page_${page.id}`);
    if (!pageFolder) continue;

    // Get the questions for this page
    const pageQuestions = getQuestionsForPage(page.id);
    
    // Create assets folder for images
    const assetsFolder = pageFolder.folder("assets");
    if (!assetsFolder) continue;

    // Process and store images, update question references
    const processedQuestions = await Promise.all(pageQuestions.map(async (question) => {
      const cleanQuestion = { ...question };
      
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
      
      return cleanQuestion;
    }));

    // Create the page JSON with processed questions
    const pageData = {
      id: page.id,
      title: page.title,
      questions: processedQuestions
    };
    
    // Add the page config file
    pageFolder.file("page_config.json", JSON.stringify(pageData, null, 2));
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
      configFile: `page_${page.id}/page_config.json`
    }))
  };
  quizFolder.file("manifest.json", JSON.stringify(manifest, null, 2));

  // Generate the zip file
  return await zip.generateAsync({ type: "blob" });
}; 
