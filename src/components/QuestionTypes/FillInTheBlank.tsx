import React from 'react';
import { useTranslation } from 'react-i18next';
import { Question } from '../../types';

interface FillInTheBlankProps {
  question: Question;
  updateQuestion: (updatedQuestion: Partial<Question>) => void;
  answers: string[];
  onAnswerChange: (answer: string) => void;
}

function FillInTheBlank({ question, updateQuestion, answers, onAnswerChange }: FillInTheBlankProps) {
  const { t } = useTranslation();

  const handleQuestionTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateQuestion({ text: e.target.value });
  };

  const handleAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onAnswerChange(e.target.value);
  };

  return (
    <div>
      <div className="mb-4">
        <label className="block text-gray-700 dark:text-gray-300 mb-2">
          {t('questionBuilder.fillInTheBlank.instruction')}
        </label>
        <input
          type="text"
          value={question.text}
          onChange={handleQuestionTextChange}
          placeholder={t('questionBuilder.fillInTheBlank.placeholder')}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 dark:text-gray-300 mb-2">
          {t('questionBuilder.fillInTheBlank.correctAnswer')}
        </label>
        <input
          type="text"
          value={answers[0] || ''}
          onChange={handleAnswerChange}
          placeholder={t('questionBuilder.fillInTheBlank.answerPlaceholder')}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
        />
      </div>
    </div>
  );
}

export default FillInTheBlank; 
