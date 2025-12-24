import React, { useState, useEffect, createContext, useContext } from "react";
import { Users, CalendarDays, BarChart3, CheckSquare } from "lucide-react";

// Firebase Imports
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  getDocs,
  where,
} from "firebase/firestore";

// Page Imports
import LoginPage from "./LoginPage";
import LeadsPage from "./Leadspage";
import TasksPage from "./Taskspage";
import CalendarPage from "./CalendarPage";
import StatsPage from "./StatsPage";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDLZmoaMAmQdzaUvDVxyytnlVVfnxySjhw",
  authDomain: "shir-crm.firebaseapp.com",
  projectId: "shir-crm",
  storageBucket: "shir-crm.firebasestorage.app",
  messagingSenderId: "425124951754",
  appId: "1:425124951754:web:5d34e677b681b20f9c2633",
  measurementId: "G-0QZJX0JFEH",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Constants
export const STATUSES = {
  1: {
    label: "חדש",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  2: {
    label: "בתהליך",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  3: {
    label: "נסגר",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  4: {
    label: "לא רלוונטי",
    color: "bg-rose-100 text-rose-700 border-rose-200",
    dot: "bg-rose-500",
  },
};

export const SOURCES = {
  אינסטגרם: {
    color: "bg-pink-100 text-pink-700 border-pink-200",
  },
  פייסבוק: {
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  טיקטוק: {
    color: "bg-slate-800 text-white border-slate-900",
  },
  "חבר מביא חבר": {
    color: "bg-green-100 text-green-700 border-green-200",
  },
  SHIRSHIZ: {
    color: "bg-indigo-100 text-indigo-700 border-indigo-200",
  },
  אחר: {
    color: "bg-purple-100 text-purple-700 border-purple-200",
  },
};

export const EVENT_TYPES = {
  "מאפס למקצוענית": {
    color: "bg-pink-100 text-pink-700 border-pink-200",
  },
  "סדנת וינטאג'": {
    color: "bg-purple-100 text-purple-700 border-purple-200",
  },
  אחר: {
    color: "bg-slate-100 text-slate-700 border-slate-200",
  },
};

// Context for sharing data between components
const AppContext = createContext();

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
};

export default function App() {
  const [activeTab, setActiveTab] = useState("leads");
  const [leads, setLeads] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  // Load Google Font
  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Assistant:wght@300;400;600;700;800&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  // Check if user is authenticated (from localStorage)
  useEffect(() => {
    const authUser = localStorage.getItem("shirshiz_auth");
    if (authUser) {
      setIsAuthenticated(true);
    }
    setAuthChecking(false);
  }, []);

  // Login function
  const handleLogin = async (email, password) => {
    try {
      const usersRef = collection(db, "users");
      const q = query(
        usersRef,
        where("email", "==", email),
        where("password", "==", password)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        localStorage.setItem("shirshiz_auth", JSON.stringify(userData));
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("shirshiz_auth");
    setIsAuthenticated(false);
  };

  // Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        try {
          await signInAnonymously(auth);
        } catch (e) {
          console.error("Auth error");
        }
      } else {
        setUser(currentUser);
      }
    });
    return () => unsubscribe();
  }, []);

  // Firebase Realtime Listener
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "leads"), orderBy("regDate", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setLeads(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsubscribe();
  }, [user]);

  // CRUD Operations
  const addLead = async (leadData) => {
    const payload = {
      ...leadData,
      status: Number(leadData.status || 1),
      regDate: leadData.regDate || new Date().toISOString().split("T")[0],
      regTime:
        leadData.regTime ||
        new Date().toLocaleTimeString("he-IL", {
          hour: "2-digit",
          minute: "2-digit",
        }),
    };
    try {
      await addDoc(collection(db, "leads"), payload);
      return { success: true };
    } catch (e) {
      return { success: false, error: "שגיאה בשמירה למסד הנתונים" };
    }
  };

  const updateLead = async (id, leadData) => {
    const payload = {
      ...leadData,
      status: Number(leadData.status || 1),
    };
    try {
      await updateDoc(doc(db, "leads", id), payload);
      return { success: true };
    } catch (e) {
      return { success: false, error: "שגיאה בעדכון" };
    }
  };

  const deleteLead = async (id) => {
    try {
      await deleteDoc(doc(db, "leads", id));
      return { success: true };
    } catch (e) {
      return { success: false, error: "שגיאה במחיקה" };
    }
  };

  if (authChecking) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 font-['Assistant']"
        dir="rtl"
      >
        <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-slate-50 font-['Assistant']"
        dir="rtl"
      >
        <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const contextValue = {
    leads,
    addLead,
    updateLead,
    deleteLead,
  };

  return (
    <AppContext.Provider value={contextValue}>
      <div
        className="min-h-screen bg-slate-50 font-['Assistant'] text-slate-900"
        dir="rtl"
      >
        {/* Mobile Header */}
        <header className="lg:hidden fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm z-50">
          <div className="flex items-center justify-between px-4 py-3.5">
            <div>
              <h1 className="text-xl font-black text-pink-600 tracking-tight italic">
                SHIRSHIZ
              </h1>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                Management v4.5
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleLogout}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-full font-bold transition-all active:scale-95"
              >
                יציאה
              </button>
              <span className="text-xs bg-pink-100 text-pink-700 px-3 py-1.5 rounded-full font-bold">
                {leads.length}
              </span>
            </div>
          </div>
        </header>

        {/* Desktop Sidebar */}
        <aside className="fixed inset-y-0 right-0 w-64 bg-white border-l border-slate-200 z-30 hidden lg:block">
          <div className="p-8 text-center border-b border-slate-50">
            <h1 className="text-3xl font-black text-pink-600 tracking-tighter italic">
              SHIRSHIZ
            </h1>
            <p className="text-[9px] text-slate-400 mt-1 font-bold uppercase tracking-widest">
              Management v4.5
            </p>
            <button
              onClick={handleLogout}
              className="mt-4 w-full bg-slate-100 hover:bg-slate-200 text-slate-600 py-2 px-4 rounded-xl font-bold text-sm transition-all active:scale-95"
            >
              יציאה
            </button>
          </div>
          <nav className="mt-6 px-4 space-y-2">
            <SidebarItem
              active={activeTab === "leads"}
              onClick={() => setActiveTab("leads")}
              icon={<Users size={20} />}
              label="ניהול לידים"
            />
            <SidebarItem
              active={activeTab === "tasks"}
              onClick={() => setActiveTab("tasks")}
              icon={<CheckSquare size={20} />}
              label="משימות"
            />
            <SidebarItem
              active={activeTab === "calendar"}
              onClick={() => setActiveTab("calendar")}
              icon={<CalendarDays size={20} />}
              label="לוח אירועים"
            />
            <SidebarItem
              active={activeTab === "stats"}
              onClick={() => setActiveTab("stats")}
              icon={<BarChart3 size={20} />}
              label="סטטיסטיקה"
            />
          </nav>

          {/* Desktop Stats Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-slate-100 bg-slate-50/50">
            <div className="text-center">
              <p className="text-xs font-black text-slate-600">סה"כ לידים</p>
              <p className="text-2xl font-black text-pink-600 mt-1">
                {leads.length}
              </p>
              <p className="text-[9px] text-slate-400 mt-2">© 2025 SHIRSHIZ</p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="lg:mr-64 min-h-screen pb-24 lg:pb-8 pt-20 lg:pt-0 px-3 lg:px-8 lg:py-8">
          {activeTab === "leads" && <LeadsPage />}
          {activeTab === "tasks" && <TasksPage />}
          {activeTab === "calendar" && <CalendarPage />}
          {activeTab === "stats" && <StatsPage />}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl z-50">
          <div className="grid grid-cols-4 h-16">
            <MobileNavItem
              active={activeTab === "leads"}
              onClick={() => setActiveTab("leads")}
              icon={<Users size={24} />}
              label="לידים"
            />
            <MobileNavItem
              active={activeTab === "tasks"}
              onClick={() => setActiveTab("tasks")}
              icon={<CheckSquare size={24} />}
              label="משימות"
            />
            <MobileNavItem
              active={activeTab === "calendar"}
              onClick={() => setActiveTab("calendar")}
              icon={<CalendarDays size={24} />}
              label="יומן"
            />
            <MobileNavItem
              active={activeTab === "stats"}
              onClick={() => setActiveTab("stats")}
              icon={<BarChart3 size={24} />}
              label="נתונים"
            />
          </div>
        </nav>
      </div>
    </AppContext.Provider>
  );
}

// Desktop Sidebar Component
const SidebarItem = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all ${
      active
        ? "bg-pink-600 text-white shadow-lg shadow-pink-100"
        : "text-slate-500 hover:bg-slate-50 font-semibold"
    }`}
  >
    {icon} <span className="font-bold">{label}</span>
  </button>
);

// Mobile Bottom Nav Item Component
const MobileNavItem = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1 transition-all active:scale-95 relative ${
      active ? "text-pink-600" : "text-slate-400"
    }`}
  >
    <span className={`transition-transform ${active ? "scale-110" : ""}`}>
      {icon}
    </span>
    <span
      className={`text-[10px] font-bold ${
        active ? "text-pink-600" : "text-slate-500"
      }`}
    >
      {label}
    </span>
    {active && (
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-pink-600 rounded-t-full"></div>
    )}
  </button>
);
