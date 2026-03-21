'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ExerciseCard } from './ExerciseCard';
import type { ComponentProps } from 'react';

type Props = Omit<ComponentProps<typeof ExerciseCard>, 'dragHandleProps'> & { sortId: string };

export function SortableExerciseCard({ sortId, ...cardProps }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortId });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform) ?? undefined,
    transition: transition ?? undefined,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <ExerciseCard
        {...cardProps}
        dragHandleProps={{ ...attributes, ...listeners } as React.HTMLAttributes<HTMLDivElement>}
      />
    </div>
  );
}
