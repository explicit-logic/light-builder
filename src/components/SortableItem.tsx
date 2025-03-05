import React, { createContext, useContext } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';

// Create a context to pass down sortable attributes
const SortableContext = createContext<{
  attributes: Record<string, any>;
  listeners: SyntheticListenerMap | undefined;
  isDragging: boolean;
} | null>(null);

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  data?: Record<string, any>;
}

export function SortableItem({ id, children, data }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id, 
    data,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Provide the sortable attributes to children
  return (
    <SortableContext.Provider value={{ attributes, listeners, isDragging }}>
      <div ref={setNodeRef} style={style}>
        {children}
      </div>
    </SortableContext.Provider>
  );
}

// Create a separate component for the drag handle
interface DragHandleProps {
  children?: React.ReactNode;
  className?: string;
}

export function DragHandle({ children, className = '' }: DragHandleProps) {
  // Get the sortable attributes from context
  const context = useContext(SortableContext);
  
  if (!context) {
    console.warn('DragHandle must be used within a SortableItem');
    return null;
  }
  
  const { attributes, listeners } = context;
  
  return (
    <div 
      className={`cursor-move p-1 ${className}`}
      {...attributes}
      {...listeners}
    >
      {children || (
        <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      )}
    </div>
  );
} 
