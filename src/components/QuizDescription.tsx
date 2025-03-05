import { useTranslation } from 'react-i18next';

interface QuizDescriptionProps {
  quizDescription: string;
  setQuizDescription: (description: string) => void;
  showDescription: boolean;
}

function QuizDescription({ 
  quizDescription,
  setQuizDescription,
  showDescription
}: QuizDescriptionProps) {
  const { t } = useTranslation();

  return (
    <>
      {showDescription && (
        <div className="px-1 w-full max-w-4xl">
          <textarea
            value={quizDescription}
            onChange={(e) => setQuizDescription(e.target.value)}
            placeholder={t('questionBuilder.descriptionPlaceholder')}
            className="w-full p-3 text-sm text-gray-800 dark:text-white bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
            rows={3}
          />
        </div>
      )}
    </>
  );
}

export default QuizDescription; 
