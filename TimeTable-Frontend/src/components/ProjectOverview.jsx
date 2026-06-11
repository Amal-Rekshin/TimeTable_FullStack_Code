// src/components/ProjectOverview.jsx

import React from 'react';

const ProjectOverview = () => {
    const features = [
        { title: "Department-Wise Class Details", desc: "Tracks all sections for CSE, ECE, AIDS, EEE and more.", icon: "🏢" },
        { title: "Faculty Allocation", desc: "Staff-section mapping with auto-update capability.", icon: "👥" },
        { title: "Staff Workload Hours", desc: "Weekly hours calculation for lectures, labs, and duties.", icon: "⏱️" },
        { title: "Timetable Automation", desc: "Clash-free scheduling with availability checking.", icon: "🤖" },
        { title: "Admin & HOD Dashboard", desc: "Centralized control for staff, sections, and hours.", icon: "📊" },
        { title: "Full College Report", desc: "Consolidated departmental stats and comparison charts.", icon: "📈" },
    ];

    const whyNeeded = [
        "Colleges face difficulty allocating classes for each department manually",
        "Staff workload calculation takes hours",
        "Transparency between HOD, principal, staff is missing",
        "Manual allotments cause errors & timetable conflicts",
        "NAAC & NBA documentation becomes hard"
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-12">
            {/* Hero Section */}
            <div className="text-center py-10 md:py-16 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl md:rounded-3xl shadow-xl px-6">
                <h1 className="text-2xl md:text-6xl font-extrabold mb-4 tracking-tight">
                    Automated Department-wise Class & Faculty Workload Management System
                </h1>
                <p className="text-lg md:text-2xl font-light opacity-90 mb-8">
                    One Platform. Every Department. Complete Transparency.
                </p>
                <div className="max-w-3xl mx-auto bg-white/10 backdrop-blur-md p-4 md:p-6 rounded-2xl border border-white/20">
                    <p className="text-base md:text-lg">
                        A smart solution designed to help colleges manage classes, faculty allocations, and working hours across all engineering departments — CSE, ECE, AIDS, EEE and more.
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2 md:gap-4 text-[10px] md:text-sm font-bold uppercase tracking-wider">
                        <span className="bg-green-500/20 px-3 py-1 rounded-full border border-green-500/30">Fully automated</span>
                        <span className="bg-yellow-500/20 px-3 py-1 rounded-full border border-yellow-500/30">Error-free</span>
                        <span className="bg-purple-500/20 px-3 py-1 rounded-full border border-purple-500/30">Time-saving</span>
                    </div>
                </div>
            </div>

            {/* Why Needed Section */}
            <div className="grid md:grid-cols-2 gap-8 items-center bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-lg border border-gray-100">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800">🏫 Why This System is Needed?</h2>
                    <ul className="space-y-4">
                        {whyNeeded.map((point, i) => (
                            <li key={i} className="flex items-start gap-3">
                                <span className="bg-red-100 text-red-600 p-1 rounded-full mt-1 shrink-0">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>
                                </span>
                                <span className="text-gray-600 text-base md:text-lg">{point}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="bg-blue-50 p-6 md:p-8 rounded-2xl border-2 border-dashed border-blue-200 text-center">
                    <p className="text-xl md:text-2xl font-bold text-blue-800 mb-2 font-serif italic">"Our project solves all of this."</p>
                    <div className="w-16 h-1 bg-blue-600 mx-auto mt-4 rounded-full"></div>
                </div>
            </div>

            {/* Key Features Grid */}
            <div>
                <h2 className="text-3xl font-bold mb-8 text-center text-gray-800">🛠️ Key Features</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, i) => (
                        <div key={i} className="group bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                            <h3 className="text-xl font-bold mb-2 text-gray-800 uppercase tracking-tight">{i + 1}. {feature.title}</h3>
                            <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProjectOverview;
