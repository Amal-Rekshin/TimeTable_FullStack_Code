// src/components/PeriodRow.jsx

import SubjectCell from "./SubjectCell";
import { periods } from "../utils/periods";

export default function PeriodRow({ day, data = {}, shortNameMap, fullGrid, activeDept, activeYear, activeSection, onEdit }) {
  // Ensure data is always an object
  const safeData = data || {};

  // Get period IDs from the periods configuration to maintain order
  const periodIds = periods.map(p => p.id);

  return (
    <tr>
      <td className="border p-2 font-semibold bg-gray-50">{day}</td>

      {periodIds.map((periodId) => {
        if (day === "Saturday" && (periodId === "interval2" || periodId === "p7")) {
            if (periodId === "interval2") {
                return (
                    <td key={periodId} colSpan={2} className="p-6 bg-gray-100 text-center border-r border-b">
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">
                            Weekend Early End
                        </div>
                    </td>
                );
            }
            return null;
        }

        const cell = safeData[periodId];
        
        return (
          <SubjectCell
            key={periodId}
            periodId={periodId}
            day={day}
            cell={cell}
            shortNameMap={shortNameMap}
            fullGrid={fullGrid}
            activeDept={activeDept}
            activeYear={activeYear}
            activeSection={activeSection}
            onClick={() => {
              // Allow editing if it's not a break
              if (cell?.type !== "break") {
                onEdit(periodId);
              }
            }}
          />
        );
      })}
    </tr>
  );
}
