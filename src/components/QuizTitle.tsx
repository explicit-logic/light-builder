import { useTranslation } from 'react-i18next';

interface QuizTitleProps {
  quizName: string;
  isEditingTitle: boolean;
  setQuizName: (title: string) => void;
  setIsEditingTitle: (isEditing: boolean) => void;
  showDescription: boolean;
  setShowDescription: (show: boolean) => void;
}

function QuizTitle({ 
  quizName, 
  isEditingTitle, 
  setQuizName, 
  setIsEditingTitle,
  showDescription,
  setShowDescription
}: QuizTitleProps) {
  const { t } = useTranslation();

  const handleTitleFinishEditing = () => {
    if (!quizName.trim()) {
      setQuizName(t('questionBuilder.quizName'));
    }
    setIsEditingTitle(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {isEditingTitle ? (
          <input
            type="text"
            value={quizName}
            onChange={(e) => setQuizName(e.target.value)}
            onBlur={handleTitleFinishEditing}
            onKeyDown={(e) => e.key === 'Enter' && handleTitleFinishEditing()}
            className="text-xl font-semibold text-gray-800 dark:text-white w-full bg-transparent px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 h-10"
            autoFocus
          />
        ) : (
          <>
            <h2 
              className="text-xl font-semibold text-gray-800 dark:text-white px-2 py-1.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors duration-200" 
              onClick={() => setIsEditingTitle(true)}
            >
              {quizName}
            </h2>
            <button
              onClick={() => setShowDescription(!showDescription)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              title={showDescription ? t('questionBuilder.hideDescription') : t('questionBuilder.showDescription')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showDescription ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"} />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default QuizTitle; 
