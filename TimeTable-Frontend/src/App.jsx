import { useState, useEffect, useRef } from "react";
import Header from "./components/Header";
import SubjectsForm from "./components/SubjectsForm";
import YearTabs from "./components/YearTabs";
import Timetable from "./components/Timetable";
import ProjectOverview from "./components/ProjectOverview";
import Dashboard from "./components/Dashboard";
import DepartmentManager from "./components/DepartmentManager";
import StaffManager from "./components/StaffManager";
import ResourceManager from "./components/ResourceManager";
import SubjectManager from "./components/SubjectManager";
import ArchiveDashboard from "./components/ArchiveDashboard";
import ClassroomDashboard from "./components/ClassroomDashboard";
import StaffScheduleView from "./components/StaffScheduleView";
import GlobalSummary from "./components/GlobalSummary";
import Sidebar from "./components/Sidebar";
import AuthPage from "./components/AuthPage";
import AdminAccess from "./components/AdminAccess";
import { ADMIN_EMAILS } from "./utils/roles";
import { exportTimetablePDF } from "./pdf/exportPDF";
import * as api from "./utils/apiUtils";
import { notify } from "./components/Toast.jsx";

export default function App() {
  // --- ADVANCED STATE SCHEMA ---
  const [departments, setDepartments] = useState([]);
  const [staff, setStaff] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [subjects, setSubjects] = useState({});
  const [subjectsList, setSubjectsList] = useState([]);
  const [timetableGrid, setTimetableGrid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationAttempt, setGenerationAttempt] = useState(0);
  const abortGeneration = useRef(false);
  // Notifications handled by notify utility

  const [activeYear, setActiveYear] = useState(1);
  const [activeSection, setActiveSection] = useState("A");
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedDept, setSelectedDept] = useState("CSE");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [systemSettings, setSystemSettings] = useState({ allowCreditEdit: true });

  // Monitor Auth State and Role
  useEffect(() => {
    // Check for OAuth2 JWT callback from Spring Boot
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    
    if (tokenParam) {
      try {
        // Decode JWT payload (Base64Url encoded)
        const base64Url = tokenParam.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const decodedToken = JSON.parse(jsonPayload);
        
        // Reconstruct user object from claims
        const user = {
            email: decodedToken.sub,
            fullName: decodedToken.fullName,
            role: decodedToken.role
        };

        localStorage.setItem('jwt_token', tokenParam);
        localStorage.setItem('user', JSON.stringify(user));
        
        setCurrentUser(user);
        setUserRole(user.role);
        
        // Remove the query param from URL to clean it up
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (err) {
        console.error("Failed to parse JWT token from OAuth callback", err);
      }
    } else {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setUserRole(user.role);
      }
    }
    setAuthLoading(false);
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('user');
    setCurrentUser(null);
    setUserRole(null);
    window.location.reload();
  };



  function ErrorFallback({ error }) {
    return (
      <div role="alert">
        <p>The Archive Dashboard failed to load:</p>
        <pre>{error.message}</pre>
      </div>
    );
  }

  // Load initial data from Spring Boot API
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [fetchedDepts, fetchedStaff, fetchedRooms, fetchedArchives, fetchedSubjectsList, fetchedConfigs] = await Promise.all([
          api.fetchDepartments(),
          api.fetchStaff(),
          api.fetchRooms(),
          api.fetchArchives(),
          api.fetchSubjects(),
          api.fetchConfigs()
        ]);

        setDepartments(fetchedDepts);
        setStaff(fetchedStaff);
        setRooms(fetchedRooms);
        setSubjectsList(fetchedSubjectsList);

        // Map configs list to object
        const configsObj = {};
        fetchedConfigs.forEach(c => {
          configsObj[c.configKey] = c.configValue === 'true';
        });
        setSystemSettings(prev => ({ ...prev, ...configsObj }));

        if (fetchedDepts.length > 0) {
          setSelectedDept(fetchedDepts[0].name);
        }

        // Note: Timetable grid would ideally be fetched from a specific endpoint or derived
      } catch (error) {
        console.error("CRITICAL: Backend Connection Failed!");
        console.error("Error Message:", error.message);
        if (error.response) {
          console.error("Status:", error.response.status);
          console.error("Data:", error.response.data);
        } else if (error.request) {
          console.error("Request made but no response received. Is the backend running at http://localhost:8080?");
        }
        notify.error(`${error.message}`, { variant: "error" });
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const handleArchive = async () => {
    if (!timetableGrid || !selectedDept) {
      notify.warning("No timetable data to archive!");
      return;
    }
    // Get the whole grid for the selected department (all years and sections)
    const deptGrid = timetableGrid[selectedDept];

    const archiveData = {
      dept: selectedDept,
      grid: JSON.stringify(deptGrid), // Restore stringify
      staffDetails: JSON.stringify(staff.filter(s => s.dept === selectedDept)), // Restore stringify
      version: "V" + new Date().getFullYear() + (new Date().getMonth() + 1).toString().padStart(2, '0'),
      createdAt: new Date().toISOString()
    };
    try {
      const saved = await api.archiveTimetableAPI(archiveData);
      notify.success(`Full ${selectedDept} Timetable archived!`);
    } catch (err) {
      notify.error("Failed to archive timetable.");
    }
  };

  const handleArchiveAll = async () => {
    if (!timetableGrid) return;
    const departmentsToArchive = Object.keys(timetableGrid);
    
    if (!window.confirm(`Are you sure you want to archive timetables for ALL ${departmentsToArchive.length} departments?`)) {
      return;
    }

    let successCount = 0;
    for (const deptName of departmentsToArchive) {
      try {
        const archiveData = {
          dept: deptName,
          grid: JSON.stringify(timetableGrid[deptName]),
          archivedAt: new Date().toISOString()
        };
        await api.archiveTimetableAPI(archiveData);
        successCount++;
      } catch (error) {
        notify.error(`Failed to archive ${deptName}`);
      }
    }
    
    if (successCount > 0) {
      notify.success(`Successfully archived ${successCount} departments!`);
    }
  };

  const handleExportAll = async () => {
    if (!timetableGrid) return;
    notify.info("Generating multi-department PDF report...");
    exportTimetablePDF("timetable-area", `Global_Timetable_${new Date().toLocaleDateString()}.pdf`);
  };

  // Role booleans — mutually exclusive hierarchy
  const isAdmin = currentUser && (
    userRole?.toLowerCase() === 'admin' ||
    ADMIN_EMAILS.includes(currentUser.email)
  );
  const isHod = !isAdmin && userRole?.toLowerCase() === 'hod';
  const isStaff = !isAdmin && !isHod && userRole?.toLowerCase() === 'staff';

  // Shared tabs visible to every logged-in user
  const sharedTabs = [
    { id: 'overview', label: 'Overview', icon: '📖' },
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'depts', label: 'Departments', icon: '🏢' },
    { id: 'staff', label: 'Staff Profile', icon: '👥' },
    { id: 'rooms', label: 'Classrooms', icon: '🏫' },
    { id: 'subjects', label: 'Subjects', icon: '📚' },
    { id: 'archive', label: 'Archive', icon: '📁' },
  ];

  const navItems = [
    // Admin panel — admin only
    ...(isAdmin ? [{ id: 'admin', label: 'Admin Access', icon: '🛡️' }] : []),
    ...sharedTabs,
    // Timetable — admin and HOD only (not staff)
    ...(isAdmin || isHod ? [
        { id: 'manage', label: 'Timetable', icon: '🗓️' },
        { id: 'staff_schedule', label: 'Staff Schedule', icon: '📅' }
    ] : []),
  ];




  // Guard: redirect to overview if user accesses a tab they don't have permission for
  useEffect(() => {
    if (!currentUser) return;
    const allowedIds = new Set(navItems.map(n => n.id));
    if (!allowedIds.has(activeTab)) {
      setActiveTab('overview');
    }
  }, [currentUser, isAdmin, isHod, isStaff, activeTab]);

  if (authLoading || loading) {
    const isGenerating = loadingMessage && loadingMessage.includes("Attempt");
    return (
      <div className={`min-h-screen flex items-center justify-center ${isGenerating ? 'bg-slate-900 border-4 border-blue-500 shadow-[inset_0_0_100px_rgba(59,130,246,0.2)]' : 'bg-slate-50'}`}>
        <div className={`flex flex-col items-center gap-6 p-10 rounded-3xl ${isGenerating ? 'bg-white/10 backdrop-blur-xl border border-white/10 shadow-2xl scale-110 transition-transform duration-1000' : ''}`}>
          {isGenerating ? (
            <div className="relative w-28 h-28 flex items-center justify-center transition-all duration-300">
              <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20"></div>
              <div className="absolute inset-4 bg-indigo-500 rounded-xl animate-spin opacity-30 mix-blend-screen" style={{ animationDuration: '3s' }}></div>
              <div className="relative flex items-end justify-center w-20 h-20 bg-gradient-to-t from-blue-600 to-indigo-500 rounded-xl shadow-[0_0_40px_rgba(79,70,229,0.5)] border-2 border-white/40 overflow-hidden p-3 gap-1.5">
                <div className="w-3 h-full bg-white/90 rounded animate-bounce shadow-lg" style={{ animationDelay: '0ms', animationDuration: '0.8s' }}></div>
                <div className="w-3 h-2/3 bg-white/90 rounded animate-bounce shadow-lg" style={{ animationDelay: '150ms', animationDuration: '0.9s' }}></div>
                <div className="w-3 h-4/5 bg-white/90 rounded animate-bounce shadow-lg" style={{ animationDelay: '300ms', animationDuration: '1s' }}></div>
              </div>
            </div>
          ) : (
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          )}

          <p className={`font-bold tracking-wide text-center px-4 max-w-sm ${isGenerating ? 'text-blue-100 text-lg animate-pulse' : 'text-gray-500'}`}>
            {authLoading ? "Verifying Authentication..." : loadingMessage || "Initializing Timetable Cloud System..."}
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthPage />;
  }

  // Pending Approval View
  if (userRole === 'pending') {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-blue-100/50 border border-blue-50/50 p-8 md:p-12 text-center space-y-8 animate-in fade-in zoom-in duration-500">
          {/* Animated Icon Container */}
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-25"></div>
            <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 w-24 h-24 rounded-full flex items-center justify-center shadow-lg shadow-blue-200">
              <span className="text-4xl animate-bounce">⏳</span>
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Access Pending
            </h1>
            <p className="text-slate-500 leading-relaxed font-medium">
              Welcome to <span className="text-blue-600 font-bold">SMTEC Portal</span>! Your account has been created successfully.
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-3">
            <div className="flex items-center gap-3 text-sm text-slate-600 font-semibold justify-center">
              <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span>
              Waiting for Administrator Approval
            </div>
            <p className="text-xs text-slate-400 leading-tight">
              An administrator needs to verify your identity and assign your department roles before you can access the timetable system.
            </p>
          </div>

          <div className="pt-4 space-y-4">
            <button
              onClick={handleSignOut}
              className="w-full py-4 bg-white border-2 border-slate-100 hover:border-red-100 hover:bg-red-50 text-slate-600 hover:text-red-600 font-bold rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 group"
            >
              <span>Sign Out</span>
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
              Institutional Security Policy • Phase 1 Verification
            </p>
          </div>
        </div>
      </div>
    );
  }



  // console.log(timetableGrid)
  // console.log(selectedDept)
  // console.log("ARCHIVE DATA:", archiveData);


  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onToggleMenu={() => setIsSidebarOpen(!isSidebarOpen)}
        currentUser={currentUser}
        onSignOut={handleSignOut}
      />

      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          navItems={navItems}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto h-full">
            {activeTab === "overview" && <ProjectOverview />}
            {activeTab === "admin" && isAdmin && <AdminAccess currentUser={currentUser} isAdmin={isAdmin} systemSettings={systemSettings} setSystemSettings={setSystemSettings} />}
            {activeTab === "dashboard" && (
              <Dashboard
                subjects={subjects}
                departments={departments}
                staff={staff}
                rooms={rooms}
              />
            )}

            {activeTab === "depts" && (
              <DepartmentManager
                departments={departments}
                setDepartments={setDepartments}
              />
            )}

            {activeTab === "staff" && (
              <StaffManager
                staff={staff}
                setStaff={setStaff}
                departments={departments}
                subjectsList={subjectsList}
              />
            )}

            {activeTab === "rooms" && (
              <ClassroomDashboard 
                rooms={rooms}
                setRooms={setRooms}
              />
            )}

            {activeTab === "subjects" && (
              <SubjectManager
                subjectsList={subjectsList}
                setSubjectsList={setSubjectsList}
                departments={departments}
                allowCreditEdit={systemSettings.allowCreditEdit}
              />
            )}

            {activeTab === "archive" && (
              <ArchiveDashboard
                departments={departments}
                isAdmin={isAdmin}
              />
            )}

            {activeTab === "staff_schedule" && (
              <StaffScheduleView 
                fullGrid={timetableGrid}
                staff={staff}
                subjectsList={subjectsList}
              />
            )}

            {activeTab === "manage" && !isStaff && (
              !timetableGrid ? (
                <SubjectsForm
                  onSave={async (newCurriculum, preGeneratedGrid = null) => {
                    setSubjects(newCurriculum);
                    
                    if (preGeneratedGrid) {
                      setTimetableGrid(preGeneratedGrid);
                      notify.success("Global conflict-free schedule generated locally!");
                      return;
                    }

                    setIsGenerating(true);
                    abortGeneration.current = false;

                    // We immediately render the Timetable container with a placeholder 
                    // so the user visually sees the attempt grid swap in real time.
                    setTimetableGrid({});

                    try {
                      let attempt = 1;
                      let response = null;
                      const MAX_ATTEMPTS = 500; // Loops for ~30 minutes max

                      while (attempt <= MAX_ATTEMPTS) {
                        setGenerationAttempt(attempt);

                        // Call Spring Boot REST API for generation
                        response = await api.generateTimetableAPI(newCurriculum);

                        if (abortGeneration.current) {
                          break;
                        }

                        // Output the grid IMMEDIATELY so the user watches it build
                        setTimetableGrid(response.grid);

                        if (response.success) {
                          break; // Perfect schedule found! 0 Missing Values!
                        }

                        attempt++;
                        // Tiny pause so browser renderer doesn't choke during rapid looping
                        await new Promise(resolve => setTimeout(resolve, 300));
                      }

                      if (response.success) {
                        notify.success(`Legendary! Perfect 100% timetable generated entirely after ${attempt} tries.`);
                      } else {
                        const totalMissing = response.unassigned ? response.unassigned.reduce((acc, curr) => acc + curr.remaining, 0) : 0;
                        const failedDepts = [...new Set(response.unassigned?.map(u => u.dept) || [])];
                        notify.warning(`Gave up after ${MAX_ATTEMPTS} attempts. ${totalMissing} periods unassigned in: ${failedDepts.join(", ")}`);
                      }
                    } catch (error) {
                      notify.error("Failed to generate timetable on server.");
                    } finally {
                      setIsGenerating(false);
                      setGenerationAttempt(0);
                    }
                  }}
                  onStrictSave={async (newCurriculum) => {
                    setSubjects(newCurriculum);
                    setIsGenerating(true);
                    setLoadingMessage("AI Optimizing (Strict Mode)...");
                    abortGeneration.current = false;
                    setTimetableGrid({});

                    try {
                      setGenerationAttempt(1);
                      // Use the strict endpoint which prioritizes Gemini AI
                      const response = await api.generateStrictTimetableAPI(newCurriculum);
                      
                      if (!abortGeneration.current) {
                        setTimetableGrid(response.grid);
                        if (response.success) {
                          notify.success("Strict Global AI Generation Successful!");
                        } else {
                          notify.warning("AI Generation partial success. Check unassigned slots.");
                        }
                      }
                    } catch (error) {
                      notify.error("Strict AI Generation failed.");
                    } finally {
                      setIsGenerating(false);
                      setGenerationAttempt(0);
                      setLoadingMessage("");
                    }
                  }}
                  staff={staff}
                  subjectsList={subjectsList}
                  departments={departments}
                  initialData={subjects}
                  allowCreditEdit={systemSettings.allowCreditEdit}
                />
              ) : (
                <div className="space-y-6">
                  {/* GLOBAL STATUS DASHBOARD */}
                  <GlobalSummary 
                    grid={timetableGrid}
                    subjects={subjects}
                    departments={departments}
                    onSelectDept={setSelectedDept}
                    onSelectYear={setActiveYear}
                  />

                  {/* GENERATIVE AI ANIMATION OVERLAY */}
                  {isGenerating && (
                    <div className="bg-gradient-to-r from-blue-900 via-indigo-800 to-blue-900 border border-blue-400 p-6 rounded-3xl shadow-[0_0_30px_rgba(59,130,246,0.4)] flex items-center justify-between text-white animate-pulse relative overflow-hidden">
                      <div className="absolute inset-0 bg-white/5 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] opacity-20"></div>
                      <div className="flex items-center gap-6 relative z-10">
                        <div className="relative w-12 h-12">
                          <div className="absolute inset-0 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                          <div className="absolute inset-2 border-4 border-indigo-300 border-b-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-extrabold tracking-wide text-xl text-blue-50 glow">Global AI Engine Running...</span>
                          <span className="text-sm text-blue-200">Processing all {Object.keys(subjects).length} departments & years for optimal conflict-free scheduling.</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 relative z-10">
                        <span className="font-mono text-indigo-100 font-bold bg-indigo-950 px-5 py-2 rounded-2xl shadow-inner border border-indigo-400/50">
                          Optimization Cycle {generationAttempt}
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-300 mr-2">Searching for perfect 0-missing solution</span>
                      </div>
                    </div>
                  )}

                  <div className="bg-white p-4 rounded-2xl shadow-sm border flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                      <select
                        value={selectedDept}
                        onChange={(e) => setSelectedDept(e.target.value)}
                        className="bg-gray-50 border-0 p-3 rounded-xl font-bold text-gray-700 shadow-inner"
                      >
                        {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                      </select>
                      <YearTabs activeYear={activeYear} setActiveYear={setActiveYear} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          const subjectsFormOnSave = async (newCurriculum) => {
                            setSubjects(newCurriculum);
                            setIsGenerating(true);
                            abortGeneration.current = false;
                            try {
                              let attempt = 1;
                              let response = null;
                              const MAX_ATTEMPTS = 500;
                              while (attempt <= MAX_ATTEMPTS) {
                                setGenerationAttempt(attempt);
                                response = await api.generateTimetableAPI(newCurriculum);
                                if (abortGeneration.current) break;
                                setTimetableGrid(response.grid);
                                if (response.success) break;
                                attempt++;
                                await new Promise(resolve => setTimeout(resolve, 300));
                              }
                              if (response.success) {
                                notify.success(`Legendary! Perfect 100% timetable generated after ${attempt} tries.`);
                              } else {
                                const totalMissing = response.unassigned ? response.unassigned.reduce((acc, curr) => acc + curr.remaining, 0) : 0;
                                const failedDepts = [...new Set(response.unassigned?.map(u => u.dept) || [])];
                                notify.warning(`Gave up after ${MAX_ATTEMPTS} attempts. ${totalMissing} periods unassigned in: ${failedDepts.join(", ")}`);
                              }
                            } catch (error) {
                              notify.error("Failed to generate timetable.");
                            } finally {
                              setIsGenerating(false);
                              setGenerationAttempt(0);
                            }
                          };
                          subjectsFormOnSave(subjects);
                        }}
                        className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-green-200 flex items-center gap-2"
                      >
                        <span className="text-lg">⚡</span>
                        Re-optimize All
                      </button>
                      <button
                        onClick={() => handleArchive()}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-200"
                      >
                        ✅ Archive {selectedDept}
                      </button>
                      {/* <button
                        onClick={handleArchiveAll}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-indigo-200"
                      >
                        📦 Archive ALL
                      </button> */}
                      {/* <button
                        onClick={() => exportTimetablePDF("timetable-area")}
                        className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-purple-200"
                      >
                        📥 Export PDF
                      </button> */}
                      <button
                        onClick={handleExportAll}
                        className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-rose-200"
                      >
                        📄 Export ALL
                      </button>
                    </div>
                  </div>

                  <div id="timetable-area">
                    <Timetable
                      grid={timetableGrid[selectedDept] || {}}
                      fullGrid={timetableGrid}
                      activeDept={selectedDept}
                      activeYear={activeYear}
                      activeSection={activeSection}
                      setActiveSection={setActiveSection}
                      subjectsList={subjectsList}
                      subjects={subjects}
                      staff={staff}
                      onUpdateGrid={(newDeptGrid) => {
                        setTimetableGrid(prev => ({
                          ...prev,
                          [selectedDept]: newDeptGrid
                        }));
                      }}
                    />
                  </div>

                  <div className="flex justify-center">
                    <button
                      onClick={() => {
                        abortGeneration.current = true;
                        setIsGenerating(false);
                        setGenerationAttempt(0);
                        setTimetableGrid(null);
                      }}
                      className="text-gray-400 hover:text-red-500 text-sm font-medium transition-colors"
                    >
                      ← Reset Data and Re-generate
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        </main>
      </div>
    </div>
  );
}