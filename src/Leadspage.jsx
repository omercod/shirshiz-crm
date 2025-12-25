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
  Calendar,
  Calendar as CalendarIcon,
} from "lucide-react";
import { useAppContext, STATUSES, SOURCES, EVENT_TYPES } from "./App";

const formatIsraeliDate = (dateStr) => {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
};

export default function LeadsPage() {
  const { leads, addLead, updateLead, deleteLead } = useAppContext();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [customDateRange, setCustomDateRange] = useState({ from: "", to: "" });
  const [showCustomPicker, setShowCustomPicker] = useState(false);
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
    const limit = new Date();

    if (timeFilter === "day") {
      const today = new Date().toISOString().split("T")[0];
      return leads.filter((l) => l.regDate === today);
    }

    if (timeFilter === "custom") {
      if (customDateRange.from && customDateRange.to) {
        const fromDate = new Date(customDateRange.from);
        const toDate = new Date(customDateRange.to);
        return leads.filter((l) => {
          const leadDate = new Date(l.regDate);
          return leadDate >= fromDate && leadDate <= toDate;
        });
      }
      return leads;
    }

    if (timeFilter === "week") limit.setDate(now.getDate() - 7);
    if (timeFilter === "month") limit.setMonth(now.getMonth() - 1);

    return leads.filter((l) => new Date(l.regDate) >= limit);
  }, [leads, timeFilter, customDateRange]);

  const sortedAndFilteredLeads = useMemo(() => {
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
  };

  return (
    <div className="space-y-4 lg:space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <header className="flex flex-col gap-4 mb-6 mt-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <h2 className="text-2xl lg:text-3xl font-black text-slate-800">
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
              { val: "week", label: "שבוע" },
              { val: "month", label: "חודש" },
              { val: "all", label: "הכל" },
            ].map((opt) => (
              <button
                key={opt.val}
                onClick={() => {
                  setTimeFilter(opt.val);
                  setShowCustomPicker(false);
                }}
                className={`px-3 lg:px-4 py-2 rounded-lg font-black text-xs lg:text-sm transition-all active:scale-95 ${
                  timeFilter === opt.val
                    ? "bg-pink-600 text-white shadow-lg"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
            <button
              onClick={() => {
                setTimeFilter("custom");
                setShowCustomPicker(!showCustomPicker);
              }}
              className={`flex items-center gap-1.5 px-3 lg:px-4 py-2 rounded-lg font-black text-xs lg:text-sm transition-all active:scale-95 ${
                timeFilter === "custom"
                  ? "bg-pink-600 text-white shadow-lg"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Calendar size={14} />
              מותאם אישית
            </button>
          </div>
        </div>

        {/* Custom Date Picker */}
        {showCustomPicker && (
          <div className="bg-white p-4 rounded-xl border shadow-sm animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="text-xs font-black text-slate-500 mb-2 block">
                  מתאריך
                </label>
                <input
                  type="date"
                  value={customDateRange.from}
                  onChange={(e) =>
                    setCustomDateRange({
                      ...customDateRange,
                      from: e.target.value,
                    })
                  }
                  className="w-full p-2.5 bg-slate-50 border-2 border-slate-200 rounded-lg outline-none font-bold text-sm focus:border-pink-400"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-black text-slate-500 mb-2 block">
                  עד תאריך
                </label>
                <input
                  type="date"
                  value={customDateRange.to}
                  onChange={(e) =>
                    setCustomDateRange({
                      ...customDateRange,
                      to: e.target.value,
                    })
                  }
                  className="w-full p-2.5 bg-slate-50 border-2 border-slate-200 rounded-lg outline-none font-bold text-sm focus:border-pink-400"
                />
              </div>
              <button
                onClick={() => {
                  if (customDateRange.from && customDateRange.to) {
                    setShowCustomPicker(false);
                  }
                }}
                disabled={!customDateRange.from || !customDateRange.to}
                className="mt-7 px-4 py-2.5 bg-pink-600 text-white rounded-lg font-black hover:bg-pink-700 disabled:bg-slate-300 transition-all text-sm"
              >
                הצג
              </button>
            </div>
            {customDateRange.from && customDateRange.to && (
              <div className="mt-3 text-xs font-bold text-slate-500 text-center">
                מציג: {formatIsraeliDate(customDateRange.from)} -{" "}
                {formatIsraeliDate(customDateRange.to)}
              </div>
            )}
          </div>
        )}

        {/* Add Lead Button - Mobile */}
        <button
          onClick={() => {
            setEditingLead(newLeadTemplate);
            setIsModalOpen(true);
          }}
          className="md:hidden bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-xl shadow-xl font-black flex items-center justify-center gap-2 transition-all active:scale-95 text-sm"
        >
          <Plus size={20} /> הוספת ליד
        </button>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        <div className="bg-blue-50 p-3 lg:p-4 rounded-xl border border-blue-100">
          <div className="text-xs lg:text-sm font-black uppercase opacity-80 mb-1 text-blue-600">
            סה״כ לידים
          </div>
          <div className="text-xl lg:text-3xl font-black text-blue-600">
            {filteredByTime.length}
          </div>
        </div>
        <div className="bg-blue-50 p-3 lg:p-4 rounded-xl border border-blue-100">
          <div className="text-xs lg:text-sm font-black uppercase opacity-80 mb-1 text-blue-600">
            חדש
          </div>
          <div className="text-xl lg:text-3xl font-black text-blue-600">
            {filteredByTime.filter((l) => l.status === 1).length}
          </div>
        </div>
        <div className="bg-amber-50 p-3 lg:p-4 rounded-xl border border-amber-100">
          <div className="text-xs lg:text-sm font-black uppercase opacity-80 mb-1 text-amber-600">
            בתהליך
          </div>
          <div className="text-xl lg:text-3xl font-black text-amber-600">
            {filteredByTime.filter((l) => l.status === 2).length}
          </div>
        </div>
        <div className="bg-emerald-50 p-3 lg:p-4 rounded-xl border border-emerald-100">
          <div className="text-xs lg:text-sm font-black uppercase opacity-80 mb-1 text-emerald-600">
            נסגר
          </div>
          <div className="text-xl lg:text-3xl font-black text-emerald-600">
            {filteredByTime.filter((l) => l.status === 3).length}
          </div>
        </div>
      </div>

      {/* Add Lead Button - Desktop Only */}
      <div className="hidden md:flex justify-end mb-4">
        <button
          onClick={() => {
            setEditingLead(newLeadTemplate);
            setIsModalOpen(true);
          }}
          className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-4 rounded-2xl shadow-xl font-black flex items-center gap-2 transition-all active:scale-95"
        >
          <Plus size={20} /> הוספת ליד
        </button>
      </div>

      {/* Filters */}
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
              {sortedAndFilteredLeads.map((lead) => (
                <tr
                  key={lead.id}
                  className="hover:bg-slate-50/50 transition-colors group"
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
                    <div className="font-black text-slate-800 text-base">
                      {lead.name || "ללא שם"}
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
              ))}
            </tbody>
          </table>
        </div>
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
        <h3 className="font-black text-slate-800 text-lg mb-1.5 truncate">
          {lead.name || "ללא שם"}
        </h3>
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
      <div className="flex items-center gap-2 text-sm">
        <Phone size={14} className="text-pink-400 flex-shrink-0" />
        <span className="font-bold text-slate-700">{lead.phone || "חסר"}</span>
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
          {lead.regTime && <span className="mr-2">{lead.regTime}</span>}
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

// Lead Modal (Responsive)
const LeadModal = ({ lead, onSave, onClose, error }) => {
  const [formData, setFormData] = useState(lead);

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end lg:items-center justify-center p-0 lg:p-4">
      <div className="bg-white w-full lg:max-w-4xl h-[95vh] lg:max-h-[90vh] rounded-t-[2rem] lg:rounded-[2.5rem] shadow-2xl flex flex-col animate-in slide-in-from-bottom lg:zoom-in duration-200">
        {/* Header */}
        <div className="bg-white px-4 lg:px-8 py-4 lg:py-6 border-b border-slate-50 flex justify-between items-center z-20 gap-3 flex-shrink-0">
          <div className="flex items-center gap-2 lg:gap-4 flex-1 min-w-0">
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-all flex-shrink-0"
            >
              <X size={20} className="lg:hidden" />
              <X size={24} className="hidden lg:block" />
            </button>
            <div className="min-w-0">
              <h3 className="text-lg lg:text-2xl font-black text-slate-800 truncate">
                {formData.id ? "עדכון לקוחה" : "ליד חדש"}
              </h3>
              <p className="text-[10px] lg:text-xs font-bold text-slate-400 italic">
                SHIRSHIZ CRM
              </p>
            </div>
          </div>
          <button
            onClick={() => onSave(formData)}
            className="bg-pink-600 text-white px-4 lg:px-8 py-2 lg:py-3 rounded-xl shadow-lg font-black hover:bg-pink-700 transition-all active:scale-95 text-sm lg:text-base flex-shrink-0"
          >
            שמור
          </button>
        </div>

        {/* Form */}
        <div className="overflow-y-auto flex-1">
          <div className="p-4 lg:p-8 space-y-6 lg:space-y-8 pb-24">
            {error && (
              <div className="bg-rose-50 text-rose-600 p-3 lg:p-4 rounded-xl lg:rounded-2xl flex items-center gap-2 lg:gap-3 font-black text-xs lg:text-sm border border-rose-100">
                <AlertCircle size={18} className="lg:hidden flex-shrink-0" />
                <AlertCircle
                  size={20}
                  className="hidden lg:block flex-shrink-0"
                />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Contact */}
              <div className="space-y-3 lg:space-y-4">
                <SectionTitle icon={<User size={14} />} title="פרטי קשר" />
                <div className="space-y-3">
                  <InputField
                    label="שם *"
                    value={formData.name}
                    onChange={(v) => setFormData({ ...formData, name: v })}
                    placeholder="שם מלא"
                  />
                  <InputField
                    label="טלפון *"
                    value={formData.phone}
                    onChange={(v) => setFormData({ ...formData, phone: v })}
                    placeholder="05XXXXXXXX"
                  />
                  <InputField
                    label="מייל"
                    value={formData.email}
                    onChange={(v) => setFormData({ ...formData, email: v })}
                    placeholder="email@example.com"
                    icon={<AtSign size={14} />}
                  />
                </div>
              </div>

              {/* Status */}
              <div className="space-y-3 lg:space-y-4">
                <SectionTitle
                  icon={<MessageCircle size={14} />}
                  title="סטטוס"
                />
                <div className="space-y-3">
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
                  <InputField
                    label="הצעה (₪)"
                    type="number"
                    value={formData.quote}
                    onChange={(v) => setFormData({ ...formData, quote: v })}
                  />
                </div>
              </div>

              {/* Demographics */}
              <div className="space-y-3 lg:space-y-4">
                <SectionTitle icon={<MapPin size={14} />} title="פרטים" />
                <div className="space-y-3">
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

            {/* Dates and Notes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 pt-4 lg:pt-6 border-t border-slate-50">
              <div className="space-y-3">
                <SectionTitle
                  icon={<CalendarIcon size={14} />}
                  title="תאריכים"
                />
                <div className="grid grid-cols-2 gap-3">
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

                {/* 🎂 אירוע 2 - רק למי שבאפס למקצוענית + נסגר */}
                {formData.eventType === "מאפס למקצוענית" &&
                  formData.status === 3 && (
                    <div className="pt-2">
                      <InputField
                        label="🎂 אירוע שני (מפגש 2)"
                        type="date"
                        value={formData.event2Date}
                        onChange={(v) =>
                          setFormData({ ...formData, event2Date: v })
                        }
                      />
                    </div>
                  )}
              </div>
              <div className="space-y-3">
                <SectionTitle
                  icon={<MessageCircle size={14} />}
                  title="הערות"
                />
                <textarea
                  className="w-full p-3 lg:p-4 bg-slate-50 border-none rounded-xl lg:rounded-2xl outline-none font-bold text-sm text-slate-700 focus:ring-2 focus:ring-pink-100 min-h-[80px] lg:min-h-[100px] resize-none"
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
      </div>
    </div>
  );
};

// Form Components
const SectionTitle = ({ icon, title }) => (
  <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] lg:text-[11px] uppercase tracking-[0.1em] pb-1">
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
        className={`w-full p-3 lg:p-3.5 bg-slate-50 border-2 border-transparent focus:border-pink-200 rounded-xl outline-none font-bold text-slate-800 text-sm transition-all ${
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
}) => {
  const isWhiteText = dynamicClass?.includes("bg-slate-800");

  return (
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
          className={`w-full p-2.5 lg:p-3 bg-transparent font-black outline-none cursor-pointer text-sm ${
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
