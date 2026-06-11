// src/components/beautifulDnd/BeautifulDraggable.jsx

import { Draggable } from "react-beautiful-dnd";

export default function BeautifulDraggable({ id, index, label }) {
  return (
    <Draggable draggableId={id} index={index}>
      {(provided) => (
        <div
          className="p-2 bg-purple-500 text-white rounded shadow cursor-move"
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          {label}
        </div>
      )}
    </Draggable>
  );
}
