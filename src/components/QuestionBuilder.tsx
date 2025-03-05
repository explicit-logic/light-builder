import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import QuizDescription from './QuizDescription';
import { Question, Page } from '../types';
import { generateFullQuizJson, generatePageJson, exportQuizAsZip } from '../utils/quizExport';
import { importQuizFromZip } from '../utils/quizImport';

interface QuestionBuilderProps {
  questions: Record<string, Question>;
  setQuestions: (questions: Record<string, Question>) => void;
}

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

function QuestionBuilder({ questions, setQuestions }: QuestionBuilderProps) {
  const { t } = useTranslation();
  const [questionType, setQuestionType] = useState<Question['type']>('multipleChoice');
  const [showImageUpload, setShowImageUpload] = useState<Record<string, boolean>>({});
  const [showJsonOutput, setShowJsonOutput] = useState<boolean>(false);
  const [jsonOutputPage, setJsonOutputPage] = useState<string | null>(null);
  
  // State for pages and active page
  const [pages, setPages] = useState<Page[]>([
    { id: 'page-1', title: t('questionBuilder.page.title', { number: 1 }), questions: [] }
  ]);
  const [activePage, setActivePage] = useState<string>('page-1');
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingPageTitle, setEditingPageTitle] = useState<string>('');
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [quizName, setQuizName] = useState<string>(t('questionBuilder.quizName'));
  const [quizDescription, setQuizDescription] = useState<string>('');
  const [showDescription, setShowDescription] = useState<boolean>(false);

  // Get questions for the active page
  const activePageQuestionIds = pages.find(p => p.id === activePage)?.questions ?? [];
  const activePageQuestions = activePageQuestionIds.map(qId => questions[qId]) ?? [];

  // Get questions for a specific page
  const getQuestionsForPage = (pageId: string) => {
    const page = pages.find(p => p.id === pageId);
    if (!page) return [];
    
    return Object.values(questions).filter(q => page.questions.includes(q.id));
  };

  // Generate JSON for the current page
  const generateCurrentPageJson = () => {
    if (!jsonOutputPage) return '{}';
    const currentPage = pages.find(p => p.id === jsonOutputPage);
    return generatePageJson(jsonOutputPage, currentPage, getQuestionsForPage);
  };

  // Toggle JSON output display
  const toggleJsonOutput = (pageId: string | null = null) => {
    if (pageId) {
      setJsonOutputPage(pageId);
      setShowJsonOutput(true);
    } else {
      setShowJsonOutput(!showJsonOutput);
    }
  };

  // Copy JSON to clipboard
  const copyJsonToClipboard = () => {
    if (!jsonOutputPage) return;
    
    const json = generateCurrentPageJson();
    navigator.clipboard.writeText(json)
      .then(() => {
        alert(t('questionBuilder.json.copied'));
      })
      .catch(err => {
        console.error('Failed to copy JSON: ', err);
      });
  };

  // Export JSON as file
  const exportJsonAsFile = () => {
    if (!jsonOutputPage) return;
    
    const json = generateCurrentPageJson();
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
  const exportFullQuiz = () => {
    const json = generateFullQuizJson(pages, getQuestionsForPage);
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
      const content = await exportQuizAsZip(pages, getQuestionsForPage);
      
      // Create download link
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'quiz_export.zip';
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to generate zip file:', error);
      alert(t('questionBuilder.alerts.exportError'));
    }
  };

  // Add a new page
  const addPage = () => {
    const newPageId = `page-${Date.now()}`;
    const newPage: Page = {
      id: newPageId,
      title: t('questionBuilder.page.title', { number: pages.length + 1 }),
      questions: []
    };
    setPages([...pages, newPage]);
    setActivePage(newPageId);
  };

  // Delete a page and its questions
  const deletePage = (pageId: string) => {
    // Get the questions to delete
    const pageToDelete = pages.find(p => p.id === pageId);
    if (!pageToDelete) return;

    // Delete the questions
    const updatedQuestions = { ...questions };
    pageToDelete.questions.forEach(qId => {
      delete updatedQuestions[qId];
    });
    setQuestions(updatedQuestions);

    // Delete the page
    const updatedPages = pages.filter(p => p.id !== pageId);
    
    // If we're deleting the active page, set a new active page
    if (pageId === activePage && updatedPages.length > 0) {
      setActivePage(updatedPages[0].id);
    }
    
    // If no pages left, create a new one
    if (updatedPages.length === 0) {
      const newPageId = `page-${Date.now()}`;
      setPages([{ id: newPageId, title: t('questionBuilder.page.title', { number: 1 }), questions: [] }]);
      setActivePage(newPageId);
    } else {
      setPages(updatedPages);
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

  // Save the edited page title
  const savePageTitle = () => {
    if (editingPageId) {
      setPages(pages.map(p => 
        p.id === editingPageId ? { ...p, title: editingPageTitle } : p
      ));
      setEditingPageId(null);
    }
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `question-${Date.now()}`,
      type: questionType,
      text: t('questionBuilder.questionNumber', { number: activePageQuestionIds.length + 1 }),
      options: questionType === 'fillInTheBlank' ? [] : [
        { id: `option-${Date.now()}-1`, text: '', isCorrect: false },
        { id: `option-${Date.now()}-2`, text: '', isCorrect: false },
      ],
      answer: questionType === 'fillInTheBlank' ? '' : undefined,
      image: null,
    };
    
    // Add the question to the questions object
    setQuestions({ ...questions, [newQuestion.id]: newQuestion });
    
    // Add the question ID to the active page
    setPages(pages.map(page => 
      page.id === activePage 
        ? { ...page, questions: [...page.questions, newQuestion.id] } 
        : page
    ));
  };

  const updateQuestion = (id: string, updatedQuestion: Partial<Question>) => {
    const currentQuestion = questions[id];
    if (!currentQuestion) return;
    
    setQuestions({
      ...questions,
      [id]: { ...currentQuestion, ...updatedQuestion }
    });
  };

  const deleteQuestion = (id: string) => {
    // Remove the question from the questions object
    const updatedQuestions = { ...questions };
    delete updatedQuestions[id];
    setQuestions(updatedQuestions);
    
    // Remove the question ID from any page that contains it
    setPages(pages.map(page => ({
      ...page,
      questions: page.questions.filter(qId => qId !== id)
    })));
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
      const activePage = pages.find(p => p.questions.includes(activeId));
      const overPage = pages.find(p => p.questions.includes(overId));
      
      if (activePage && overPage) {
        if (activePage.id === overPage.id) {
          // Moving within the same page
          const oldIndex = activePage.questions.indexOf(activeId);
          const newIndex = activePage.questions.indexOf(overId);
          
          setPages(pages.map(p => 
            p.id === activePage.id 
              ? { ...p, questions: arrayMove(p.questions, oldIndex, newIndex) }
              : p
          ));
        } else {
          // Moving between pages
          setPages(pages.map(p => {
            if (p.id === activePage.id) {
              return { ...p, questions: p.questions.filter(id => id !== activeId) };
            }
            if (p.id === overPage.id) {
              const newIndex = p.questions.indexOf(overId);
              const newQuestions = [...p.questions];
              newQuestions.splice(newIndex, 0, activeId);
              return { ...p, questions: newQuestions };
            }
            return p;
          }));
        }
      }
      return;
    }

    // Handle option reordering
    if (active.data.current?.type === 'option') {
      const sourceQuestionId = active.data.current.questionId;
      const destQuestionId = over.data.current?.questionId;
      
      if (sourceQuestionId === destQuestionId) {
        const question = questions[sourceQuestionId];
        if (question && question.options) {
          const oldIndex = question.options.findIndex(opt => opt.id === activeId);
          const newIndex = question.options.findIndex(opt => opt.id === overId);
          
          setQuestions({
            ...questions,
            [sourceQuestionId]: {
              ...question,
              options: arrayMove(question.options, oldIndex, newIndex)
            }
          });
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
    const question = questions[questionId];
    
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
      case 'multipleChoice':
        return <MultipleChoice question={question} updateQuestion={updateThisQuestion} />;
      case 'multipleResponse':
        return <MultipleResponse question={question} updateQuestion={updateThisQuestion} />;
      case 'fillInTheBlank':
        return <FillInTheBlank question={question} updateQuestion={updateThisQuestion} />;
      default:
        return null;
    }
  };

  // Handle quiz import
  const handleImportQuiz = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const { pages: newPages, questions: newQuestions } = await importQuizFromZip(file);
      
      // Update state
      setQuestions(newQuestions);
      setPages(newPages);
      setActivePage(newPages[0]?.id || 'page-1');

      // Reset file input
      event.target.value = '';
      
      alert(t('questionBuilder.alerts.importSuccess'));
    } catch (error) {
      console.error('Failed to import quiz:', error);
      alert(t('questionBuilder.alerts.importError'));
    }
  };

  return (
    <DragDropProvider onDragEnd={onDragEnd}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="mb-6 space-y-6">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-2 flex-grow max-w-[calc(100%-180px)]">
              <QuizTitle
                quizName={quizName}
                isEditingTitle={isEditingTitle}
                setQuizName={setQuizName}
                setIsEditingTitle={setIsEditingTitle}
                showDescription={showDescription}
                setShowDescription={setShowDescription}
              />
              <QuizDescription
                quizDescription={quizDescription}
                setQuizDescription={setQuizDescription}
                showDescription={showDescription}
              />
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
                <option value="multipleChoice">{t('questionBuilder.types.multipleChoice')}</option>
                <option value="multipleResponse">{t('questionBuilder.types.multipleResponse')}</option>
                <option value="fillInTheBlank">{t('questionBuilder.types.fillInTheBlank')}</option>
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
              {pages.map((page, index) => (
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
                    onClick={() => setActivePage(page.id)}
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
                        <span className="mr-2">{page.title}</span>
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
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 border-b-2 border-transparent rounded-t-lg hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
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
                  {jsonOutputPage === 'full' 
                    ? generateFullQuizJson(pages, getQuestionsForPage) 
                    : generateCurrentPageJson()}
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
