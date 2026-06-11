import React from 'react';

const Sidebar = ({ isOpen, onClose, activeTab, setActiveTab, navItems }) => {
    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] lg:hidden transition-opacity duration-300"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Content */}
            {/* <div className="lg:h-[90vh]">
                <aside className={`
                    fixed inset-y-0 left-0 z-[110] lg:h-[90vh] lg:z-0 w-72 bg-white border-r transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:sticky lg:top-10 lg:left-0 lg:h-auto
                    ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
                    flex flex-col p-4 space-y-2
                `}> */}


            <aside
                className={`
                fixed inset-y-0 left-0 z-[110] w-72 bg-white border-r
                transform transition-transform duration-300 ease-in-out

                ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}

                lg:translate-x-0 lg:shadow-none
                lg:static lg:h-full lg:z-0

                flex flex-col p-4 space-y-2
                `}
            >


                    <div className="flex items-center justify-between mb-6 px-4 py-2 lg:hidden">
                        <h2 className="text-xl font-black text-blue-600 tracking-tight">MENU</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
                        >
                            ✕
                        </button>
                    </div>

                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4 mb-2 font-mono">Management</p>

                    <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar pr-1">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setActiveTab(item.id);
                                    onClose(); // Auto-close on mobile
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-black transition-all group ${activeTab === item.id
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-[1.02]'
                                    : 'text-gray-500 hover:bg-slate-50 hover:text-blue-600'
                                    }`}
                            >
                                <span className={`text-xl transition-transform group-hover:scale-110 ${activeTab === item.id ? 'scale-110' : ''}`}>
                                    {item.icon}
                                </span>
                                <span className="tracking-tight">{item.label}</span>
                            </button>
                        ))}
                    </nav>

                    <div className="mt-auto p-4 bg-slate-50 rounded-[1.5rem] border border-slate-100 hidden lg:block">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Cloud Status</p>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <p className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">System Online</p>
                        </div>
                    </div>
                </aside>
        </>
    );
};

export default Sidebar;
