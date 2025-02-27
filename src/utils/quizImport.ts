import JSZip from 'jszip';
import { Question, Page } from '../types';

// Import quiz from ZIP file
export const importQuizFromZip = async (file: File): Promise<{
  pages: Page[];
  questions: Question[];
}> => {
  const zip = await JSZip.loadAsync(file);
  const quizFolder = zip.folder("quiz");
  if (!quizFolder) {
    throw new Error('Invalid quiz archive format');
  }

  // Load and parse manifest
  const manifestFile = await quizFolder.file("manifest.json")?.async("text");
  if (!manifestFile) {
    throw new Error('Missing manifest file in quiz archive');
  }

  const manifest = JSON.parse(manifestFile);
  const newPages: Page[] = [];
  const newQuestions: Question[] = [];

  // Process each page
  for (const pageInfo of manifest.pageOrder) {
    const pageConfigPath = pageInfo.configFile;
    const pageConfigFile = await quizFolder.file(pageConfigPath)?.async("text");
    
    if (!pageConfigFile) {
      console.error(`Missing page config file: ${pageConfigPath}`);
      continue;
    }

    const pageConfig = JSON.parse(pageConfigFile);
    
    // Process questions and their images
    const processedQuestions = await Promise.all(pageConfig.questions.map(async (question: Question) => {
      const newQuestion = { ...question };
      
      // If question has an image reference, load it
      if (question.image && question.image.startsWith('assets/')) {
        const imagePath = `page_${pageConfig.id}/${question.image}`;
        const imageFile = await quizFolder.file(imagePath)?.async("blob");
        
        if (imageFile) {
          newQuestion.image = URL.createObjectURL(imageFile);
        } else {
          newQuestion.image = null;
        }
      }
      
      return newQuestion;
    }));

    // Add questions to the new questions array
    newQuestions.push(...processedQuestions);

    // Create the page
    newPages.push({
      id: pageConfig.id,
      title: pageConfig.title,
      questions: processedQuestions.map(q => q.id)
    });
  }

  return { pages: newPages, questions: newQuestions };
}; 
