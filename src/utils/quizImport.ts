import JSZip from 'jszip';
import { Question, Page } from '../types';

// Import quiz from ZIP file
export const importQuizFromZip = async (file: File): Promise<{
  pages: Page[];
  questions: Record<string, Question>;
  globalTimeLimit: number | null;
  pageTimeLimit: number | null;
  name: string;
  description: string;
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
  const newQuestions: Record<string, Question> = {};

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
    await Promise.all(pageConfig.questions.map(async (question: Question) => {
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
      
      // Add question to the questions object
      newQuestions[question.id] = newQuestion;
    }));

    // Create the page
    newPages.push({
      id: pageConfig.id,
      title: pageConfig.title,
      questions: pageConfig.questions.map((q: Question) => q.id)
    });
  }

  return { 
    pages: newPages, 
    questions: newQuestions,
    globalTimeLimit: manifest.globalTimeLimit || null,
    pageTimeLimit: manifest.pageTimeLimit || null,
    name: manifest.name || 'My Quiz',
    description: manifest.description || ''
  };
}; 
