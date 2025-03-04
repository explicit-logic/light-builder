import { useTranslation } from 'react-i18next';

interface QuizTitleProps {
  quizName: string;
  isEditingTitle: boolean;
  setQuizName: (title: string) => void;
  setIsEditingTitle: (isEditing: boolean) => void;
}

function QuizTitle({ quizName, isEditingTitle, setQuizName, setIsEditingTitle }: QuizTitleProps) {
  const { t } = useTranslation();

  const handleTitleFinishEditing = () => {
    if (!quizName.trim()) {
      setQuizName(t('questionBuilder.quizName'));
    }
    setIsEditingTitle(false);
  };

  return (
    <div className="flex items-center h-12 mb-4">
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
        <h2 
          className="text-xl font-semibold text-gray-800 dark:text-white px-2 py-1.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors duration-200" 
          onClick={() => setIsEditingTitle(true)}
        >
          {quizName}
        </h2>
      )}
    </div>
  );
}

export default QuizTitle; 
