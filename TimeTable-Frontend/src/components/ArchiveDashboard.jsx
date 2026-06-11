import React, { useState, useEffect, useMemo } from 'react';
import * as api from '../utils/apiUtils';
import { periods, weekDays } from '../utils/periods';
import { exportToExcel, exportToCSV } from '../utils/exportUtils';
import { exportTimetablePDF } from '../pdf/exportPDF';
import { notify } from './Toast';

const ArchiveDashboard = ({ departments, isAdmin }) => {
    const [archives, setArchives] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filters, setFilters] = useState({
        dept: "All"
    });
    const [selectedArchive, setSelectedArchive] = useState(null);
    const [previewYear, setPreviewYear] = useState(1);
    const [previewSection, setPreviewSection] = useState("A");
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    // Notifications handled by notify utility

    useEffect(() => {
        const loadArchives = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await api.fetchArchives();
                setArchives(data.sort((a, b) => new Date(b.archivedAt) - new Date(a.archivedAt)));
            } catch (err) {
                console.error("Error loading archives:", err);
                setError(err.message || "Failed to load archives.");
                notify.error("Failed to load archives.");
            } finally {
                setLoading(false);
            }
        };
        loadArchives();
    }, []);

    const handleDelete = async () => {
        if (!confirmDeleteId) return;
        try {
            await api.deleteArchive(confirmDeleteId);
            setArchives(prev => prev.filter(a => a.id !== confirmDeleteId));
            notify.success("Archive permanently deleted.");
            setConfirmDeleteId(null);
        } catch (error) {
            notify.error("Failed to delete archive.");
        }
    };

    const stats = useMemo(() => {
        return {
            total: archives.length,
            latest: archives[0]?.archivedAt || null,
            deptCount: new Set(archives.map(a => a.dept)).size
        };
    }, [archives]);

    const filteredArchives = archives.filter(item => {
        const matchesSearch = item.dept.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.version.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDept = filters.dept === "All" || item.dept === filters.dept;
        return matchesSearch && matchesDept;
    });

    const years = [1, 2, 3, 4];
    const sections = ["A", "B", "C"];

    return (
        <div className="h-full flex flex-col">
            {!selectedArchive ? (
                <div className="space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 pb-6">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900">
                                🗄️ Historical Archives
                            </h2>
                            <p className="text-slate-500 font-medium mt-1">
                                Access and restore previously generated schedules.
                            </p>
                        </div>
                        {isAdmin && (
                            <button
                                onClick={() => notify.warning("Archive sync disabled in preview")}
                                className="px-6 py-3 bg-white text-indigo-600 border-2 border-indigo-100 rounded-[2rem] font-black text-sm hover:bg-indigo-50 hover:border-indigo-200 transition-all flex items-center gap-2"
                            >
                                <span className="text-lg">🔄</span> Sync Storage
                            </button>
                        )}
                    </div>

                    {/* Professional Analytics Banner */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-[2rem] text-white shadow-2xl shadow-indigo-100 flex flex-col justify-between group overflow-hidden relative">
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                            <div>
                                <p className="text-indigo-200 font-bold uppercase text-[10px] tracking-[0.2em] mb-1">Total Archived Sessions</p>
                                <h4 className="text-4xl font-black">{stats.total}</h4>
                            </div>
                            <div className="mt-8 flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                <span className="text-xs font-bold text-indigo-100">Storage System Active</span>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
                            <div>
                                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mb-1">Last Update</p>
                                <h4 className="text-xl font-black text-slate-800">
                                    {stats.latest ? new Date(stats.latest).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "No History"}
                                </h4>
                            </div>
                            <p className="text-xs text-slate-500 font-medium">{stats.latest ? "Most recent synchronization" : "--"}</p>
                        </div>

                        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
                            <div>
                                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mb-1">Active Departments</p>
                                <h4 className="text-xl font-black text-slate-800">{stats.deptCount} Active</h4>
                            </div>
                            <div className="flex -space-x-2 overflow-hidden">
                                {[...new Set(archives.map(a => a.dept))].slice(0, 5).map((d, i) => (
                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-indigo-50 flex items-center justify-center text-[10px] font-black text-indigo-600 uppercase" title={d}>
                                        {d[0]}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Filter & Search Hub */}
                    <div className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-100/50 border border-slate-100/50 flex flex-col md:flex-row items-center gap-6">
                        <div className="relative flex-1 group w-full">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors text-xl">🔍</span>
                            <input
                                type="text"
                                placeholder="Search by session ID, version or tags..."
                                className="w-full bg-slate-50/50 border-2 border-transparent focus:border-indigo-100 focus:bg-white px-16 py-4 rounded-2xl md:rounded-3xl font-bold text-slate-700 outline-none transition-all placeholder:text-slate-300 shadow-inner"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <select
                                className="bg-slate-50 border-0 px-6 py-4 rounded-2xl md:rounded-3xl font-bold text-slate-600 outline-none hover:bg-slate-100 transition-colors cursor-pointer appearance-none min-w-[200px]"
                                value={filters.dept}
                                onChange={(e) => setFilters({ ...filters, dept: e.target.value })}
                            >
                                <option value="All">All Departments</option>
                                {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : error ? (
                        <div className="bg-rose-50 text-rose-600 p-6 rounded-2xl border border-rose-100 flex items-center gap-4">
                            <span className="text-2xl">⚠️</span>
                            <div>
                                <h3 className="font-bold">Failed to load archives</h3>
                                <p className="text-sm opacity-80">{error}</p>
                            </div>
                        </div>
                    ) : archives.length === 0 ? (
                        <div className="bg-white border border-slate-100 rounded-[2rem] p-16 text-center shadow-sm flex flex-col items-center justify-center">
                            <span className="text-6xl mb-6 grayscale animate-bounce-slow">📭</span>
                            <h3 className="text-2xl font-black text-slate-800">No Archives Found</h3>
                            <p className="text-slate-400 font-medium mt-2">Generated timetables will be saved here automatically.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {filteredArchives.map((item) => (
                                <div 
                                    key={item.id} 
                                    className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-100/40 hover:-translate-y-2 transition-all duration-500 group relative"
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl font-black group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                            {item.id}
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-2">
                                                {item.dept}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-1 mb-8">
                                        <h4 className="text-xl font-black text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors">{item.version}</h4>
                                        <p className="text-xs text-slate-400 font-medium">
                                            {new Date(item.archivedAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                        </p>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setSelectedArchive(item)}
                                            className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-slate-900 transition-all active:scale-95 text-xs"
                                        >
                                            Review Archive
                                        </button>
                                        {isAdmin && (
                                            <button
                                                onClick={() => setConfirmDeleteId(item.id)}
                                                className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all active:scale-95 shadow-inner"
                                                title="Delete Permanently"
                                            >
                                                🗑
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex-1 flex flex-col bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-500">
                    {/* Top Control Bar */}
                    <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center bg-slate-50">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setSelectedArchive(null)}
                                className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-full text-slate-500 hover:text-indigo-600 hover:border-indigo-200 shadow-sm transition-all"
                                title="Back to Archives"
                            >
                                ←
                            </button>
                            <div className="text-left">
                                <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none mb-1">
                                    Session Archive <span className="text-indigo-600">{selectedArchive.version}</span>
                                </h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{selectedArchive.dept} • Historical View</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 mt-6 md:mt-0">
                            <div className="flex gap-2 bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
                                <button
                                    onClick={() => {
                                        const grid = typeof selectedArchive.grid === 'string' ? JSON.parse(selectedArchive.grid) : selectedArchive.grid;
                                        exportToExcel(grid[`year${previewYear}`]?.[previewSection] || {}, `${selectedArchive.id}_Y${previewYear}_S${previewSection}`);
                                        notify.info("Excel Export Ready");
                                    }}
                                    className="w-10 h-10 text-green-600 rounded-xl flex items-center justify-center hover:bg-green-50 transition-all"
                                    title="Excel Export"
                                >📊</button>
                                <button
                                    onClick={() => {
                                        const grid = typeof selectedArchive.grid === 'string' ? JSON.parse(selectedArchive.grid) : selectedArchive.grid;
                                        exportToCSV(grid[`year${previewYear}`]?.[previewSection] || {}, `${selectedArchive.id}_Y${previewYear}_S${previewSection}`);
                                        notify.info("CSV Export Ready");
                                    }}
                                    className="w-10 h-10 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-50 transition-all"
                                    title="CSV Export"
                                >📄</button>
                                <button
                                    onClick={() => exportTimetablePDF("archive-preview-area")}
                                    className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-all"
                                    title="PDF Export"
                                >📥</button>
                            </div>
                        </div>
                    </div>

                    {/* Horizontal Tabs */}
                    <div className="px-6 py-4 flex flex-col md:flex-row gap-6 items-start md:items-center border-b border-slate-100 bg-white">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Year</span>
                            <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                                {years.map(y => (
                                    <button
                                        key={y}
                                        onClick={() => setPreviewYear(y)}
                                        className={`px-4 py-1.5 rounded-lg font-black transition-all text-xs ${previewYear === y
                                            ? "bg-white text-indigo-600 shadow-sm border border-slate-200"
                                            : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"}`}
                                    >
                                        Year {y}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="hidden md:block w-px h-6 bg-slate-200"></div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Section</span>
                            <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                                {sections.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setPreviewSection(s)}
                                        className={`px-4 py-1.5 rounded-lg font-black transition-all text-xs ${previewSection === s
                                            ? "bg-white text-indigo-600 shadow-sm border border-slate-200"
                                            : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"}`}
                                    >
                                        Sec {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Dynamic Timetable Space */}
                    <div className="flex-1 overflow-y-auto p-0 bg-white" id="archive-preview-area">
                        {(() => {
                            const yearKey = `year${previewYear}`;
                            let gridData = null;
                            try {
                                const grid = typeof selectedArchive.grid === 'string' ? JSON.parse(selectedArchive.grid) : selectedArchive.grid;
                                gridData = grid[yearKey]?.[previewSection];
                            } catch (e) {
                                console.error("Archive Parse Error:", e);
                            }

                            if (gridData) {
                                return (
                                    <div className="w-full bg-white animate-in fade-in duration-500">
                                                <div className="overflow-x-auto custom-scrollbar">
                                                    <table className="w-full border-collapse">
                                                        <thead>
                                                            <tr className="bg-slate-50/50">
                                                                <th className="p-4 text-left font-black text-slate-400 uppercase tracking-widest text-[9px] bg-slate-50/80 border-b border-r border-slate-50 min-w-[80px]">Timeline</th>
                                                                {periods.map(p => (
                                                                    <th key={p.id} className={`p-3 text-center border-b border-slate-100 bg-slate-50/30 ${p.type === 'break' ? 'min-w-[40px] px-1' : 'min-w-[100px] px-3'}`}>
                                                                        <div className="font-black text-slate-500 uppercase tracking-widest text-[9px] mb-0.5">{p.name}</div>
                                                                        <div className="text-[8px] text-indigo-400/60 font-black">{p.start} - {p.end}</div>
                                                                    </th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100">
                                                            {weekDays.map(day => (
                                                                <tr key={day} className="hover:bg-indigo-50/20 transition-colors">
                                                                    <td className="p-4 font-black text-slate-800 border-r border-slate-100 bg-slate-50/20 text-xs">{day}</td>
                                                                    {periods.map(p => {
                                                                        if (day === "Saturday" && (p.id === "interval2" || p.id === "p7")) {
                                                                            if (p.id === "interval2") {
                                                                                return (
                                                                                    <td key={p.id} colSpan={2} className="p-3 bg-slate-50/50">
                                                                                        <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest text-center">
                                                                                            Weekend Early End
                                                                                        </div>
                                                                                    </td>
                                                                                );
                                                                            }
                                                                            return null;
                                                                        }

                                                                        const slot = gridData[day]?.[p.id];
                                                                        if (p.type === "break" || (slot && slot.type === "break")) {
                                                                            return (
                                                                                <td key={p.id} className="p-2 bg-slate-50/50">
                                                                                    <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest text-center transform -rotate-90 md:rotate-0">
                                                                                        Interval
                                                                                    </div>
                                                                                </td>
                                                                            );
                                                                        }
                                                                        return (
                                                                            <td key={p.id} className="p-3 text-center group">
                                                                                {slot ? (
                                                                                    <div className="space-y-1 transition-transform group-hover:scale-105 duration-300">
                                                                                        <p className="font-black text-slate-900 text-[10px] mb-1 leading-tight">{slot.shortName || slot.subject}</p>
                                                                                        <div className="inline-flex flex-col items-center bg-indigo-50/50 px-2 py-1 rounded-lg border border-indigo-100/50">
                                                                                            <span className="text-[6px] font-black text-indigo-600 uppercase tracking-tighter">{slot.teacher}</span>
                                                                                            {/* {slot.teacherCode && (
                                                                                                <span className="text-[7px] text-indigo-400/60 font-mono font-bold mt-0.5">ID: {slot.teacherCode}</span>
                                                                                            )} */}
                                                                                        </div>
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="py-4 border-2 border-dashed border-slate-100 rounded-xl text-[9px] font-black text-slate-200 uppercase tracking-widest group-hover:border-indigo-100 transition-colors">
                                                                                        Vacant
                                                                                    </div>
                                                                                )}
                                                                            </td>
                                                                        );
                                                                    })}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        );
                                    } else {
                                        return (
                                            <div className="h-full flex flex-col items-center justify-center bg-white rounded-[4rem] border-4 border-dashed border-slate-50">
                                                <div className="text-8xl mb-8 opacity-20 grayscale grayscale-50">🚫</div>
                                                <h4 className="text-3xl font-black text-slate-300 tracking-tight">Partial Session Archive</h4>
                                                <p className="text-slate-400 font-medium max-w-sm text-center mt-2">The selected Academic Year ({previewYear}) or Section ({previewSection}) was not included in this department synchronization.</p>
                                            </div>
                                        );
                                    }
                                })()}
                            </div>
                </div>
            )}

            {/* Permanent Destruction Confirmation */}
            {confirmDeleteId && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setConfirmDeleteId(null)}></div>
                    <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-rose-100 max-w-md w-full relative animate-in zoom-in-95 duration-500">
                        <div className="text-center space-y-8">
                            <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[2.5rem] flex items-center justify-center text-4xl mx-auto shadow-inner border border-rose-100">
                                🔒
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-3xl font-black text-slate-900 tracking-tight">Admin Override</h3>
                                <p className="text-slate-500 font-medium leading-relaxed">
                                    You are about to <span className="text-rose-600 font-black">permanently destroy</span> this synchronization component. This action is logged and cannot be reversed by anyone.
                                </p>
                            </div>

                            <div className="flex flex-col gap-4 pt-6">
                                <button
                                    onClick={handleDelete}
                                    className="w-full py-5 bg-rose-600 text-white rounded-2xl font-black shadow-2xl shadow-rose-200 hover:bg-rose-700 transition-all active:scale-95 text-base"
                                >
                                    Confirm Destruction
                                </button>
                                <button
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="w-full py-5 bg-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-200 transition-all active:scale-95"
                                >
                                    Abort Operation
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Quick Action */}
            <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="fixed bottom-10 right-10 w-14 h-14 bg-slate-900 text-white rounded-2xl shadow-2xl shadow-slate-900/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group"
            >
                <span className="text-xl group-hover:-translate-y-1 transition-transform">↑</span>
            </button>
        </div>
    );
};

export default ArchiveDashboard;
