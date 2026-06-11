# 🗓️ AI Timetable Cloud - Technical Overview

This document provides a detailed breakdown of the technologies used and the core features implemented in the AI-Powered University Timetable System.

## 🚀 Backend Technologies
The backend is a high-performance **Spring Boot** application designed for complex scheduling logic and secure data persistence.

*   **Core Framework:** Spring Boot 4.0.5 (Java 17+)
*   **AI Integration:** **Gemini API (Google AI)** – Leveraged for reasoning-based, conflict-free scheduling.
*   **Database:** **MySQL** – Used for relational storage of departments, staff, and archived sessions.
*   **ORM:** **Hibernate / Spring Data JPA** – For robust data mapping and persistence.
*   **JSON Handling:** **Jackson (tools.jackson)** – Custom-configured for advanced Java 25 / Jackson 3.1 ecosystems.
*   **Build Tool:** **Maven**
*   **Security:** Role-based access logic implemented for Admin, HOD, and Staff levels.

---

## 🎨 Frontend Technologies
The frontend is a modern, responsive **React** application built with a focus on premium aesthetics and real-time user feedback.

*   **Core Framework:** **React 19** with **Vite 7** (for lightning-fast development).
*   **Styling:** **Vanilla CSS** with **Tailwind CSS** support for utility-first design and modern responsiveness.
*   **API Client:** **Axios** – Used for all communication with the Spring Boot backend.
*   **Notifications:** **Notistack** – Provides real-time feedback for generation and archive status.
*   **Exports:** 
    *   **jsPDF & html2canvas:** For generating high-fidelity PDF exports.
    *   **xlsx / CSV:** For exporting timetable data to spreadsheet formats.
*   **Authentication:** Integrated Firebase/Multi-provider auth flow support.

---

## ✨ Core Features

### 1. 🧠 AI-Driven Scheduling
*   **Gemini AI Generation:** Uses Generative AI to solve complex teacher mapping problems that traditional algorithms often struggle with.
*   **Global Conflict-Free Mapping:** Enforces strict constraints ensuring a teacher is never assigned to multiple classes simultaneously across the entire organization.
*   **Monte Carlo Fallback:** Includes a robust local fallback algorithm that continues to iterate until a 100% credit-full schedule is achieved if the AI is unavailable.

### 2. 🗄️ Advanced Archiving System
*   **Full Session Component Storage:** Saves entire departmental grids as structured JSON in a `LONGTEXT` MySQL backend for historical reference.
*   **Versioning:** Automatic versioning system (e.g., `V20240414_2042`) for tracking curriculum changes over time.
*   **Version Previews:** Interactive preview dashboard allowing users to view years/sections of archived timetables without restoring them.

### 3. 🛡️ Role-Based Access Control (RBAC)
*   **Hierarchy:** Strict data access rules for **Admin**, **HOD**, and **Staff** roles.
*   **Approval Flow:** A "Pending" state for new users ensures institutional security before data access is granted.

### 4. 📊 Project Dashboard & Analytics
*   **Insights:** High-level overview of total departments, staff strength, and subject distribution.
*   **Dynamic Mapping:** Visual interface for linking staff members to specific subjects.

### 5. 📥 Intelligent Exports
*   **PDF Exports:** Professional-grade PDF generation with layout optimization.
*   **Excel/CSV Support:** Allows academic departments to integrate timetable data with existing management tools.
