// src/components/EditModal.jsx

import { useState, useEffect } from "react";

export default function EditModal({
  timetable,
  fullGrid,
  editingCell,
  onClose,
  onSave,
  subjectsList = [],
  staff = [],
  activeDept
}) {
  const { day, periodId } = editingCell;
  const current = timetable?.[day]?.[periodId] || null;

  // Configuration for filtering
  const deptSubjects = subjectsList.filter(s => s.dept === activeDept);
  const deptStaff = staff.filter(s => s.dept === activeDept);

  // States
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (current) {
      if (current.code) {
        const sub = deptSubjects.find(s => s.code === current.code);
        if (sub) setSelectedSubjectId(sub.id);
      }
      if (current.teacherCode) {
        const t = deptStaff.find(s => s.code === current.teacherCode);
        if (t) setSelectedStaffId(t.id);
      }
    }
  }, [current, activeDept]);

  const checkClash = (teacherCode) => {
    if (!teacherCode || teacherCode === "free") return null;

    for (const [deptName, deptGrid] of Object.entries(fullGrid)) {
      for (const [year, yearGrid] of Object.entries(deptGrid)) {
        for (const [section, sectionGrid] of Object.entries(yearGrid)) {
          // Skip the EXACT cell being edited to avoid false self-clash
          const isSameCell =
            deptName === activeDept &&
            year === String(editingCell.year) &&
            section === editingCell.section;

          if (isSameCell) continue; // ← was missing before!

          const cell = sectionGrid[day]?.[periodId];
          if (cell && cell.type === "class" && cell.teacherCode === teacherCode) {
            return { deptName, year, section };
          }
        }
      }
    }
    return null;
  };

  const save = () => {
    setError("");
    const sub = deptSubjects.find(s => s.id == selectedSubjectId);
    const teach = deptStaff.find(s => s.id == selectedStaffId);

    if (teach) {
        const clash = checkClash(teach.code);
        if (clash) {
            setError(`Staff busy in ${clash.deptName} - Yr ${clash.year} ${clash.section}`);
            return;
        }
    }

    const updatedCell = {
      ...current,
      subject: sub ? sub.name : "",
      shortName: sub ? sub.shortName : "",
      code: sub ? sub.code : "",
      subjectType: sub ? sub.type : "Theory",
      teacher: teach ? teach.name : "Free",
      teacherCode: teach ? teach.code : "",
    };

    onSave(day, periodId, updatedCell);
    onClose();
  };

  // Don't render if it's explicitly a break (those shouldn't be edited)
  if (current?.type === "break") {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">📝 Edit Assignment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Select Subject</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full bg-gray-50 border-0 p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold text-gray-700 transition-all appearance-none shadow-inner"
            >
              <option value="">-- Choose Subject --</option>
              {deptSubjects.map(sub => (
                <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Assign Staff</label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full bg-gray-50 border-0 p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold text-gray-700 transition-all appearance-none shadow-inner"
            >
              <option value="">-- Choose Staff --</option>
              <option value="free">No Teacher (Free Period)</option>
              {deptStaff.map(s => (
                <option key={s.id} value={s.id}>{s.name} [{s.code}]</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold border border-red-100 animate-pulse">
              ⚠️ {error}
            </div>
          )}

          <div className="pt-4 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={save}
              className="flex-1 px-6 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
            >
              Update Slot
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
