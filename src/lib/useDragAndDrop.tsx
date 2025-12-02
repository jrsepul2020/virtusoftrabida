/**
 * Hook para Drag & Drop usando @dnd-kit
 * Permite arrastrar elementos entre contenedores
 */
import { useState, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React from 'react';

// Tipos
export interface DraggableItem {
  id: string;
  containerId: string;
  [key: string]: any;
}

export interface ContainerData {
  id: string;
  items: DraggableItem[];
}

interface UseDragAndDropOptions<T extends DraggableItem> {
  initialContainers: Record<string, T[]>;
  onDragEnd?: (item: T, sourceContainer: string, targetContainer: string, newIndex: number) => void | Promise<void>;
}

interface UseDragAndDropReturn<T extends DraggableItem> {
  containers: Record<string, T[]>;
  activeItem: T | null;
  isDragging: boolean;
  handleDragStart: (event: DragStartEvent) => void;
  handleDragOver: (event: DragOverEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  setContainers: React.Dispatch<React.SetStateAction<Record<string, T[]>>>;
  moveItem: (itemId: string, targetContainerId: string, newIndex?: number) => void;
}

/**
 * Hook para manejar drag & drop entre contenedores
 */
export function useDragAndDrop<T extends DraggableItem>({
  initialContainers,
  onDragEnd,
}: UseDragAndDropOptions<T>): UseDragAndDropReturn<T> {
  const [containers, setContainers] = useState<Record<string, T[]>>(initialContainers);
  const [activeItem, setActiveItem] = useState<T | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const findContainer = useCallback((id: UniqueIdentifier): string | null => {
    // Buscar si el id es de un contenedor
    if (id in containers) return id as string;

    // Buscar en qué contenedor está el item
    for (const [containerId, items] of Object.entries(containers)) {
      if (items.some(item => item.id === id)) {
        return containerId;
      }
    }
    return null;
  }, [containers]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const containerId = findContainer(active.id);
    
    if (containerId) {
      const item = containers[containerId]?.find(i => i.id === active.id);
      if (item) {
        setActiveItem(item);
        setIsDragging(true);
      }
    }
  }, [containers, findContainer]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    setContainers(prev => {
      const activeItems = [...prev[activeContainer]];
      const overItems = [...prev[overContainer]];

      const activeIndex = activeItems.findIndex(i => i.id === active.id);
      const overIndex = overItems.findIndex(i => i.id === over.id);

      if (activeIndex === -1) return prev;

      // Mover item al nuevo contenedor
      const [movedItem] = activeItems.splice(activeIndex, 1);
      const updatedItem = { ...movedItem, containerId: overContainer };

      // Insertar en la posición correcta
      const insertIndex = overIndex >= 0 ? overIndex : overItems.length;
      overItems.splice(insertIndex, 0, updatedItem);

      return {
        ...prev,
        [activeContainer]: activeItems,
        [overContainer]: overItems,
      };
    });
  }, [findContainer]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setIsDragging(false);
    setActiveItem(null);

    if (!over) return;

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);

    if (!activeContainer || !overContainer) return;

    // Reordenar dentro del mismo contenedor
    if (activeContainer === overContainer) {
      const items = containers[activeContainer];
      const activeIndex = items.findIndex(i => i.id === active.id);
      const overIndex = items.findIndex(i => i.id === over.id);

      if (activeIndex !== overIndex) {
        setContainers(prev => ({
          ...prev,
          [activeContainer]: arrayMove(prev[activeContainer], activeIndex, overIndex),
        }));
      }
    }

    // Callback externo
    if (onDragEnd) {
      const item = containers[overContainer]?.find(i => i.id === active.id);
      if (item) {
        const newIndex = containers[overContainer].findIndex(i => i.id === active.id);
        await onDragEnd(item, activeContainer, overContainer, newIndex);
      }
    }
  }, [containers, findContainer, onDragEnd]);

  const moveItem = useCallback((itemId: string, targetContainerId: string, newIndex?: number) => {
    setContainers(prev => {
      const sourceContainer = findContainer(itemId);
      if (!sourceContainer || sourceContainer === targetContainerId) return prev;

      const sourceItems = [...prev[sourceContainer]];
      const targetItems = [...prev[targetContainerId]];

      const itemIndex = sourceItems.findIndex(i => i.id === itemId);
      if (itemIndex === -1) return prev;

      const [movedItem] = sourceItems.splice(itemIndex, 1);
      const updatedItem = { ...movedItem, containerId: targetContainerId };

      const insertIndex = newIndex !== undefined ? newIndex : targetItems.length;
      targetItems.splice(insertIndex, 0, updatedItem);

      return {
        ...prev,
        [sourceContainer]: sourceItems,
        [targetContainerId]: targetItems,
      };
    });
  }, [findContainer]);

  return {
    containers,
    activeItem,
    isDragging,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    setContainers,
    moveItem,
  };
}

// ============== COMPONENTES DE SOPORTE ==============

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Componente que hace un elemento arrastrable
 */
export function SortableItem({ id, children, className = '' }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${className} ${isDragging ? 'ring-2 ring-blue-400 shadow-lg' : ''}`}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}

interface DroppableContainerProps {
  id: string;
  items: DraggableItem[];
  children: React.ReactNode;
  className?: string;
  emptyMessage?: string;
}

/**
 * Contenedor que acepta elementos arrastrados
 */
export function DroppableContainer({ 
  id, 
  items, 
  children, 
  className = '',
  emptyMessage = 'Arrastra elementos aquí'
}: DroppableContainerProps) {
  return (
    <SortableContext id={id} items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
      <div className={className}>
        {items.length === 0 ? (
          <div className="py-4 text-center text-gray-400 text-sm italic border-2 border-dashed rounded-lg">
            {emptyMessage}
          </div>
        ) : (
          children
        )}
      </div>
    </SortableContext>
  );
}

interface DragAndDropProviderProps {
  children: React.ReactNode;
  onDragStart?: (event: DragStartEvent) => void;
  onDragOver?: (event: DragOverEvent) => void;
  onDragEnd?: (event: DragEndEvent) => void;
  overlayContent?: React.ReactNode;
}

/**
 * Provider de DnD Context con configuración por defecto
 */
export function DragAndDropProvider({
  children,
  onDragStart,
  onDragOver,
  onDragEnd,
  overlayContent,
}: DragAndDropProviderProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Mínimo 5px para activar drag
      },
    })
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      {children}
      <DragOverlay>
        {overlayContent}
      </DragOverlay>
    </DndContext>
  );
}

// Re-exportar todo lo necesario
export { DndContext, DragOverlay, SortableContext, useSortable, arrayMove };
export type { DragStartEvent, DragEndEvent, DragOverEvent };
