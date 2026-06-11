package com.example.timetable.service;

import com.example.timetable.model.*;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.core.type.TypeReference;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class TimetableService {

    private final GeminiService geminiService;
    private final ObjectMapper objectMapper;

    public static final List<String> WEEK_DAYS = Arrays.asList("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday");

    public static class Period {
        public String id;
        public String name;
        public String type; // "class" or "break"
        public String start;
        public String end;

        public Period(String id, String name, String type) {
            this.id = id;
            this.name = name;
            this.type = type;
        }
    }

    public static final List<Period> PERIODS = Arrays.asList(
            new Period("p1", "Period 1", "class"),
            new Period("p2", "Period 2", "class"),
            new Period("interval1", "Interval", "break"),
            new Period("p3", "Period 3", "class"),
            new Period("p4", "Period 4", "class"),
            new Period("lunch", "Lunch Break", "break"),
            new Period("p5", "Period 5", "class"),
            new Period("p6", "Period 6", "class"),
            new Period("interval2", "Interval", "break"),
            new Period("p7", "Period 7", "class"));

    public Map<String, Object> generateTimetable(Map<String, Map<String, List<Subject>>> allDeptsSubjects) {
        return internalGenerate(allDeptsSubjects, false);
    }

    public Map<String, Object> generateStrictTimetable(Map<String, Map<String, List<Subject>>> allDeptsSubjects) {
        return internalGenerate(allDeptsSubjects, true);
    }

    private Map<String, Object> internalGenerate(Map<String, Map<String, List<Subject>>> allDeptsSubjects, boolean isStrict) {
        // Master Grid: Dept -> Year -> Section -> Day -> PeriodID -> Cell
        Map<String, Map<String, Map<String, Map<String, Map<String, Map<String, Object>>>>>> grid = new HashMap<>();

        // 1. Initial Logic: Setup Grid Structure
        for (String dept : allDeptsSubjects.keySet()) {
            grid.put(dept, new HashMap<>());
            for (String yearKey : allDeptsSubjects.get(dept).keySet()) {
                grid.get(dept).put(yearKey, new HashMap<>());
                // Dynamic sections based on input configuration
                List<String> sections = getSectionsForYear(allDeptsSubjects.get(dept).get(yearKey));
                for (String sec : sections) {
                    grid.get(dept).get(yearKey).put(sec, new HashMap<>());
                    for (String day : WEEK_DAYS) {
                        grid.get(dept).get(yearKey).get(sec).put(day, new HashMap<>());
                        // Pre-fill breaks
                        for (Period p : PERIODS) {
                            if ("Saturday".equals(day) && (p.id.equals("interval2") || p.id.equals("p7"))) {
                                continue;
                            }
                            if (p.type.equals("break")) {
                                Map<String, Object> cell = new HashMap<>();
                                cell.put("type", "break");
                                cell.put("subject", p.name);
                                grid.get(dept).get(yearKey).get(sec).get(day).put(p.id, cell);
                            }
                        }
                    }
                }
            }
        }

        // 2. Pre-calculate Feasibility and Prepare Task List
        Map<String, Integer> teacherLoad = new HashMap<>();
        Map<String, Integer> subjectRequired = new HashMap<>(); // Key: dept_year_sec_subject
        List<Task> tasks = new ArrayList<>();
        int totalRequiredHours = 0;

        for (String dept : allDeptsSubjects.keySet()) {
            Map<String, List<Subject>> deptYears = allDeptsSubjects.get(dept);
            for (String yearKey : deptYears.keySet()) {
                List<String> sections = getSectionsForYear(deptYears.get(yearKey));
                for (String sec : sections) {
                    for (Subject sub : deptYears.get(yearKey)) {
                        int hours = (sub.getCredits() != null && sub.getCredits() > 0) ? (int) Math.ceil(sub.getCredits()) : 0;
                        if (hours <= 0)
                            continue;

                        totalRequiredHours += hours;
                        String subKey = dept + "_" + yearKey + "_" + sec + "_" + sub.getName();
                        subjectRequired.put(subKey, hours);

                        // Update teacher load for heuristics
                        // Resolve teacher for section A/B
                        String teacher = sub.getTeacher();
                        String tCode = sub.getTeacherCode();
                        if ("B".equals(sec) && sub.getTeacherB() != null && !sub.getTeacherB().trim().isEmpty()) {
                            teacher = sub.getTeacherB();
                            tCode = sub.getTeacherCodeB();
                        }

                        // Trim names/codes to prevent mismatch
                        if (teacher != null) teacher = teacher.trim();
                        if (tCode != null) tCode = tCode.trim();

                        // FLATTEN into ATOMIC TASKS
                        int remaining = hours;
                        boolean isLab = "Lab".equalsIgnoreCase(sub.getType())
                                || "Theory and Lab".equalsIgnoreCase(sub.getType());

                        if (isLab) {
                            // Try to keep labs as 3-hour blocks if possible
                            while (remaining >= 3) {
                                tasks.add(new Task(sub, dept, yearKey, sec, "Lab", 3, sub.getType()));
                                remaining -= 3;
                            }
                            while (remaining >= 2) {
                                tasks.add(new Task(sub, dept, yearKey, sec, "Lab", 2, sub.getType()));
                                remaining -= 2;
                            }
                        }
                        // Remaining hours as 1-hour tasks
                        while (remaining > 0) {
                            tasks.add(new Task(sub, dept, yearKey, sec, isLab ? "Lab" : "Theory", 1, sub.getType()));
                            remaining -= 1;
                        }
                    }
                }
            }
        }

        // --- Global Feasibility Check ---
        int classPeriodsPerDay = (int) PERIODS.stream().filter(p -> "class".equals(p.type)).count();
        int saturdayClassPeriods = classPeriodsPerDay - 1;

        int sectionCount = 0;
        for (String dept : grid.keySet()) {
            for (String yearKey : grid.get(dept).keySet()) {
                sectionCount += grid.get(dept).get(yearKey).size();
            }
        }
        int totalSectionSlots = sectionCount * ((WEEK_DAYS.size() - 1) * classPeriodsPerDay + saturdayClassPeriods);

        if (totalRequiredHours > totalSectionSlots) {
            return returnFeasibilityError("GLOBAL SLOT OVERLOAD",
                    "Required slots: " + totalRequiredHours + ", Available: " + totalSectionSlots);
        }

        // 3. Sort tasks (for fallback greedy)
        // SHUFFLE FIRST to ensure different depts get a chance at being first in each priority level
        Collections.shuffle(tasks);
        tasks.sort((a, b) -> {
            if (b.hours != a.hours)
                return Integer.compare(b.hours, a.hours);
            return 0;
        });

        // --- NEW: GEMINI GENERATION BLOCK ---
        String geminiPrompt = constructGeminiPrompt(allDeptsSubjects, tasks);
        if (isStrict) {
            geminiPrompt += "\nSTRICT MODE: Ensure 100% adherence to teacher availability. No overlaps allowed. Prioritize conflict-free teacher assignments.";
        }
        String geminiResponse = geminiService.generateTimetableJson(geminiPrompt);

        if (geminiResponse != null && !geminiResponse.isEmpty()) {
            try {
                Map<String, Map<String, Map<String, Map<String, Map<String, Map<String, Object>>>>>> geminiGrid = 
                    objectMapper.readValue(geminiResponse, new TypeReference<Map<String, Map<String, Map<String, Map<String, Map<String, Map<String, Object>>>>>>>() {});
                
                // Post-process to ensure breaks are preserved and structure is valid
                validateAndMergeGeminiGrid(grid, geminiGrid);

                Map<String, Object> result = new HashMap<>();
                result.put("success", true);
                result.put("grid", grid);
                result.put("unassigned", new ArrayList<>()); // Gemini is expected to handle all
                result.put("debug", Arrays.asList("Generated via Gemini AI" + (isStrict ? " (Strict Mode)" : "")));
                return result;
            } catch (Exception e) {
                System.err.println("Gemini JSON Parsing failed: " + e.getMessage());
            }
        }
        // --- END GEMINI BLOCK ---

        // 4. Fallback to Monte Carlo Greedy Simulation Layer
        long deadline = System.currentTimeMillis() + (isStrict ? 10000 : 4000); // 10s for strict mode, 4s for normal
        int minUnassigned = Integer.MAX_VALUE;
        Map<String, Map<String, Map<String, Map<String, Map<String, Map<String, Object>>>>>> bestGrid = null;
        Map<String, Integer> bestSubjectAssigned = null;
        int[] bestConflictStats = new int[2];
        List<String> debugLog = new ArrayList<>();
        int iterations = 0;

        while (minUnassigned > 0 && System.currentTimeMillis() < deadline) {
            iterations++;
            Map<String, Map<String, Map<String, Map<String, Map<String, Map<String, Object>>>>>> currentGrid = new HashMap<>();

            for (String dept : allDeptsSubjects.keySet()) {
                currentGrid.put(dept, new HashMap<>());
                for (String yearKey : allDeptsSubjects.get(dept).keySet()) {
                    currentGrid.get(dept).put(yearKey, new HashMap<>());
                    List<String> sections = getSectionsForYear(allDeptsSubjects.get(dept).get(yearKey));
                    for (String sec : sections) {
                        currentGrid.get(dept).get(yearKey).put(sec, new HashMap<>());
                        for (String day : WEEK_DAYS) {
                            currentGrid.get(dept).get(yearKey).get(sec).put(day, new HashMap<>());
                            for (Period p : PERIODS) {
                                if ("Saturday".equals(day) && (p.id.equals("interval2") || p.id.equals("p7"))) {
                                    continue;
                                }
                                if (p.type.equals("break")) {
                                    Map<String, Object> cell = new HashMap<>();
                                    cell.put("type", "break");
                                    cell.put("subject", p.name);
                                    currentGrid.get(dept).get(yearKey).get(sec).get(day).put(p.id, cell);
                                }
                            }
                        }
                    }
                }
            }

            Map<String, Integer> currentSubjectAssigned = new HashMap<>();
            int[] currentConflictStats = new int[2];
            Map<String, Set<String>> currentTeacherBusyMap = new HashMap<>();

            List<String> masterShuffledDays = new ArrayList<>(WEEK_DAYS);
            Collections.shuffle(masterShuffledDays);

            List<Integer> masterShuffledStartIndices = new ArrayList<>();
            for (int i = 0; i < PERIODS.size() - 1; i++)
                masterShuffledStartIndices.add(i);
            Collections.shuffle(masterShuffledStartIndices);

            List<Period> masterShuffledPeriods = new ArrayList<>(PERIODS);
            Collections.shuffle(masterShuffledPeriods);

            greedyGenerate(tasks, currentGrid, currentSubjectAssigned, subjectRequired, debugLog, currentConflictStats,
                    currentTeacherBusyMap, masterShuffledDays, masterShuffledStartIndices, masterShuffledPeriods,
                    deadline);

            List<Map<String, Object>> unassignedList = calculateUnassigned(tasks, currentSubjectAssigned);
            int unassignedCount = unassignedList.stream().mapToInt(m -> (int) m.get("remaining")).sum();

            if (unassignedCount < minUnassigned) {
                minUnassigned = unassignedCount;
                bestGrid = currentGrid;
                bestSubjectAssigned = currentSubjectAssigned;
                bestConflictStats = currentConflictStats;

                if (minUnassigned == 0) {
                    break;
                }
            }
        }

        debugLog.add("Monte Carlo Restarts Completed: " + iterations);
        boolean success = (minUnassigned == 0);

        Map<String, Object> finalResult = new HashMap<>();
        finalResult.put("success", success);
        finalResult.put("grid", bestGrid);
        finalResult.put("unassigned", calculateUnassigned(tasks, bestSubjectAssigned));
        finalResult.put("debug", debugLog.size() > 500 ? debugLog.subList(0, 500) : debugLog);
        finalResult.put("teacherConflicts", bestConflictStats[0]);
        finalResult.put("slotConflicts", bestConflictStats[1]);

        if (!success) {
            finalResult.put("error",
                    "Optimized partial schedule generated. Could not fulfill 100% due to constrained resources.");
        }

        return finalResult;
    }

    private void greedyGenerate(List<Task> tasks,
            Map<String, Map<String, Map<String, Map<String, Map<String, Map<String, Object>>>>>> grid,
            Map<String, Integer> subjectAssigned, Map<String, Integer> subjectRequired,
            List<String> debugLog, int[] conflictStats, Map<String, Set<String>> teacherBusyMap,
            List<String> shuffledDays, List<Integer> startIndices, List<Period> shuffledPeriods, long deadline) {

        for (Task task : tasks) {
            if (System.currentTimeMillis() > deadline) {
                debugLog.add("CRITICAL: Generation timed out.");
                break;
            }

            String subKey = task.dept + "_" + task.year + "_" + task.section + "_" + task.subject;
            int assigned = subjectAssigned.getOrDefault(subKey, 0);
            int required = subjectRequired.getOrDefault(subKey, 0);

            if (assigned + task.hours > required) {
                continue;
            }

            boolean placed = false;
            for (String day : shuffledDays) {
                if (placed)
                    break;

                if (task.saturdayOnly && !"Saturday".equals(day)) {
                    continue;
                }

                int currentDailyCount = getDailyCount(grid.get(task.dept).get(task.year).get(task.section).get(day),
                        task.subject);
                
                // Constraint: Max 2 hours per day for Theory, but allow 3 for Labs
                int maxDaily = "Lab".equalsIgnoreCase(task.originalType) ? 3 : 2;
                if (currentDailyCount + task.hours > maxDaily)
                    continue;

                if (task.hours >= 2) {
                    for (int i : startIndices) {
                        List<Period> block = getValidClassBlock(day, i, task.hours);
                        if (block == null)
                            continue;

                        boolean possible = true;
                        for (Period p : block) {
                            if (isStaffBusyOptimized(teacherBusyMap, day, Arrays.asList(p), task.teacher,
                                    task.teacherCode)
                                    || !isSlotFree(grid, day, p.id, task)) {
                                possible = false;
                                if (isStaffBusyOptimized(teacherBusyMap, day, Arrays.asList(p), task.teacher,
                                        task.teacherCode))
                                    conflictStats[0]++;
                                else
                                    conflictStats[1]++;
                                break;
                            }
                        }

                        if (possible) {
                            for (Period p : block) {
                                grid.get(task.dept).get(task.year).get(task.section).get(day).put(p.id,
                                        createCell(task, "greedy"));
                                markTeacherBusy(teacherBusyMap, day, p.id, task.teacher, task.teacherCode);
                            }
                            subjectAssigned.put(subKey, assigned + task.hours);
                            placed = true;
                            break;
                        }
                    }
                } else {
                    for (Period p : shuffledPeriods) {
                        if ("Saturday".equals(day) && (p.id.equals("interval2") || p.id.equals("p7"))) {
                            continue;
                        }
                        if (!"class".equals(p.type))
                            continue;

                        if (!isStaffBusyOptimized(teacherBusyMap, day, Arrays.asList(p), task.teacher, task.teacherCode)
                                && isSlotFree(grid, day, p.id, task)) {
                            grid.get(task.dept).get(task.year).get(task.section).get(day).put(p.id,
                                    createCell(task, "greedy"));
                            markTeacherBusy(teacherBusyMap, day, p.id, task.teacher, task.teacherCode);
                            subjectAssigned.put(subKey, assigned + 1);
                            placed = true;
                            break;
                        } else {
                            if (isStaffBusyOptimized(teacherBusyMap, day, Arrays.asList(p), task.teacher,
                                    task.teacherCode))
                                conflictStats[0]++;
                            else
                                conflictStats[1]++;
                        }
                    }
                }
            }
        }
    }

    private int getDailyCount(Map<String, Map<String, Object>> daySchedule, String subjectName) {
        if (subjectName == null)
            return 0;
        int count = 0;
        for (Map<String, Object> cell : daySchedule.values()) {
            if (cell != null && subjectName.equals(cell.get("subject"))) {
                count++;
            }
        }
        return count;
    }


    private List<Map<String, Object>> calculateUnassigned(List<Task> tasks, Map<String, Integer> subjectAssigned) {
        List<Map<String, Object>> unassigned = new ArrayList<>();
        Map<String, Integer> requiredTotals = new HashMap<>();
        for (Task t : tasks) {
            String key = t.dept + "_" + t.year + "_" + t.section + "_" + t.subject;
            requiredTotals.put(key, requiredTotals.getOrDefault(key, 0) + t.hours);
        }

        Set<String> processed = new HashSet<>();
        for (Task t : tasks) {
            String subKey = t.dept + "_" + t.year + "_" + t.section + "_" + t.subject;
            if (processed.contains(subKey))
                continue;

            int assigned = subjectAssigned.getOrDefault(subKey, 0);
            int required = requiredTotals.getOrDefault(subKey, 0);

            if (assigned < required) {
                Map<String, Object> map = new HashMap<>();
                map.put("subject", t.subject);
                map.put("dept", t.dept);
                map.put("year", t.year);
                map.put("section", t.section);
                map.put("remaining", required - assigned);
                unassigned.add(map);
            }
            processed.add(subKey);
        }
        return unassigned;
    }

    private Map<String, Object> returnFeasibilityError(String errorType, String message) {
        Map<String, Object> errorResult = new HashMap<>();
        errorResult.put("success", false);
        errorResult.put("grid", new HashMap<>()); // Return empty grid on feasibility failure
        errorResult.put("unassigned", new ArrayList<>());
        errorResult.put("error", errorType + ": " + message);
        return errorResult;
    }


    private List<Period> getValidClassBlock(String day, int startIndex, int size) {
        List<Period> block = new ArrayList<>();
        int i = startIndex;
        while (block.size() < size && i < PERIODS.size()) {
            Period p = PERIODS.get(i);
            if ("Saturday".equals(day) && (p.id.equals("interval2") || p.id.equals("p7"))) {
                break;
            }
            if ("class".equals(p.type)) {
                block.add(p);
            }
            i++;
        }
        return block.size() == size ? block : null;
    }

    private boolean isSlotFree(
            Map<String, Map<String, Map<String, Map<String, Map<String, Map<String, Object>>>>>> grid, String day,
            String periodId, Task task) {
        Map<String, Object> cell = grid.get(task.dept).get(task.year).get(task.section).get(day).get(periodId);
        return (cell == null || cell.get("subject") == null);
    }

    private static class Task {
        String subject, shortName, code, teacher, teacherCode, dept, section, originalType, year;
        int hours;
        boolean saturdayOnly;

        Task(Subject sub, String dept, String year, String section, String type, int hours, String originalType) {
            this.subject = sub.getName() != null ? sub.getName().trim() : null;
            this.shortName = sub.getShortName() != null ? sub.getShortName().trim() : null;
            this.code = sub.getCode() != null ? sub.getCode().trim() : null;
            this.saturdayOnly = Boolean.TRUE.equals(sub.getSaturdayOnly());
            
            // Resolve teacher based on section: Use Teacher B only if it's Section B and Teacher B is provided
            if ("B".equals(section) && sub.getTeacherB() != null && !sub.getTeacherB().trim().isEmpty()) {
                this.teacher = sub.getTeacherB().trim();
                this.teacherCode = sub.getTeacherCodeB() != null ? sub.getTeacherCodeB().trim() : null;
            } else {
                this.teacher = sub.getTeacher() != null ? sub.getTeacher().trim() : null;
                this.teacherCode = sub.getTeacherCode() != null ? sub.getTeacherCode().trim() : null;
            }
            
            this.dept = dept;
            this.year = year;
            this.section = section;
            this.hours = hours;
            this.originalType = originalType;
        }
    }

    private Map<String, Object> createCell(Task task, String assignType) {
        Map<String, Object> cell = new HashMap<>();
        cell.put("type", "class");
        cell.put("subject", task.subject);
        cell.put("shortName", task.shortName);
        cell.put("code", task.code);
        cell.put("teacher", task.teacher);
        cell.put("teacherCode", task.teacherCode);
        cell.put("subjectType", task.originalType);
        cell.put("assignType", assignType);
        return cell;
    }

    private String constructGeminiPrompt(Map<String, Map<String, List<Subject>>> allDeptsSubjects, List<Task> tasks) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are a Timetable Scheduling Expert AI.\n");
        sb.append("TASK: Generate a 100% conflict-free university timetable for the following departments and subjects.\n\n");
        
        sb.append("GLOBAL CONSTRAINT (CRITICAL):\n");
        sb.append("A teacher MUST NOT be assigned to more than one class at the same time across the entire organization.\n");
        sb.append("If Teacher 'X' is assigned to 'Monday' Period 'p1' in 'Dept A', they CANNOT be assigned to 'Monday' Period 'p1' in 'Dept B' or any other section.\n\n");
        
        sb.append("DAILY CONSTRAINTS:\n");
        sb.append("- Working Days: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday\n");
        sb.append("- Periods: p1, p2, p3, p4, p5, p6, p7 (Total 7 class periods). NOTE: Saturday only has periods p1 through p6 (6 class periods total).\n");
        sb.append("- Any subject should not appear more than 2 times per day per section.\n");
        sb.append("- If a subject has 'SatOnly: true', you MUST ONLY schedule it on 'Saturday'.\n\n");
        sb.append("- DO NOT assume any default hours/credits. Use ONLY the 'TOTAL HOURS' provided below.\n");
        sb.append("- Fill the grid such that the total slots for each subject matches its 'TOTAL HOURS'.\n\n");

        sb.append("INPUT DATA (Subjects to assign):\n");
        sb.append("INPUT DATA (Subjects to assign clearly with Total Credits):\n");
        // Aggregate tasks by subKey for clearer AI instruction
        Map<String, Integer> aggregatedHours = new LinkedHashMap<>();
        Map<String, String> subDetails = new HashMap<>(); // subKey -> Details String

        for (Task t : tasks) {
            String subKey = t.dept + "_" + t.year + "_" + t.section + "_" + t.subject;
            aggregatedHours.put(subKey, aggregatedHours.getOrDefault(subKey, 0) + t.hours);
            subDetails.put(subKey, String.format("Dept: %s, Year: %s, Sec: %s, Sub: %s, Code: %s, Assigned Faculty: %s (%s), Type: %s, SatOnly: %s", 
                t.dept, t.year, t.section, t.subject, t.code, t.teacher, t.teacherCode, t.originalType, t.saturdayOnly));
        }

        for (String subKey : aggregatedHours.keySet()) {
            sb.append(String.format("- %s, TOTAL HOURS TO SCHEDULE: %d\n", 
                subDetails.get(subKey), aggregatedHours.get(subKey)));
        }

        sb.append("\nOUTPUT FORMAT:\n");
        sb.append("Return ONLY a valid JSON object with this exact structure (nesting: Dept -> Year -> Section -> Day -> PeriodID -> Cell):\n");
        sb.append("{\n  \"DeptName\": {\n    \"YearName\": {\n      \"SectionName\": {\n        \"Monday\": {\n          \"p1\": { \"type\": \"class\", \"subject\": \"SubName\", \"code\": \"SubCode\", \"teacher\": \"TeacherName\", \"teacherCode\": \"TCode\", \"subjectType\": \"Type\" },\n          ...\n        }\n      }\n    }\n  }\n}\n");
        sb.append("Do not include breaks (Interval, Lunch) in your response. Only place 'class' type cells in p1-p7 slots where needed to fulfill hours.\n");
        
        return sb.toString();
    }

    private void validateAndMergeGeminiGrid(
            Map<String, Map<String, Map<String, Map<String, Map<String, Map<String, Object>>>>>> target,
            Map<String, Map<String, Map<String, Map<String, Map<String, Map<String, Object>>>>>> source) {
        
        for (String dept : source.keySet()) {
            if (!target.containsKey(dept)) continue;
            for (String year : source.get(dept).keySet()) {
                if (!target.get(dept).containsKey(year)) continue;
                for (String sec : source.get(dept).get(year).keySet()) {
                    if (!target.get(dept).get(year).containsKey(sec)) continue;
                    for (String day : source.get(dept).get(year).get(sec).keySet()) {
                        if (!target.get(dept).get(year).get(sec).containsKey(day)) continue;
                        
                        Map<String, Map<String, Object>> dayData = source.get(dept).get(year).get(sec).get(day);
                        for (String periodId : dayData.keySet()) {
                            if (periodId.startsWith("p")) { // Only accept p1-p7
                                Map<String, Object> cell = dayData.get(periodId);
                                cell.put("assignType", "gemini");
                                target.get(dept).get(year).get(sec).get(day).put(periodId, cell);
                            }
                        }
                    }
                }
            }
        }
    }

    private boolean isStaffBusyOptimized(Map<String, Set<String>> teacherBusyMap, String day, List<Period> periods,
            String teacher, String teacherCode) {
        if (teacher == null || teacher.trim().isEmpty() || "TBD".equals(teacher))
            return false;

        for (Period p : periods) {
            String key = day + "_" + p.id;
            Set<String> busyTeachers = teacherBusyMap.get(key);
            if (busyTeachers != null) {
                // Check both name and code (case-insensitive via lowerCase storage)
                if (busyTeachers.contains(teacher.toLowerCase()) ||
                        (teacherCode != null && !teacherCode.isEmpty()
                                && busyTeachers.contains(teacherCode.toLowerCase()))) {
                    return true;
                }
            }
        }
        return false;
    }

    private void markTeacherBusy(Map<String, Set<String>> teacherBusyMap, String day, String periodId, String teacher,
            String teacherCode) {
        if (teacher == null || teacher.trim().isEmpty() || "TBD".equals(teacher))
            return;
        String key = day + "_" + periodId;
        String t = teacher.trim().toLowerCase();
        teacherBusyMap.computeIfAbsent(key, k -> new HashSet<>()).add(t);
        if (teacherCode != null && !teacherCode.trim().isEmpty()) {
            teacherBusyMap.get(key).add(teacherCode.trim().toLowerCase());
        }
    }

    private List<String> getSectionsForYear(List<Subject> subjects) {
        if (subjects == null || subjects.isEmpty()) {
            return Collections.singletonList("A");
        }
        // Check if any subject has teacherB OR if there's a specific flag set on any subject row
        boolean needsB = subjects.stream().anyMatch(s -> Boolean.TRUE.equals(s.getNeedsSectionB()));
        return needsB ? Arrays.asList("A", "B") : Collections.singletonList("A");
    }

}