export type QuestionType = 'multiple-choice' | 'multiple-response' | 'fill-in-the-blank';

export interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options: Option[];
  answer?: string;
} 
