import React, { useState, useMemo } from 'react';
import { notify } from "./Toast";
import * as api from '../utils/apiUtils';

const SUGGESTED_ROOM_TYPES = [
    "Smart Lecture Hall",
    "Computer Science Lab",
    "Robotics Excellence Center",
    "Administrative Office",
    "Staff Lounge",
    "Library Annex",
    "AV Seminar Room",
    "Other"
];

const ClassroomDashboard = ({ rooms, setRooms }) => {
    // Notifications handled by notify utility
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState("All");
    const [selectedRoom, setSelectedRoom] = useState(null);
    
    // --- EDITING & ADDING STATE ---
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState(null);
    const [isCustomType, setIsCustomType] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [newRoom, setNewRoom] = useState({
        name: "",
        block: "Main Block",
        floor: "Ground",
        capacity: 60,
        benches: 30,
        type: "Smart Lecture Hall",
        status: "Available",
        maintenanceDate: new Date().toISOString().split('T')[0]
    });

    // --- STATUS UPDATER ---
    const updateRoomStatus = async (roomId, newStatus) => {
        try {
            const targetRoom = rooms.find(r => r.id === roomId);
            if (!targetRoom) return;

            const updatedData = { ...targetRoom, status: newStatus };
            const saved = await api.updateRoom(roomId, updatedData);
            
            if (saved) {
                setRooms(prev => prev.map(r => r.id === roomId ? saved : r));
                if (selectedRoom && selectedRoom.id === roomId) {
                    setSelectedRoom(saved);
                    if (isEditing) setEditForm(prev => ({ ...prev, status: newStatus }));
                }
                notify.info(`Asset flagged as ${newStatus}`, { variant: "success", autoHideDuration: 2000 });
            }
        } catch (error) {
            notify.error("State synchronization failure");
        }
    };

    // --- CRUD HANDLERS ---
    const handleAdd = async () => {
        if (!newRoom.name.trim()) {
            notify.warning("Asset name is mandatory");
            return;
        }
        try {
            const saved = await api.addRoom(newRoom);
            if (saved) {
                setRooms(prev => [...prev, saved]);
                notify.success("Infrastructure asset commissioned");
                setIsAdding(false);
                setNewRoom({
                    name: "",
                    block: "Main Block",
                    floor: "Ground",
                    capacity: 60,
                    benches: 30,
                    type: "Smart Lecture Hall",
                    status: "Available",
                    maintenanceDate: new Date().toISOString().split('T')[0]
                });
            }
        } catch (error) {
            notify.error("System failed to register asset");
        }
    };

    const handleRemove = async (id) => {
        if (!window.confirm("Permanent Decommission: Delete this asset?")) return;
        try {
            await api.deleteRoom(id);
            setRooms(prev => prev.filter(r => r.id !== id));
            setSelectedRoom(null);
            notify.info("Asset decommissioned successfully");
        } catch (error) {
            notify.error("Failed to decommission asset");
        }
    };

    const handleStartEdit = () => {
        setEditForm({ ...selectedRoom });
        setIsEditing(true);
        setIsCustomType(!SUGGESTED_ROOM_TYPES.includes(selectedRoom.type) && selectedRoom.type !== "Other");
    };

    const handleInputChange = (src, field, value) => {
        const setFn = src === 'new' ? setNewRoom : setEditForm;
        
        if (field === 'type' && value === 'Other') {
            setIsCustomType(true);
            setFn(prev => ({ ...prev, type: "" }));
        } else if (field === 'type' && SUGGESTED_ROOM_TYPES.includes(value)) {
            setIsCustomType(false);
            setFn(prev => ({ ...prev, [field]: value }));
        } else {
            setFn(prev => ({ ...prev, [field]: value }));
        }
    };

    const handleSave = async () => {
        try {
            const saved = await api.updateRoom(editForm.id, editForm);
            if (saved) {
                setRooms(prev => prev.map(r => r.id === saved.id ? saved : r));
                setSelectedRoom(saved);
                setIsEditing(false);
                setIsCustomType(false);
                notify.success("Classroom profile optimized successfully");
            }
        } catch (error) {
            notify.error("Failed to update asset profile");
        }
    };

    const handleCloseModal = () => {
        setSelectedRoom(null);
        setIsEditing(false);
        setEditForm(null);
        setIsCustomType(false);
    };

    // --- FILTER LOGIC ---
    const filteredRooms = useMemo(() => {
        return rooms.filter(room => {
            const matchesSearch = (room.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
                                 (room.block?.toLowerCase() || "").includes(searchTerm.toLowerCase());
            
            let matchesFilter = true;
            if (activeFilter === "Available") matchesFilter = room.status === "Available";
            if (activeFilter === "Labs") matchesFilter = (room.type?.toLowerCase() || "").includes("lab");
            if (activeFilter === "HighCap") matchesFilter = (room.capacity || 0) > 50;

            return matchesSearch && matchesFilter;
        });
    }, [rooms, searchTerm, activeFilter]);

    // --- STATS ENGINE ---
    const stats = useMemo(() => {
        return {
            total: rooms.length,
            available: rooms.filter(r => r.status === "Available").length,
            occupied: rooms.filter(r => r.status === "Occupied").length,
            maintenance: rooms.filter(r => r.status === "Maintenance").length
        };
    }, [rooms]);

    // --- STATUS COLORS ---
    const statusColors = {
        Available: "bg-emerald-500",
        Occupied: "bg-rose-500",
        Maintenance: "bg-amber-400",
        Reserved: "bg-blue-600",
        Closed: "bg-slate-400"
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-12">
            {/* Header & Stats Strip */}
            <div className="flex flex-col xl:flex-row gap-6">
                <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: "Total Asset", value: stats.total, color: "bg-slate-900", icon: "🏢" },
                        { label: "Live Available", value: stats.available, color: "bg-emerald-500", icon: "🟢" },
                        { label: "Currently Occupied", value: stats.occupied, color: "bg-rose-500", icon: "🔴" },
                        { label: "Under Analytics", value: stats.maintenance, color: "bg-amber-400", icon: "📊" }
                    ].map((stat, idx) => (
                        <div key={idx} className={`p-6 rounded-2xl ${stat.color} text-white shadow-lg shadow-slate-200/50 flex flex-col justify-between h-32 transition-all hover:scale-[1.02]`}>
                            <div className="flex justify-between items-start">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 leading-tight">{stat.label}</p>
                                <span className="text-xl">{stat.icon}</span>
                            </div>
                            <h4 className="text-4xl font-bold tracking-tighter">{stat.value}</h4>
                        </div>
                    ))}
                </div>
                <button 
                    onClick={() => setIsAdding(!isAdding)}
                    className={`xl:w-48 p-6 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 transition-all ${isAdding ? "bg-rose-50 border-rose-200 text-rose-600" : "bg-white border-blue-100 text-blue-600 hover:border-blue-300 hover:bg-blue-50"}`}
                >
                    <span className="text-2xl">{isAdding ? "✕" : "⊕"}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">{isAdding ? "Cancel" : "Add Asset"}</span>
                </button>
            </div>

            {/* Quick Add Panel */}
            {isAdding && (
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-blue-50 animate-in zoom-in-95 duration-500">
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">Register New Asset</h3>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Facility Management System</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset Name</label>
                            <input 
                                className="w-full bg-slate-50 border-0 p-4 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 ring-blue-100"
                                placeholder="e.g. A-101"
                                value={newRoom.name}
                                onChange={(e) => handleInputChange('new', 'name', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Building Block</label>
                            <input 
                                className="w-full bg-slate-50 border-0 p-4 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 ring-blue-100"
                                placeholder="Main Wing"
                                value={newRoom.block}
                                onChange={(e) => handleInputChange('new', 'block', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Facility Level</label>
                            <select 
                                className="w-full bg-slate-50 border-0 p-4 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 ring-blue-100"
                                value={newRoom.floor}
                                onChange={(e) => handleInputChange('new', 'floor', e.target.value)}
                            >
                                {["Ground", "1st", "2nd", "3rd", "4th", "5th"].map(f => <option key={f} value={f}>{f} Floor</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Room Designation</label>
                            <select 
                                className="w-full bg-slate-50 border-0 p-4 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 ring-blue-100"
                                value={newRoom.type}
                                onChange={(e) => handleInputChange('new', 'type', e.target.value)}
                            >
                                {SUGGESTED_ROOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="mt-10 flex justify-end">
                        <button 
                            onClick={handleAdd}
                            className="bg-blue-600 text-white px-10 py-4 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg active:scale-95"
                        >
                            Confirm Registration
                        </button>
                    </div>
                </div>
            )}

            {/* Premium Control Bar */}
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-3">
                <div className="relative flex-1 w-full group">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors pointer-events-none">🔍</span>
                    <input
                        type="text"
                        placeholder="Search infrastructure by name or block..."
                        className="w-full bg-slate-50 border-0 pl-12 pr-6 py-3.5 rounded-xl font-bold text-slate-700 outline-none text-xs focus:ring-2 ring-blue-100 transition-all placeholder:text-slate-300"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto p-1 bg-slate-50 rounded-xl overflow-x-auto no-scrollbar">
                    {["All", "Available", "Labs", "HighCap"].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveFilter(tab)}
                            className={`px-6 py-2.5 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${activeFilter === tab ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Room Asset Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {filteredRooms.map((room) => (
                    <div 
                        key={room.id} 
                        className="group bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between min-h-[160px]"
                        onClick={() => setSelectedRoom(room)}
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className={`w-3 h-3 rounded-full ${statusColors[room.status || "Available"]} shadow-lg ring-4 ring-slate-50`}></div>
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest group-hover:text-blue-500 transition-colors">{room.block}</span>
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none mb-2">{room.name}</h3>
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wide">{room.type}</p>
                        </div>
                        <div className="mt-6 pt-4 border-t border-slate-50/50 flex items-center justify-between">
                            <span className="text-[11px] font-black text-slate-500 uppercase tracking-tight">Cap: {room.capacity}</span>
                            <span className="text-[11px] font-black text-blue-600 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">VIEW →</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Redesigned Clean Modal */}
            {selectedRoom && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500" onClick={handleCloseModal}></div>
                    
                    <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 slide-in-from-bottom-8 duration-700">
                        
                        {/* LEFT DASH PANEL: Identity */}
                        <div className="bg-slate-50 md:w-72 p-12 flex flex-col items-center justify-center text-center border-r border-slate-100">
                            {isEditing ? (
                                <input 
                                    className="text-5xl font-black text-slate-800 mb-8 bg-transparent border-b-4 border-blue-600/20 outline-none w-full text-center focus:border-blue-600 transition-all font-mono"
                                    value={editForm.name}
                                    onChange={(e) => handleInputChange('edit', 'name', e.target.value)}
                                    autoFocus
                                />
                            ) : (
                                <h2 className="text-6xl font-black text-slate-900 tracking-tighter mb-8 font-mono">{selectedRoom.name}</h2>
                            )}
                            
                            <div className="space-y-10 w-full">
                                <div className="flex flex-col items-center gap-3">
                                    <div className={`w-3.5 h-3.5 rounded-full ${statusColors[selectedRoom.status || "Available"]} shadow-lg ring-4 ring-white`}></div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{selectedRoom.status || "Available"}</span>
                                </div>

                                <div className="pt-10 space-y-8 border-t border-slate-200/50">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-2">Block Domain</p>
                                        {isEditing ? (
                                            <input 
                                                className="text-sm font-bold text-slate-700 bg-white px-4 py-2 rounded-xl w-full text-center border border-slate-100 outline-none shadow-sm focus:ring-2 ring-blue-100"
                                                value={editForm.block}
                                                onChange={(e) => handleInputChange('edit', 'block', e.target.value)}
                                            />
                                        ) : (
                                            <p className="text-base font-bold text-slate-800">{selectedRoom.block || "—"}</p>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-2">Facility Level</p>
                                        {isEditing ? (
                                            <select 
                                                className="text-sm font-bold text-slate-700 bg-white px-4 py-2 rounded-xl w-full text-center border border-slate-100 outline-none shadow-sm appearance-none cursor-pointer focus:ring-2 ring-blue-100"
                                                value={editForm.floor}
                                                onChange={(e) => handleInputChange('edit', 'floor', e.target.value)}
                                            >
                                                {["Ground", "1st", "2nd", "3rd", "4th", "5th"].map(f => <option key={f} value={f}>{f} Floor</option>)}
                                            </select>
                                        ) : (
                                            <p className="text-base font-bold text-slate-800">{selectedRoom.floor || "—"} Floor</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT DATA PANEL: Attributes */}
                        <div className="flex-1 p-12 lg:p-14 bg-white flex flex-col justify-between">
                            <div className="flex justify-between items-center mb-10">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
                                    {isEditing ? "Optimization Profile" : "Classroom Details"}
                                </h4>
                                <button onClick={handleCloseModal} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:bg-slate-50 hover:text-rose-500 transition-all">✕</button>
                            </div>
                            
                            <div className="space-y-7">
                                <div className="flex justify-between items-center">
                                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Max Occupancy</span>
                                    {isEditing ? (
                                        <input 
                                            type="number"
                                            className="text-base font-black text-slate-800 text-right w-20 bg-slate-50 px-4 py-2 rounded-xl outline-none"
                                            value={editForm.capacity}
                                            onChange={(e) => handleInputChange('edit', 'capacity', parseInt(e.target.value))}
                                        />
                                    ) : (
                                        <span className="text-base font-black text-slate-900">{selectedRoom.capacity || 0} Students</span>
                                    )}
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Bench Count</span>
                                    {isEditing ? (
                                        <input 
                                            type="number"
                                            className="text-base font-black text-slate-800 text-right w-20 bg-slate-50 px-4 py-2 rounded-xl outline-none"
                                            value={editForm.benches}
                                            onChange={(e) => handleInputChange('edit', 'benches', parseInt(e.target.value))}
                                        />
                                    ) : (
                                        <span className="text-base font-black text-slate-900">{selectedRoom.benches || 0} Benches</span>
                                    )}
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Designation</span>
                                    <div className="flex flex-col items-end gap-2">
                                        {isEditing ? (
                                            <>
                                                <select 
                                                    className="text-[11px] font-black text-blue-600 outline-none bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 cursor-pointer"
                                                    value={isCustomType ? "Other" : editForm.type}
                                                    onChange={(e) => handleInputChange('edit', 'type', e.target.value)}
                                                >
                                                    {SUGGESTED_ROOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                                {isCustomType && (
                                                    <input 
                                                        className="text-[11px] font-black text-slate-800 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 outline-blue-600 w-44 text-right mt-2"
                                                        value={editForm.type}
                                                        onChange={(e) => handleInputChange('edit', 'type', e.target.value)}
                                                    />
                                                )}
                                            </>
                                        ) : (
                                            <span className="text-base font-black text-slate-900">{selectedRoom.type || "—"}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex-col justify-between items-center">
                                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Current State</span>
                                    <div className="flex gap-1">
                                        {["Available", "Occupied", "Maintenance"].map(s => (
                                            <button 
                                                key={s}
                                                onClick={() => updateRoomStatus(selectedRoom.id, s)}
                                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${selectedRoom.status === s ? "bg-slate-900 text-white shadow-sm" : "bg-slate-50 text-slate-400 hover:bg-slate-100"}`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Last Service</span>
                                    {isEditing ? (
                                        <input 
                                            type="date"
                                            className="text-sm font-black text-slate-800 outline-none bg-slate-50 px-4 py-2 rounded-xl"
                                            value={editForm.maintenanceDate}
                                            onChange={(e) => handleInputChange('edit', 'maintenanceDate', e.target.value)}
                                        />
                                    ) : (
                                        <span className="text-base font-black text-slate-900">{selectedRoom.maintenanceDate || "—"}</span>
                                    )}
                                </div>
                            </div>

                            <div className="mt-14 flex items-center gap-3">
                                {isEditing ? (
                                    <>
                                        <button onClick={handleSave} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg">Save Changes</button>
                                        <button onClick={() => { setIsEditing(false); setIsCustomType(false); }} className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Discard</button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={handleStartEdit} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:hover:bg-slate-800 transition-all shadow-xl">Modify Data</button>
                                        <button 
                                            onClick={() => handleRemove(selectedRoom.id)}
                                            className="w-16 bg-rose-50 text-rose-500 py-4 rounded-2xl flex items-center justify-center hover:bg-rose-100 transition-all"
                                            title="Delete Asset"
                                        >
                                            🗑
                                        </button>
                                        <button onClick={handleCloseModal} className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Close</button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClassroomDashboard;
