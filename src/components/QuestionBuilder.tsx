import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableItem, DragHandle } from './SortableItem';
import MultipleChoice from './QuestionTypes/MultipleChoice';
import MultipleResponse from './QuestionTypes/MultipleResponse';
import FillInTheBlank from './QuestionTypes/FillInTheBlank';
import QuizTitle from './QuizTitle';
import { Question, PageOrderItem } from '../types';
import { generateFullQuizJson, generatePageJson } from '../utils/quizExport';
import { importQuizFromZip } from '../utils/quizImport';
import { handleExportQuizAsZip as exportQuizAsZipHandler } from '../utils/exportHandlers';
import { cachePageData, getCachedPageData, deleteCachedPage, clearAllCache } from '../utils/cacheUtils';
import useManifestStorage from '../hooks/useManifestStorage';

interface DescriptionButtonProps {
  showDescription: boolean;
  setShowDescription: (show: boolean) => void;
  description: string;
  setDescription: (description: string) => void;
}

const DescriptionButton: React.FC<DescriptionButtonProps> = ({
  showDescription,
  setShowDescription,
  description,
  setDescription
}) => {
  const { t } = useTranslation();
  const descriptionRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (descriptionRef.current && !descriptionRef.current.contains(event.target as Node)) {
        setShowDescription(false);
      }
    };

    if (showDescription) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDescription, setShowDescription]);

  const hasDescription = description.trim().length > 0;

  return (
    <div className="relative" ref={descriptionRef} >
      <button
        onClick={() => setShowDescription(!showDescription)}
        className={`flex items-center space-x-1 rounded-lg text-sm font-medium ${
          hasDescription
            ? 'text-blue-600 hover:text-blue-700 dark:text-blue-500 dark:hover:text-blue-400'
            : 'text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
        }`}
        title={t('questionBuilder.description.toggle')}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
        <span className={`${hasDescription ? '' : 'hidden'} w-2 h-2 bg-blue-500 rounded-full absolute -top-1 -right-1`}></span>
      </button>

      {showDescription && (
        <div className="absolute z-10 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="p-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('questionBuilder.description.label')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="block w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:text-white dark:bg-gray-700 min-h-[100px] resize-y"
              placeholder={t('questionBuilder.description.placeholder')}
            />
          </div>
        </div>
      )}
    </div>
  );
};

interface TimerButtonProps {
  showTimer: boolean;
  setShowTimer: (show: boolean) => void;
  pageTimeLimit: number | null;
  globalTimeLimit: number | null;
  setPageTimeLimit: (timeLimit: number | null) => void;
  setGlobalTimeLimit: (timeLimit: number | null) => void;
}

