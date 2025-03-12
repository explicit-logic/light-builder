export type QuestionType = 'multiple-choice' | 'multiple-response' | 'fill-in-the-blank';

export interface Option {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options?: Option[];
  image: string | null;
}

export interface QuestionBuilderProps {
  questions: Record<string, Question>;
  setQuestions: (questions: Record<string, Question>) => void;
}

export interface PageOrderItem {
  id: string;
  title: string;
  configFile: string;
}

export interface Manifest {
  name: string;
  description: string;
  totalPages: number;
  totalQuestions: number;
  activePage: string;
  globalTimeLimit: number | null;
  pageTimeLimit: number | null;
  pageOrder: PageOrderItem[];
}
