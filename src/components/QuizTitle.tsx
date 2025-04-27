import { useTranslation } from 'react-i18next';

interface QuizTitleProps {
  name: string;
  isEditingTitle: boolean;
  setName: (title: string) => void;
  setIsEditingTitle: (isEditing: boolean) => void;
}

function QuizTitle({
  name,
  isEditingTitle,
  setName, 
  setIsEditingTitle,
}: QuizTitleProps) {
  const { t } = useTranslation();

  const handleTitleFinishEditing = () => {
    if (!name.trim()) {
      setName(t('questionBuilder.quizName'));
    }
    setIsEditingTitle(false);
  };

  return (
    <div className="min-w-xs">
      {isEditingTitle ? (
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleTitleFinishEditing}
          onKeyDown={(e) => e.key === 'Enter' && handleTitleFinishEditing()}
          className="text-xl font-semibold text-gray-800 dark:text-white w-full bg-transparent px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
          autoFocus
        />
      ) : (
        <h2
          className="text-xl font-semibold text-gray-800 dark:text-white px-2 py-1.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors duration-200 border border-gray-200 dark:border-gray-700"
          onClick={() => setIsEditingTitle(true)}
        >
          {name}
        </h2>
      )}
    </div>
  );
}

export default QuizTitle; 
