import React, { useState, useMemo } from 'react';
import * as api from '../utils/apiUtils';
import { notify } from "./Toast";

const StaffManager = ({ staff, setStaff, departments, subjectsList = [] }) => {
    // Notifications handled by notify utility

    const [newStaff, setNewStaff] = useState({
        name: "",
        code: "",
        dept: departments[0]?.name || "CSE",
        designation: "Assistant Professor",
        maxHours: 35,
        handleLabs: true,
        eligibleSubjects: "" // Comma separated codes
    });

    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState("All");

    const filteredStaff = useMemo(() => {
        return staff.filter(member => {
            const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                 member.code.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesDept = activeFilter === "All" || member.dept === activeFilter;
            return matchesSearch && matchesDept;
        });
    }, [staff, searchTerm, activeFilter]);

    const designations = [
        "Professor",
        "Associate Professor",
        "Assistant Professor",
        "Guest Lecturer",
        "Lab Assistant"
    ];

    const handleAdd = async () => {
        if (!newStaff.name.trim() || !newStaff.code.trim()) {
            notify.info("Please enter name and staff code.");
            return;
        }

        try {
            if (editingId) {
                const saved = await api.updateStaff(editingId, newStaff);
                if (saved) {
                    setStaff(prev => prev.map(s => String(s.id) === String(editingId) ? saved : s));
                    notify.success("Staff updated successfully!");
                }
            } else {
                const saved = await api.addStaff(newStaff);
                if (saved) {
                    setStaff(prev => [...prev, saved]);
                    notify.success("Staff added successfully!");
                }
            }
        } catch (error) {
            notify.error(`Error ${editingId ? "updating" : "saving"} staff.`);
        }
        resetForm();
    };

    const handleEdit = (member) => {
        setNewStaff({
            name: member.name,
            code: member.code,
            dept: member.dept,
            designation: member.designation,
            maxHours: member.maxHours || 35,
            handleLabs: member.handleLabs ?? true,
            eligibleSubjects: member.eligibleSubjects || ""
        });
        setEditingId(member.id);
        setIsAdding(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setNewStaff({
            name: "",
            code: "",
            dept: departments[0]?.name || "CSE",
            designation: "Assistant Professor",
            maxHours: 35,
            handleLabs: true,
            eligibleSubjects: ""
        });
        setEditingId(null);
        setIsAdding(false);
    };

    const [confirmingId, setConfirmingId] = useState(null);

    const handleRemove = async (id) => {
        try {
            await api.deleteStaff(id);
            setStaff(prev => prev.filter(s => String(s.id) !== String(id)));
            notify.success("Staff member removed.");
            setConfirmingId(null);
        } catch (error) {
            notify.error("Error deleting staff.");
        }
    };

    const toggleSubjectEligibility = (subCode) => {
        const currentList = newStaff.eligibleSubjects ? newStaff.eligibleSubjects.split(",") : [];
        let newList = currentList.includes(subCode) 
            ? currentList.filter(c => c !== subCode) 
            : [...currentList, subCode];
        setNewStaff({ ...newStaff, eligibleSubjects: newList.join(",") });
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">👥 Faculty Directory</h2>
                    <p className="text-sm text-gray-500">Maintain faculty profiles, subjects, and workload limits.</p>
                </div>

                <button
                    onClick={() => isAdding ? resetForm() : setIsAdding(true)}
                    className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold transition-all shadow-lg ${isAdding ? "bg-gray-100 text-gray-600" : "bg-green-600 text-white hover:bg-green-700"}`}
                >
                    {isAdding ? "Cancel" : "+ Add Staff"}
                </button>
            </div>

            {/* Add Staff Panel */}
            {isAdding && (
                <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-xl border border-green-100">
                    <h3 className="text-xl font-bold mb-6 text-gray-800">{editingId ? "Edit Staff Profile" : "New Faculty Profile"}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
                        <div className="sm:col-span-2 space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Full Name</label>
                            <input
                                type="text"
                                className="w-full bg-gray-50 p-4 rounded-xl md:rounded-2xl font-bold text-gray-700 text-sm outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="e.g. Dr. Anand Kumar"
                                value={newStaff.name}
                                onChange={e => setNewStaff({ ...newStaff, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Staff Code</label>
                            <input
                                type="text"
                                className="w-full bg-gray-50 p-4 rounded-xl md:rounded-2xl font-bold text-gray-700 text-sm outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="AK01"
                                value={newStaff.code}
                                onChange={e => setNewStaff({ ...newStaff, code: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Department</label>
                            <select
                                className="w-full bg-gray-50 p-4 rounded-xl md:rounded-2xl font-bold text-gray-700 text-sm outline-none focus:ring-2 focus:ring-green-500 appearance-none"
                                value={newStaff.dept}
                                onChange={e => setNewStaff({ ...newStaff, dept: e.target.value })}
                            >
                                {departments.map(dep => <option key={dep.name} value={dep.name}>{dep.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Max Hrs/Week</label>
                            <input
                                type="number"
                                className="w-full bg-gray-50 p-4 rounded-xl md:rounded-2xl font-bold text-gray-700 text-sm outline-none focus:ring-2 focus:ring-green-500"
                                value={newStaff.maxHours}
                                onChange={e => setNewStaff({ ...newStaff, maxHours: Number(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-12 gap-8 mt-6">
                        <div className="lg:col-span-4 space-y-6">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Designation</label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {designations.map(d => (
                                        <button
                                            key={d}
                                            onClick={() => setNewStaff({ ...newStaff, designation: d })}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${newStaff.designation === d ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-500 border-gray-200 hover:border-green-200"}`}
                                        >
                                            {d}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="p-5 bg-gray-50 rounded-2xl border flex items-center justify-between">
                                <span className="font-bold text-gray-700">Handle Lab Sessions</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={newStaff.handleLabs} onChange={(e) => setNewStaff({ ...newStaff, handleLabs: e.target.checked })} />
                                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                </label>
                            </div>
                        </div>

                        <div className="lg:col-span-8 bg-gray-50 p-6 rounded-3xl border">
                            <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-4">Eligible Subjects</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[250px] overflow-y-auto pr-2 no-scrollbar">
                                {subjectsList.filter(s => s.dept === newStaff.dept || s.dept === "General").map((sub) => {
                                    const isEligible = newStaff.eligibleSubjects.split(",").includes(sub.code);
                                    return (
                                        <div
                                            key={sub.id}
                                            onClick={() => toggleSubjectEligibility(sub.code)}
                                            className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all cursor-pointer ${isEligible ? 'border-green-500 bg-green-50' : 'border-white bg-white hover:border-gray-200'}`}
                                        >
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${sub.type === "Lab" ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                                                {sub.type === "Lab" ? "🧪" : "📚"}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-gray-800 truncate text-xs">{sub.name}</p>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{sub.code}</p>
                                            </div>
                                            {isEligible && <span className="text-green-600 font-bold">✓</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex gap-3 justify-end text-right">
                        <button onClick={resetForm} className="bg-gray-100 text-gray-600 px-10 py-4 rounded-xl md:rounded-2xl font-bold hover:bg-gray-200">Cancel</button>
                        <button onClick={handleAdd} className="bg-green-600 text-white px-10 py-4 rounded-xl md:rounded-2xl font-bold shadow-lg hover:bg-green-700">{editingId ? "Update Staff" : "Add Staff"}</button>
                    </div>
                </div>
            )}

            {/* Filter & Search Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar w-full md:w-auto">
                    <button
                        onClick={() => setActiveFilter("All")}
                        className={`px-6 py-2.5 rounded-xl font-bold transition-all border whitespace-nowrap text-sm ${activeFilter === "All" ? "bg-green-600 text-white border-green-600 shadow-md" : "bg-white text-gray-500 border-gray-100 hover:bg-gray-50"}`}
                    >
                        All Staff
                    </button>
                    {departments.map(dept => (
                        <button
                            key={dept.id}
                            onClick={() => setActiveFilter(dept.name)}
                            className={`px-6 py-2.5 rounded-xl font-bold transition-all border whitespace-nowrap text-sm ${activeFilter === dept.name ? "bg-green-600 text-white border-green-600 shadow-md" : "bg-white text-gray-500 border-gray-100 hover:bg-gray-50"}`}
                        >
                            {dept.name}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-64">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    <input
                        type="text"
                        placeholder="Search by name or code..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-50 border border-transparent p-3 pl-10 rounded-xl font-bold text-gray-700 focus:ring-2 focus:ring-green-500 outline-none transition-all text-sm"
                    />
                </div>
            </div>

            {/* Staff Table */}
            <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <th className="p-6">Staff member</th>
                                <th className="p-6 text-center">Dept</th>
                                <th className="p-6 text-center">Constraints</th>
                                <th className="p-6 text-center">Eligible Subjects</th>
                                <th className="p-6 text-right">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-50">
                            {filteredStaff.map(member => (
                                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center font-black text-green-600 text-sm">
                                                {member.name[0]}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800">{member.name}</p>
                                                <p className="text-[10px] text-gray-400 font-mono tracking-tighter">{member.designation} • {member.code}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6 text-center">
                                        <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase">
                                            {member.dept}
                                        </span>
                                    </td>
                                    <td className="p-6 text-center">
                                        <div className="flex flex-col gap-1 items-center">
                                            <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-[10px] font-black whitespace-nowrap">
                                                {member.maxHours} hrs/wk
                                            </span>
                                            {member.handleLabs && (
                                                <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black whitespace-nowrap">Labs Enabled</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex flex-wrap gap-1 justify-center max-w-[200px] mx-auto">
                                            {member.eligibleSubjects ? member.eligibleSubjects.split(",").slice(0, 3).map(code => (
                                                <span key={code} className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[9px] font-bold">
                                                    {code}
                                                </span>
                                            )) : <span className="text-[10px] text-gray-300 italic">None</span>}
                                            {member.eligibleSubjects && member.eligibleSubjects.split(",").length > 3 && (
                                                <span className="text-[9px] text-gray-400 font-bold">+{member.eligibleSubjects.split(",").length - 3} more</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-6 text-right">
                                        <div className="flex justify-end gap-2 items-center">
                                            {confirmingId !== member.id && (
                                                <button onClick={() => handleEdit(member)} className="text-gray-400 hover:text-green-600 transition-colors p-2 text-xl transform hover:scale-110" title="Edit Staff">✏️</button>
                                            )}
                                            {confirmingId === member.id ? (
                                                <div className="flex justify-end gap-2 animate-in fade-in slide-in-from-right-2">
                                                    <button onClick={() => handleRemove(member.id)} className="bg-red-500 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-red-600 shadow-sm">Confirm</button>
                                                    <button onClick={() => setConfirmingId(null)} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-xs font-bold hover:bg-gray-200">Cancel</button>
                                                </div>
                                            ) : (
                                                <button onClick={() => setConfirmingId(member.id)} className="text-gray-300 hover:text-red-500 transition-colors p-2 text-xl transform hover:scale-110" title="Remove Staff">🗑</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredStaff.length === 0 && (
                    <div className="text-center py-20 text-gray-400 italic">No faculty members found for this filter.</div>
                )}
            </div>
        </div>
    );
};

export default StaffManager;
