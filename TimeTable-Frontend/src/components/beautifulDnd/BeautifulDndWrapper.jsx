// src/components/beautifulDnd/BeautifulDndWrapper.jsx

import { DragDropContext, Droppable } from "react-beautiful-dnd";

export default function BeautifulDndWrapper({ items, onDragEnd, children }) {
  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const newOrder = Array.from(items);
    const [moved] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, moved);

    onDragEnd(newOrder);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="subjects-grid" direction="horizontal">
        {(provided) => (
          <div
            ref={provided.innerRef}
            className="flex gap-2"
            {...provided.droppableProps}
          >
            {children}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
