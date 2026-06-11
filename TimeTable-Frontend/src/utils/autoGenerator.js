import { periods, weekDays } from "./periods.js";

// Simplified shuffle
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/**
 * Global Conflict Checker
 * Checks if a teacher is already busy at a specific day/period in ANY department/year/section
 */
const isStaffBusyGlobally = (grid, day, periodId, teacher) => {
  if (!teacher || teacher.trim() === "") return false;
  const t = teacher.trim().toLowerCase();

  for (const dept of Object.keys(grid)) {
    for (const year of Object.keys(grid[dept])) {
      for (const sec of Object.keys(grid[dept][year])) {
        const cell = grid[dept][year][sec][day]?.[periodId];
        if (cell && cell.type === "class") {
          const cellTeacher = cell.teacher ? cell.teacher.trim().toLowerCase() : "";
          const cellTeacherCode = cell.teacherCode ? cell.teacherCode.trim().toLowerCase() : "";
          if (cellTeacher === t || cellTeacherCode === t) {
            return true;
          }
        }
      }
    }
  }
  return false;
};

export const autoGenerateTimetable = (allDeptsSubjects) => {
  const grid = {};
  const depts = Object.keys(allDeptsSubjects);

  // 1. Pre-initialize Global Grid
  depts.forEach(dept => {
    grid[dept] = {};
    Object.keys(allDeptsSubjects[dept]).forEach(yearKey => {
      grid[dept][yearKey] = {};
      
      // Determine sections for this year based on input
      const yearSubjects = allDeptsSubjects[dept][yearKey];
      const hasSectionB = yearSubjects.some(s => s.needsSectionB || (s.teacherB && s.teacherB.trim() !== ""));
      const sections = hasSectionB ? ["A", "B"] : ["A"];
      
      sections.forEach(sec => {
        grid[dept][yearKey][sec] = {};
        weekDays.forEach(day => {
          grid[dept][yearKey][sec][day] = {};
          // Fill breaks first
          periods.forEach(p => {
            if (p.type === "break") {
              grid[dept][yearKey][sec][day][p.id] = { type: "break", subject: p.name };
            }
          });
        });
      });
    });
  });

  const classPeriods = periods.filter(p => p.type === "class");

  // Helper to create subject record
  const createCell = (sub, subTypeOverride = null, section = "A") => {
    // Resolve teacher for section
    let teacher = sub.teacher;
    let teacherCode = sub.teacherCode;
    if (section === "B" && sub.teacherB && sub.teacherB.trim() !== "") {
      teacher = sub.teacherB;
      teacherCode = sub.teacherCodeB;
    }

    return {
      type: "class",
      subject: sub.subject,
      shortName: sub.shortName,
      code: sub.code,
      teacher: teacher,
      teacherCode: teacherCode,
      subjectType: subTypeOverride || sub.type
    };
  };

  // Calculate requirements and track hours assigned
  const requirements = [];
  depts.forEach(dept => {
    Object.keys(allDeptsSubjects[dept]).forEach(yearKey => {
      const yearSubjects = allDeptsSubjects[dept][yearKey];
      const hasSectionB = yearSubjects.some(s => s.needsSectionB || (s.teacherB && s.teacherB.trim() !== ""));
      const sections = hasSectionB ? ["A", "B"] : ["A"];

      sections.forEach(sec => {
        yearSubjects.forEach(sub => {
          if (sub.type === "Theory and Lab") {
            // Split into 3h Lab and remaining Theory
            const labHours = Math.min(3, sub.hours);
            const theoryHours = sub.hours - labHours;

            if (labHours > 0) {
              requirements.push({
                ...sub,
                dept,
                yearKey,
                section: sec,
                type: "Lab", // Treated as Lab for Pass 2
                remainingHours: labHours,
                originalType: "Theory and Lab"
              });
            }
            if (theoryHours > 0) {
              requirements.push({
                ...sub,
                dept,
                yearKey,
                section: sec,
                type: "Theory", // Treated as Theory for Pass 1/3
                remainingHours: theoryHours,
                originalType: "Theory and Lab"
              });
            }
          } else {
            requirements.push({
              ...sub,
              dept,
              yearKey,
              section: sec,
              remainingHours: sub.hours,
              assignedDays: new Set()
            });
          }
        });
      });
    });
  });

  // PASS 1: Daily Subject Distribution (Ensuring every subject appears at least once per day if possible)
  weekDays.forEach(day => {
    // Global Shuffle of requirements for this day to ensure fairness across depts/sections
    shuffle(requirements.filter(r => r.type !== "Lab" && r.remainingHours > 0)).forEach(req => {
      const freePeriod = shuffle(classPeriods).find(p =>
        (!grid[req.dept][req.yearKey][req.section][day][p.id] || !grid[req.dept][req.yearKey][req.section][day][p.id].subject) &&
        !isStaffBusyGlobally(grid, day, p.id, req.section === "B" && req.teacherB ? req.teacherB : req.teacher)
      );

      if (freePeriod) {
        grid[req.dept][req.yearKey][req.section][day][freePeriod.id] = createCell(req, req.originalType, req.section);
        req.remainingHours--;
      }
    });
  });

  // PASS 2: Lab Assignment (Block Priority, aware of intervals)
  requirements.filter(r => r.type === "Lab").forEach(req => {
    let hoursToAssign = req.remainingHours;
    let attempts = 0;
    const currentTeacher = (req.section === "B" && req.teacherB) ? req.teacherB : req.teacher;

    while (hoursToAssign > 0 && attempts < 100) {
      const day = weekDays[Math.floor(Math.random() * weekDays.length)];

      // We look for a block of class periods that might have breaks in between but NOT lunch
      // Total 3 periods needed
      for (let i = 0; i < periods.length - 2; i++) {
        const p1 = periods[i];
        if (p1.type !== "class") continue;

        // Collect 3 class periods starting from i
        const block = [];
        let j = i;
        while (block.length < 3 && j < periods.length) {
          if (periods[j].type === "class") {
            block.push(periods[j]);
          } else if (periods[j].id === "lunch") {
            // Lab cannot span lunch
            break;
          }
          j++;
        }

        if (block.length === 3) {
          const canFit = block.every(p =>
            (!grid[req.dept][req.yearKey][req.section][day][p.id]?.subject) &&
            !isStaffBusyGlobally(grid, day, p.id, currentTeacher)
          );

          if (canFit) {
            block.forEach(p => {
              grid[req.dept][req.yearKey][req.section][day][p.id] = createCell(req, req.originalType, req.section);
            });
            hoursToAssign -= 3;
            break;
          }
        }
      }
      attempts++;
    }
  });

  // PASS 3: Remaining Theory Hours
  requirements.filter(r => r.type !== "Lab").forEach(req => {
    let hoursToAssign = req.remainingHours;
    let attempts = 0;
    const currentTeacher = (req.section === "B" && req.teacherB) ? req.teacherB : req.teacher;

    while (hoursToAssign > 0 && attempts < 100) {
      const day = weekDays[Math.floor(Math.random() * weekDays.length)];
      const p = shuffle(classPeriods).find(p =>
        (!grid[req.dept][req.yearKey][req.section][day][p.id] || !grid[req.dept][req.yearKey][req.section][day][p.id].subject) &&
        !isStaffBusyGlobally(grid, day, p.id, currentTeacher)
      );

      if (p) {
        grid[req.dept][req.yearKey][req.section][day][p.id] = createCell(req, req.originalType, req.section);
        hoursToAssign--;
      }
      attempts++;
    }
  });

  // Removed FINAL PASS: 100% Occupancy Backfill to prevent subject repetition beyond assigned hours.
  // Subjects will now only appear for the specified 'hoursPerWeek'.

  return grid;
};
