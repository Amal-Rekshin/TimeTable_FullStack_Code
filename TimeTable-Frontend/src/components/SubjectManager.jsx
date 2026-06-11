import React, { useState } from 'react';
import * as api from '../utils/apiUtils';
import { notify } from "./Toast";

const SubjectManager = ({ subjectsList, setSubjectsList, departments, allowCreditEdit }) => {
    // Notifications handled by notify utility

    // State for NEW subject only
    const [newSubject, setNewSubject] = useState({
        name: "",
        shortName: "",
        code: "",
        dept: departments[0]?.name || "CSE",
        type: "Theory",
        credits: 0,
        hours: 0,
        hoursPerWeek: 0
    });

    // In-place editing states
    const [editingRowId, setEditingRowId] = useState(null);
    const [editFormData, setEditFormData] = useState(null);

    const [isAdding, setIsAdding] = useState(false);
    const [confirmingId, setConfirmingId] = useState(null);
    const [activeFilter, setActiveFilter] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");

    const subjectTypes = ["Theory", "Lab", "Elective", "Theory and Lab"];

    const filteredSubjects = subjectsList.filter(sub => {
        const matchesFilter = activeFilter === "All" || sub.dept === activeFilter;
        const matchesSearch = sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sub.code.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const handleAdd = async () => {
        if (!newSubject.name.trim() || !newSubject.code.trim()) {
            notify.info("Please enter subject name and code.");
            return;
        }

        try {
            const saved = await api.addSubject(newSubject);
            if (saved) {
                setSubjectsList(prev => [...prev, saved]);
                notify.success("Subject added successfully!");
                resetNewForm();
            }
        } catch (error) {
            notify.error("Error saving subject.");
        }
    };

    const startEditing = (sub) => {
        setEditingRowId(sub.id);
        setEditFormData({ ...sub });
    };

    const cancelEditing = () => {
        setEditingRowId(null);
        setEditFormData(null);
    };

    const handleSaveInPlace = async () => {
        try {
            const updated = await api.updateSubject(editingRowId, editFormData);
            if (updated) {
                setSubjectsList(prev => prev.map(s => s.id === editingRowId ? updated : s));
                notify.success("Subject updated successfully!");
                cancelEditing();
            }
        } catch (error) {
            notify.error("Error updating subject.");
        }
    };

    const resetNewForm = () => {
        setNewSubject({
            name: "",
            shortName: "",
            code: "",
            dept: departments[0]?.name || "CSE",
            type: "Theory",
            credits: 0,
            hours: 0,
            hoursPerWeek: 0
        });
        setIsAdding(false);
    };

    const handleRemove = async (id) => {
        try {
            await api.deleteSubject(id);
            setSubjectsList(prev => prev.filter(s => s.id !== id));
            setConfirmingId(null);
            notify.success("Subject deleted successfully.");
        } catch (error) {
            notify.error("Error deleting subject.");
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">📚 Subject Management</h2>
                    <p className="text-sm text-gray-500">Define global subjects and their properties.</p>
                </div>

                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold transition-all shadow-lg ${isAdding ? "bg-gray-100 text-gray-600" : "bg-blue-600 text-white hover:bg-blue-700"}`}
                >
                    {isAdding ? "Cancel" : "+ Add Subject"}
                </button>
            </div>

            {/* Add Subject Panel */}
            {isAdding && (
                <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-xl border border-blue-100">
                    <h3 className="text-xl font-bold mb-6 text-gray-800">New Subject Details</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        <div className="sm:col-span-1 space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Subject Name</label>
                            <input
                                type="text"
                                className="w-full bg-gray-50 p-4 rounded-xl md:rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                                placeholder="e.g. Operating Systems"
                                value={newSubject.name}
                                onChange={e => setNewSubject({ ...newSubject, name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Short Name (Abbr)</label>
                            <input
                                type="text"
                                className="w-full bg-gray-50 p-4 rounded-xl md:rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                                placeholder="e.g. OS"
                                value={newSubject.shortName}
                                onChange={e => setNewSubject({ ...newSubject, shortName: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Subject Code</label>
                            <input
                                type="text"
                                className="w-full bg-gray-50 p-4 rounded-xl md:rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                                placeholder="CS301"
                                value={newSubject.code}
                                onChange={e => setNewSubject({ ...newSubject, code: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Credits/Week</label>
                            <input
                                type="number"
                                min="1"
                                className="w-full bg-gray-50 p-4 rounded-xl md:rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                                value={newSubject.credits}
                                onChange={e => {
                                    const val = parseFloat(e.target.value) || 0;
                                    setNewSubject({ ...newSubject, credits: val, hours: val, hoursPerWeek: val });
                                }}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Department</label>
                            <select
                                className="w-full bg-gray-50 p-4 rounded-xl md:rounded-2xl font-bold text-gray-700 outline-none appearance-none text-sm"
                                value={newSubject.dept}
                                onChange={e => setNewSubject({ ...newSubject, dept: e.target.value })}
                            >
                                <option value="General">General</option>
                                {departments.map(dep => (
                                    <option key={dep.id} value={dep.name}>{dep.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="sm:col-span-3 space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Subject Type</label>
                            <div className="flex flex-wrap gap-2">
                                {subjectTypes.map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setNewSubject({ ...newSubject, type: t })}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${newSubject.type === t ? "bg-blue-600 text-white border-blue-600 shadow-md" : "bg-white text-gray-500 border-gray-200 hover:border-blue-300"}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 text-right">
                        <button
                            onClick={handleAdd}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-xl md:rounded-2xl font-bold shadow-lg transition-all transform active:scale-95"
                        >
                            Add Subject
                        </button>
                    </div>
                </div>
            )}

            {/* Filter Tabs & Search */}
            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar w-full md:w-auto">
                        <button
                            onClick={() => setActiveFilter("All")}
                            className={`px-6 py-3 rounded-2xl font-black transition-all border whitespace-nowrap ${activeFilter === "All" ? "bg-blue-600 text-white border-blue-600 shadow-lg" : "bg-white text-gray-500 border-gray-100 hover:bg-gray-50"}`}
                        >
                            All
                        </button>
                        {departments.map(dept => (
                            <button
                                key={dept.id}
                                onClick={() => setActiveFilter(dept.name)}
                                className={`px-6 py-3 rounded-2xl font-black transition-all border whitespace-nowrap ${activeFilter === dept.name ? "bg-blue-600 text-white border-blue-600 shadow-lg" : "bg-white text-gray-500 border-gray-100 hover:bg-gray-50"}`}
                            >
                                {dept.name}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full md:w-64">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                        <input
                            type="text"
                            placeholder="Search subjects..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-gray-100 p-3 pl-10 rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Subjects Table */}
                <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b">
                                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">
                                    <th className="p-6 text-left">Subject & Code</th>
                                    <th className="p-6">Dept</th>
                                    <th className="p-6">Short Name</th>
                                    <th className="p-6">Type</th>
                                    <th className="p-6">Credits</th>
                                    <th className="p-6 text-right">Actions</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-50">
                                {filteredSubjects.map(sub => (
                                    <tr key={sub.id} className={`hover:bg-gray-50 transition-colors border-b last:border-0 ${editingRowId === sub.id ? 'bg-blue-50/20' : ''}`}>
                                        <td className="py-4 px-6 min-w-[320px]">
                                            {editingRowId === sub.id ? (
                                                <div className="flex gap-2 items-center">
                                                    <input
                                                        className="flex-1 p-2 bg-white border border-gray-200 rounded-lg font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                                                        value={editFormData.name}
                                                        placeholder="Subject Name"
                                                        onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                                                    />
                                                    <input
                                                        className="w-20 p-2 bg-white border border-gray-200 rounded-lg font-mono text-[10px] outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-center uppercase"
                                                        value={editFormData.code}
                                                        placeholder="Code"
                                                        onChange={e => setEditFormData({ ...editFormData, code: e.target.value })}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] flex-shrink-0 ${sub.type === "Lab" ? "bg-blue-100 text-blue-600" : sub.type === "Elective" ? "bg-purple-100 text-purple-600" : "bg-green-100 text-green-600"}`}>
                                                        {sub.name[0]}
                                                    </div>
                                                    <div className="flex items-baseline gap-2 overflow-hidden">
                                                        <p className="font-bold text-gray-800 text-sm truncate">{sub.name}</p>
                                                        <span className="text-[9px] text-gray-400 font-mono font-bold tracking-tighter uppercase whitespace-nowrap">{sub.code}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </td>

                                        <td className="py-4 px-6 text-center w-24">
                                            {editingRowId === sub.id ? (
                                                <select
                                                    className="w-full p-2 border border-gray-200 rounded-lg font-bold text-[10px] outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                                    value={editFormData.dept}
                                                    onChange={e => setEditFormData({ ...editFormData, dept: e.target.value })}
                                                >
                                                    <option value="General">General</option>
                                                    {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                                                </select>
                                            ) : (
                                                <span className="bg-gray-100 text-gray-500 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter">
                                                    {sub.dept}
                                                </span>
                                            )}
                                        </td>

                                        <td className="py-4 px-6 text-center w-24">
                                            {editingRowId === sub.id ? (
                                                <input
                                                    className="w-full p-2 bg-white border border-gray-200 rounded-lg font-bold text-[10px] text-center outline-none focus:ring-2 focus:ring-blue-500"
                                                    value={editFormData.shortName}
                                                    placeholder="Short"
                                                    onChange={e => setEditFormData({ ...editFormData, shortName: e.target.value })}
                                                />
                                            ) : (
                                                <span className="font-bold text-gray-500 text-[10px] px-2 py-0.5 border border-dashed border-gray-200 rounded">
                                                    {sub.shortName || "—"}
                                                </span>
                                            )}
                                        </td>

                                        <td className="py-4 px-6 text-center w-28">
                                            {editingRowId === sub.id ? (
                                                <select
                                                    className="w-full p-2 border border-gray-200 rounded-lg font-bold text-[10px] outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                                    value={editFormData.type}
                                                    onChange={e => setEditFormData({ ...editFormData, type: e.target.value })}
                                                >
                                                    {subjectTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                            ) : (
                                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${sub.type === "Lab" ? "bg-blue-50 text-blue-600" : sub.type === "Elective" ? "bg-purple-50 text-purple-600" : "bg-green-50 text-green-600"}`}>
                                                    {sub.type}
                                                </span>
                                            )}
                                        </td>

                                        <td className="py-4 px-6 text-center w-20">
                                            {editingRowId === sub.id ? (
                                                <input
                                                    type="number"
                                                    className="w-full p-2 bg-white border border-gray-200 rounded-lg font-bold text-[10px] text-center outline-none focus:ring-2 focus:ring-blue-500"
                                                    value={editFormData.credits}
                                                    onChange={e => {
                                                        const val = parseFloat(e.target.value) || 0;
                                                        setEditFormData({ ...editFormData, credits: val, hours: val, hoursPerWeek: val });
                                                    }}
                                                    disabled={!allowCreditEdit}
                                                />
                                            ) : (
                                                <span className="font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full text-[10px]">
                                                    {sub.credits || sub.hours}
                                                </span>
                                            )}
                                        </td>

                                        <td className="py-4 px-6 text-right w-24">
                                            <div className="flex justify-end gap-2 items-center">
                                                {editingRowId === sub.id ? (
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={handleSaveInPlace}
                                                            className="bg-green-500 text-white p-1.5 rounded-lg hover:bg-green-600 shadow-sm cursor-pointer transition-colors"
                                                            title="Save"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={cancelEditing}
                                                            className="bg-gray-100 text-gray-400 p-1.5 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                                                            title="Cancel"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ) : confirmingId === sub.id ? (
                                                    <div className="flex gap-1 animate-in fade-in slide-in-from-right-2">
                                                        <button
                                                            onClick={() => handleRemove(sub.id)}
                                                            className="bg-red-500 text-white px-2 py-1 rounded text-[9px] font-black uppercase tracking-tighter hover:bg-red-600 shadow-sm"
                                                        >
                                                            YES
                                                        </button>
                                                        <button
                                                            onClick={() => setConfirmingId(null)}
                                                            className="bg-gray-100 text-gray-500 px-2 py-1 rounded text-[9px] font-black uppercase tracking-tighter hover:bg-gray-200"
                                                        >
                                                            NO
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => startEditing(sub)}
                                                            className="text-gray-300 hover:text-blue-500 transition-all p-1.5 hover:bg-blue-50 rounded-lg"
                                                            title="Edit"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => setConfirmingId(sub.id)}
                                                            className="text-gray-300 hover:text-red-500 transition-all p-1.5 hover:bg-red-50 rounded-lg"
                                                            title="Delete"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {filteredSubjects.length === 0 && (
                            <div className="text-center py-20 text-gray-400 italic font-medium">
                                No subjects match the current filters.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubjectManager;
