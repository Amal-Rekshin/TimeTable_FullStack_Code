// src/utils/conflictChecker.js

export const findGlobalConflicts = (fullGrid, staffName, day, periodId, currentLoc) => {
  if (!staffName || !fullGrid) return [];

  const conflicts = [];
  const { dept: currentDept, year: currentYear, section: currentSec } = currentLoc;

  Object.keys(fullGrid).forEach(dept => {
    Object.keys(fullGrid[dept]).forEach(yearKey => {
      Object.keys(fullGrid[dept][yearKey]).forEach(sec => {
        // Skip if it's the exact same section we are looking at
        if (dept === currentDept && yearKey === currentYear && sec === currentSec) return;

        const cell = fullGrid[dept][yearKey][sec][day]?.[periodId];
        if (cell && (cell.teacher === staffName || cell.teacherB === staffName)) {
          conflicts.push({
            dept,
            year: yearKey,
            section: sec,
            subject: cell.subject
          });
        }
      });
    });
  });

  return conflicts;
};

export const getStaffGlobalSchedule = (fullGrid, staffName) => {
    const schedule = {};
    if (!fullGrid || !staffName) return schedule;

    Object.keys(fullGrid).forEach(dept => {
        Object.keys(fullGrid[dept]).forEach(yearKey => {
            Object.keys(fullGrid[dept][yearKey]).forEach(sec => {
                const deptGrid = fullGrid[dept][yearKey][sec];
                Object.keys(deptGrid).forEach(day => {
                    if (!schedule[day]) schedule[day] = {};
                    Object.keys(deptGrid[day]).forEach(periodId => {
                        const cell = deptGrid[day][periodId];
                        if (cell && (cell.teacher === staffName || cell.teacherB === staffName)) {
                            schedule[day][periodId] = {
                                dept,
                                year: yearKey,
                                section: sec,
                                subject: cell.subject,
                                type: cell.type
                            };
                        }
                    });
                });
            });
        });
    });
    return schedule;
};
