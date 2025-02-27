import React from 'react';
import { useTranslation } from 'react-i18next';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import { Question } from '../../types';

interface MultipleChoiceProps {
  question: Question;
  updateQuestion: (updatedQuestion: Partial<Question>) => void;
}

function MultipleChoice({ question, updateQuestion }: MultipleChoiceProps) {
  const { t } = useTranslation();
  
  const updateQuestionText = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateQuestion({ text: e.target.value });
  };

  const updateOptionText = (optionId: string, text: string) => {
    if (!question.options) return;
    updateQuestion({
      options: question.options.map((opt) =>
        opt.id === optionId ? { ...opt, text } : opt
      ),
    });
  };

  const toggleOptionCorrect = (optionId: string) => {
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
    <div>
      <div className="mb-4">
        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
          {t('questionBuilder.questionText')}
        </label>
        <input
          type="text"
          value={question.text}
          onChange={updateQuestionText}
          placeholder={t('questionBuilder.enterQuestion')}
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
        />
      </div>

      <div className="mb-4">
        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
          {t('questionBuilder.options')}
        </label>
        
        <Droppable droppableId={`options-${question.id}`} type="option">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2"
            >
              {question.options?.map((option, index) => (
                <Draggable key={option.id} draggableId={option.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="flex items-center space-x-2"
                    >
                      <input
                        type="radio"
                        checked={option.isCorrect}
                        onChange={() => toggleOptionCorrect(option.id)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <input
                        type="text"
                        value={option.text}
                        onChange={(e) => updateOptionText(option.id, e.target.value)}
                        placeholder={`${t('questionBuilder.options')} ${index + 1}`}
                        className="flex-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      />
                      <button
                        onClick={() => removeOption(option.id)}
                        className="p-2.5 text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400"
                        title={t('questionBuilder.actions.delete')}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>

        <button
          onClick={addOption}
          className="mt-2 text-blue-600 hover:text-blue-800 dark:text-blue-500 dark:hover:text-blue-400"
        >
          + {t('questionBuilder.addOption')}
        </button>
      </div>
    </div>
  );
}

export default MultipleChoice; 
