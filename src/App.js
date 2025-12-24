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
} from "firebase/firestore";

// Page Imports
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

  // Load Google Font
  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Assistant:wght@300;400;600;700;800&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

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
        className="min-h-screen bg-slate-50 font-['Assistant'] text-slate-900 overflow-x-hidden"
        dir="rtl"
      >
        {/* Sidebar */}
        <aside className="fixed inset-y-0 right-0 w-64 bg-white border-l border-slate-200 z-30 hidden lg:block">
          <div className="p-8 text-center border-b border-slate-50">
            <h1 className="text-3xl font-black text-pink-600 tracking-tighter italic">
              SHIRSHIZ
            </h1>
            <p className="text-[9px] text-slate-400 mt-1 font-bold uppercase tracking-widest">
              Management v4.5
            </p>
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
        </aside>

        {/* Main Content */}
        <main className="lg:mr-64 p-4 lg:p-8 pb-20">
          {activeTab === "leads" && <LeadsPage />}
          {activeTab === "tasks" && <TasksPage />}
          {activeTab === "calendar" && <CalendarPage />}
          {activeTab === "stats" && <StatsPage />}
        </main>
      </div>
    </AppContext.Provider>
  );
}

// Sidebar Component
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