const TimerButton: React.FC<TimerButtonProps> = ({
  showTimer,
  setShowTimer,
  pageTimeLimit,
  globalTimeLimit,
  setPageTimeLimit,
  setGlobalTimeLimit
}) => {
  const { t } = useTranslation();
  const timerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (timerRef.current && !timerRef.current.contains(event.target as Node)) {
        setShowTimer(false);
      }
    };

    if (showTimer) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTimer, setShowTimer]);

  const handleGlobalTimeChange = (minutes: number) => {
    setGlobalTimeLimit(minutes || null);
    setPageTimeLimit(null); // Clear page limit when setting global limit
  };

  const handlePageTimeChange = (minutes: number) => {
    setPageTimeLimit(minutes || null);
    setGlobalTimeLimit(null); // Clear global limit when setting page limit
  };

  const hasTimeLimit = globalTimeLimit !== null || pageTimeLimit !== null;

  return (
    <div className="relative" ref={timerRef}>
      <button
        onClick={() => setShowTimer(!showTimer)}
        className={`flex items-center space-x-1 rounded-lg text-sm font-medium ${
          hasTimeLimit
            ? 'text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400'
            : 'text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
        }`}
        title={t('questionBuilder.timer.toggle')}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {hasTimeLimit && (
          <span className="w-2 h-2 bg-green-500 rounded-full absolute -top-1 -right-1"></span>
        )}
      </button>

      {showTimer && (
        <div className="absolute z-10 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('questionBuilder.timer.globalLimit')}
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="0"
                  value={globalTimeLimit || ''}
                  onChange={(e) => handleGlobalTimeChange(parseInt(e.target.value))}
                  className="block w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:text-white dark:bg-gray-700"
                  placeholder={t('questionBuilder.timer.minutesPlaceholder')}
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">{t('questionBuilder.timer.min')}</span>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('questionBuilder.timer.pageLimit')}
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="0"
                  value={pageTimeLimit || ''}
                  onChange={(e) => handlePageTimeChange(parseInt(e.target.value))}
                  className="block w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:text-white dark:bg-gray-700"
                  placeholder={t('questionBuilder.timer.minutesPlaceholder')}
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">{t('questionBuilder.timer.min')}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface QuestionBuilderProps {}

const DragDropProvider: React.FC<{ 
  children: React.ReactNode,
  onDragEnd: (event: DragEndEvent) => void 
}> = ({ children, onDragEnd }) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Only activate when pressing on a drag handle
      activationConstraint: {
        distance: 8, // 8px
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    onDragEnd(event);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {children}
    </DndContext>
  );
};

function QuestionBuilder({}: QuestionBuilderProps) {
  const { t } = useTranslation();
  const [questionType, setQuestionType] = useState<Question['type']>('multiple-choice');
  const [showImageUpload, setShowImageUpload] = useState<Record<string, boolean>>({});
  const [showJsonOutput, setShowJsonOutput] = useState<boolean>(false);
  const [jsonOutputPage, setJsonOutputPage] = useState<string | null>(null);
  const [jsonContent, setJsonContent] = useState<string>('');
  
  // State for active page's questions and answers
  const [activePageQuestions, setActivePageQuestions] = useState<Question[]>([]);
  const [activePageAnswers, setActivePageAnswers] = useState<Record<string, string[]>>({});
  
  // State for pages and active page using manifest storage
  const [pages, setPages] = useManifestStorage('pageOrder', [
    { id: 'page-1', title: t('questionBuilder.page.title', { number: 1 }), configFile: '' }
  ]);
  const [activePage, setActivePage] = useManifestStorage('activePage', 'page-1');
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingPageTitle, setEditingPageTitle] = useState<string>('');
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [name, setName] = useManifestStorage('name', t('questionBuilder.quizName'));
  const [description, setDescription] = useManifestStorage('description', '');
  const [showDescription, setShowDescription] = useState<boolean>(false);
  const [showTimer, setShowTimer] = useState<boolean>(false);
  const [pageTimeLimit, setPageTimeLimit] = useManifestStorage('pageTimeLimit', null);
  const [globalTimeLimit, setGlobalTimeLimit] = useManifestStorage('globalTimeLimit', null);

  // Effect to restore state from cache on mount
  useEffect(() => {
    const restoreState = async () => {
      const cachedPageData = await getCachedPageData(activePage);
      if (cachedPageData) {
        setActivePageQuestions(cachedPageData.questions);
        setActivePageAnswers(cachedPageData.answers);
      }
    };

    restoreState();
  }, [activePage]);

  // Handle page switching and caching
  const handlePageSwitch = async (newPageId: string) => {
    // Cache current page data before switching
    if (activePage && activePageQuestions.length > 0) {
      await cachePageData(activePage, {
        questions: activePageQuestions,
        answers: activePageAnswers
      });
    }

    // Load new page data from cache
    const cachedData = await getCachedPageData(newPageId);
    if (cachedData) {
      setActivePageQuestions(cachedData.questions);
      setActivePageAnswers(cachedData.answers);
    } else {
      setActivePageQuestions([]);
      setActivePageAnswers({});
    }

    await setActivePage(newPageId);
  };

  // Modified page tab click handler
  const handlePageTabClick = (pageId: string) => {
    if (pageId !== activePage) {
      handlePageSwitch(pageId);
    }
  };

  // Add a new page
  const addPage = async () => {
    const newPageId = `page-${Date.now()}`;
    const newPage: PageOrderItem = {
      id: newPageId,
      title: t('questionBuilder.page.title', { number: pages.length + 1 }),
      configFile: '',
    };
    
    await setPages([...pages, newPage]);
    handlePageSwitch(newPageId);
  };

  // Modified updateQuestion to handle active page questions
  const updateQuestion = (id: string, updatedQuestion: Partial<Question>) => {
    const currentIndex = activePageQuestions.findIndex((question) => question.id === id);
    if (currentIndex < 0) return;
    const newQuestions = [...activePageQuestions];
    const currentQuestion = newQuestions[currentIndex];
    const newQuestion = { ...currentQuestion, ...updatedQuestion };
    newQuestions[currentIndex] = newQuestion;
    setActivePageQuestions(newQuestions);

    // Update answers if needed
    if (!activePageAnswers[id]) {
      setActivePageAnswers(prev => ({
        ...prev,
        [id]: []
      }));
    }
  };

  // Modified addQuestion to handle active page questions
  const addQuestion = async () => {
    const newQuestion: Question = {
      id: `question-${Date.now()}`,
      type: questionType,
      text: t('questionBuilder.questionNumber', { number: Object.keys(activePageQuestions).length + 1 }),
      options: questionType === 'fill-in-the-blank' ? [] : [
        { id: `option-${Date.now()}-1`, text: '' },
        { id: `option-${Date.now()}-2`, text: '' },
      ],
      image: null,
    };
    
    // Add to active page questions
    setActivePageQuestions(prev => ([...prev, newQuestion]));
    
    // Initialize empty answers
    setActivePageAnswers(prev => ({
      ...prev,
      [newQuestion.id]: []
    }));
    
    // Update page question list
    const updatedPages = pages.map(page => 
      page.id === activePage 
        ? { ...page } 
        : page
    );
    await setPages(updatedPages);
  };

  // Modified deleteQuestion to handle active page questions
  const deleteQuestion = async (id: string) => {
    // Remove from active page questions and answers
    const remainingQuestions = activePageQuestions.filter((question) => question.id !== id);
    const { [id]: removedAnswers, ...remainingAnswers } = activePageAnswers;

    setActivePageQuestions(remainingQuestions);
    setActivePageAnswers(remainingAnswers);
    
    // Remove from pages
    const updatedPages = pages.map(page => ({
      ...page,
      configFile: '',
    }));
    await setPages(updatedPages);
  };

  // Modified handleAnswerChange to handle active page answers
  const handleAnswerChange = (questionId: string, optionId: string) => {
    const currentAnswers = activePageAnswers[questionId] || [];
    const question = activePageQuestions.find((q) => q.id === questionId);
    
    if (!question) return;

    let newAnswers: string[];

    if (question.type === 'multiple-choice') {
      newAnswers = [optionId];
    } else if (question.type === 'multiple-response') {
      newAnswers = currentAnswers.includes(optionId)
        ? currentAnswers.filter(id => id !== optionId)
        : [...currentAnswers, optionId];
    } else if (question.type === 'fill-in-the-blank') {
      newAnswers = [optionId];
    } else {
      return;
    }

    setActivePageAnswers(prev => ({
      ...prev,
      [questionId]: newAnswers
    }));
  };

  // Modified deletePage to handle cache
  const deletePage = async (pageId: string) => {
    // Delete page data from cache
    await deleteCachedPage(pageId);
    
    // Update pages state
    const updatedPages = pages.filter(p => p.id !== pageId);
    
    if (pageId === activePage && updatedPages.length > 0) {
      await handlePageSwitch(updatedPages[0].id);
    }
    
    if (updatedPages.length === 0) {
      const newPageId = `page-${Date.now()}`;
      await setPages([{ id: newPageId, title: t('questionBuilder.page.title', { number: 1 }), configFile: '' }]);
      await setActivePage(newPageId);
    } else {
      await setPages(updatedPages);
    }
  };

  // Modified handleImportQuiz to handle cache
  const handleImportQuiz = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const { 
        pages: newPages, 
        questions: newQuestions, 
        globalTimeLimit: newGlobalTimeLimit, 
        pageTimeLimit: newPageTimeLimit,
        name: newQuizName,
        description: newQuizDescription,
        answers: newAnswers
      } = await importQuizFromZip(file);
      
      // Clear existing cache
      await clearAllCache();
      
      // Cache data for each page except the first one
      for (let i = 1; i < newPages.length; i++) {
        const pageId = newPages[i].id;
      }
      
      // Set first page as active and load its data
      const firstPageId = newPages[0].id;

      
      setPages(newPages);
      setActivePage(firstPageId);
      // setActivePageQuestions([]);
      // setActivePageAnswers([]);
      setGlobalTimeLimit(newGlobalTimeLimit);
      setPageTimeLimit(newPageTimeLimit);
      setName(newQuizName);
      setDescription(newQuizDescription);

      event.target.value = '';
      
      toast.success(t('questionBuilder.alerts.importSuccess'), {
        duration: 3000,
      });
    } catch (error) {
      console.error('Failed to import quiz:', error);
      toast.error(t('questionBuilder.alerts.importError'), {
        duration: 3000,
      });
    }
  };

  // Get questions for a specific page
  const getQuestionsForPage = async (pageId: string) => {
    if (pageId === activePage) {
      return activePageQuestions;
    }
    
    const cachedData = await getCachedPageData(pageId);
    return cachedData ? cachedData.questions : [];
  };

  // Generate JSON for the current page
  const generateCurrentPageJson = async () => {
    if (!jsonOutputPage) return '{}';
    const currentPage = pages.find(p => p.id === jsonOutputPage);
    return await generatePageJson(jsonOutputPage, currentPage, getQuestionsForPage, pageTimeLimit, activePageAnswers);
  };

  // Toggle JSON output display
  const toggleJsonOutput = async (pageId: string | null = null) => {
    if (pageId) {
      setJsonOutputPage(pageId);
      setShowJsonOutput(true);
    } else {
      setShowJsonOutput(!showJsonOutput);
    }
  };

  // Copy JSON to clipboard
  const copyJsonToClipboard = async () => {
    if (!jsonOutputPage) return;
    
    const json = await generateCurrentPageJson();
    navigator.clipboard.writeText(json)
      .then(() => {
        toast.success(t('questionBuilder.json.copied'), {
          duration: 2000,
        });
      })
      .catch(err => {
        console.error('Failed to copy JSON: ', err);
        toast.error(t('questionBuilder.alerts.copyError'));
      });
  };

  // Export JSON as file
  const exportJsonAsFile = async () => {
    if (!jsonOutputPage) return;
    
    const json = await generateCurrentPageJson();
    const page = pages.find(p => p.id === jsonOutputPage);
    const fileName = page ? `${page.title.replace(/\s+/g, '_')}.json` : 'page.json';
    
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export full quiz as JSON file
  const exportFullQuiz = async () => {
    const json = await generateFullQuizJson(pages, getQuestionsForPage, {
      name,
      description,
      timeLimits: { globalTimeLimit, pageTimeLimit }
    }, activePageAnswers);
    const fileName = 'full_quiz.json';
    
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export quiz as ZIP archive
  const handleExportQuizAsZip = async () => {
    try {
      const result = await exportQuizAsZipHandler();
      
      // Create download link
      const url = URL.createObjectURL(result.content);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.fileName;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to generate zip file:', error);
      toast.error(t('questionBuilder.alerts.exportError'), {
        duration: 3000,
      });
    }
  };

  // Start editing a page title
  const startEditingPage = (pageId: string) => {
    const page = pages.find(p => p.id === pageId);
    if (page) {
      setEditingPageId(pageId);
      setEditingPageTitle(page.title);
    }
  };

  // Modified savePageTitle to handle async
  const savePageTitle = async () => {
    if (editingPageId) {
      const updatedPages = pages.map(p => 
        p.id === editingPageId ? { ...p, title: editingPageTitle } : p
      );
      await setPages(updatedPages);
      setEditingPageId(null);
    }
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    if (active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    
    // Handle page reordering
    if (active.data.current?.type === 'page') {
      const oldIndex = pages.findIndex(p => p.id === activeId);
      const newIndex = pages.findIndex(p => p.id === overId);

      setPages(arrayMove(pages, oldIndex, newIndex));
      return;
    }

    // Handle question reordering
    if (active.data.current?.type === 'question') {
      const oldIndex = activePageQuestions.findIndex(p => p.id === activeId);
      const newIndex = activePageQuestions.findIndex(p => p.id === overId);

      setActivePageQuestions(arrayMove(activePageQuestions, oldIndex, newIndex));
      return;
    }

    // Handle option reordering
    if (active.data.current?.type === 'option') {
      const sourceQuestionId = active.data.current.questionId;
      const destQuestionId = over.data.current?.questionId;
      
      if (sourceQuestionId === destQuestionId) {
        const question = activePageQuestions.find(q => q.id === sourceQuestionId);
        if (question && question.options) {
          const oldIndex = question.options.findIndex(opt => opt.id === activeId);
          const newIndex = question.options.findIndex(opt => opt.id === overId);
          
          if (oldIndex !== -1 && newIndex !== -1) {
            updateQuestion(question.id, { options: arrayMove(question.options || [], oldIndex, newIndex) });

          }
        }
      }
    }
  };

  const handleImageUpload = (questionId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create a URL for the uploaded image
    const imageUrl = URL.createObjectURL(file);
    
    // Update the question with the image
    updateQuestion(questionId, { image: imageUrl });
  };

  const removeImage = (questionId: string) => {
    // Find the question
    const question = activePageQuestions.find(q => q.id === questionId);
    // If the question has an image URL created with URL.createObjectURL, revoke it
    if (question?.image && question.image.startsWith('blob:')) {
      URL.revokeObjectURL(question.image);
    }
    
    // Update the question to remove the image
    updateQuestion(questionId, { image: null });
  };

  // Toggle image upload visibility for a specific question
  const toggleImageUpload = (questionId: string) => {
    setShowImageUpload(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const renderQuestionComponent = (question: Question) => {
    const updateThisQuestion = (updatedQuestion: Partial<Question>) => {
      updateQuestion(question.id, updatedQuestion);
    };

    switch (question.type) {
      case 'multiple-choice':
        return <MultipleChoice 
          question={question} 
          updateQuestion={updateThisQuestion} 
          answers={activePageAnswers[question.id] || []}
          onAnswerChange={(optionId) => handleAnswerChange(question.id, optionId)}
        />;
      case 'multiple-response':
        return <MultipleResponse 
          question={question} 
          updateQuestion={updateThisQuestion} 
          answers={activePageAnswers[question.id] || []}
          onAnswerChange={(optionId) => handleAnswerChange(question.id, optionId)}
        />;
      case 'fill-in-the-blank':
        return <FillInTheBlank 
          question={question} 
          updateQuestion={updateThisQuestion} 
          answers={activePageAnswers[question.id] || []}
          onAnswerChange={(optionId) => handleAnswerChange(question.id, optionId)}
        />;
      default:
        return null;
    }
  };

  return (
    <DragDropProvider onDragEnd={onDragEnd}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="mb-6 space-y-6">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-2 flex-grow">
              <div className="flex items-center gap-4">
                <QuizTitle
                  name={name}
                  isEditingTitle={isEditingTitle}
                  setName={setName}
                  setIsEditingTitle={setIsEditingTitle}
                />
                <div className="flex items-center space-x-3 flex-shrink-0">
                  <DescriptionButton
                    showDescription={showDescription}
                    setShowDescription={setShowDescription}
                    description={description}
                    setDescription={setDescription}
                  />
                  <TimerButton
                    showTimer={showTimer}
                    setShowTimer={setShowTimer}
                    pageTimeLimit={pageTimeLimit}
                    globalTimeLimit={globalTimeLimit}
                    setPageTimeLimit={setPageTimeLimit}
                    setGlobalTimeLimit={setGlobalTimeLimit}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0 ml-4 sticky top-0">
              <label className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none dark:focus:ring-blue-700 flex items-center cursor-pointer whitespace-nowrap">
                <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {t('questionBuilder.actions.import')}
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleImportQuiz}
                  className="hidden"
                />
              </label>
              <button
                onClick={handleExportQuizAsZip}
                className="text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-green-500 dark:hover:bg-green-600 focus:outline-none dark:focus:ring-green-700 flex items-center whitespace-nowrap"
                title={t('questionBuilder.actions.export')}
              >
                <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {t('questionBuilder.actions.export')}
              </button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1">
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                {t('questionBuilder.questionType')}
              </label>
              <select
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value as Question['type'])}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              >
                <option value="multiple-choice">{t('questionBuilder.types.multipleChoice')}</option>
                <option value="multiple-response">{t('questionBuilder.types.multipleResponse')}</option>
                <option value="fill-in-the-blank">{t('questionBuilder.types.fillInTheBlank')}</option>
              </select>
            </div>
            <button
              onClick={addQuestion}
              className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800 self-end"
            >
              {t('questionBuilder.addQuestion')}
            </button>
          </div>
        </div>

        {/* Page Tabs */}
        <div className="mb-6">
          <SortableContext
            items={pages.map(p => p.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
              {pages.map((page) => (
                <SortableItem
                  key={page.id}
                  id={page.id}
                  data={{ type: 'page' }}
                >
                  <div
                    className={`flex items-center px-4 py-2 text-sm font-medium border-b-2 rounded-t-lg cursor-pointer ${
                      activePage === page.id
                        ? 'text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500'
                        : 'text-gray-500 border-transparent hover:text-gray-600 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                    onClick={() => handlePageTabClick(page.id)}
                  >
                    <DragHandle className="mr-2">
                      <svg className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </DragHandle>
                    {editingPageId === page.id ? (
                      <div className="flex items-center">
                        <input
                          type="text"
                          value={editingPageTitle}
                          onChange={(e) => setEditingPageTitle(e.target.value)}
                          onBlur={savePageTitle}
                          onKeyDown={(e) => e.key === 'Enter' && savePageTitle()}
                          className="w-24 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <span className="mr-2 whitespace-nowrap">{page.title}</span>
                        <div className="flex space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditingPage(page.id);
                            }}
                            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            title="Edit page title"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleJsonOutput(page.id);
                            }}
                            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            title="View JSON"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                            </svg>
                          </button>
                          {pages.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deletePage(page.id);
                              }}
                              className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                              title={t('questionBuilder.page.deleteTitle')}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </SortableItem>
              ))}
              <button
                onClick={addPage}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 border-b-2 border-transparent rounded-t-lg hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 whitespace-nowrap"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {t('questionBuilder.addPage')}
              </button>
            </div>
          </SortableContext>
        </div>

        {/* JSON Output Modal */}
        {showJsonOutput && jsonOutputPage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {jsonOutputPage === 'full' 
                    ? t('questionBuilder.json.fullTitle')
                    : t('questionBuilder.json.pageTitle', { 
                        title: pages.find(p => p.id === jsonOutputPage)?.title 
                      })}
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={copyJsonToClipboard}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 p-1"
                    title={t('questionBuilder.actions.copy')}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                  </button>
                  <button
                    onClick={jsonOutputPage === 'full' ? exportFullQuiz : exportJsonAsFile}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 p-1"
                    title={t('questionBuilder.json.downloadTitle')}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setShowJsonOutput(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 p-1"
                    title={t('questionBuilder.actions.close')}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-4 overflow-auto max-h-[calc(80vh-4rem)]">
                <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm overflow-auto max-h-[60vh]">
                  {jsonContent}
                </pre>
              </div>
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <button
                  onClick={() => setShowJsonOutput(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg text-sm font-medium"
                >
                  {t('questionBuilder.actions.close')}
                </button>
              </div>
            </div>
          </div>
        )}

        <SortableContext
          items={activePageQuestions.map(q => q.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-6">
            {activePageQuestions.length === 0 ? (
              <div className="flex items-center justify-center p-8 text-center border-2 border-dashed rounded-lg border-gray-300 dark:border-gray-600">
                <p className="text-gray-500 dark:text-gray-400">
                  {t('questionBuilder.noQuestions')}
                </p>
              </div>
            ) : (
              activePageQuestions.map((question) => (
                <SortableItem
                  key={question.id}
                  id={question.id}
                  data={{ type: 'question' }}
                >
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
                    <div className="flex justify-between items-center mb-4">
                      <DragHandle>
                        <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                      </DragHandle>
                      <span className="font-medium text-gray-700 dark:text-gray-300 w-lg text-center overflow-ellipsis overflow-hidden whitespace-nowrap">
                        {question.text}
                      </span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleImageUpload(question.id)}
                          className="text-blue-500 hover:text-blue-700 p-1 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded-lg flex items-center"
                          aria-label={question.image || showImageUpload[question.id] ? t('questionBuilder.actions.hideImageOptions') : t('questionBuilder.actions.addImage')}
                        >
                          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {question.image ? t('questionBuilder.actions.editImage') : (showImageUpload[question.id] ? t('questionBuilder.actions.hideImage') : t('questionBuilder.actions.addImage'))}
                        </button>
                        <button
                          onClick={() => deleteQuestion(question.id)}
                          className="text-red-500 hover:text-red-700 p-1 focus:outline-none focus:ring-2 focus:ring-red-300 rounded-lg"
                          aria-label={t('questionBuilder.actions.deleteQuestion')}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    {/* Image Upload Section - Only show if there's an image or showImageUpload is true */}
                    {(question.image || showImageUpload[question.id]) && (
                      <div className="mb-4 p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                        <div className="flex flex-col gap-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('questionBuilder.imageUpload.title')}
                          </label>
                          
                          {question.image ? (
                            <div className="relative">
                              <img 
                                src={question.image} 
                                alt={t('questionBuilder.imageUpload.previewAlt')}
                                className="max-h-64 max-w-full rounded-lg object-contain"
                              />
                              <button
                                onClick={() => removeImage(question.id)}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
                                aria-label={t('questionBuilder.imageUpload.removeImage')}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center w-full">
                              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-600 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                  <svg className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                  </svg>
                                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                    <span className="font-semibold">{t('questionBuilder.imageUpload.clickToUpload')}</span> {t('questionBuilder.imageUpload.dragAndDrop')}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {t('questionBuilder.imageUpload.fileTypes')}
                                  </p>
                                </div>
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  accept="image/*"
                                  onChange={(e) => {
                                    handleImageUpload(question.id, e);
                                    // Hide the upload UI after successful upload
                                    if (e.target.files?.length) {
                                      setShowImageUpload(prev => ({
                                        ...prev,
                                        [question.id]: false
                                      }));
                                    }
                                  }}
                                />
                              </label>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {renderQuestionComponent(question)}
                  </div>
                </SortableItem>
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </DragDropProvider>
  );
}

export default QuestionBuilder; 
