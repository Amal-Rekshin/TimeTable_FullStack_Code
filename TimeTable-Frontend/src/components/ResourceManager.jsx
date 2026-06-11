import React, { useState, useMemo } from 'react';
import * as api from '../utils/apiUtils';
import { notify } from "./Toast";

const ResourceManager = ({ rooms, setRooms }) => {
    // Notifications handled by notify utility
    
    const initialRoomState = {
        number: "", 
        type: "Theory",
        capacity: 40,
        buildingBlock: "Main Block",
        floor: "Ground",
        amenities: []
    };

    const [newRoom, setNewRoom] = useState(initialRoomState);
    const [isAdding, setIsAdding] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState("All");

    const amenitiesOptions = ["Projector", "AC", "Smart Board", "Wi-Fi", "Speaker System", "UPS Backup"];
    const buildingBlocks = ["Main Block", "Science Block", "Engineering Block", "PG Block", "Workshop Wing"];
    const floorLevels = ["Ground", "First", "Second", "Third", "Fourth", "Lab Wing"];

    const handleAdd = async () => {
        if (!newRoom.number.trim()) {
            notify.info("Please enter a room identifier.");
            return;
        }
        
        try {
            const roomPayload = {
                name: newRoom.number,
                type: newRoom.type,
                capacity: newRoom.capacity,
                buildingBlock: newRoom.buildingBlock,
                floor: newRoom.floor,
                amenities: newRoom.amenities.join(",")
            };
            
            const savedRoom = await api.addRoom(roomPayload);
            if (savedRoom) {
                // Formatting for frontend consistency
                const formattedRoom = { ...savedRoom, number: savedRoom.name };
                setRooms(prev => [...prev, formattedRoom]);
                notify.success(`Resource ${savedRoom.name} successfully registered.`);
                resetForm();
            }
        } catch (error) {
            notify.error("Error saving resource to backend.");
        }
    };

    const resetForm = () => {
        setNewRoom(initialRoomState);
        setIsAdding(false);
    };

    const [confirmingId, setConfirmingId] = useState(null);

    const handleRemove = async (id) => {
        try {
            await api.deleteRoom(id);
            setRooms(prev => prev.filter(r => String(r.id) !== String(id)));
            notify.success("Infrastructure component removed.");
            setConfirmingId(null);
        } catch (error) {
            notify.error("Error deleting resource.");
        }
    };

    const toggleAmenity = (amenity) => {
        const current = newRoom.amenities;
        const updated = current.includes(amenity) 
            ? current.filter(a => a !== amenity) 
            : [...current, amenity];
        setNewRoom({ ...newRoom, amenities: updated });
    };

    const filteredRooms = useMemo(() => {
        return rooms.filter(room => {
            const matchesSearch = room.number?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                 room.buildingBlock?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = activeFilter === "All" || room.type === activeFilter;
            return matchesSearch && matchesType;
        });
    }, [rooms, searchTerm, activeFilter]);

    const stats = useMemo(() => {
        return {
            total: rooms.length,
            totalCapacity: rooms.reduce((acc, r) => acc + (r.capacity || 0), 0),
            labs: rooms.filter(r => r.type === "Lab").length,
            theory: rooms.filter(r => r.type === "Theory").length
        };
    }, [rooms]);

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
            {/* Infrastructure Insights */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-purple-600 to-purple-800 p-8 rounded-[2rem] text-white shadow-2xl flex flex-col justify-between group overflow-hidden relative">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-700"></div>
                    <div>
                        <p className="text-purple-200 font-bold uppercase text-[10px] tracking-[0.2em] mb-1">Total Capacity</p>
                        <h4 className="text-4xl font-black">{stats.totalCapacity} <span className="text-sm font-medium opacity-60">Students</span></h4>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mb-1">Active Resources</p>
                        <h4 className="text-xl font-black text-slate-800">{stats.total} Components</h4>
                    </div>
                    <p className="text-xs text-slate-500 font-medium tracking-tight">Theory + Lab Infrastructure</p>
                </div>

                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mb-1">Specialized Labs</p>
                        <h4 className="text-xl font-black text-slate-800">{stats.labs} Facilities</h4>
                    </div>
                    <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mt-4">
                        <div className="bg-orange-500 h-full rounded-full" style={{ width: `${(stats.labs / stats.total) * 100}%` }}></div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mb-1">Theory Halls</p>
                        <h4 className="text-xl font-black text-slate-800">{stats.theory} Rooms</h4>
                    </div>
                    <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mt-4">
                        <div className="bg-blue-500 h-full rounded-full" style={{ width: `${(stats.theory / stats.total) * 100}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Registration Hub Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-100/50 border border-slate-100/50 gap-6">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">🏢 Campus Infrastructure</h2>
                    <p className="text-sm text-slate-500 font-medium">Coordinate classrooms, specialized labs, and workshop wings.</p>
                </div>
                <button
                    onClick={() => isAdding ? resetForm() : setIsAdding(true)}
                    className={`w-full sm:w-auto px-8 py-4 rounded-2xl font-black transition-all shadow-xl active:scale-95 ${isAdding ? 'bg-slate-100 text-slate-600' : 'bg-purple-600 text-white shadow-purple-200 hover:bg-slate-900 hover:shadow-slate-200'}`}
                >
                    {isAdding ? 'Cancel Registration' : '+ Register Resource'}
                </button>
            </div>

            {/* Enrollment Panel */}
            {isAdding && (
                <div className="bg-white p-8 md:p-12 rounded-[3.5rem] shadow-2xl border border-purple-50 animate-in zoom-in-95 duration-500 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 text-purple-100 pointer-events-none">
                        <svg className="w-32 h-32 opacity-20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3L2 12h3v8h14v-8h3L12 3zm0 2.83l7 6.3V18H5v-8.87l7-6.3z" /></svg>
                    </div>

                    <h3 className="text-2xl font-black mb-10 text-slate-800 flex items-center gap-3">
                        <span className="w-2 h-8 bg-purple-600 rounded-full"></span>
                        Resource Registration
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Room Identifier</label>
                            <input
                                type="text"
                                placeholder="e.g. L-101"
                                className="w-full bg-slate-50 border-2 border-transparent p-5 rounded-[2rem] focus:border-purple-100 focus:bg-white transition-all font-black text-slate-700 outline-none"
                                value={newRoom.number}
                                onChange={(e) => setNewRoom({ ...newRoom, number: e.target.value })}
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Building Block</label>
                            <select
                                className="w-full bg-slate-50 border-2 border-transparent p-5 rounded-[2rem] focus:border-purple-100 focus:bg-white transition-all font-black text-slate-700 outline-none appearance-none"
                                value={newRoom.buildingBlock}
                                onChange={(e) => setNewRoom({ ...newRoom, buildingBlock: e.target.value })}
                            >
                                {buildingBlocks.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Floor / Level</label>
                            <select
                                className="w-full bg-slate-50 border-2 border-transparent p-5 rounded-[2rem] focus:border-purple-100 focus:bg-white transition-all font-black text-slate-700 outline-none appearance-none"
                                value={newRoom.floor}
                                onChange={(e) => setNewRoom({ ...newRoom, floor: e.target.value })}
                            >
                                {floorLevels.map(f => <option key={f} value={f}>{f} Floor</option>)}
                            </select>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Max Capacity</label>
                            <input
                                type="number"
                                className="w-full bg-slate-50 border-2 border-transparent p-5 rounded-[2rem] focus:border-purple-100 focus:bg-white transition-all font-black text-slate-700 outline-none"
                                value={newRoom.capacity}
                                onChange={(e) => setNewRoom({ ...newRoom, capacity: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-12 gap-10 mt-10">
                        <div className="lg:col-span-4 space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Resource Type</label>
                            <div className="grid grid-cols-2 gap-3">
                                {["Theory", "Lab", "Workshop", "Auditorium"].map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setNewRoom({ ...newRoom, type: t })}
                                        className={`p-4 rounded-3xl font-bold text-sm transition-all border-2 ${newRoom.type === t ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-200' : 'bg-slate-50 text-slate-500 border-transparent hover:border-purple-100'}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="lg:col-span-8 bg-slate-50/50 p-8 rounded-[3rem] border border-slate-100">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 block ml-2">Integrated Amenities</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {amenitiesOptions.map(a => (
                                    <button
                                        key={a}
                                        onClick={() => toggleAmenity(a)}
                                        className={`p-4 rounded-2xl text-xs font-black transition-all border-2 flex items-center gap-3 ${newRoom.amenities.includes(a) ? 'bg-white border-purple-400 text-purple-700 shadow-sm' : 'bg-white/50 border-white text-slate-400 hover:border-slate-200'}`}
                                    >
                                        <span className={`w-3 h-3 rounded-full ${newRoom.amenities.includes(a) ? 'bg-purple-500 shadow-sm' : 'bg-slate-200'}`}></span>
                                        {a}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 pt-8 border-t border-slate-50 flex justify-end">
                        <button
                            onClick={handleAdd}
                            className="w-full sm:w-auto bg-slate-900 text-white px-16 py-5 rounded-[2rem] font-black shadow-2xl hover:bg-purple-600 transition-all active:scale-95"
                        >
                            Deploy Resource Component
                        </button>
                    </div>
                </div>
            )}

            {/* Hub Navigation Bar */}
            <div className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-100/50 border border-slate-100/50 flex flex-col md:flex-row items-center gap-6">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto pb-2 md:pb-0">
                    <button
                        onClick={() => setActiveFilter("All")}
                        className={`px-8 py-3 rounded-2xl font-black text-sm transition-all border-2 whitespace-nowrap ${activeFilter === "All" ? "bg-slate-900 text-white border-slate-900 shadow-lg" : "bg-white text-slate-400 border-transparent hover:bg-slate-50"}`}
                    >
                        All Infrastructure
                    </button>
                    {["Theory", "Lab", "Workshop", "Auditorium"].map(t => (
                        <button
                            key={t}
                            onClick={() => setActiveFilter(t)}
                            className={`px-8 py-3 rounded-2xl font-black text-sm transition-all border-2 whitespace-nowrap ${activeFilter === t ? "bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-100" : "bg-white text-slate-400 border-transparent hover:bg-slate-50"}`}
                        >
                            {t}s
                        </button>
                    ))}
                </div>

                <div className="relative flex-1 group w-full">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-purple-500 transition-colors text-xl">🔍</span>
                    <input
                        type="text"
                        placeholder="Search by Room ID or Building Block..."
                        className="w-full bg-slate-50/50 border-2 border-transparent focus:border-purple-100 focus:bg-white px-16 py-4 rounded-[1.5rem] font-black text-slate-700 outline-none transition-all placeholder:text-slate-300 shadow-inner"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Campus Grid */}
            {filteredRooms.length === 0 ? (
                <div className="py-40 flex flex-col items-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100">
                    <span className="text-7xl mb-8 opacity-20 filter grayscale">🏢</span>
                    <h3 className="text-2xl font-black text-slate-800">No Resources Located</h3>
                    <p className="text-slate-400 font-medium max-w-sm text-center mt-2">Adjust your search or filter toggle to locate specific campus components.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {filteredRooms.map((room) => (
                        <div key={room.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-purple-100/40 hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
                            <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full blur-3xl opacity-10 transition-colors ${room.type === 'Lab' ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
                            
                            <div className="flex justify-between items-start mb-6 relative">
                                <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-sm ${room.type === 'Lab' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                                    }`}>
                                    {room.type}
                                </div>
                                
                                {confirmingId === room.id ? (
                                    <div className="flex gap-2 animate-in fade-in slide-in-from-right-2 duration-300">
                                        <button onClick={() => handleRemove(room.id)} className="bg-rose-500 text-white px-3 py-1 rounded-lg text-[9px] font-black">X</button>
                                        <button onClick={() => setConfirmingId(null)} className="bg-slate-100 text-slate-400 px-3 py-1 rounded-lg text-[9px] font-black">Cancel</button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setConfirmingId(room.id)}
                                        className="w-8 h-8 flex items-center justify-center text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all"
                                    >
                                        🗑
                                    </button>
                                )}
                            </div>

                            <div className="mb-8">
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-1">{room.buildingBlock || "Main Block"}</p>
                                <h3 className="text-3xl font-black text-slate-800 tracking-tight group-hover:text-purple-600 transition-colors">{room.number}</h3>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-tighter mt-1">{room.floor || "Ground"} Floor</p>
                            </div>

                            <div className="flex flex-col gap-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center text-lg">👥</div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">Capacity</p>
                                        <p className="font-black text-slate-700 text-sm mt-1">{room.capacity} Students</p>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-50">
                                    <div className="flex flex-wrap gap-1.5">
                                        {room.amenities ? room.amenities.split(",").slice(0, 3).map(a => (
                                            <span key={a} className="bg-slate-50 text-slate-400 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-tight">
                                                {a}
                                            </span>
                                        )) : <span className="text-[9px] text-slate-200 italic">Standard Amenities</span>}
                                        {room.amenities && room.amenities.split(",").length > 3 && (
                                            <span className="text-[8px] text-slate-400 font-black">+{room.amenities.split(",").length - 3}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Quick Export / View Floating Action */}
            <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="fixed bottom-10 right-10 w-16 h-16 bg-slate-900 text-white rounded-[1.5rem] shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group"
            >
                <span className="text-2xl group-hover:-translate-y-1 transition-transform">↑</span>
            </button>
        </div>
    );
};

export default ResourceManager;
