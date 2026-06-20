import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Plus,
  Search,
  Trash2,
  Edit2,
  Phone,
  Filter,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  X,
  AtSign,
  AlertCircle,
  User,
  MessageCircle,
  MapPin,
  Info,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAppContext, STATUSES, SOURCES, EVENT_TYPES } from "./App";
import PaymentsModal from "./PaymentsModal";

const formatIsraeliDate = (dateStr) => {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
};

export default function LeadsPage() {
  const { leads, addLead, updateLead, deleteLead } = useAppContext();
  const [isPaymentsModalOpen, setIsPaymentsModalOpen] = useState(false);
  const [currentFormData, setCurrentFormData] = useState(null);
  const [currentSetFormData, setCurrentSetFormData] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const LEADS_PER_PAGE = 50;

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [customDateRange, setCustomDateRange] = useState({ from: "", to: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [formError, setFormError] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "regDate",
    direction: "desc",
  });
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(null);
  const [eventTypeDropdownOpen, setEventTypeDropdownOpen] = useState(null);

  const useDraggableScroll = (ref) => {
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    useEffect(() => {
      const element = ref.current;
      if (!element) return;

      const handleMouseDown = (e) => {
        // התעלם מלחיצה על אלמנטים אינטראקטיביים
        if (e.target.closest("button, a, input, select, textarea")) return;

        setIsDragging(true);
        setStartX(e.pageX - element.offsetLeft);
        setScrollLeft(element.scrollLeft);
        element.style.scrollBehavior = "auto";
      };

      const handleMouseMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - element.offsetLeft;
        const walk = (x - startX) * 1.5;
        element.scrollLeft = scrollLeft - walk;
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        element.style.scrollBehavior = "smooth";
      };

      const handleMouseLeave = () => {
        setIsDragging(false);
        element.style.scrollBehavior = "smooth";
      };

      element.addEventListener("mousedown", handleMouseDown);
      element.addEventListener("mousemove", handleMouseMove);
      element.addEventListener("mouseup", handleMouseUp);
      element.addEventListener("mouseleave", handleMouseLeave);

      return () => {
        element.removeEventListener("mousedown", handleMouseDown);
        element.removeEventListener("mousemove", handleMouseMove);
        element.removeEventListener("mouseup", handleMouseUp);
        element.removeEventListener("mouseleave", handleMouseLeave);
      };
    }, [isDragging, startX, scrollLeft, ref]);

    return isDragging;
  };

  // יצירת ref לטבלה
  const tableScrollRef = useRef(null);
  useDraggableScroll(tableScrollRef);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusDropdownOpen && !event.target.closest(".relative")) {
        setStatusDropdownOpen(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [statusDropdownOpen]);

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

  const handleSaveLead = async (leadData) => {
    const error = validateForm(leadData);
    if (error) {
      setFormError(error);
      return;
    }
    setFormError("");

    const result = editingLead?.id
      ? await updateLead(editingLead.id, leadData)
      : await addLead(leadData);

    if (result.success) {
      setIsModalOpen(false);
      setEditingLead(null);
    } else {
      setFormError(result.error);
    }
  };

  const handleQuickStatusChange = async (leadId, newStatus) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;

    await updateLead(leadId, { ...lead, status: newStatus });
    setStatusDropdownOpen(null);
  };

  const handleQuickEventTypeChange = async (leadId, newEventType) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;

    await updateLead(leadId, { ...lead, eventType: newEventType });
    setEventTypeDropdownOpen(null);
  };

  const getDropdownPosition = (buttonElement) => {
    if (!buttonElement) return "bottom";
    const rect = buttonElement.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    return spaceBelow < 200 && spaceAbove > spaceBelow ? "top" : "bottom";
  };

  // Time Filter
  const filteredByTime = useMemo(() => {
    if (timeFilter === "all") return leads;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (timeFilter === "day") {
      // היום - תאריך מקומי
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      const todayStr = `${year}-${month}-${day}`;
      return leads.filter((l) => l.regDate === todayStr);
    }

    if (timeFilter === "week") {
      // מיום ראשון עד היום
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dayOfWeek = today.getDay(); // 0 = ראשון, 1 = שני, ..., 6 = שבת
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - dayOfWeek); // חזרה ליום ראשון
      startOfWeek.setHours(0, 0, 0, 0);

      return leads.filter((l) => {
        const leadDate = new Date(l.regDate);
        leadDate.setHours(0, 0, 0, 0);
        return leadDate >= startOfWeek && leadDate <= today;
      });
    }

    if (timeFilter === "month") {
      // מה-1 בחודש עד היום
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      startOfMonth.setHours(0, 0, 0, 0);

      return leads.filter((l) => {
        const leadDate = new Date(l.regDate);
        leadDate.setHours(0, 0, 0, 0);
        return leadDate >= startOfMonth && leadDate <= today;
      });
    }

    if (timeFilter === "year") {
      // מ-1.1 עד היום
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      startOfYear.setHours(0, 0, 0, 0);

      return leads.filter((l) => {
        const leadDate = new Date(l.regDate);
        leadDate.setHours(0, 0, 0, 0);
        return leadDate >= startOfYear && leadDate <= today;
      });
    }

    if (timeFilter === "custom") {
      // מותאם אישית
      if (customDateRange.from && customDateRange.to) {
        const fromDate = new Date(customDateRange.from);
        fromDate.setHours(0, 0, 0, 0);
        const toDate = new Date(customDateRange.to);
        toDate.setHours(23, 59, 59, 999);

        return leads.filter((l) => {
          const leadDate = new Date(l.regDate);
          leadDate.setHours(0, 0, 0, 0);
          return leadDate >= fromDate && leadDate <= toDate;
        });
      }
      return leads;
    }

    return leads;
  }, [leads, timeFilter, customDateRange]);

  // כל הלידים המסוננים (לפני pagination)
  const allFilteredLeads = useMemo(() => {
    let sortableLeads = [...filteredByTime];
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
  }, [filteredByTime, searchTerm, statusFilter, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(allFilteredLeads.length / LEADS_PER_PAGE);
  const startIndex = (currentPage - 1) * LEADS_PER_PAGE;
  const endIndex = startIndex + LEADS_PER_PAGE;
  const sortedAndFilteredLeads = allFilteredLeads.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, timeFilter, customDateRange]);

  const newLeadTemplate = {
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
    event2Date: "",
    callDetails: "",
    regDate: new Date().toISOString().split("T")[0],
    payments: [],
  };

  // Pagination Component
  const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const getPageNumbers = () => {
      const pages = [];
      const maxVisible = 5;

      if (totalPages <= maxVisible) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        if (currentPage <= 3) {
          pages.push(1, 2, 3, 4, "...", totalPages);
        } else if (currentPage >= totalPages - 2) {
          pages.push(
            1,
            "...",
            totalPages - 3,
            totalPages - 2,
            totalPages - 1,
            totalPages,
          );
        } else {
          pages.push(
            1,
            "...",
            currentPage - 1,
            currentPage,
            currentPage + 1,
            "...",
            totalPages,
          );
        }
      }

      return pages;
    };

    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-center gap-2 py-6">
        {/* Previous */}
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-3 py-2 rounded-lg font-bold text-sm transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed bg-slate-100 text-slate-600 hover:bg-slate-200"
        >
          ← הקודם
        </button>

        {/* Page Numbers */}
        <div className="flex gap-1">
          {getPageNumbers().map((page, index) => {
            if (page === "...") {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-3 py-2 text-slate-400 font-bold"
                >
                  ...
                </span>
              );
            }

            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`min-w-[40px] px-3 py-2 rounded-lg font-black text-sm transition-all active:scale-95 ${
                  currentPage === page
                    ? "bg-pink-600 text-white shadow-lg"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Next */}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-2 rounded-lg font-bold text-sm transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed bg-slate-100 text-slate-600 hover:bg-slate-200"
        >
          הבא →
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-4 lg:space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <header className="flex flex-col gap-4 mb-6 mt-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <h2 className="text-2xl lg:text-3xl font-black bg-gradient-to-l from-pink-600 to-rose-500 bg-clip-text text-transparent">
              לידים ולקוחות
            </h2>
            <p className="text-slate-400 font-bold text-xs lg:text-sm">
              שלום שיר, ברוכה הבאה למערכת הניהול שלך
            </p>
          </div>

          {/* Time Filter */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {[
              { val: "day", label: "היום" },
              { val: "week", label: "השבוע" },
              { val: "month", label: "החודש" },
              { val: "all", label: "הכל" },
            ].map((opt) => (
              <button
                key={opt.val}
                onClick={() => setTimeFilter(opt.val)}
                className={`px-3 lg:px-4 py-2 rounded-lg font-black text-xs lg:text-sm transition-all active:scale-95 ${
                  timeFilter === opt.val
                    ? "bg-pink-600 text-white shadow-lg"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
            <DateRangePicker
              value={customDateRange}
              onChange={setCustomDateRange}
              onApply={() => setTimeFilter("custom")}
              active={timeFilter === "custom"}
            />
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-md hover:shadow-lg transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-blue-100 rounded-xl text-blue-600 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider">סה"כ</span>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-slate-800">{filteredByTime.length}</div>
          <div className="text-xs text-slate-400 font-bold mt-1">לידים</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-md hover:shadow-lg transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-sky-100 rounded-xl text-sky-600 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <span className="text-[10px] font-black text-sky-400 uppercase tracking-wider">חדש</span>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-slate-800">{filteredByTime.filter((l) => l.status === 1).length}</div>
          <div className="text-xs text-slate-400 font-bold mt-1">ממתינים לטיפול</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-md hover:shadow-lg transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-amber-100 rounded-xl text-amber-600 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            </div>
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">בתהליך</span>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-slate-800">{filteredByTime.filter((l) => l.status === 2).length}</div>
          <div className="text-xs text-slate-400 font-bold mt-1">בשלב משא ומתן</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-md hover:shadow-lg transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-600 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">נסגר</span>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-slate-800">{filteredByTime.filter((l) => l.status === 3).length}</div>
          <div className="text-xs text-slate-400 font-bold mt-1">עסקאות שנסגרו</div>
        </div>
      </div>

      {/* Filters + Add Button */}
      <div className="flex flex-col sm:flex-row gap-2 lg:gap-3 items-stretch sm:items-center bg-white p-3 rounded-xl lg:rounded-2xl border shadow-sm">
        <div className="relative flex-1">
          <Search
            className="absolute right-3 lg:right-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
          />
          <input
            type="text"
            placeholder="חיפוש..."
            className="w-full pr-9 lg:pr-10 pl-3 lg:pl-4 py-2.5 lg:py-3 bg-slate-50 border-none rounded-lg lg:rounded-xl outline-none font-bold text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 bg-slate-50 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg lg:rounded-xl border border-slate-100">
          <Filter size={16} className="text-slate-400" />
          <select
            className="bg-transparent border-none outline-none font-black text-slate-600 cursor-pointer text-xs lg:text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">הכל</option>
            {Object.entries(STATUSES).map(([val, { label }]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => {
            setEditingLead(newLeadTemplate);
            setIsModalOpen(true);
          }}
          className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white px-5 py-2.5 lg:py-3 rounded-lg lg:rounded-xl shadow-md shadow-pink-200 hover:shadow-lg hover:shadow-pink-300 font-black flex items-center justify-center gap-2 transition-all active:scale-95 hover:-translate-y-0.5 text-sm whitespace-nowrap"
        >
          <Plus size={18} /> הוספת ליד
        </button>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden">
        {/* Main Table */}
        <div
          ref={tableScrollRef}
          id="leads-table-scroll"
          className="overflow-x-auto select-none"
          style={{
            WebkitOverflowScrolling: "touch",
            touchAction: "pan-x pan-y",
          }}
          onScroll={(e) => {
            const topScroll = e.currentTarget.previousElementSibling;
            if (topScroll) topScroll.scrollLeft = e.currentTarget.scrollLeft;
          }}
        >
          <table className="w-full text-right text-sm whitespace-nowrap">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr className="text-slate-400 font-black">
                <th
                  onClick={() => requestSort("regDate")}
                  className="p-5 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  תאריך <SortIcon columnKey="regDate" config={sortConfig} />
                </th>
                <th className="p-5">סטטוס</th>
                <th
                  onClick={() => requestSort("name")}
                  className="p-5 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  לקוח <SortIcon columnKey="name" config={sortConfig} />
                </th>
                <th className="p-5">פרטי קשר</th>
                <th className="p-5">מקור</th>
                <th className="p-5">סוג האירוע</th>
                <th className="p-5">עיר</th>
                <th className="p-5">גיל ומקצוע</th>
                <th className="p-5">הצעה</th>
                <th className="p-5">שיחה חוזרת</th>
                <th className="p-5">אירוע 1</th>
                <th className="p-5">אירוע 2</th>
                <th className="p-5 text-center">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sortedAndFilteredLeads.map((lead) => {
                const statusRowBg = {
                  1: "hover:bg-blue-50/40",
                  2: "hover:bg-amber-50/40",
                  3: "hover:bg-emerald-50/40",
                  4: "hover:bg-rose-50/30",
                }[lead.status] || "hover:bg-slate-50/50";
                const avatarColors = {
                  1: "bg-blue-100 text-blue-700",
                  2: "bg-amber-100 text-amber-700",
                  3: "bg-emerald-100 text-emerald-700",
                  4: "bg-rose-100 text-rose-700",
                }[lead.status] || "bg-pink-100 text-pink-700";
                return (
                <tr
                  key={lead.id}
                  className={`transition-colors duration-150 group ${statusRowBg}`}
                >
                  <td className="p-5">
                    <div className="font-bold text-slate-400">
                      {formatIsraeliDate(lead.regDate) || "לא הוזן"}
                    </div>
                    {lead.regTime && (
                      <div className="text-xs text-slate-300 font-semibold mt-0.5">
                        {lead.regTime}
                      </div>
                    )}
                  </td>
                  <td className="p-5">
                    <StatusDropdown
                      lead={lead}
                      statusDropdownOpen={statusDropdownOpen}
                      setStatusDropdownOpen={setStatusDropdownOpen}
                      handleQuickStatusChange={handleQuickStatusChange}
                      getDropdownPosition={getDropdownPosition}
                    />
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full ${avatarColors} font-black text-xs flex items-center justify-center flex-shrink-0`}>
                        {(lead.name || "?")[0]}
                      </div>
                      <button
                        onClick={() => {
                          setEditingLead(lead);
                          setIsModalOpen(true);
                        }}
                        className="p-1 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors active:scale-95 flex-shrink-0"
                        title="מידע מלא"
                      >
                        <Info size={14} />
                      </button>
                      <div className="font-black text-slate-800 text-base">
                        {lead.name || "ללא שם"}
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5 font-bold text-slate-600">
                        <Phone size={12} className="text-pink-400" />
                        {lead.phone || "חסר"}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold italic">
                        <AtSign size={12} /> {lead.email || "אין"}
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black border inline-block ${
                        SOURCES[lead.source]?.color || SOURCES["אחר"].color
                      }`}
                    >
                      {lead.source}
                    </span>
                  </td>
                  <td className="p-5">
                    <EventTypeDropdown
                      lead={lead}
                      eventTypeDropdownOpen={eventTypeDropdownOpen}
                      setEventTypeDropdownOpen={setEventTypeDropdownOpen}
                      handleQuickEventTypeChange={handleQuickEventTypeChange}
                      getDropdownPosition={getDropdownPosition}
                    />
                  </td>
                  <td className="p-5 font-bold text-slate-500">
                    {lead.city || "לא ידוע"}
                  </td>
                  <td className="p-5">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-800 text-sm">
                        {lead.age || "-"}
                      </span>
                      <span className="text-slate-400 font-bold text-xs">
                        {lead.job || "-"}
                      </span>
                    </div>
                  </td>
                  <td className="p-5 font-black text-pink-600">
                    ₪{lead.quote || 0}
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-1.5 font-bold text-blue-600 text-xs">
                      📞 {formatIsraeliDate(lead.nextCallDate) || "אין"}
                    </div>
                  </td>
                  <td className="p-5 font-bold text-emerald-600 text-xs">
                    {formatIsraeliDate(lead.eventDate) || "טרם נקבע"}
                  </td>
                  <td className="p-5">
                    {lead.eventType === "מאפס למקצוענית" &&
                    lead.status === 3 &&
                    lead.event2Date ? (
                      <span className="font-bold text-purple-600 text-xs">
                        🎂 {formatIsraeliDate(lead.event2Date)}
                      </span>
                    ) : (
                      <span className="text-slate-300 text-xs">-</span>
                    )}
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
                            await deleteLead(lead.id);
                        }}
                        className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {sortedAndFilteredLeads.map((lead) => (
          <MobileLeadCard
            key={lead.id}
            lead={lead}
            statusDropdownOpen={statusDropdownOpen}
            setStatusDropdownOpen={setStatusDropdownOpen}
            handleQuickStatusChange={handleQuickStatusChange}
            onEdit={() => {
              setEditingLead(lead);
              setIsModalOpen(true);
            }}
            onDelete={async () => {
              if (window.confirm("למחוק את הליד?")) await deleteLead(lead.id);
            }}
          />
        ))}

        {sortedAndFilteredLeads.length === 0 && (
          <div className="text-center py-16 text-slate-400 bg-white rounded-2xl">
            <Search size={40} className="mx-auto mb-3 opacity-20" />
            <p className="font-bold">אין לידים להצגה</p>
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Modal */}
      {isModalOpen && editingLead && (
        <LeadModal
          lead={editingLead}
          onSave={handleSaveLead}
          onClose={() => {
            setIsModalOpen(false);
            setEditingLead(null);
            setFormError("");
          }}
          error={formError}
          onOpenPayments={(formData, setFormData) => {
            setCurrentFormData(formData);
            setCurrentSetFormData(() => setFormData);
            setIsPaymentsModalOpen(true);
          }}
        />
      )}
      {isPaymentsModalOpen && currentFormData && currentSetFormData && (
        <PaymentsModal
          totalAmount={currentFormData.quote}
          payments={currentFormData.payments || []}
          onSave={(payments) => {
            currentSetFormData({ ...currentFormData, payments });
            setIsPaymentsModalOpen(false);
            setCurrentFormData(null);
            setCurrentSetFormData(null);
          }}
          onClose={() => {
            setIsPaymentsModalOpen(false);
            setCurrentFormData(null);
            setCurrentSetFormData(null);
          }}
        />
      )}
    </div>
  );
}

// Mobile Lead Card
const MobileLeadCard = ({
  lead,
  statusDropdownOpen,
  setStatusDropdownOpen,
  handleQuickStatusChange,
  onEdit,
  onDelete,
}) => (
  <div className="bg-white rounded-2xl p-4 border-2 border-slate-100 shadow-sm active:scale-[0.98] transition-all">
    {/* Header */}
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <button
            onClick={onEdit}
            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors active:scale-95 flex-shrink-0"
            title="מידע מלא"
          >
            <Info size={18} />
          </button>
          <h3 className="font-black text-slate-800 text-lg truncate flex-1">
            {lead.name || "ללא שם"}
          </h3>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusDropdown
            lead={lead}
            statusDropdownOpen={statusDropdownOpen}
            setStatusDropdownOpen={setStatusDropdownOpen}
            handleQuickStatusChange={handleQuickStatusChange}
            getDropdownPosition={() => "bottom"}
          />
          <span
            className={`px-2 py-1 rounded-lg text-[9px] font-black border ${
              SOURCES[lead.source]?.color || SOURCES["אחר"].color
            }`}
          >
            {lead.source}
          </span>
          {lead.eventType && (
            <span
              className={`px-2 py-1 rounded-lg text-[9px] font-black border ${
                EVENT_TYPES[lead.eventType]?.color || EVENT_TYPES["אחר"].color
              }`}
            >
              {lead.eventType}
            </span>
          )}
        </div>
      </div>
      <div className="font-black text-pink-600 text-xl flex-shrink-0 ml-2">
        ₪{lead.quote || 0}
      </div>
    </div>

    {/* Contact Info */}
    <div className="space-y-2 mb-3">
      <div
        className="flex items-center gap-2 text-sm w-fit cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          if (lead.phone) window.location.href = `tel:${lead.phone}`;
        }}
      >
        <Phone size={14} className="text-pink-400 flex-shrink-0" />
        <span className="font-bold text-pink-600 underline decoration-pink-200">
          {lead.phone || "חסר"}
        </span>
      </div>
      {lead.email && (
        <div className="flex items-center gap-2 text-xs">
          <AtSign size={12} className="text-slate-400 flex-shrink-0" />
          <span className="text-slate-500 truncate">{lead.email}</span>
        </div>
      )}
      {lead.city && (
        <div className="flex items-center gap-2 text-xs">
          <MapPin size={12} className="text-slate-400 flex-shrink-0" />
          <span className="text-slate-500">{lead.city}</span>
        </div>
      )}
      {lead.regDate && (
        <div className="text-xs text-slate-400 font-semibold">
          נרשם: {formatIsraeliDate(lead.regDate)}
          {lead.regTime && <span className="mr-1"> | {lead.regTime}</span>}
        </div>
      )}
    </div>

    {/* Dates */}
    <div className="flex gap-2 mb-3 flex-wrap">
      {lead.nextCallDate && (
        <div className="flex-1 min-w-[100px] bg-blue-50 p-2 rounded-lg">
          <div className="text-[9px] text-blue-600 font-bold mb-0.5">
            שיחה חוזרת
          </div>
          <div className="text-xs font-black text-blue-700">
            {formatIsraeliDate(lead.nextCallDate)}
          </div>
        </div>
      )}
      {lead.eventDate && (
        <div className="flex-1 min-w-[100px] bg-emerald-50 p-2 rounded-lg">
          <div className="text-[9px] text-emerald-600 font-bold mb-0.5">
            אירוע 1
          </div>
          <div className="text-xs font-black text-emerald-700">
            {formatIsraeliDate(lead.eventDate)}
          </div>
        </div>
      )}
      {lead.eventType === "מאפס למקצוענית" &&
        lead.status === 3 &&
        lead.event2Date && (
          <div className="flex-1 min-w-[100px] bg-purple-50 p-2 rounded-lg">
            <div className="text-[9px] text-purple-600 font-bold mb-0.5">
              🎂 אירוע 2
            </div>
            <div className="text-xs font-black text-purple-700">
              {formatIsraeliDate(lead.event2Date)}
            </div>
          </div>
        )}
    </div>

    {/* Actions */}
    <div className="flex gap-2 pt-3 border-t border-slate-100">
      <button
        onClick={onEdit}
        className="flex-1 bg-blue-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        <Edit2 size={16} />
        ערוך
      </button>
      <button
        onClick={onDelete}
        className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors active:scale-95"
      >
        <Trash2 size={18} />
      </button>
    </div>
  </div>
);

// Status Dropdown
const StatusDropdown = ({
  lead,
  statusDropdownOpen,
  setStatusDropdownOpen,
  handleQuickStatusChange,
  getDropdownPosition,
}) => {
  const [buttonEl, setButtonEl] = useState(null);

  return (
    <div className="relative">
      <button
        ref={(el) => setButtonEl(el)}
        onClick={() => {
          const newOpen = statusDropdownOpen === lead.id ? null : lead.id;
          setStatusDropdownOpen(newOpen);
        }}
        className={`px-2.5 py-1 rounded-full text-[9px] lg:text-[10px] font-black border flex items-center gap-1.5 w-fit cursor-pointer hover:opacity-80 transition-all ${
          STATUSES[lead.status]?.color
        }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${STATUSES[lead.status]?.dot}`}
        ></span>
        {STATUSES[lead.status]?.label}
        <span className="text-[8px] opacity-50">▼</span>
      </button>

      {statusDropdownOpen === lead.id && (
        <div
          className={`absolute left-0 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 min-w-[120px] animate-in fade-in duration-200 ${
            getDropdownPosition(buttonEl) === "top"
              ? "bottom-full mb-1"
              : "top-full mt-1"
          }`}
        >
          {Object.entries(STATUSES).map(([statusKey, statusVal]) => (
            <button
              key={statusKey}
              onClick={() =>
                handleQuickStatusChange(lead.id, Number(statusKey))
              }
              className={`w-full text-right px-3 py-2 hover:bg-slate-50 transition-all flex items-center gap-2 text-[11px] font-black ${
                Number(lead.status) === Number(statusKey) ? "bg-slate-50" : ""
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${statusVal.dot}`}></span>
              {statusVal.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Event Type Dropdown
const EventTypeDropdown = ({
  lead,
  eventTypeDropdownOpen,
  setEventTypeDropdownOpen,
  handleQuickEventTypeChange,
  getDropdownPosition,
}) => {
  const [buttonEl, setButtonEl] = useState(null);
  const currentEventType = lead.eventType || "אחר";

  return (
    <div className="relative">
      <button
        ref={(el) => setButtonEl(el)}
        onClick={() => {
          const newOpen = eventTypeDropdownOpen === lead.id ? null : lead.id;
          setEventTypeDropdownOpen(newOpen);
        }}
        className={`px-2.5 py-1 rounded-lg text-[10px] font-black border flex items-center gap-1.5 w-fit cursor-pointer hover:opacity-80 transition-all ${
          EVENT_TYPES[currentEventType]?.color || EVENT_TYPES["אחר"].color
        }`}
      >
        {currentEventType}
        <span className="text-[8px] opacity-50">▼</span>
      </button>

      {eventTypeDropdownOpen === lead.id && (
        <div
          className={`absolute left-0 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 min-w-[150px] animate-in fade-in duration-200 ${
            getDropdownPosition(buttonEl) === "top"
              ? "bottom-full mb-1"
              : "top-full mt-1"
          }`}
        >
          {Object.entries(EVENT_TYPES).map(([typeKey, typeVal]) => (
            <button
              key={typeKey}
              onClick={() => handleQuickEventTypeChange(lead.id, typeKey)}
              className={`w-full text-right px-3 py-2 hover:bg-slate-50 transition-all flex items-center gap-2 text-[11px] font-black ${
                lead.eventType === typeKey ? "bg-slate-50" : ""
              }`}
            >
              {typeKey}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Date Range Picker (Booking.com style) ───────────────────────────────────

const HEBREW_MONTHS = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
];
const WEEK_DAYS = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

const toDateStr = (y, m, d) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

const DateRangePicker = ({ value, onChange, onApply, active }) => {
  const today = new Date();
  const [isOpen, setIsOpen] = useState(false);
  const [tempFrom, setTempFrom] = useState(value.from || "");
  const [tempTo, setTempTo] = useState(value.to || "");
  const [hoverDate, setHoverDate] = useState(null);
  const [selectingEnd, setSelectingEnd] = useState(false);
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const popupRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  const navMonth = (dir) => {
    let m = viewMonth + dir;
    let y = viewYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setViewMonth(m);
    setViewYear(y);
  };

  const handleDayClick = (dateStr) => {
    if (!tempFrom || (!selectingEnd && tempFrom)) {
      setTempFrom(dateStr);
      setTempTo("");
      setSelectingEnd(true);
    } else {
      const from = tempFrom <= dateStr ? tempFrom : dateStr;
      const to = tempFrom <= dateStr ? dateStr : tempFrom;
      setTempTo(to);
      setTempFrom(from);
      setSelectingEnd(false);
    }
  };

  const getEffectiveRange = () => {
    const from = tempFrom;
    const to = selectingEnd && hoverDate
      ? (tempFrom <= hoverDate ? hoverDate : tempFrom)
      : tempTo;
    const actualFrom = selectingEnd && hoverDate && hoverDate < tempFrom ? hoverDate : from;
    return { from: actualFrom, to };
  };

  const renderMonth = (year, month) => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const { from: rFrom, to: rTo } = getEffectiveRange();

    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    return (
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-3 px-1">
          <button
            onClick={() => navMonth(-1)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
          <span className="text-sm font-black text-slate-700">
            {HEBREW_MONTHS[month]} {year}
          </span>
          <button
            onClick={() => navMonth(1)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
        </div>

        <div className="grid grid-cols-7 mb-1">
          {WEEK_DAYS.map((d) => (
            <div key={d} className="text-center text-[10px] font-black text-slate-400 py-1">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (!day) return <div key={`e-${idx}`} />;
            const dateStr = toDateStr(year, month, day);
            const isStart = dateStr === rFrom;
            const isEnd = dateStr === rTo;
            const inRange = rFrom && rTo && dateStr > rFrom && dateStr < rTo;
            const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());
            const isToday = dateStr === todayStr;
            const isFuture = dateStr > todayStr;

            let dayClass = "relative flex items-center justify-center h-9 text-sm font-bold cursor-pointer select-none transition-all ";

            if (isStart || isEnd) {
              dayClass += "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md z-10 ";
              dayClass += isStart ? "rounded-r-full " : "rounded-l-full ";
            } else if (inRange) {
              dayClass += "bg-pink-50 text-pink-700 ";
            } else if (isFuture) {
              dayClass += "text-slate-300 cursor-not-allowed ";
            } else {
              dayClass += "text-slate-700 hover:bg-pink-100 rounded-full ";
            }

            if (isToday && !isStart && !isEnd) {
              dayClass += "ring-2 ring-pink-300 ring-inset rounded-full ";
            }

            return (
              <div
                key={dateStr}
                className={dayClass}
                onClick={() => !isFuture && handleDayClick(dateStr)}
                onMouseEnter={() => selectingEnd && setHoverDate(dateStr)}
                onMouseLeave={() => setHoverDate(null)}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
  const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;

  const labelFrom = tempFrom ? formatIsraeliDate(tempFrom) : "בחרי תאריך";
  const labelTo = tempTo ? formatIsraeliDate(tempTo) : selectingEnd ? "בחרי סיום" : "בחרי תאריך";

  const handleApply = () => {
    if (!tempFrom || !tempTo) return;
    onChange({ from: tempFrom, to: tempTo });
    onApply();
    setIsOpen(false);
  };

  const handleClear = () => {
    setTempFrom("");
    setTempTo("");
    setSelectingEnd(false);
    onChange({ from: "", to: "" });
  };

  return (
    <div className="relative" ref={popupRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 lg:px-4 py-2 rounded-lg font-black text-xs lg:text-sm transition-all active:scale-95 ${
          active
            ? "bg-pink-600 text-white shadow-lg"
            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
        }`}
      >
        <CalendarIcon size={14} />
        {active && tempFrom && tempTo
          ? `${formatIsraeliDate(tempFrom)} – ${formatIsraeliDate(tempTo)}`
          : "מותאם אישית"}
      </button>

      {isOpen && (
        <div
          className="absolute top-full mt-2 z-50 bg-white rounded-2xl shadow-2xl shadow-slate-200/80 border border-slate-100 overflow-hidden"
          style={{ left: 0, width: "min(640px, calc(100vw - 16px))" }}
        >
          {/* Header */}
          <div className="bg-gradient-to-l from-pink-500 to-rose-500 px-5 py-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold opacity-80 mb-1">
                  {selectingEnd ? "בחרי תאריך סיום" : "בחרי תאריך התחלה"}
                </p>
                <div className="flex items-center gap-2 text-sm font-black">
                  <span className="bg-white/20 rounded-lg px-3 py-1">{labelFrom}</span>
                  <span className="opacity-60">→</span>
                  <span className={`rounded-lg px-3 py-1 ${tempTo ? "bg-white/20" : "bg-white/10 opacity-60"}`}>
                    {labelTo}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="p-4 flex gap-4">
            {renderMonth(viewYear, viewMonth)}
            <div className="w-px bg-slate-100 hidden sm:block" />
            <div className="hidden sm:block flex-1 min-w-0">
              {renderMonth(nextYear, nextMonth)}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50">
            <button
              onClick={handleClear}
              className="text-xs font-black text-slate-400 hover:text-slate-600 transition-colors"
            >
              נקה
            </button>
            <button
              onClick={handleApply}
              disabled={!tempFrom || !tempTo}
              className="px-5 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-black rounded-xl shadow-md shadow-pink-200 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:translate-y-0 disabled:shadow-none"
            >
              הצג תוצאות
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Sort Icon
const SortIcon = ({ columnKey, config }) => {
  if (config.key !== columnKey)
    return <ArrowUpDown size={12} className="opacity-20 inline ml-1" />;
  return config.direction === "asc" ? (
    <ChevronUp size={12} className="inline ml-1 text-pink-500" />
  ) : (
    <ChevronDown size={12} className="inline ml-1 text-pink-500" />
  );
};

// Lead Modal (Responsive) - OPTIMIZED FINAL
const LeadModal = ({ lead, onSave, onClose, error, onOpenPayments }) => {
  const [formData, setFormData] = useState(lead);

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl my-8 sm:my-8 max-h-[calc(100vh-16rem)] sm:max-h-[90vh] rounded-2xl shadow-2xl flex flex-col mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Compact */}
        <div className="sticky top-0 bg-white px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 flex justify-between items-center z-20 gap-3 flex-shrink-0 rounded-t-2xl">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 transition-all flex-shrink-0"
            >
              <X size={20} />
            </button>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-black text-pink-600 truncate">
                {formData.id ? `עריכת ${formData.name || "לקוחה"}` : "ליד חדש"}
              </h3>
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 italic">
                SHIRSHIZ CRM
              </p>
            </div>
          </div>
          <button
            onClick={() => onSave(formData)}
            className="hidden sm:flex bg-pink-600 text-white px-6 py-2 rounded-xl shadow-lg font-black hover:bg-pink-700 transition-all active:scale-95 text-sm flex-shrink-0"
          >
            שמור
          </button>
        </div>

        {/* Form - Scrollable with reduced bottom padding */}
        <div className="overflow-y-auto flex-1">
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 pb-6 sm:pb-4">
            {error && (
              <div className="bg-rose-50 text-rose-600 p-3 rounded-xl flex items-center gap-2 font-black text-xs border border-rose-100">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Main Grid - Compact */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              {/* Contact */}
              <div className="space-y-3">
                <SectionTitle icon={<User size={12} />} title="פרטי קשר" />
                <div className="space-y-2.5">
                  <InputField
                    label="שם *"
                    value={formData.name}
                    onChange={(v) => setFormData({ ...formData, name: v })}
                    placeholder="שם מלא"
                  />
                  <InputField
                    label="טלפון *"
                    type="tel"
                    value={formData.phone}
                    onChange={(v) => setFormData({ ...formData, phone: v })}
                    placeholder="05XXXXXXXX"
                  />
                  <InputField
                    label="מייל"
                    value={formData.email}
                    onChange={(v) => setFormData({ ...formData, email: v })}
                    placeholder="email@example.com"
                    icon={<AtSign size={12} />}
                  />
                </div>
              </div>

              {/* Status */}
              <div className="space-y-3">
                <SectionTitle
                  icon={<MessageCircle size={12} />}
                  title="סטטוס"
                />
                <div className="space-y-2.5">
                  <SelectField
                    label="סטטוס"
                    value={formData.status}
                    onChange={(v) => setFormData({ ...formData, status: v })}
                    options={Object.entries(STATUSES).map(([k, v]) => ({
                      val: k,
                      label: v.label,
                    }))}
                    dynamicClass={STATUSES[formData.status]?.color}
                  />
                  <SelectField
                    label="מקור"
                    value={formData.source}
                    onChange={(v) => setFormData({ ...formData, source: v })}
                    options={Object.keys(SOURCES).map((s) => ({
                      val: s,
                      label: s,
                    }))}
                    dynamicClass={
                      SOURCES[formData.source]?.color || SOURCES["אחר"].color
                    }
                  />
                  <SelectField
                    label="סוג האירוע"
                    value={formData.eventType || "אחר"}
                    onChange={(v) => setFormData({ ...formData, eventType: v })}
                    options={Object.keys(EVENT_TYPES).map((s) => ({
                      val: s,
                      label: s,
                    }))}
                    dynamicClass={
                      EVENT_TYPES[formData.eventType || "אחר"]?.color
                    }
                  />
                  <div>
                    <label className="text-[9px] font-black text-slate-500 mb-1 block px-0.5">
                      הצעה (₪)
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <input
                          type="number"
                          placeholder="0"
                          className="w-full p-2.5 bg-slate-50 border-2 border-transparent focus:border-pink-200 rounded-lg outline-none font-bold text-slate-800 text-sm transition-all"
                          value={formData.quote || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, quote: e.target.value })
                          }
                        />
                      </div>
                      <button
                        onClick={() => {
                          if (!formData.quote || formData.quote <= 0) {
                            alert("נא להזין הצעת מחיר תחילה");
                            return;
                          }
                          onOpenPayments(formData, setFormData);
                        }}
                        className="px-3 py-2.5 bg-emerald-50 border-2 border-emerald-200 rounded-lg font-black text-emerald-700 hover:bg-emerald-100 transition-all active:scale-95 flex items-center gap-1.5 whitespace-nowrap text-sm"
                        title="ניהול תשלומים"
                      >
                        💰
                        {formData.payments && formData.payments.length > 0 && (
                          <span className="bg-emerald-600 text-white px-1.5 py-0.5 rounded-full text-[9px] font-black">
                            {formData.payments.length}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Demographics */}
              <div className="space-y-3">
                <SectionTitle icon={<MapPin size={12} />} title="פרטים" />
                <div className="space-y-2.5">
                  <InputField
                    label="עיר"
                    value={formData.city}
                    onChange={(v) => setFormData({ ...formData, city: v })}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <InputField
                      label="גיל"
                      value={formData.age}
                      onChange={(v) => setFormData({ ...formData, age: v })}
                    />
                    <InputField
                      label="מקצוע"
                      value={formData.job}
                      onChange={(v) => setFormData({ ...formData, job: v })}
                    />
                  </div>
                  <InputField
                    label="תאריך רישום"
                    type="date"
                    value={formData.regDate}
                    onChange={(v) => setFormData({ ...formData, regDate: v })}
                  />
                </div>
              </div>
            </div>

            {/* Dates and Notes - Reduced spacing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-3 border-t border-slate-100">
              <div className="space-y-2.5">
                <SectionTitle
                  icon={<CalendarIcon size={12} />}
                  title="תאריכים"
                />
                <div className="grid grid-cols-2 gap-2">
                  <InputField
                    label="שיחה חוזרת"
                    type="date"
                    value={formData.nextCallDate}
                    onChange={(v) =>
                      setFormData({ ...formData, nextCallDate: v })
                    }
                  />
                  <InputField
                    label="אירוע ראשון"
                    type="date"
                    value={formData.eventDate}
                    onChange={(v) => setFormData({ ...formData, eventDate: v })}
                  />
                </div>
                {formData.eventType === "מאפס למקצוענית" && (
                  <div className="pt-1">
                    <InputField
                      label="🎂 אירוע שני"
                      type="date"
                      value={formData.event2Date}
                      onChange={(v) =>
                        setFormData({ ...formData, event2Date: v })
                      }
                    />
                  </div>
                )}
              </div>
              <div className="space-y-2.5">
                <SectionTitle
                  icon={<MessageCircle size={12} />}
                  title="הערות"
                />
                <textarea
                  className="w-full p-3 bg-slate-50 border-none rounded-lg outline-none font-bold text-sm text-slate-700 focus:ring-2 focus:ring-pink-100 min-h-[80px] resize-none"
                  placeholder="סיכום..."
                  value={formData.callDetails || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, callDetails: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Fixed at Bottom (Mobile Only) */}
        <div className="sm:hidden border-t border-slate-100 p-3 bg-white flex gap-2.5 flex-shrink-0 rounded-b-2xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button
            onClick={() => onSave(formData)}
            className="flex-1 bg-pink-600 text-white py-2.5 rounded-lg font-black hover:bg-pink-700 transition-all active:scale-95 text-sm"
          >
            שמור
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-lg font-bold hover:bg-slate-200 transition-all active:scale-95 text-sm"
          >
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
};

// Form Components - Compact
const SectionTitle = ({ icon, title }) => (
  <div className="flex items-center gap-1.5 text-slate-400 font-black text-[9px] sm:text-[10px] uppercase tracking-wider pb-0.5">
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
    <label className="text-[9px] font-black text-slate-500 mb-1 block px-0.5">
      {label}
    </label>
    <div className="relative">
      {icon && (
        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300">
          {icon}
        </div>
      )}
      <input
        type={type}
        placeholder={placeholder}
        dir={type === "tel" ? "ltr" : undefined}
        className={`w-full px-2 py-2.5 bg-slate-50 border-2 border-transparent focus:border-pink-200 rounded-lg outline-none font-bold text-slate-800 text-sm transition-all ${
          type === "tel" ? "text-right" : ""
        } ${icon ? "pl-9" : ""}`}
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
}) => {
  const isWhiteText = dynamicClass?.includes("bg-slate-800");

  return (
    <div>
      <label className="text-[9px] font-black text-slate-500 mb-1 block px-0.5">
        {label}
      </label>
      <div
        className={`p-0.5 rounded-lg border-2 transition-all ${
          dynamicClass || "bg-slate-50 border-transparent"
        }`}
      >
        <select
          className={`w-full p-2 bg-transparent font-black outline-none cursor-pointer text-sm ${
            isWhiteText ? "text-white" : "text-slate-800"
          }`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((opt) => (
            <option
              key={opt.val}
              value={opt.val}
              className="bg-white text-slate-800"
            >
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
