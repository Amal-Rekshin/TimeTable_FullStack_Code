// src/components/Timetable.jsx

import { periods, weekDays } from "../utils/periods";
import PeriodRow from "./PeriodRow";
import { useEffect, useState } from "react";
import EditModal from "./EditModal";
import SectionTabs from "./SectionTabs";

export default function Timetable({
  grid = {},
  fullGrid = {},
  activeDept,
  activeYear,
  activeSection,
  setActiveSection,
  subjectsList = [],
  subjects = {},
  staff = [],
  onUpdateGrid
}) {

  const [currentTable, setCurrentTable] = useState({});
  const [editingCell, setEditingCell] = useState(null);

  const yearKey = `year${activeYear}`;
  const availableSections = grid[yearKey] ? Object.keys(grid[yearKey]).sort() : ["A"];

  useEffect(() => {
    if (grid?.[yearKey]?.[activeSection]) {
      setCurrentTable(grid[yearKey][activeSection]);
    } else {
      setCurrentTable({});
    }
  }, [activeYear, activeSection, grid, yearKey]);

  // Build a lookup map for Short Names to show in cells
  const shortNameMap = subjectsList.reduce((acc, sub) => {
    if (sub.name && sub.shortName) {
      acc[sub.name] = sub.shortName;
    }
    return acc;
  }, {});

  // Ensure activeSection is valid for the current grid
  useEffect(() => {
    if (!availableSections.includes(activeSection)) {
      setActiveSection("A");
    }
  }, [availableSections, activeSection, setActiveSection]);

  console.log(currentTable)

  const updateSubject = (day, periodId, updatedCell) => {
    // 1. Update master grid structure
    const newDeptGrid = JSON.parse(JSON.stringify(grid));
    const yearKey = `year${activeYear}`;
    if (!newDeptGrid[yearKey]) newDeptGrid[yearKey] = {};
    if (!newDeptGrid[yearKey][activeSection]) newDeptGrid[yearKey][activeSection] = {};
    if (!newDeptGrid[yearKey][activeSection][day]) newDeptGrid[yearKey][activeSection][day] = {};

    newDeptGrid[yearKey][activeSection][day][periodId] = {
      ...updatedCell,
      type: "class" // Ensure it's a class if edited
    };

    // 2. Propagate to App.jsx
    if (onUpdateGrid) {
      onUpdateGrid(newDeptGrid);
    }
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 tracking-tight">
          Timetable — <span className="text-blue-600">{activeDept}</span> <span className="text-gray-300 mx-1">|</span> Year {activeYear} <span className="text-gray-300 mx-1">|</span> Section {activeSection}
        </h2>
      </div>

      <SectionTabs
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        availableSections={availableSections}
      />

      {/* Timetable */}
      <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[800px] md:min-w-0">
            <thead className="bg-gray-50 border-b">
              <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <th className="p-4 border-r border-gray-100">Day</th>
                {periods?.map((p) => (
                  <th key={p.id} className="p-4 text-center border-r border-gray-100 last:border-r-0">
                    <div className="font-black text-gray-600 mb-1">{p.name}</div>
                    <div className="text-[9px] text-gray-400 font-mono">
                      {p.start} - {p.end}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {weekDays?.map((day) => (
                <PeriodRow
                  key={day}
                  day={day}
                  data={currentTable[day] || {}}
                  shortNameMap={shortNameMap}
                  fullGrid={fullGrid}
                  activeDept={activeDept}
                  activeYear={activeYear}
                  activeSection={activeSection}
                  onEdit={(periodId) => setEditingCell({ day, periodId })}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingCell && (
        <EditModal
          timetable={currentTable}
          fullGrid={fullGrid}
          editingCell={editingCell}
          onClose={() => setEditingCell(null)}
          onSave={updateSubject}
          subjectsList={subjectsList}
          staff={staff}
          activeDept={activeDept}
        />
      )}

      {/* Teacher Class Counts */}
      <div className="mt-8 md:mt-12 bg-gray-50 p-4 md:p-8 rounded-2xl md:rounded-3xl border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-2 h-8 bg-green-500 rounded-full"></span>
          <div>
            <h3 className="text-xl md:text-2xl font-black text-gray-800 tracking-tight">📊 Section Workload Analysis</h3>
            <p className="text-gray-500 text-xs md:text-sm">Distribution of teaching hours across faculty for Year {activeYear} Sect {activeSection}.</p>
          </div>
        </div>

        <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border">
          <table className="min-w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">
                <th className="py-4 px-6 text-left">Subject</th>
                <th className="py-4 px-6 text-center">Required</th>
                <th className="py-4 px-6 text-center">Scheduled</th>
                <th className="py-4 px-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(subjects?.[activeDept]?.[`year${activeYear}`] || []).map((sub, idx) => {
                const subjectName = sub.subject || sub.name;
                const scheduled = Object.values(currentTable || {}).reduce((acc, dayData) => {
                  return acc + Object.values(dayData).filter(cell => cell.subject === subjectName).length;
                }, 0);
                const required = parseInt(sub.hours || sub.credits || 0);
                const isComplete = scheduled === required;

                if (required === 0 && scheduled === 0) return null;

                return (
                  <tr key={sub.id || sub.code || idx} className="hover:bg-blue-50/30 transition-colors">
                    <td className="py-4 px-6 font-bold text-gray-800">{subjectName}</td>
                    <td className="py-4 px-6 text-center text-gray-500 font-mono">{required} hrs</td>
                    <td className="py-4 px-6 text-center font-black text-blue-600">{scheduled} hrs</td>
                    <td className="py-4 px-6 text-right">
                      {isComplete ? (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Matched</span>
                      ) : scheduled > required ? (
                        <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Over {scheduled - required}</span>
                      ) : (
                        <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Missing {required - scheduled}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
