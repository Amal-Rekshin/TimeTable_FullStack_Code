# 🗓️ AI Timetable Cloud: The Master Project Documentation

This document serves as the comprehensive single-source-of-truth for the **AI-Powered University Timetable System**. It covers everything from business logic and technical architecture to API references and database schemas.

---

## 1. Project Vision & Objective
**AI Timetable Cloud** is a full-stack enterprise solution designed to solve the "Scheduling Conflict Problem" in large academic institutions. 

### The Problem:
- Manual scheduling leads to staff being double-booked across different departments.
- Ensuring credit compliance (hours per week) for every subject is tedious.
- Managing room availability and departmental constraints is prone to human error.

### The Solution:
By combining **Generative AI (Google Gemini)** with a **High-Performance Spring Boot backend**, the system generates 100% valid, conflict-free timetables in seconds, while providing a premium, interactive management dashboard for administrators.

---

## 2. Technology Stack

### Frontend (User Interface)
- **Framework:** React 19 (Vite 7)
- **Styling:** Vanilla CSS + Tailwind CSS (Glassmorphic Design)
- **State Management:** Functional Hooks (`useState`, `useEffect`, `useRef`)
- **API Client:** Axios (Centralized interceptors for backend communication)
- **Export Engine:** `jsPDF`, `html2canvas`, `xlsx`
- **Notifications:** `notistack` (Real-time snackbars)

### Backend (Business Logic & Persistence)
- **Framework:** Spring Boot 4.0.5 (Java 17+)
- **Intelligence:** Google Gemini API (Generative AI Integration)
- **Database:** MySQL 8.0
- **ORM:** Hibernate / Spring Data JPA
- **Security:** Custom Role-Based Access Control (Admin, HOD, Staff)
- **JSON Engine:** Jackson 3.1 (Advanced Serialization)

---

## 3. Core Architectural Modules

### 🧠 The Intelligence Engine (AI & Logic)
The system uses a tiered approach to generation:
1.  **Strict AI Path (Gemini):** Leverages LLM reasoning to map teachers and subjects based on global constraints.
2.  **Monte Carlo Fallback:** A high-speed local algorithm that runs thousands of iterations per second to fill credit gaps if the AI is unreachable or hits a constraint limit.
3.  **Global Conflict Checker:** A utility that verifies teacher availability across the *entire* institution, not just the local department.

### 🗄️ Advanced Archiving System
- **JSON Snapshots:** Stores the entire state of a 5-day grid (with years/sections) as a `LONGTEXT` JSON object.
- **Interactive Previews:** Administrators can search and "Live Preview" any historical timetable without affecting the current active session.
- **Versioning:** Automated version stamps (e.g., `V20240504_1200`) for historical tracking.

### 🛡️ Security & Role Mutex
- **Admin:** Full access to all data, user approvals, and global institutional settings.
- **HOD (Head of Dept):** Can manage subjects and generate timetables for their specific department.
- **Staff:** View-only access to their personal schedules.
- **Approval System:** New users are locked in a "Pending" state until an Admin grants them institutional access.

---

## 4. API Reference (Core Endpoints)

| Category | Endpoint | Method | Description |
| :--- | :--- | :--- | :--- |
| **Timetable** | `/api/timetable/generate` | `POST` | Triggers AI-driven generation. |
| **Timetable** | `/api/timetable/archive` | `POST` | Saves the current grid to permanent storage. |
| **Timetable** | `/api/timetable/archive` | `GET` | Retrieves all historical versions. |
| **Institutional** | `/api/departments` | `ALL` | CRUD operations for university departments. |
| **Institutional** | `/api/staff` | `ALL` | Full management of teacher profiles and codes. |
| **Institutional** | `/api/subjects` | `ALL` | Credit mapping and curriculum management. |
| **User** | `/api/users/login` | `POST` | Authentication and role-info retrieval. |
| **User** | `/api/users/signup` | `POST` | Registration (defaults to Pending status). |

---

## 5. Database Schema (Key Entities)

- **User:** Stores credentials, roles, and `isApproved` status.
- **Department:** Name, HOD details, and departmental ID.
- **Staff:** Name, Staff Code (Unique ID), Department, and Contact Info.
- **Subject:** Name, Credit Hours (Weekly), Department, and assigned Staff.
- **Room:** Physical classroom capacity and ID.
- **ArchivedTimetable:** Stores the grid JSON, version string, and department ownership.
- **SystemConfig:** Global settings (University Name, Logo URL, Working Days).

---

## 6. Frontend Component Map

- `Dashboard.jsx`: The main hub for all scheduling activities.
- `Timetable.jsx`: The interactive 5x8 grid component for viewing/editing schedules.
- `ArchiveDashboard.jsx`: The "Time Machine" for viewing historical records.
- `GlobalSummary.jsx`: An institutional overview of staff workloads and departmental stats.
- `SubjectsForm.jsx`: The interface for mapping teachers to subject credits.
- `AuthPage.jsx`: Secure login and registration portal.

---

## 7. Operational Workflow
1.  **Setup:** Admin creates Departments, Rooms, and Staff.
2.  **Curriculum:** HODs add Subjects and assign Staff/Credits.
3.  **Generation:** User clicks "Generate Global AI (Strict)".
4.  **Verification:** The system checks for global staff conflicts.
5.  **Finalization:** User reviews the grid and clicks "Archive to Cloud".
6.  **Distribution:** Timetable is exported as PDF for staff and students.

---

## 8. Setup & Installation

### Backend:
1. Update `application.properties` with your MySQL credentials.
2. Add your `GEMINI_API_KEY` to the `.env` or system environment.
3. Run `mvn spring-boot:run`.

### Frontend:
1. Navigate to `TimeTable-Frontend`.
2. Run `npm install`.
3. Run `npm run dev`.

---

> [!IMPORTANT]
> This project is currently maintained by **Antigravity**. All modifications should adhere to the established "Glassmorphic" design system and the strict global conflict checking logic.
