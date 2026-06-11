// src/components/GlobalSummary.jsx

import React from 'react';

export default function GlobalSummary({ grid, subjects, departments, onSelectDept, onSelectYear }) {
  if (!grid || Object.keys(grid).length === 0) return null;

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
          <span className="text-blue-600">🌍</span>
          Global Generation Status
        </h3>
        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full">
          All Departments Overview
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map(dept => {
          const deptGrid = grid[dept.name] || {};
          const deptCurriculum = subjects[dept.name] || {};
          
          let totalRequired = 0;
          let totalScheduled = 0;

          Object.keys(deptCurriculum).forEach(yearKey => {
            const yearCurriculum = deptCurriculum[yearKey] || [];
            totalRequired += yearCurriculum.reduce((acc, sub) => acc + (parseInt(sub.hours) || 0), 0);

            const yearSections = deptGrid[yearKey] || {};
            Object.values(yearSections).forEach(sectionGrid => {
              Object.values(sectionGrid).forEach(dayData => {
                totalScheduled += Object.values(dayData).filter(cell => cell.subject).length;
              });
            });
          });

          // Note: totalScheduled might be inflated if multiple sections are counted, 
          // but we want a relative health indicator.
          // Let's refine to per-year average success.
          
          const years = ["year1", "year2", "year3", "year4"];
          const yearStats = years.map(yk => {
              const req = (deptCurriculum[yk] || []).reduce((acc, sub) => acc + (parseInt(sub.hours) || 0), 0);
              if (req === 0) return null;
              
              const secAGrid = deptGrid[yk]?.["A"] || {};
              const sched = Object.values(secAGrid).reduce((acc, dayData) => acc + Object.values(dayData).filter(c => c.subject).length, 0);
              return { year: yk, percent: Math.round((sched / req) * 100) };
          }).filter(Boolean);

          const avgSuccess = yearStats.length > 0 ? Math.round(yearStats.reduce((acc, s) => acc + s.percent, 0) / yearStats.length) : 0;

          return (
            <div 
              key={dept.id} 
              className="p-4 rounded-2xl bg-gray-50 border border-transparent hover:border-blue-200 transition-all cursor-pointer group"
              onClick={() => onSelectDept(dept.name)}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-sm font-black text-gray-800 group-hover:text-blue-600 transition-colors">{dept.name}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">{dept.students} Students</p>
                </div>
                <div className={`px-2 py-1 rounded-lg text-[10px] font-black ${avgSuccess === 100 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {avgSuccess}% OK
                </div>
              </div>
              
              <div className="flex gap-1 h-1.5 mb-3">
                {yearStats.map(s => (
                  <div 
                    key={s.year} 
                    className={`flex-1 rounded-full ${s.percent === 100 ? 'bg-green-500' : s.percent > 80 ? 'bg-blue-500' : 'bg-amber-500'}`}
                    style={{ opacity: s.percent / 100 }}
                  />
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {yearStats.map(s => (
                  <button
                    key={s.year}
                    onClick={(e) => { e.stopPropagation(); onSelectYear(parseInt(s.year.replace('year', ''))); onSelectDept(dept.name); }}
                    className={`text-[9px] font-black px-2 py-1 rounded ${s.percent === 100 ? 'bg-white text-green-600 border border-green-100' : 'bg-white text-amber-600 border border-amber-100'}`}
                  >
                    Y{s.year.replace('year', '')}: {s.percent}%
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
