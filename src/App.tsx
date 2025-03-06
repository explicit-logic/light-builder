import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import QuestionBuilder from './components/QuestionBuilder';
import ThemeToggle from './components/ThemeToggle';
import LanguageSelector from './components/LanguageSelector';
import useLocalStorage from './hooks/useLocalStorage';
import { Question } from './types';
import { Toaster } from 'react-hot-toast';
import './i18n/config';

function App() {
  const { t } = useTranslation();
  const [darkMode, setDarkMode] = useLocalStorage('darkMode', false);
  const [questions, setQuestions] = useLocalStorage<Record<string, Question>>('questions', {});
  const [jsonOutput, setJsonOutput] = useState('');

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    setJsonOutput(JSON.stringify(questions, null, 2));
  }, [questions]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
      <Toaster position="top-center" />
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('questionBuilder.title')}</h1>
          <div className="flex items-center space-x-4">
            <LanguageSelector />
            <ThemeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
          </div>
        </header>
        
        <div className="flex justify-center">
          <div className="w-full">
            <QuestionBuilder questions={questions} setQuestions={setQuestions} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App; 
