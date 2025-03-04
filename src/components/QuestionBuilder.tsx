import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import MultipleChoice from './QuestionTypes/MultipleChoice';
import MultipleResponse from './QuestionTypes/MultipleResponse';
import FillInTheBlank from './QuestionTypes/FillInTheBlank';
import QuizTitle from './QuizTitle';
import { Question, Page } from '../types';
import { generateFullQuizJson, generatePageJson, exportQuizAsZip } from '../utils/quizExport';
import { importQuizFromZip } from '../utils/quizImport';

interface QuestionBuilderProps {
  questions: Question[];
  setQuestions: (questions: Question[]) => void;
}

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

  // Get questions for the active page
  const activePageQuestions = questions.filter(q => {
    const page = pages.find(p => p.id === activePage);
    return page && page.questions.includes(q.id);
  });

  // Get questions for a specific page
  const getQuestionsForPage = (pageId: string) => {
    const page = pages.find(p => p.id === pageId);
    if (!page) return [];
    
    return questions.filter(q => page.questions.includes(q.id));
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
    const updatedQuestions = questions.filter(q => !pageToDelete.questions.includes(q.id));
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
      text: '',
      options: questionType === 'fillInTheBlank' ? [] : [
        { id: `option-${Date.now()}-1`, text: '', isCorrect: false },
        { id: `option-${Date.now()}-2`, text: '', isCorrect: false },
      ],
      answer: questionType === 'fillInTheBlank' ? '' : undefined,
      image: null,
    };
    
    // Add the question to the questions array
    setQuestions([...questions, newQuestion]);
    
    // Add the question ID to the active page
    setPages(pages.map(page => 
      page.id === activePage 
        ? { ...page, questions: [...page.questions, newQuestion.id] } 
        : page
    ));
  };

  const updateQuestion = (id: string, updatedQuestion: Partial<Question>) => {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, ...updatedQuestion } : q))
    );
  };

  const deleteQuestion = (id: string) => {
    // Remove the question from the questions array
    setQuestions(questions.filter((q) => q.id !== id));
    
    // Remove the question ID from any page that contains it
    setPages(pages.map(page => ({
      ...page,
      questions: page.questions.filter(qId => qId !== id)
    })));
  };

  // Modified onDragEnd to handle both page tabs and questions
  const onDragEnd = (result: DropResult) => {
    const { destination, source, type, draggableId } = result;
    
    // If there's no destination or the item is dropped in the same place
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }

    // Handle page tab reordering
    if (type === 'page') {
      const reorderedPages = Array.from(pages);
      const [removed] = reorderedPages.splice(source.index, 1);
      reorderedPages.splice(destination.index, 0, removed);
      setPages(reorderedPages);
      return;
    }

    // Handle question reordering within a page
    if (type === 'question') {
      // If moving within the same page
      if (destination.droppableId === source.droppableId) {
        const pageId = destination.droppableId;
        const page = pages.find(p => p.id === pageId);
        if (!page) return;

        const newQuestionIds = Array.from(page.questions);
        const [removed] = newQuestionIds.splice(source.index, 1);
        newQuestionIds.splice(destination.index, 0, removed);

        setPages(pages.map(p => 
          p.id === pageId ? { ...p, questions: newQuestionIds } : p
        ));
      } 
      // If moving between different pages
      else {
        const sourcePage = pages.find(p => p.id === source.droppableId);
        const destPage = pages.find(p => p.id === destination.droppableId);
        
        if (!sourcePage || !destPage) return;
        
        // Remove from source page
        const sourceQuestionIds = Array.from(sourcePage.questions);
        const [questionId] = sourceQuestionIds.splice(source.index, 1);
        
        // Add to destination page
        const destQuestionIds = Array.from(destPage.questions);
        destQuestionIds.splice(destination.index, 0, questionId);
        
        // Update both pages
        setPages(pages.map(p => {
          if (p.id === source.droppableId) {
            return { ...p, questions: sourceQuestionIds };
          }
          if (p.id === destination.droppableId) {
            return { ...p, questions: destQuestionIds };
          }
          return p;
        }));
      }
      return;
    }

    // Handle option reordering within a question (existing code)
    if (type === 'option') {
      // Extract the question ID from the droppable ID
      // The format should be 'options-{questionId}'
      const sourceQuestionId = source.droppableId.replace('options-', '');
      const destinationQuestionId = destination.droppableId.replace('options-', '');
      
      // Find the question by ID
      const sourceQuestion = questions.find(q => q.id === sourceQuestionId);
      
      if (!sourceQuestion || !sourceQuestion.options) {
        console.error('Source question or options not found');
        return;
      }
      
      // If moving within the same question
      if (sourceQuestionId === destinationQuestionId) {
        const newOptions = Array.from(sourceQuestion.options);
        const [removed] = newOptions.splice(source.index, 1);
        newOptions.splice(destination.index, 0, removed);
        
        setQuestions(
          questions.map(q => 
            q.id === sourceQuestionId 
              ? { ...q, options: newOptions } 
              : q
          )
        );
      } 
      // If moving between different questions (if you want to support this)
      else {
        const destQuestion = questions.find(q => q.id === destinationQuestionId);
        
        if (!destQuestion || !destQuestion.options) {
          console.error('Destination question or options not found');
          return;
        }
        
        const sourceOptions = Array.from(sourceQuestion.options);
        const destOptions = Array.from(destQuestion.options);
        
        const [removed] = sourceOptions.splice(source.index, 1);
        destOptions.splice(destination.index, 0, removed);
        
        setQuestions(
          questions.map(q => {
            if (q.id === sourceQuestionId) {
              return { ...q, options: sourceOptions };
            }
            if (q.id === destinationQuestionId) {
              return { ...q, options: destOptions };
            }
            return q;
          })
        );
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
    const question = questions.find(q => q.id === questionId);
    
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

  const renderQuestionComponent = (question: Question, index: number) => {
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <QuizTitle
            quizName={quizName}
            isEditingTitle={isEditingTitle}
            setQuizName={setQuizName}
            setIsEditingTitle={setIsEditingTitle}
          />
          <div className="flex gap-2">
            <label className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none dark:focus:ring-blue-700 flex items-center cursor-pointer">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
              className="text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-green-500 dark:hover:bg-green-600 focus:outline-none dark:focus:ring-green-700 flex items-center"
              title={t('questionBuilder.actions.export')}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="page-tabs" direction="horizontal" type="page">
            {(provided) => (
              <div 
                className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto"
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {pages.map((page, index) => (
                  <Draggable key={page.id} draggableId={page.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`flex items-center px-4 py-2 text-sm font-medium border-b-2 rounded-t-lg cursor-pointer ${
                          activePage === page.id
                            ? 'text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500'
                            : 'text-gray-500 border-transparent hover:text-gray-600 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                        onClick={() => setActivePage(page.id)}
                      >
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
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
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
            )}
          </Droppable>
        </DragDropContext>
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

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId={activePage} type="question">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-6"
            >
              {activePageQuestions.length === 0 ? (
                <div className="flex items-center justify-center p-8 text-center border-2 border-dashed rounded-lg border-gray-300 dark:border-gray-600">
                  <p className="text-gray-500 dark:text-gray-400">
                    {t('questionBuilder.noQuestions')}
                  </p>
                </div>
              ) : (
                activePageQuestions.map((question, index) => (
                  <Draggable
                    key={question.id}
                    draggableId={question.id}
                    index={index}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex justify-between items-center mb-4">
                          <div
                            {...provided.dragHandleProps}
                            className="cursor-move p-1"
                          >
                            <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                          </div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {t('questionBuilder.questionNumber', { number: index + 1 })}
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
                        
                        {renderQuestionComponent(question, index)}
                      </div>
                    )}
                  </Draggable>
                ))
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}

export default QuestionBuilder; 
