// src/components/SubjectsForm.jsx

import { useState, useMemo, useEffect } from "react";
import { notify } from "./Toast";
import { autoGenerateTimetable } from "../utils/autoGenerator";

export default function SubjectsForm({ onSave, onStrictSave, onLocalSave, staff = [], departments = [], subjectsList = [], initialData = {}, allowCreditEdit }) {
  // Notifications handled by notify utility
  // Structure: { [deptName]: { year1: [], year2: [], year3: [], year4: [] } }
  const [allSubjects, setAllSubjects] = useState(initialData || {});
  const [activeDept, setActiveDept] = useState(departments[0]?.name || "CSE");

  // Show all subjects for suggestions across all departments
  const filteredSubjects = useMemo(() => subjectsList, [subjectsList]);

  // Initialize empty structure for all departments if not present, but KEEP existing data
  useEffect(() => {
    const updated = { ...allSubjects };
    let changed = false;
    departments.forEach(dept => {
      if (!updated[dept.name]) {
        updated[dept.name] = {
          year1: [{ subject: "", shortName: "", code: "", type: "Theory", hours: 0, teacher: "", teacherCode: "", dept: "", needsSectionB: false, saturdayOnly: false, teacherB: "", teacherCodeB: "" }],
          year2: [{ subject: "", shortName: "", code: "", type: "Theory", hours: 0, teacher: "", teacherCode: "", dept: "", needsSectionB: false, saturdayOnly: false, teacherB: "", teacherCodeB: "" }],
          year3: [{ subject: "", shortName: "", code: "", type: "Theory", hours: 0, teacher: "", teacherCode: "", dept: "", needsSectionB: false, saturdayOnly: false, teacherB: "", teacherCodeB: "" }],
          year4: [{ subject: "", shortName: "", code: "", type: "Theory", hours: 0, teacher: "", teacherCode: "", dept: "", needsSectionB: false, saturdayOnly: false, teacherB: "", teacherCodeB: "" }],
        };
        changed = true;
      }
    });

    // Also sync if initialData changed externally (e.g. after Firebase load)
    if (initialData && Object.keys(initialData).length > 0) {
      Object.keys(initialData).forEach(dept => {
        if (!updated[dept]) {
          updated[dept] = initialData[dept];
          changed = true;
        }
      });
    }

    if (changed) setAllSubjects(updated);
  }, [departments, initialData]);

  const currentDeptSubjects = useMemo(() => {
    const deptData = allSubjects[activeDept] || {};
    return {
      year1: deptData.year1 || [],
      year2: deptData.year2 || [],
      year3: deptData.year3 || [],
      year4: deptData.year4 || [],
    };
  }, [allSubjects, activeDept]);

  // Calculate global-style workload per staff (across ALL departments)
  const staffWorkload = useMemo(() => {
    const counts = {};
    Object.values(allSubjects).forEach(deptData => {
      Object.values(deptData).flat().forEach(sub => {
        if (sub.teacher) {
          const hours = parseInt(sub.hours) || 0;
          const yearKey = Object.keys(deptData).find(yk => deptData[yk].includes(sub));
          const needsSectionB = deptData[yearKey]?.some(s => s.needsSectionB);

          // Section A contribution
          counts[sub.teacher] = (counts[sub.teacher] || 0) + hours;

          // Section B contribution if enabled
          if (needsSectionB) {
            const bTeacher = sub.teacherB || sub.teacher;
            counts[bTeacher] = (counts[bTeacher] || 0) + hours;
          }
        }
      });
    });
    return counts;
  }, [allSubjects]);

  const addRow = (year) => {
    const isSectionBEnabled = currentDeptSubjects[year]?.some(s => s.needsSectionB) || false;
    const updatedRows = [...(currentDeptSubjects[year] || [])];
    updatedRows.push({
      subject: "",
      shortName: "",
      code: "",
      type: "Theory",
      hours: 0,
      teacher: "",
      teacherCode: "",
      dept: "",
      needsSectionB: isSectionBEnabled,
      saturdayOnly: false,
      teacherB: "",
      teacherCodeB: ""
    });
    const updatedDept = {
      ...currentDeptSubjects,
      [year]: updatedRows,
    };
    setAllSubjects({ ...allSubjects, [activeDept]: updatedDept });
  };

  const updateRow = (year, index, field, value) => {
    const updatedRows = [...(currentDeptSubjects[year] || [])];

    // Auto-fill logic for subjects
    if (field === "subject") {
      const selectedSub = subjectsList.find(s => s.name === value || s.code === value);
      if (selectedSub) {
        updatedRows[index]["subject"] = selectedSub.name;
        updatedRows[index]["shortName"] = selectedSub.shortName || "";
        updatedRows[index]["code"] = selectedSub.code;
        updatedRows[index]["type"] = selectedSub.type || "Theory";
        updatedRows[index]["hours"] = selectedSub.credits || selectedSub.hours || 0;
      } else {
        updatedRows[index][field] = value;
      }
    } else if (field === "teacher") {
      const selectedStaff = staff.find(s => s.name === value);
      if (selectedStaff) {
        updatedRows[index]["teacherCode"] = selectedStaff.code;
        updatedRows[index]["dept"] = selectedStaff.dept;
      } else {
        updatedRows[index]["teacherCode"] = "";
        updatedRows[index]["dept"] = "";
      }
      updatedRows[index][field] = value;
    } else if (field === "teacherB") {
      const selectedStaff = staff.find(s => s.name === value);
      if (selectedStaff) {
        updatedRows[index]["teacherCodeB"] = selectedStaff.code;
      } else {
        updatedRows[index]["teacherCodeB"] = "";
      }
      updatedRows[index][field] = value;
    } else {
      updatedRows[index][field] = value;
    }

    const updatedDept = { ...currentDeptSubjects, [year]: updatedRows };
    setAllSubjects({ ...allSubjects, [activeDept]: updatedDept });
  };

  const removeRow = (year, index) => {
    const updatedRows = (currentDeptSubjects[year] || []).filter((_, i) => i !== index);
    const updatedDept = { ...currentDeptSubjects, [year]: updatedRows };
    setAllSubjects({ ...allSubjects, [activeDept]: updatedDept });
  };

  const toggleSectionB = (year) => {
    const isCurrentlyEnabled = currentDeptSubjects[year]?.some(s => s.needsSectionB);
    const updatedRows = (currentDeptSubjects[year] || []).map(row => ({
      ...row,
      needsSectionB: !isCurrentlyEnabled,
      // If disabling Section B, also turn off individual splits
      isSplit: !isCurrentlyEnabled ? row.isSplit : false
    }));
    const updatedDept = { ...currentDeptSubjects, [year]: updatedRows };
    setAllSubjects({ ...allSubjects, [activeDept]: updatedDept });
  };

  const submit = () => {
    const cleanedGlobal = {};
    const slotLimit = 41; // 7 periods * 5 days (35) + 6 periods * 1 day (6) = 41

    Object.keys(allSubjects).forEach(deptName => {
      const cleanedDept = {};
      Object.keys(allSubjects[deptName]).forEach((yearKey) => {
        const validRows = allSubjects[deptName][yearKey].filter(
          (row) => row.subject.trim() !== "" && row.teacher.trim() !== ""
        );

        // Validation: Sum credits for this year/section
        const totalCredits = validRows.reduce((acc, r) => acc + (parseInt(r.hours) || 0), 0);
        if (totalCredits > slotLimit) {
          notify.error(`Error: ${deptName} ${yearKey} requires ${totalCredits} slots but only ${slotLimit} are available.`);
          throw new Error("Slot overload");
        }

        if (validRows.length > 0) cleanedDept[yearKey] = validRows;
      });
      if (Object.keys(cleanedDept).length > 0) cleanedGlobal[deptName] = cleanedDept;
    });

    if (Object.keys(cleanedGlobal).length === 0) {
      notify.warning("Please enter subject details for at least one department.");
      return;
    }
    
    const incomplete = [];
    Object.keys(allSubjects).forEach(deptName => {
      Object.keys(allSubjects[deptName]).forEach(yearKey => {
        const rows = allSubjects[deptName][yearKey];
        const hasSomeData = rows.some(r => r.subject.trim() !== "" || r.teacher.trim() !== "");
        const allComplete = rows.every(r => (r.subject.trim() === "" && r.teacher.trim() === "") || (r.subject.trim() !== "" && r.teacher.trim() !== ""));
        
        if (hasSomeData && !allComplete) {
          incomplete.push(`${deptName} ${yearKey}`);
        }
      });
    });

    if (incomplete.length > 0) {
      if (!window.confirm(`Warning: The following sections have incomplete subject/teacher assignments: \n\n${incomplete.join(", ")}\n\nDo you want to proceed with generation anyway?`)) {
        return;
      }
    }

    try {
      if (onLocalSave) {
        onLocalSave(cleanedGlobal);
      } else {
        onSave(cleanedGlobal);
      }
    } catch (e) {
      // Error handled by snackbar above
    }
  };

  const handleLocalGen = () => {
    const cleanedGlobal = {};
    Object.keys(allSubjects).forEach(deptName => {
      const cleanedDept = {};
      Object.keys(allSubjects[deptName]).forEach((yearKey) => {
        const validRows = allSubjects[deptName][yearKey].filter(
          (row) => row.subject.trim() !== "" && row.teacher.trim() !== ""
        );
        if (validRows.length > 0) cleanedDept[yearKey] = validRows;
      });
      if (Object.keys(cleanedDept).length > 0) cleanedGlobal[deptName] = cleanedDept;
    });

    if (Object.keys(cleanedGlobal).length === 0) {
      notify.warning("No data to generate.");
      return;
    }

    if (onStrictSave) {
        onStrictSave(cleanedGlobal);
    } else {
        // Fallback to local if onStrictSave not provided
        try {
          const grid = autoGenerateTimetable(cleanedGlobal);
          onSave(cleanedGlobal, grid); 
        } catch (err) {
          notify.error("Local generation failed.");
        }
    }
  };

  const renderYear = (label, key) => {
    const rows = currentDeptSubjects[key] || [];
    const totalHours = rows.reduce((acc, s) => acc + (parseInt(s.hours) || 0), 0);
    return (
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-black text-gray-800 tracking-tight flex items-center gap-2">
              <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
              {label}
            </h2>
            <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-gray-200">
              {totalHours} Total Credits
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 mr-4 bg-gray-100 p-1 rounded-xl">
              <span className={`text-[10px] font-black uppercase tracking-widest px-2 ${rows.some(s => s.needsSectionB) ? 'text-blue-600' : 'text-gray-400'}`}>Sec B</span>
              <button
                onClick={() => toggleSectionB(key)}
                className={`relative w-12 h-6 rounded-full transition-all ${rows.some(s => s.needsSectionB) ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${rows.some(s => s.needsSectionB) ? 'left-7' : 'left-1'}`}></div>
              </button>
            </div>
            <button
              onClick={() => addRow(key)}
              className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-600 hover:text-white transition-all text-xs"
            >
              + Add Subject
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {rows.map((row, index) => {
            const currentStaff = staff.find(s => s.name === row.teacher);
            const totalAssigned = staffWorkload[row.teacher] || 0;
            const isOverloaded = currentStaff && totalAssigned > currentStaff.maxHours;

            return (
              <div key={index} className={`grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-2 p-4 md:p-3 rounded-2xl group transition-all items-center border ${isOverloaded
                ? "bg-rose-50 border-rose-200 shadow-rose-50"
                : "bg-gray-50 border-transparent hover:bg-white hover:shadow-md hover:border-blue-100"
                }`}>
                <div className="col-span-1 md:col-span-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase md:hidden mb-1 block">Subject</label>
                  <input
                    value={row.subject}
                    onChange={(e) => updateRow(key, index, "subject", e.target.value)}
                    list="subjects-list"
                    className="w-full bg-white border-0 p-2 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 transition-all font-bold text-gray-700 shadow-sm"
                    placeholder="Subject Name"
                  />
                </div>
                <div className="col-span-1 md:col-span-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase md:hidden mb-1 block">Short Name</label>
                  <input
                    value={row.shortName}
                    onChange={(e) => updateRow(key, index, "shortName", e.target.value)}
                    className="w-full bg-white border-0 p-2 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 transition-all font-bold text-gray-700 shadow-sm"
                    placeholder="Short"
                  />
                </div>
                <div className="col-span-1 md:col-span-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase md:hidden mb-1 block">Code</label>
                  <input
                    value={row.code}
                    onChange={(e) => updateRow(key, index, "code", e.target.value)}
                    className="w-full bg-white border-0 p-2 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 transition-all font-bold text-gray-700 shadow-sm"
                    placeholder="Code"
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase md:hidden mb-1 block">Type</label>
                  <select
                    value={row.type}
                    onChange={(e) => updateRow(key, index, "type", e.target.value)}
                    className="w-full bg-white border-0 p-2 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 transition-all font-bold text-gray-700 shadow-sm"
                  >
                    <option value="Theory">Theory</option>
                    <option value="Lab">Lab</option>
                    <option value="Elective">Elective</option>
                    <option value="Theory and Lab">Theory and Lab</option>
                  </select>
                </div>
                <div className="col-span-1 md:col-span-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase md:hidden mb-1 block">Credits</label>
                  <input
                    type="number"
                    disabled={!allowCreditEdit}
                    value={row.hours || row.credits}
                    placeholder="credits"
                    onChange={(e) => updateRow(key, index, "hours", parseInt(e.target.value) || 0)}
                    className="w-full bg-white border-0 p-2 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 transition-all font-bold text-center text-gray-700 shadow-sm no-spinner"
                  />
                </div>
                <div className={`col-span-1 ${row.needsSectionB ? "md:col-span-2" : "md:col-span-4"}`}>
                  <label className="text-[9px] font-black text-gray-400 uppercase md:hidden mb-1 block">
                    {row.needsSectionB ? "Sec A Faculty" : "Assigned Faculty"}
                  </label>
                  <select
                    value={row.teacher}
                    onChange={(e) => updateRow(key, index, "teacher", e.target.value)}
                    className={`w-full bg-white border-0 p-2 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 transition-all font-bold text-gray-700 shadow-sm ${isOverloaded ? "text-rose-600 ring-1 ring-rose-200" : ""
                      }`}
                  >
                    <option value="">{row.needsSectionB ? "Sec A Staff..." : "Assign Staff..."}</option>
                    {staff.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {row.needsSectionB && (
                  <div className="col-span-1 md:col-span-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase md:hidden mb-1 block">Sec B Faculty</label>
                    <select
                      value={row.teacherB}
                      onChange={(e) => updateRow(key, index, "teacherB", e.target.value)}
                      className={`w-full bg-white border-0 p-2 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 transition-all font-bold text-gray-700 shadow-sm ${staffWorkload[row.teacherB] > staff.find(s => s.name === row.teacherB)?.maxHours ? "text-rose-600 ring-1 ring-rose-200" : ""
                        }`}
                    >
                      <option value="">Sec B Staff</option>
                      {staff.map(s => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                )}



                <div className="col-span-1 md:col-span-1 flex justify-end gap-1 items-end md:items-center">
                  <button
                    title="Saturday Only"
                    onClick={() => updateRow(key, index, "saturdayOnly", !row.saturdayOnly)}
                    className={`w-full md:w-8 h-10 md:h-8 flex items-center justify-center rounded-lg transition-all ${row.saturdayOnly ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                  >
                    <span className="md:hidden text-xs font-bold mr-2">Sat Only</span>
                    <span className="hidden md:inline text-[9px] font-black">SAT</span>
                  </button>
                  <button
                    onClick={() => removeRow(key, index)}
                    className="w-full md:w-8 h-10 md:h-8 flex items-center justify-center bg-gray-100 text-gray-300 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all"
                  >
                    <span className="md:hidden text-xs font-bold mr-2">Remove Line</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };



  const [workloadVisible, setWorkloadVisible] = useState(false);

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4 md:px-6 space-y-10">
      {/* Horizontal Department Selection */}
      <div className="pt-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Select Department</p>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Curriculum Entry</h2>
            <p className="text-gray-500 font-medium">Configure subjects and faculty for all departments.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-xl border border-green-100">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">
                {Object.keys(allSubjects).filter(d => 
                  Object.values(allSubjects[d]).some(y => y.some(r => r.subject && r.teacher))
                ).length} Departments Ready
              </span>
            </div>
            {Object.keys(allSubjects).some(d => Object.values(allSubjects[d]).some(y => y.some(r => (r.subject && !r.teacher) || (!r.subject && r.teacher)))) && (
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-xl border border-amber-100">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                  Incomplete Data Found
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-3 pb-4">
          {departments.map(dept => {
            const hasData = Object.values(allSubjects[dept.name] || {}).some(y => y.some(r => r.subject && r.teacher));
            return (
              <button
                key={dept.id}
                onClick={() => setActiveDept(dept.name)}
                className={`px-8 py-4 rounded-2xl font-black transition-all shadow-sm border relative group ${activeDept === dept.name
                  ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100 scale-105'
                  : 'bg-white text-gray-500 border-gray-100 hover:bg-gray-50'
                  }`}
              >
                {dept.name}
                {hasData && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-px bg-gray-200 w-full" />

      <div className="space-y-6 md:space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b pb-6 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter">📅 Global Data Entry</h1>
            <p className="text-gray-500 font-medium tracking-tight">
              Curriculum for <span className="text-blue-600 font-black">{activeDept}</span> department.
            </p>
          </div>
          <div className="flex gap-3">
            <button
                onClick={handleLocalGen}
                className="px-6 py-4 bg-indigo-600 text-white rounded-[2rem] font-black text-sm shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all transform hover:scale-105 flex items-center gap-3 group border-2 border-indigo-400/30"
            >
                <div className="flex flex-col items-start leading-none text-left">
                <span className="text-[10px] uppercase tracking-widest opacity-70 mb-1">Local Optimization</span>
                <span className="text-lg text-white">Global AI (Strict)</span>
                </div>
                <span className="text-2xl group-hover:animate-spin transition-transform">⚙️</span>
            </button>
            <button
                onClick={submit}
                className="px-8 py-4 bg-green-600 text-white rounded-[2rem] font-black text-sm shadow-xl shadow-green-200 hover:bg-green-700 transition-all transform hover:scale-105 flex items-center gap-3 group"
            >
                <div className="flex flex-col items-start leading-none text-left">
                <span className="text-[10px] uppercase tracking-widest opacity-70 mb-1">Server Action</span>
                <span className="text-lg">Generate (Fast)</span>
                </div>
                <span className="text-2xl group-hover:rotate-12 transition-transform">⚡</span>
            </button>
          </div>
        </div>

        <div className="space-y-6 md:space-y-8">
          {renderYear("First Year", "year1")}
          {renderYear("Second Year", "year2")}
          {renderYear("Third Year", "year3")}
          {renderYear("Fourth Year", "year4")}
        </div>

        {/* Real-time Workload Monitor Sidebar */}






        {workloadVisible && (
          <aside className="w-[400px] fixed top-20 right-0">
            {/* xl:w-80 xl:sticky xl:top-8 h-fit order-3 */}
            <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-xl border border-blue-50 space-y-6">
              <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
                <span className="text-blue-600">📊</span>
                Global Workload
              </h3>
              <button onClick={() => setWorkloadVisible(!workloadVisible)} className="absolute top-0 right-4 py-2 px-4 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                ✕
              </button>
              <div className="space-y-4 max-h-[40vh] xl:max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {staff.map(s => {
                  const hours = staffWorkload[s.name] || 0;
                  const percent = (hours / s.maxHours) * 100;
                  const isOver = hours > s.maxHours;

                  return (
                    <div key={s.id} className="space-y-1.5 p-3 rounded-2xl bg-gray-50 border border-transparent hover:border-blue-100 transition-all">
                      <div className="flex justify-between items-end">
                        <p className="text-sm font-bold text-gray-700 truncate w-32">{s.name}</p>
                        <span className={`text-[10px] font-black ${isOver ? 'text-rose-600' : 'text-blue-600'}`}>
                          {hours} / {s.maxHours} hrs
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${isOver ? 'bg-rose-500' : 'bg-blue-600'}`}
                          style={{ width: `${Math.min(percent, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </aside>
        )}
      </div>



      <datalist id="subjects-list">
        {filteredSubjects.map((s) => (
          <option key={s.id} value={s.name}>{s.code} - {s.dept}</option>
        ))}
      </datalist>

      <button onClick={() => setWorkloadVisible(!workloadVisible)} className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50">
        <span className="text-xl">📊 Work Load</span>
      </button>
    </div>
  );
}
