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
  options: Option[];
  answer?: string;
} 
