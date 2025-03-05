import React from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem, DragHandle } from '../SortableItem';
import { Question } from '../../types';

interface MultipleResponseProps {
  question: Question;
  updateQuestion: (updatedQuestion: Partial<Question>) => void;
}

function MultipleResponse({ question, updateQuestion }: MultipleResponseProps) {
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateQuestion({ text: e.target.value });
  };

  const handleOptionTextChange = (optionId: string, text: string) => {
    if (!question.options) return;
    updateQuestion({
      options: question.options.map((opt) =>
        opt.id === optionId ? { ...opt, text } : opt
      ),
    });
  };

  const handleOptionCorrectChange = (optionId: string) => {
    if (!question.options) return;
    updateQuestion({
      options: question.options.map((opt) =>
        opt.id === optionId ? { ...opt, isCorrect: !opt.isCorrect } : opt
      ),
    });
  };

  const addOption = () => {
    if (!question.options) return;
    const newOption = {
      id: `option-${Date.now()}`,
      text: '',
      isCorrect: false,
    };
    updateQuestion({ options: [...question.options, newOption] });
  };

  const removeOption = (optionId: string) => {
    if (!question.options) return;
    updateQuestion({
      options: question.options.filter((opt) => opt.id !== optionId),
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
          Question Text
        </label>
        <textarea
          value={question.text}
          onChange={handleTextChange}
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          placeholder="Enter your question here"
          rows={3}
        />
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
          Options
        </label>
        <SortableContext
          items={question.options?.map(opt => opt.id) || []}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {question.options?.map((option) => (
              <SortableItem
                key={option.id}
                id={option.id}
                data={{ type: 'option', questionId: question.id }}
              >
                <div className="flex items-center gap-2">
                  <DragHandle>
                    <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </DragHandle>
                  <input
                    type="checkbox"
                    checked={option.isCorrect}
                    onChange={() => handleOptionCorrectChange(option.id)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) => handleOptionTextChange(option.id, e.target.value)}
                    className="flex-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    placeholder="Enter option text"
                  />
                  <button
                    onClick={() => removeOption(option.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </SortableItem>
            ))}
          </div>
        </SortableContext>
        <button
          onClick={addOption}
          className="mt-2 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
        >
          Add Option
        </button>
      </div>
    </div>
  );
}

export default MultipleResponse; 
