import React from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import { Question } from '../../types';

interface MultipleResponseProps {
  question: Question;
  updateQuestion: (updatedQuestion: Partial<Question>) => void;
}

function MultipleResponse({ question, updateQuestion }: MultipleResponseProps) {
  const updateQuestionText = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateQuestion({ text: e.target.value });
  };

  const updateOptionText = (optionId: string, text: string) => {
    const updatedOptions = question.options?.map((option) =>
      option.id === optionId ? { ...option, text } : option
    );
    updateQuestion({ options: updatedOptions });
  };

  const toggleCorrectOption = (optionId: string) => {
    const updatedOptions = question.options?.map((option) =>
      option.id === optionId
        ? { ...option, isCorrect: !option.isCorrect }
        : option
    );
    updateQuestion({ options: updatedOptions });
  };

  const addOption = () => {
    const newOption = {
      id: `option-${Date.now()}`,
      text: '',
      isCorrect: false,
    };
    updateQuestion({
      options: [...(question.options || []), newOption],
    });
  };

  const removeOption = (optionId: string) => {
    // Only allow removal if there are more than 2 options
    if ((question.options?.length || 0) <= 2) {
      return;
    }
    
    const updatedOptions = question.options?.filter(
      (option) => option.id !== optionId
    );
    updateQuestion({ options: updatedOptions });
  };

  return (
    <div>
      <div className="mb-4">
        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
          Question Text
        </label>
        <input
          type="text"
          value={question.text}
          onChange={updateQuestionText}
          placeholder="Enter your question"
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
        />
      </div>

      <div className="mb-4">
        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
          Options (Select all that apply)
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
                      className="flex items-center space-x-2"
                    >
                      <div
                        {...provided.dragHandleProps}
                        className="cursor-move p-1"
                      >
                        <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                      </div>
                      <div className="flex-1 flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={option.isCorrect}
                          onChange={() => toggleCorrectOption(option.id)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <input
                          type="text"
                          value={option.text}
                          onChange={(e) => updateOptionText(option.id, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        />
                      </div>
                      {/* Only show delete button if there are more than 2 options */}
                      {(question.options?.length || 0) > 2 && (
                        <button
                          onClick={() => removeOption(option.id)}
                          className="text-red-500 hover:text-red-700 p-1 focus:outline-none focus:ring-2 focus:ring-red-300 rounded-lg"
                          aria-label="Remove option"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
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
          className="mt-2 text-blue-700 hover:text-blue-800 focus:ring-2 focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-1.5 dark:text-blue-500 dark:hover:text-blue-400 focus:outline-none"
        >
          + Add Option
        </button>
      </div>
    </div>
  );
}

export default MultipleResponse; 
