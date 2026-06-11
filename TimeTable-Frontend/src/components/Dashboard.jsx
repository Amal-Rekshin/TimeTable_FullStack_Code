// src/components/Dashboard.jsx

import React, { useState, useEffect } from 'react';
import * as api from '../utils/apiUtils';

const Dashboard = ({ subjects, departments = [], staff = [], rooms = [] }) => {
    const [archivedWorkload, setArchivedWorkload] = useState({});
    const [archivesLoading, setArchivesLoading] = useState(true);

    // Calculate dynamic stats
    const totalStaff = staff.length;
    const totalDepts = departments.length;
    const totalRooms = rooms.length;

    // Estimate total hours from subjects if available (Multi-dept structure)
    const allSubjs = subjects ? Object.values(subjects).flatMap(deptData => Object.values(deptData).flat()) : [];
    const totalCredits = allSubjs.reduce((acc, s) => acc + (parseInt(s.hours) || parseInt(s.credits) || 0), 0);

    const colors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500", "bg-rose-500"];

    // Fetch and compute actual workload from archives
    useEffect(() => {
        const fetchAndComputeWorkload = async () => {
            try {
                const data = await api.fetchArchives();
                
                // Group by department to find the latest archive for each
                const latestByDept = {};
                data.forEach(archive => {
                    if (!latestByDept[archive.dept] || new Date(archive.archivedAt) > new Date(latestByDept[archive.dept].archivedAt)) {
                        latestByDept[archive.dept] = archive;
                    }
                });

                // Compute workload from the grids
                const workload = {};
                Object.values(latestByDept).forEach(archive => {
                    let grid = {};
                    try {
                        grid = typeof archive.grid === 'string' ? JSON.parse(archive.grid) : archive.grid;
                    } catch (e) {
                        console.error("Failed to parse archive grid for workload", e);
                    }

                    // Iterate over years -> sections -> days -> periods
                    Object.values(grid).forEach(yearData => {
                        Object.values(yearData).forEach(sectionData => {
                            Object.values(sectionData).forEach(dayData => {
                                Object.values(dayData).forEach(slot => {
                                    if (slot && slot.teacher && slot.type !== 'break') {
                                        workload[slot.teacher] = (workload[slot.teacher] || 0) + 1;
                                    }
                                });
                            });
                        });
                    });
                });
                
                setArchivedWorkload(workload);
            } catch (error) {
                console.error("Failed to load archives for dashboard", error);
            } finally {
                setArchivesLoading(false);
            }
        };

        fetchAndComputeWorkload();
    }, []);

    const sortedTeachers = Object.entries(archivedWorkload).sort(([, a], [, b]) => b - a).slice(0, 5);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="bg-white p-6 md:p-10 rounded-[1.5rem] md:rounded-[3rem] shadow-xl shadow-blue-50/50 border border-blue-50 relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-2xl md:text-4xl font-black text-gray-800 tracking-tighter mb-2">📊 Academic Analytics</h2>
                    <p className="text-sm md:text-base text-gray-500 font-medium">Real-time overview of faculty workload and department infrastructure.</p>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 md:w-64 md:h-64 bg-blue-50 rounded-full -mr-10 -mt-10 md:-mr-20 md:-mt-20 opacity-50"></div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatCard title="Departments" value={totalDepts} icon="🏢" color="text-blue-600" />
                <StatCard title="Total Faculty" value={totalStaff} icon="👥" color="text-green-600" />
                <StatCard title="Classrooms/Labs" value={totalRooms} icon="🏫" color="text-purple-600" />
                <StatCard title="Total Credits" value={`${totalCredits} hrs`} icon="⏱️" color="text-orange-600" />
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Faculty Workload Ranking */}
                <div className="bg-white p-8 rounded-[2rem] shadow-lg border border-gray-50 border-t-4 border-t-orange-500">
                    <div className="flex flex-col mb-6">
                        <h3 className="text-xl font-bold text-gray-700 flex items-center gap-2">
                            🔥 Top Faculty Load
                        </h3>
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">(From Latest Archives)</span>
                    </div>
                    <div className="space-y-4">
                        {archivesLoading ? (
                            <div className="flex justify-center items-center py-4">
                                <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            <>
                                {sortedTeachers.map(([name, load], idx) => (
                                    <div key={name} className="flex justify-between items-center group">
                                        <span className="text-sm font-bold text-gray-600">{idx + 1}. {name}</span>
                                        <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-[10px] font-black">{load} periods/wk</span>
                                    </div>
                                ))}
                                {sortedTeachers.length === 0 && <p className="text-gray-400 italic text-center py-4">No archived workload data.</p>}
                            </>
                        )}
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[2rem] shadow-lg border border-gray-50 border-t-4 border-t-blue-600">
                    <h3 className="text-xl font-bold mb-6 text-gray-700 flex items-center gap-2">
                        Department Student Distribution
                    </h3>

                    <div className="space-y-6">
                        {departments.length > 0 ? departments.map((dept, idx) => (
                            <div key={dept.id} className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <span className="font-bold text-gray-700">{dept.name}</span>
                                    <span className="text-xs font-bold text-gray-400">{dept.students} Students</span>
                                </div>
                                <div className="w-full bg-gray-50 h-3 rounded-full overflow-hidden">
                                    <div
                                        className={`${colors[idx % colors.length]} h-full rounded-full transition-all duration-1000`}
                                        style={{ width: `${Math.min((dept.students / 150) * 100, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        )) : (
                            <p className="text-gray-400 italic text-center py-10">No department data available.</p>
                        )}
                    </div>
                </div>

                {/* Staff Overview */}
                <div className="bg-white p-8 rounded-[2rem] shadow-lg border border-gray-50 border-t-4 border-t-green-500">
                    <h3 className="text-xl font-bold mb-6 text-gray-700 flex items-center gap-2">
                        Faculty Designation Mix
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {["Professor", "Associate Professor", "Assistant Professor", "Lab Assistant"].map(deg => {
                            const count = staff.filter(s => s.designation === deg).length;
                            return (
                                <div key={deg} className="bg-gray-50 p-4 rounded-2xl text-center border border-transparent hover:border-green-100 transition-all">
                                    <p className="text-2xl font-black text-gray-800">{count}</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">{deg}</p>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon, color }) => (
    <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 md:gap-6 transition-all hover:shadow-xl hover:-translate-y-1">
        <div className={`text-2xl md:text-4xl ${color} bg-gray-50 w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center`}>{icon}</div>
        <div>
            <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-widest">{title}</p>
            <p className={`text-xl md:text-3xl font-black ${color}`}>{value}</p>
        </div>
    </div>
);

export default Dashboard;
