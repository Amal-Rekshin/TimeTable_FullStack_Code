// src/components/StaffScheduleView.jsx

import React, { useState, useMemo } from 'react';
import { periods, weekDays } from "../utils/periods";
import { getStaffGlobalSchedule } from "../utils/conflictChecker";

export default function StaffScheduleView({ fullGrid, staff = [], subjectsList = [] }) {
  const [selectedStaff, setSelectedStaff] = useState(staff[0]?.name || "");

  const schedule = useMemo(() => {
    return getStaffGlobalSchedule(fullGrid, selectedStaff);
  }, [fullGrid, selectedStaff]);

  if (!fullGrid || Object.keys(fullGrid).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <span className="text-6xl mb-4">🗓️</span>
        <h3 className="text-xl font-bold">No Generated Timetable Found</h3>
        <p>Please generate a timetable first to view staff schedules.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">📅 Global Staff Schedule</h2>
          <p className="text-gray-500 text-sm font-medium">Verification of teacher conflicts across all departments and years.</p>
        </div>
        <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-2xl border">
          <span className="text-xs font-black text-gray-400 uppercase tracking-widest pl-2">Select Faculty</span>
          <select
            value={selectedStaff}
            onChange={(e) => setSelectedStaff(e.target.value)}
            className="bg-white border-0 py-2 px-4 rounded-xl font-bold text-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500"
          >
            {staff.map(s => <option key={s.id} value={s.name}>{s.name} ({s.dept})</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
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
                <tr key={day} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-bold bg-gray-50/50 text-gray-700 border-r">{day}</td>
                  {periods.map(p => {
                    const cell = schedule[day]?.[p.id];
                    if (p.type === 'break') {
                        return <td key={p.id} className="p-2 bg-amber-50/30 text-center text-[10px] font-bold text-amber-600/50 italic border-r last:border-r-0 uppercase tracking-widest">{p.name}</td>;
                    }
                    if (!cell) return <td key={p.id} className="p-4 text-center text-gray-200 border-r last:border-r-0">—</td>;

                    return (
                      <td key={p.id} className="p-2 border-r last:border-r-0">
                        <div className="flex flex-col items-center text-center p-2 rounded-xl bg-blue-50 border border-blue-100 shadow-sm">
                          <span className="text-[10px] font-black text-blue-600 mb-1">{cell.dept} {cell.year.replace('year', 'Yr')} - {cell.section}</span>
                          <span className="text-xs font-bold text-gray-800 leading-tight">{cell.subject}</span>
                          <span className="text-[9px] font-bold text-gray-400 mt-1 uppercase">{cell.type}</span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
