export type QuestionType = 'multipleChoice' | 'multipleResponse' | 'fillInTheBlank';

export interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options?: Option[];
  answer?: string;
  image: string | null;
}

export interface QuestionBuilderProps {
  questions: Record<string, Question>;
  setQuestions: (questions: Record<string, Question>) => void;
}

export interface Page {
  id: string;
  title: string;
  questions: string[]; // Array of question IDs
} 
