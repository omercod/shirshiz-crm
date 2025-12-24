import React, { useState, useMemo, useEffect } from "react";
import {
  Users,
  Calendar as CalendarIcon,
  Plus,
  Search,
  Trash2,
  Edit2,
  Phone,
  MapPin,
  Filter,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  X,
  Instagram,
  Facebook,
  Music2,
  HeartHandshake,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  User,
  MessageCircle,
  CalendarDays,
  AtSign,
  AlertCircle,
  BarChart3,
  PieChart,
  TrendingUp,
  DollarSign,
  Target,
  Clock,
} from "lucide-react";

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

const STATUSES = {
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

const SOURCES = {
  אינסטגרם: {
    color: "bg-pink-100 text-pink-700 border-pink-200",
    icon: <Instagram size={14} />,
  },
  פייסבוק: {
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: <Facebook size={14} />,
  },
  טיקטוק: {
    color: "bg-slate-800 text-white border-slate-900",
    icon: <Music2 size={14} />,
  },
  "חבר מביא חבר": {
    color: "bg-green-100 text-green-700 border-green-200",
    icon: <HeartHandshake size={14} />,
  },
  אחר: {
    color: "bg-purple-100 text-purple-700 border-purple-200",
    icon: <HelpCircle size={14} />,
  },
};

export default function App() {
  const [activeTab, setActiveTab] = useState("leads");
  const [leads, setLeads] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [statsTimeFilter, setStatsTimeFilter] = useState("month"); // week, month, year, all
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [formError, setFormError] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "regDate",
    direction: "desc",
  });
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Assistant:wght@300;400;600;700;800&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

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

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc")
      direction = "desc";
    setSortConfig({ key, direction });
  };

  const validateForm = (data) => {
    if (!data.name || data.name.trim().length < 2) return "נא להזין שם תקין";
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(data.phone)) return "טלפון חייב להכיל בדיוק 10 ספרות";
    if (data.email && data.email.trim() !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) return "כתובת מייל לא תקינה";
    }
    return null;
  };

  const addOrUpdateLead = async (leadData) => {
    const error = validateForm(leadData);
    if (error) {
      setFormError(error);
      return;
    }
    setFormError("");
    const payload = {
      ...leadData,
      status: Number(leadData.status || 1),
      regDate: leadData.regDate || new Date().toISOString().split("T")[0],
    };
    try {
      if (editingLead?.id) {
        await updateDoc(doc(db, "leads", editingLead.id), payload);
      } else {
        await addDoc(collection(db, "leads"), payload);
      }
      setIsModalOpen(false);
      setEditingLead(null);
    } catch (e) {
      setFormError("שגיאה בשמירה למסד הנתונים");
    }
  };

  const sortedAndFilteredLeads = useMemo(() => {
    let sortableLeads = [...leads];
    sortableLeads = sortableLeads.filter((lead) => {
      const matchesSearch =
        (lead.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.phone || "").includes(searchTerm) ||
        (lead.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.city || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || Number(lead.status) === Number(statusFilter);
      return matchesSearch && matchesStatus;
    });
    if (sortConfig.key !== null) {
      sortableLeads.sort((a, b) => {
        const aValue = a[sortConfig.key] || "";
        const bValue = b[sortConfig.key] || "";
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sortableLeads;
  }, [leads, searchTerm, statusFilter, sortConfig]);

  // Statistics Calculation
  const stats = useMemo(() => {
    const now = new Date();
    let filtered = [...leads];

    if (statsTimeFilter !== "all") {
      const limit = new Date();
      if (statsTimeFilter === "week") limit.setDate(now.getDate() - 7);
      if (statsTimeFilter === "month") limit.setMonth(now.getMonth() - 1);
      if (statsTimeFilter === "year") limit.setFullYear(now.getFullYear() - 1);

      filtered = leads.filter((l) => new Date(l.regDate) >= limit);
    }

    const total = filtered.length;
    const closed = filtered.filter((l) => Number(l.status) === 3).length;
    const newLeads = filtered.filter((l) => Number(l.status) === 1).length;
    const conversion = total > 0 ? ((closed / total) * 100).toFixed(1) : 0;
    const totalRevenue = filtered
      .filter((l) => Number(l.status) === 3)
      .reduce((acc, curr) => acc + Number(curr.quote || 0), 0);
    const potentialRevenue = filtered
      .filter((l) => Number(l.status) === 2)
      .reduce((acc, curr) => acc + Number(curr.quote || 0), 0);

    // Group by source for mini-chart
    const sourceData = {};
    filtered.forEach((l) => {
      sourceData[l.source] = (sourceData[l.source] || 0) + 1;
    });

    return {
      total,
      closed,
      newLeads,
      conversion,
      totalRevenue,
      potentialRevenue,
      sourceData,
    };
  }, [leads, statsTimeFilter]);

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [currentDate]);

  const getEventsForDay = (day) => {
    if (!day) return [];
    const dateStr = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return leads.filter(
      (l) => l.eventDate === dateStr || l.nextCallDate === dateStr
    );
  };

  if (loading)
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-slate-50 font-['Assistant']"
        dir="rtl"
      >
        <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
      </div>
    );

  return (
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

      <main className="lg:mr-64 p-4 lg:p-8 pb-20">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-800">
              {activeTab === "leads"
                ? "לידים ולקוחות"
                : activeTab === "calendar"
                ? "יומן פגישות"
                : "ביצועים וניתוח"}
            </h2>
            <p className="text-slate-400 font-bold text-sm">
              שלום שיר, ברוכה הבאה למערכת הניהול שלך
            </p>
          </div>
          <button
            onClick={() => {
              setEditingLead({
                name: "",
                phone: "",
                email: "",
                city: "",
                age: "",
                job: "",
                source: "אינסטגרם",
                status: 1,
                quote: "",
                nextCallDate: "",
                eventDate: "",
                callDetails: "",
                regDate: new Date().toISOString().split("T")[0],
              });
              setIsModalOpen(true);
            }}
            className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-4 rounded-2xl shadow-xl font-black flex items-center gap-2 transition-all active:scale-95 w-full md:w-auto justify-center"
          >
            <Plus size={20} /> הוספת ליד חדש
          </button>
        </header>

        {activeTab === "leads" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Filters Row */}
            <div className="flex flex-wrap gap-3 items-center bg-white p-3 rounded-2xl border shadow-sm">
              <div className="relative flex-1 min-w-[300px]">
                <Search
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="חיפוש מהיר לפי שם, טלפון, עיר..."
                  className="w-full pr-10 pl-4 py-3 bg-slate-50 border-none rounded-xl outline-none font-bold text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                <Filter size={16} className="text-slate-400" />
                <select
                  className="bg-transparent border-none outline-none font-black text-slate-600 cursor-pointer text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">כל הסטטוסים</option>
                  {Object.entries(STATUSES).map(([val, { label }]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm whitespace-nowrap">
                  <thead className="bg-slate-50/50 border-b border-slate-100">
                    <tr className="text-slate-400 font-black">
                      <th
                        onClick={() => requestSort("regDate")}
                        className="p-5 cursor-pointer hover:bg-slate-100 transition-colors"
                      >
                        תאריך פנייה{" "}
                        <SortIcon columnKey="regDate" config={sortConfig} />
                      </th>
                      <th
                        onClick={() => requestSort("name")}
                        className="p-5 cursor-pointer hover:bg-slate-100 transition-colors"
                      >
                        לקוח <SortIcon columnKey="name" config={sortConfig} />
                      </th>
                      <th className="p-5">פרטי קשר</th>
                      <th className="p-5">סטטוס</th>
                      <th className="p-5">מקור</th>
                      <th className="p-5">מיקום</th>
                      <th className="p-5">גיל ומקצוע</th>
                      <th className="p-5">הצעה</th>
                      <th className="p-5">שיחה חוזרת</th>
                      <th className="p-5">אירוע</th>
                      <th className="p-5 text-center">פעולות</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {sortedAndFilteredLeads.map((lead) => (
                      <tr
                        key={lead.id}
                        className="hover:bg-slate-50/50 transition-colors group"
                      >
                        <td className="p-5 font-bold text-slate-400">
                          {lead.regDate || "לא הוזן"}
                        </td>
                        <td className="p-5">
                          <div className="font-black text-slate-800 text-base">
                            {lead.name || "ללא שם"}
                          </div>
                        </td>
                        <td className="p-5">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5 font-bold text-slate-600">
                              <Phone size={12} className="text-pink-400" />{" "}
                              {lead.phone || "חסר טלפון"}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold italic">
                              <AtSign size={12} /> {lead.email || "אין מייל"}
                            </div>
                          </div>
                        </td>
                        <td className="p-5">
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-black border flex items-center gap-1.5 w-fit ${
                              STATUSES[lead.status]?.color
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                STATUSES[lead.status]?.dot
                              }`}
                            ></span>
                            {STATUSES[lead.status]?.label}
                          </span>
                        </td>
                        <td className="p-5">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black border flex items-center gap-1.5 w-fit ${
                              SOURCES[lead.source]?.color ||
                              SOURCES["אחר"].color
                            }`}
                          >
                            {SOURCES[lead.source]?.icon} {lead.source}
                          </span>
                        </td>
                        <td className="p-5 font-bold text-slate-500">
                          {lead.city || "לא ידוע"}
                        </td>
                        <td className="p-5">
                          <div className="flex flex-col">
                            <span className="font-black text-slate-800 text-sm leading-tight">
                              {lead.age || "גיל חסר"}
                            </span>
                            <span className="text-slate-400 font-bold text-xs uppercase tracking-tight">
                              {lead.job || "מקצוע חסר"}
                            </span>
                          </div>
                        </td>
                        <td className="p-5 font-black text-pink-600">
                          ₪{lead.quote || 0}
                        </td>
                        <td className="p-5">
                          <div className="flex items-center gap-1.5 font-bold text-blue-600 text-xs">
                            <Clock size={12} />{" "}
                            {lead.nextCallDate || "אין מעקב"}
                          </div>
                        </td>
                        <td className="p-5 font-bold text-emerald-600 text-xs">
                          {lead.eventDate || "טרם נקבע"}
                        </td>
                        <td className="p-5">
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() => {
                                setEditingLead(lead);
                                setIsModalOpen(true);
                              }}
                              className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={async () => {
                                if (window.confirm("למחוק את הליד?"))
                                  await deleteDoc(doc(db, "leads", lead.id));
                              }}
                              className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "calendar" && (
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm animate-in fade-in slide-in-from-right-4 duration-400">
            {/* Calendar Component (remains the same as before) */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-pink-50 rounded-xl text-pink-600">
                  <CalendarIcon size={24} />
                </div>
                <h3 className="text-xl font-black text-slate-800">
                  יומן סטודיו
                </h3>
              </div>
              <div className="flex items-center bg-slate-50 p-1.5 rounded-xl border border-slate-100 shadow-sm">
                <button
                  onClick={() =>
                    setCurrentDate(
                      new Date(currentDate.setMonth(currentDate.getMonth() - 1))
                    )
                  }
                  className="p-2 hover:bg-white rounded-lg transition-all"
                >
                  <ChevronRight size={18} />
                </button>
                <span className="px-6 font-black text-slate-700 text-base">
                  {new Intl.DateTimeFormat("he-IL", {
                    month: "long",
                    year: "numeric",
                  }).format(currentDate)}
                </span>
                <button
                  onClick={() =>
                    setCurrentDate(
                      new Date(currentDate.setMonth(currentDate.getMonth() + 1))
                    )
                  }
                  className="p-2 hover:bg-white rounded-lg transition-all"
                >
                  <ChevronLeft size={18} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 border-t border-r border-slate-100">
              {["א", "ב", "ג", "ד", "ה", "ו", "ש"].map((day) => (
                <div
                  key={day}
                  className="p-3 text-center font-black text-slate-400 bg-slate-50/30 border-b border-l border-slate-100 text-xs uppercase"
                >
                  {day}
                </div>
              ))}
              {calendarDays.map((day, idx) => {
                const dayEvents = getEventsForDay(day);
                const isToday =
                  day &&
                  day === new Date().getDate() &&
                  currentDate.getMonth() === new Date().getMonth() &&
                  currentDate.getFullYear() === new Date().getFullYear();
                return (
                  <div
                    key={idx}
                    className={`min-h-[110px] p-1 border-b border-l border-slate-100 ${
                      day ? "hover:bg-slate-50/20" : "bg-slate-50/10"
                    }`}
                  >
                    {day && (
                      <>
                        <div className="p-1 mb-1">
                          <span
                            className={`text-xs font-black ${
                              isToday
                                ? "w-6 h-6 bg-pink-600 text-white rounded-lg flex items-center justify-center"
                                : "text-slate-300"
                            }`}
                          >
                            {day}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {dayEvents.map((ev) => {
                            const isEvent =
                              ev.eventDate ===
                              `${currentDate.getFullYear()}-${String(
                                currentDate.getMonth() + 1
                              ).padStart(2, "0")}-${String(day).padStart(
                                2,
                                "0"
                              )}`;
                            return (
                              <button
                                key={ev.id}
                                onClick={() => {
                                  setEditingLead(ev);
                                  setIsModalOpen(true);
                                }}
                                className={`w-full text-right p-1 rounded-md text-[9px] font-black truncate border transition-all hover:translate-x-0.5 ${
                                  isEvent
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                    : "bg-blue-50 text-blue-700 border-blue-100"
                                }`}
                              >
                                {isEvent ? "🎂" : "📞"} {ev.name}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "stats" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-400">
            {/* Stats Header Filter */}
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border shadow-sm">
              <div className="flex items-center gap-2 text-slate-500 font-bold">
                <TrendingUp size={20} className="text-pink-500" /> נתוני צמיחה
              </div>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                {["week", "month", "year", "all"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setStatsTimeFilter(t)}
                    className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
                      statsTimeFilter === t
                        ? "bg-white text-pink-600 shadow-sm"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {t === "week"
                      ? "שבוע"
                      : t === "month"
                      ? "חודש"
                      : t === "year"
                      ? "שנה"
                      : "הכל"}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={<Users className="text-blue-600" />}
                bg="bg-blue-50"
                label="סה״כ לידים לתקופה"
                value={stats.total}
              />
              <StatCard
                icon={<Target className="text-emerald-600" />}
                bg="bg-emerald-50"
                label="סגירות מוצלחות"
                value={stats.closed}
                sub={`שיעור המרה: ${stats.conversion}%`}
              />
              <StatCard
                icon={<DollarSign className="text-pink-600" />}
                bg="bg-pink-50"
                label="הכנסה סגורה"
                value={`₪${stats.totalRevenue.toLocaleString()}`}
              />
              <StatCard
                icon={<TrendingUp className="text-amber-600" />}
                bg="bg-amber-50"
                label="פוטנציאל בקנה"
                value={`₪${stats.potentialRevenue.toLocaleString()}`}
                sub="לידים בתהליך"
              />
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Chart 1: Sources */}
              <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <h4 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                  <PieChart size={18} className="text-pink-500" /> התפלגות
                  מקורות הגעה
                </h4>
                <div className="space-y-4">
                  {Object.entries(stats.sourceData)
                    .sort((a, b) => b[1] - a[1])
                    .map(([source, count]) => {
                      const percent = ((count / stats.total) * 100).toFixed(0);
                      return (
                        <div key={source} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-black text-slate-600">
                            <span>{source}</span>
                            <span>
                              {count} לידים ({percent}%)
                            </span>
                          </div>
                          <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                            <div
                              className={`h-full transition-all duration-1000 ${
                                SOURCES[source]?.color.split(" ")[0] ||
                                "bg-slate-400"
                              }`}
                              style={{ width: `${percent}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Action needed */}
              <div className="bg-pink-600 p-8 rounded-[2.5rem] shadow-xl text-white flex flex-col justify-between overflow-hidden relative">
                <div className="relative z-10">
                  <h4 className="text-xl font-black mb-2 italic">
                    טיפ להצלחה שיר 💎
                  </h4>
                  <p className="text-pink-100 font-bold text-sm leading-relaxed">
                    שיעור ההמרה שלך עומד על {stats.conversion}%.
                    {Number(stats.conversion) < 20
                      ? ' נסי לחזור ללידים ה"חדשים" מהר יותר כדי להעלות את המכירות!'
                      : " את עושה עבודה מדהימה, המשיכי כך!"}
                  </p>
                </div>
                <div className="mt-8 relative z-10">
                  <div className="text-4xl font-black">
                    ₪
                    {stats.totalRevenue > 10000
                      ? (stats.totalRevenue / 1000).toFixed(1) + "k"
                      : stats.totalRevenue}
                  </div>
                  <div className="text-[10px] uppercase font-bold tracking-widest text-pink-200 opacity-80">
                    הכנסה תקופתית ברוטו
                  </div>
                </div>
                {/* Decorative blobs */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-pink-500 rounded-full opacity-20 blur-3xl"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white rounded-full opacity-10 blur-3xl"></div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal - Remains the same structure, updated for flow */}
      {isModalOpen && editingLead && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-y-auto flex flex-col animate-in zoom-in duration-200">
            <div className="sticky top-0 bg-white px-8 py-6 border-b border-slate-50 flex justify-between items-center z-20">
              <div>
                <h3 className="text-2xl font-black text-slate-800">
                  {editingLead.id ? "עדכון לקוחה" : "ליד חדש למערכת"}
                </h3>
                <p className="text-xs font-bold text-slate-400 mt-0.5 italic">
                  SHIRSHIZ CRM EXPERIENCE
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-8 flex-1">
              {formError && (
                <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl flex items-center gap-3 font-black text-sm border border-rose-100 animate-pulse">
                  <AlertCircle size={20} /> {formError}
                </div>
              )}

              <div className="grid md:grid-cols-3 gap-8">
                <div className="space-y-4">
                  <SectionTitle icon={<User size={14} />} title="פרטי קשר" />
                  <div className="space-y-3">
                    <InputField
                      label="שם הלקוחה *"
                      value={editingLead.name}
                      onChange={(v) =>
                        setEditingLead({ ...editingLead, name: v })
                      }
                      placeholder="שם מלא"
                    />
                    <InputField
                      label="טלפון * (10 ספרות)"
                      value={editingLead.phone}
                      onChange={(v) =>
                        setEditingLead({ ...editingLead, phone: v })
                      }
                      placeholder="05XXXXXXXX"
                    />
                    <InputField
                      label="כתובת מייל"
                      value={editingLead.email}
                      onChange={(v) =>
                        setEditingLead({ ...editingLead, email: v })
                      }
                      placeholder="example@gmail.com"
                      icon={<AtSign size={14} />}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <SectionTitle
                    icon={<MessageCircle size={14} />}
                    title="סטטוס והצעה"
                  />
                  <div className="space-y-3">
                    <SelectField
                      label="סטטוס ליד"
                      value={editingLead.status}
                      onChange={(v) =>
                        setEditingLead({ ...editingLead, status: v })
                      }
                      options={Object.entries(STATUSES).map(([k, v]) => ({
                        val: k,
                        label: v.label,
                      }))}
                      dynamicClass={STATUSES[editingLead.status]?.color}
                    />
                    <SelectField
                      label="מקור הגעה"
                      value={editingLead.source}
                      onChange={(v) =>
                        setEditingLead({ ...editingLead, source: v })
                      }
                      options={Object.keys(SOURCES).map((s) => ({
                        val: s,
                        label: s,
                      }))}
                      dynamicClass={
                        SOURCES[editingLead.source]?.color ||
                        SOURCES["אחר"].color
                      }
                    />
                    <InputField
                      label="הצעת מחיר (₪)"
                      type="number"
                      value={editingLead.quote}
                      onChange={(v) =>
                        setEditingLead({ ...editingLead, quote: v })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <SectionTitle
                    icon={<MapPin size={14} />}
                    title="פרטים דמוגרפיים"
                  />
                  <div className="space-y-3">
                    <InputField
                      label="עיר / ישוב"
                      value={editingLead.city}
                      onChange={(v) =>
                        setEditingLead({ ...editingLead, city: v })
                      }
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <InputField
                        label="גיל"
                        value={editingLead.age}
                        onChange={(v) =>
                          setEditingLead({ ...editingLead, age: v })
                        }
                      />
                      <InputField
                        label="מקצוע"
                        value={editingLead.job}
                        onChange={(v) =>
                          setEditingLead({ ...editingLead, job: v })
                        }
                      />
                    </div>
                    <InputField
                      label="תאריך רישום"
                      type="date"
                      value={editingLead.regDate}
                      onChange={(v) =>
                        setEditingLead({ ...editingLead, regDate: v })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 pt-6 border-t border-slate-50">
                <div className="space-y-3">
                  <SectionTitle
                    icon={<CalendarIcon size={14} />}
                    title="תאריכים למעקב"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <InputField
                      label="שיחה חוזרת"
                      type="date"
                      value={editingLead.nextCallDate}
                      onChange={(v) =>
                        setEditingLead({ ...editingLead, nextCallDate: v })
                      }
                    />
                    <InputField
                      label="תאריך אירוע"
                      type="date"
                      value={editingLead.eventDate}
                      onChange={(v) =>
                        setEditingLead({ ...editingLead, eventDate: v })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <SectionTitle
                    icon={<AtSign size={14} />}
                    title="סיכום שיחה"
                  />
                  <textarea
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-sm text-slate-700 focus:ring-2 focus:ring-pink-100 min-h-[100px] resize-none"
                    placeholder="מה שיר סיכמה עם הלקוחה?"
                    value={editingLead.callDetails || ""}
                    onChange={(e) =>
                      setEditingLead({
                        ...editingLead,
                        callDetails: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="pt-8 flex gap-4">
                <button
                  onClick={() => addOrUpdateLead(editingLead)}
                  className="flex-[4] bg-pink-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-pink-100 hover:bg-pink-700 transition-all text-xl active:scale-[0.98]"
                >
                  שמירת נתונים
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-100 text-slate-500 py-5 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                  סגירה
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-components
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

const StatCard = ({ icon, bg, label, value, sub }) => (
  <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-start gap-4">
    <div className={`p-4 ${bg} rounded-2xl`}>{icon}</div>
    <div>
      <div className="text-2xl font-black text-slate-800">{value}</div>
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
        {label}
      </div>
      {sub && (
        <div className="text-[10px] font-bold text-emerald-500 mt-1">{sub}</div>
      )}
    </div>
  </div>
);

const SectionTitle = ({ icon, title }) => (
  <div className="flex items-center gap-2 text-slate-400 font-black text-[11px] uppercase tracking-[0.1em] pb-1">
    {icon} <span>{title}</span>
  </div>
);

const InputField = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  icon = null,
}) => (
  <div>
    <label className="text-[10px] font-black text-slate-500 mb-1.5 block px-1">
      {label}
    </label>
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300">
          {icon}
        </div>
      )}
      <input
        type={type}
        placeholder={placeholder}
        className={`w-full p-3.5 bg-slate-50 border-2 border-transparent focus:border-pink-200 rounded-xl outline-none font-bold text-slate-800 text-sm transition-all ${
          icon ? "pl-10" : ""
        }`}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  </div>
);

const SelectField = ({
  label,
  value,
  onChange,
  options,
  dynamicClass = "",
}) => (
  <div>
    <label className="text-[10px] font-black text-slate-500 mb-1.5 block px-1">
      {label}
    </label>
    <div
      className={`p-0.5 rounded-xl border-2 transition-all ${
        dynamicClass || "bg-slate-50 border-transparent"
      }`}
    >
      <select
        className="w-full p-3 bg-transparent font-black outline-none cursor-pointer text-sm text-slate-800"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.val} value={opt.val} className="bg-white">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  </div>
);

const SortIcon = ({ columnKey, config }) => {
  if (config.key !== columnKey)
    return <ArrowUpDown size={12} className="opacity-20 inline ml-1" />;
  return config.direction === "asc" ? (
    <ChevronUp size={12} className="inline ml-1 text-pink-500" />
  ) : (
    <ChevronDown size={12} className="inline ml-1 text-pink-500" />
  );
};
