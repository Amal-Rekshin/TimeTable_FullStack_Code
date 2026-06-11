export default function Header({ activeTab, setActiveTab, onToggleMenu, currentUser, onSignOut }) {
    const handleLogout = () => {
        if (onSignOut) onSignOut();
    };

    const user = currentUser;
  return (
    <header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white py-4 px-6 md:px-8 shadow-lg flex justify-between items-center sticky top-0 z-[90]">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleMenu}
          className="lg:hidden p-2 hover:bg-white/10 rounded-xl transition-all active:scale-95"
          title="Open Menu"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
        <div>
          <h1 className="text-base md:text-2xl font-black tracking-tight uppercase leading-tight">
            College Staff Allocation
          </h1>
          <div className="flex items-center gap-1.5 opacity-80 mt-0.5">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
            <p className="text-[10px] font-bold uppercase tracking-widest italic">Live System</p>
          </div>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-4">
        <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10 flex items-center gap-3 group relative">
          <span className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-black uppercase">
            {user?.fullName?.[0] || user?.displayName?.[0] || user?.email?.[0] || 'A'}
          </span>
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-tighter opacity-70 leading-none">
                {user?.fullName || user?.displayName || 'Administrator'}
            </p>
            <p className="text-xs font-bold leading-none mt-1 truncate max-w-[100px]">{user?.email || 'Academic Office'}</p>
          </div>
          
          <button 
            onClick={handleLogout}
            className="ml-2 p-2 hover:bg-red-500/20 rounded-lg transition-colors text-white/50 hover:text-red-300"
            title="Sign Out"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
