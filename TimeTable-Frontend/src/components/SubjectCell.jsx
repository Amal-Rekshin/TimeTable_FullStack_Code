import { findGlobalConflicts } from "../utils/conflictChecker";

export default function SubjectCell({ 
  cell, 
  shortNameMap = {}, 
  onClick,
  fullGrid,
  day,
  periodId,
  activeDept,
  activeYear,
  activeSection
}) {
  if (!cell) {
    return (
      <td
        onClick={onClick}
        className="border p-2 text-center bg-white text-gray-200 cursor-pointer hover:bg-blue-50 transition-colors"
      >
        —
      </td>
    );
  }

  const isBreak = cell.type === "break";
  const isLab = cell.subjectType === "Lab";

  // Resolve short name from map if not in cell
  const effectiveShortName = cell.shortName || shortNameMap[cell.subject] || cell.subject;
  const hasShortName = effectiveShortName !== cell.subject;

  const conflicts = findGlobalConflicts(fullGrid, cell.teacher, day, periodId, {
    dept: activeDept,
    year: `year${activeYear}`,
    section: activeSection
  });

  const hasConflict = conflicts.length > 0;

  return (
    <td
      onClick={onClick}
      className={`border p-2 text-center cursor-pointer transition-all relative group ${isBreak
        ? "bg-amber-50 text-amber-800 font-bold italic"
        : hasConflict 
          ? "bg-red-50 border-l-4 border-l-red-500 shadow-[inset_0_0_10px_rgba(239,68,68,0.1)]"
          : cell.assignType === "random"
            ? "hover:bg-amber-50 bg-amber-50/20 border-l-4 border-l-amber-500"
            : isLab
              ? "hover:bg-purple-50 bg-white border-l-4 border-l-purple-500"
              : "hover:bg-blue-50 bg-white"
        }`}
    >
      {hasConflict && (
        <div className="absolute -top-1 -right-1 z-10">
          <span className="flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600 text-[10px] text-white items-center justify-center font-bold">!</span>
          </span>
          {/* Tooltip */}
          <div className="absolute hidden group-hover:block bottom-full right-0 mb-2 w-48 p-2 bg-gray-900 text-white text-[10px] rounded-lg shadow-xl z-20 pointer-events-none">
            <p className="font-bold text-red-400 mb-1">Teacher Conflict!</p>
            {conflicts.map((c, i) => (
              <div key={i} className="border-t border-white/10 pt-1 mt-1">
                Busy in {c.dept} {c.year.replace('year', 'Yr')} - {c.section} ({c.subject})
              </div>
            ))}
            <div className="absolute top-full right-2 border-8 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
      {isBreak ? (
        <span className="text-xs uppercase tracking-widest">{cell.subject || "Break"}</span>
      ) : (
        <div className="space-y-1">
          <div className="flex justify-between items-start gap-1">
            <span className="text-[9px] font-black text-blue-500 bg-blue-50 px-1 rounded">{cell.code}</span>
            {isLab && <span className="text-[9px] font-black text-purple-500 bg-purple-50 px-1 rounded uppercase">Lab</span>}
          </div>
          <div className="font-bold text-gray-900 text-sm leading-tight">
            {effectiveShortName}
          </div>
          {hasShortName && (
            <div className="text-[10px] text-gray-400 font-medium leading-tight">
              {cell.subject}
            </div>
          )}
          {cell.teacher && (
            <div className="text-[10px] text-blue-600/70 font-semibold mt-1">
              {cell.teacher} <span className="opacity-40 font-mono">({cell.teacherCode})</span>
            </div>
          )}
        </div>
      )}
    </td>
  );
}
