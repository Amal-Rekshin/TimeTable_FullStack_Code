// import { autoGenerateTimetable } from './src/utils/autoGenerator.js';

// const sampleData = {
//     CSE: {
//         year1: [
//             { subject: "Maths", code: "MA101", type: "Theory", hours: 4, teacher: "Dr. Anand Kumar", teacherCode: "AK01", dept: "CSE" },
//             { subject: "Physics", code: "PH102", type: "Theory", hours: 3, teacher: "Prof. Meena S", teacherCode: "MS02", dept: "ECE" }
//         ],
//         year2: [
//             { subject: "Data Structures", code: "CS201", type: "Lab", hours: 3, teacher: "Dr. Anand Kumar", teacherCode: "AK01", dept: "CSE" }
//         ]
//     }
// };

// try {
//     console.log("Starting generation test...");
//     const grid = autoGenerateTimetable(sampleData);
//     console.log("Generation successful!");
//     // Check if CSE exist
//     if (grid.CSE && grid.CSE["1"] && grid.CSE["1"]["A"]) {
//         console.log("Grid structure looks correct.");
//     } else {
//         console.error("Grid structure is missing expected keys.");
//         console.log("Keys in grid:", Object.keys(grid));
//         console.log("Keys in grid.CSE:", Object.keys(grid.CSE));
//     }
// } catch (error) {
//     console.error("Generation failed with error:", error);
// }
