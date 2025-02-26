import React from 'react';
import { Question } from '../../types';

interface FillInTheBlankProps {
  question: Question;
  updateQuestion: (updatedQuestion: Partial<Question>) => void;
}

function FillInTheBlank({ question, updateQuestion }: FillInTheBlankProps) {
  const handleQuestionTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateQuestion({ text: e.target.value });
  };

  const handleAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateQuestion({ answer: e.target.value });
  };

  return (
    <div>
      <div className="mb-4">
        <label className="block text-gray-700 dark:text-gray-300 mb-2">
          Question (use "_____" to indicate the blank)
        </label>
        <input
          type="text"
          value={question.text}
          onChange={handleQuestionTextChange}
          placeholder="Enter your question with _____"
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 dark:text-gray-300 mb-2">
          Correct Answer
        </label>
        <input
          type="text"
          value={question.answer || ''}
          onChange={handleAnswerChange}
          placeholder="Enter the correct answer"
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
        />
      </div>
    </div>
  );
}

export default FillInTheBlank; 
