# 🗓️ AI Timetable Cloud: Project Specification & Documentation

## 1. Project Overview
**AI Timetable Cloud** is an advanced university management system designed to automate the complex task of scheduling. By integrating Generative AI (Google Gemini), the system eliminates manual data entry errors and solves the "Global Conflict" problem, ensuring that teachers are never double-booked across different departments or sessions.

---

## 2. Core Functionalities
The system provides a full-suite management interface for university administrators:
*   **Automated Scheduling:** Leverages AI to generate valid, credit-complete timetables in seconds.
*   **Organizational Management:** CRUD operations for Departments, Staff members, and Physical Classrooms.
*   **Subject Curriculum Mapping:** Defines credits and weekly hour requirements for every subject in the organization.
*   **Historical Archiving:** A robust version-control system for timetables, allowing administrators to save and preview past schedules.
*   **Security & RBAC:** Tiered access control for different user roles (Admin, HOD, Staff).
*   **Document Generation:** High-fidelity export system for administrative record-keeping.

---

## 3. Technology Stack

### Frontend (User Interface)
*   **React 19:** Functional components with modern hooks (`useState`, `useEffect`, `useRef`).
*   **Vite 7:** High-performance build tool and dev server.
*   **Axios:** Centralized API client for all backend communication.
*   **Tailwind CSS & Vanilla CSS:** Combined for a premium, responsive, glassmorphic UI.
*   **Notistack:** Real-time snackbar notifications for system events.
*   **Library Integrations:** `jsPDF`, `html2canvas` (PDF Export), `xlsx` (Excel Export).

### Backend (Logic & Intelligence)
*   **Spring Boot 4.0.5:** Enterprise-grade Java framework for the REST API.
*   **Java 17 Development Kit:** Utilizing modern language features.
*   **Google Gemini API:** The "brain" of the scheduling engine, providing reasoning for conflict resolution.
*   **Spring Data JPA / Hibernate:** Manages database transactions and object-relational mapping.
*   **MySQL:** Reliable storage for all institutional and scheduling data.

---

## 4. API Communication (Frontend ↔ Backend)
The frontend communicates with the backend via the following RESTful endpoints:

### Timetable Logic
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/timetable/generate` | Triggers the AI/Monte Carlo generation engine. |
| `POST` | `/api/timetable/archive` | Saves a finalized grid to the permanent archive. |
| `GET` | `/api/timetable/archive` | Retrieves all historical archives. |
| `GET` | `/api/timetable/archive/{dept}` | Filters archives by department name. |
| `DELETE` | `/api/timetable/archive/{id}` | Permanently deletes an archived session. |

### Institutional Management
| Entity | Endpoints | Supported Operations |
| :--- | :--- | :--- |
| **Departments** | `/api/departments` | `GET`, `POST`, `PUT`, `DELETE` |
| **Staff** | `/api/staff` | `GET`, `POST`, `PUT`, `DELETE` |
| **Rooms** | `/api/rooms` | `GET`, `POST`, `PUT`, `DELETE` |
| **Subjects** | `/api/subjects` | `GET`, `POST`, `PUT`, `DELETE` |

### User & Security
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/users/signup` | Registers a new user with 'Pending' status. |
| `POST` | `/api/users/login` | Authenticates existing users and returns role info. |
| `GET` | `/api/users` | Lists all users (Admin only). |
| `PUT` | `/api/users/{id}/role` | Updates user permissions (Admin only). |

---

## 5. Complete Feature List

### 🧠 Intelligent Generation
*   **Gemini AI Solver:** Uses LLM reasoning to distribute teachers across days and periods based on global constraints.
*   **Infinite-Loop Strategy:** A fall-back Monte Carlo simulation that retries generation thousands of times until 0 credits remain unassigned.
*   **Real-time Progress Tracker:** Visual "Attempt Counter" that allows users to see the AI working in the background.

### 📁 Advanced Archive Dashboard
*   **Universal Search:** Find historical sessions by department or version ID.
*   **Live Preview:** View multi-year/multi-section grids and export them without needing to re-activate the session.
*   **JSON-based Persistence:** Efficiently stores complex grid states as structured `LONGTEXT` objects.

### 📊 Administrative Tools
*   **Excel/CSV Exports:** Direct export of grids to spreadsheet formats for data analysis.
*   **Professional PDF Export:** Auto-formatted timetable sheets with institutional branding.
*   **Staff Profiles:** Detailed staff management including teacher codes for unique identification.

### 🛡️ Security
*   **Role Mutex:** Features are conditionally rendered based on `isAdmin`, `isHod`, or `isStaff` status.
*   **Approval System:** Prevents unverified users from accessing institutional data until approved by an Admin.
*   **Visual Feedback:** Dedicated "Access Pending" screens and secure sign-out flows.
