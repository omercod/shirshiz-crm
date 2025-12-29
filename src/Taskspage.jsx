import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Search,
  Edit2,
  Phone,
  Filter,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  AtSign,
  Clock,
  AlertCircle,
  Calendar as CalendarIcon,
  X,
  User,
  MessageCircle,
  MapPin,
  Info,
} from "lucide-react";
import { useAppContext, STATUSES, SOURCES, EVENT_TYPES } from "./App";
import PaymentsModal from "./PaymentsModal";

const formatIsraeliDate = (dateStr) => {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
};

export default function TasksPage() {
  const { leads, updateLead } = useAppContext();

  const [isPaymentsModalOpen, setIsPaymentsModalOpen] = useState(false);
  const [currentFormData, setCurrentFormData] = useState(null);
  const [currentSetFormData, setCurrentSetFormData] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeFilter] = useState("all");
  const [customDateRange] = useState({ from: "", to: "" });
  const [sortConfig, setSortConfig] = useState({
    key: "nextCallDate",
    direction: "asc",
  });
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(null);
  const [eventTypeDropdownOpen, setEventTypeDropdownOpen] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);

  const useDraggableScroll = (ref) => {
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    useEffect(() => {
      const element = ref.current;
      if (!element) return;

      const handleMouseDown = (e) => {
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

  const tableScrollRef = useRef(null);
  useDraggableScroll(tableScrollRef);

  // Helper function: Days until date
  const getDaysUntil = (dateStr) => {
    if (!dateStr) return null;
    const targetDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc")
      direction = "desc";
    setSortConfig({ key, direction });
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

  // Filter: Only "חדש" (1) and "בתהליך" (2)
  const sortedAndFilteredLeads = useMemo(() => {
    let sortableLeads = [...filteredByTime];
    sortableLeads = sortableLeads.filter((lead) => {
      const isActiveStatus =
        Number(lead.status) === 1 || Number(lead.status) === 2;
      const matchesSearch =
        (lead.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.phone || "").includes(searchTerm) ||
        (lead.city || "").toLowerCase().includes(searchTerm.toLowerCase());

      // חישוב דחיפות
      const daysUntil = getDaysUntil(lead.nextCallDate);
      const isUrgent = daysUntil !== null && daysUntil <= 2 && daysUntil >= 0;
      const isMissed = daysUntil !== null && daysUntil < 0 && lead.status === 2;

      // פילטר סטטוס
      let matchesStatus = true;
      if (statusFilter === "urgent") {
        matchesStatus = isUrgent;
      } else if (statusFilter === "missed") {
        matchesStatus = isMissed;
      } else if (statusFilter !== "all") {
        matchesStatus = Number(lead.status) === Number(statusFilter);
      }

      return isActiveStatus && matchesSearch && matchesStatus;
    });

    if (sortConfig.key !== null) {
      sortableLeads.sort((a, b) => {
        let aValue = a[sortConfig.key] || "";
        let bValue = b[sortConfig.key] || "";

        // 🕐 מיון מיוחד לתאריך רישום - כולל שעה!
        if (sortConfig.key === "regDate") {
          const aDateTime = `${a.regDate || ""}T${a.regTime || "00:00"}`;
          const bDateTime = `${b.regDate || ""}T${b.regTime || "00:00"}`;
          aValue = new Date(aDateTime).getTime();
          bValue = new Date(bDateTime).getTime();
        }

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sortableLeads;
  }, [filteredByTime, searchTerm, statusFilter, sortConfig]);

  const today = new Date().toISOString().split("T")[0];
  const urgentCount = sortedAndFilteredLeads.filter((l) => {
    const days = getDaysUntil(l.nextCallDate);
    return days !== null && days <= 2 && days >= 0;
  }).length;
  const missedCount = sortedAndFilteredLeads.filter((l) => {
    const days = getDaysUntil(l.nextCallDate);
    return days !== null && days < 0 && l.status === 2;
  }).length;

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
      alert(error);
      return;
    }

    const result = await updateLead(editingLead.id, leadData);

    if (result.success) {
      setIsModalOpen(false);
      setEditingLead(null);
    } else {
      alert(result.error);
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 lg:gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-black text-slate-800">
            משימות ופולואפים
          </h2>
          <p className="text-slate-400 font-bold text-xs lg:text-sm">
            ניהול מעקבים אחרי לידים פעילים
          </p>
        </div>
        {urgentCount > 0 && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 lg:px-6 py-2 lg:py-3 rounded-xl font-black flex items-center gap-2 text-sm lg:text-base">
            <AlertCircle size={18} className="lg:hidden" />
            <AlertCircle size={20} className="hidden lg:block" />
            <span className="text-xs lg:text-base">
              {urgentCount} משימות דחופות!
            </span>
          </div>
        )}
      </header>

      {/* Filters Row */}
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
            <option value="1">חדש</option>
            <option value="2">בתהליך</option>
            <option value="urgent">🔥 דחוף (יומיים)</option>
            <option value="missed">⏰ לא הספקתי</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
        <div className="bg-blue-50 p-3 lg:p-4 rounded-xl lg:rounded-2xl border border-blue-100">
          <div className="text-[10px] lg:text-sm font-bold text-blue-600 mb-1">
            חדשים
          </div>
          <div className="text-xl lg:text-3xl font-black text-blue-700">
            {
              sortedAndFilteredLeads.filter((l) => Number(l.status) === 1)
                .length
            }
          </div>
        </div>
        <div className="bg-amber-50 p-3 lg:p-4 rounded-xl lg:rounded-2xl border border-amber-100">
          <div className="text-[10px] lg:text-sm font-bold text-amber-600 mb-1">
            בתהליך
          </div>
          <div className="text-xl lg:text-3xl font-black text-amber-700">
            {
              sortedAndFilteredLeads.filter((l) => Number(l.status) === 2)
                .length
            }
          </div>
        </div>
        <div className="bg-rose-50 p-3 lg:p-4 rounded-xl lg:rounded-2xl border border-rose-100">
          <div className="text-[10px] lg:text-sm font-bold text-rose-600 mb-1">
            דחוף (יומיים)
          </div>
          <div className="text-xl lg:text-3xl font-black text-rose-700">
            {urgentCount}
          </div>
        </div>
        <div className="bg-orange-50 p-3 lg:p-4 rounded-xl lg:rounded-2xl border border-orange-100">
          <div className="text-[10px] lg:text-sm font-bold text-orange-600 mb-1">
            לא הספקתי
          </div>
          <div className="text-xl lg:text-3xl font-black text-orange-700">
            {missedCount}
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden">
        {/* Main Table */}
        <div
          ref={tableScrollRef}
          id="tasks-table-scroll"
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
                  תאריך פנייה{" "}
                  <SortIcon columnKey="regDate" config={sortConfig} />
                </th>
                <th
                  onClick={() => requestSort("nextCallDate")}
                  className="p-5 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  שיחה חוזרת{" "}
                  <SortIcon columnKey="nextCallDate" config={sortConfig} />
                </th>
                <th className="p-5">סטטוס</th>
                <th className="p-5">לקוח</th>
                <th className="p-5">פרטי קשר</th>
                <th className="p-5">מקור</th>
                <th className="p-5">סוג האירוע</th>
                <th className="p-5">הצעה</th>
                <th className="p-5">הערות</th>
                <th className="p-5 text-center">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sortedAndFilteredLeads.map((lead) => {
                const daysUntil = getDaysUntil(lead.nextCallDate);
                const isUrgent =
                  daysUntil !== null && daysUntil <= 2 && daysUntil >= 0;
                const isMissed =
                  daysUntil !== null && daysUntil < 0 && lead.status === 2;

                return (
                  <tr
                    key={lead.id}
                    className={`hover:bg-slate-50/50 transition-colors group ${
                      isMissed
                        ? "bg-orange-50/40"
                        : isUrgent
                        ? "bg-rose-50/30"
                        : ""
                    }`}
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
                      <div
                        className={`flex items-center gap-1.5 font-bold text-xs ${
                          isMissed
                            ? "text-orange-600"
                            : isUrgent
                            ? "text-rose-600"
                            : "text-blue-600"
                        }`}
                      >
                        <Clock size={12} />
                        {formatIsraeliDate(lead.nextCallDate) || "אין"}
                        {isMissed && (
                          <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-[9px] font-black">
                            לא הספקתי!
                          </span>
                        )}
                        {isUrgent && !isMissed && (
                          <span className="bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded text-[9px] font-black">
                            דחוף!
                          </span>
                        )}
                      </div>
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
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingLead(lead);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors active:scale-95 flex-shrink-0"
                          title="מידע מלא"
                        >
                          <Info size={16} />
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
                    <td className="p-5 font-black text-pink-600">
                      ₪{lead.quote || 0}
                    </td>
                    <td className="p-5">
                      <div className="text-xs text-slate-500 max-w-[200px] truncate">
                        {lead.callDetails || "אין"}
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex justify-center gap-1">
                        <a
                          href={`https://wa.me/972${lead.phone?.substring(1)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <Phone size={16} />
                        </a>
                        <button
                          onClick={() => {
                            setEditingLead(lead);
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {sortedAndFilteredLeads.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Clock size={48} className="mx-auto mb-4 opacity-20" />
              <p className="font-bold text-lg">אין משימות פעילות</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {sortedAndFilteredLeads.map((lead) => {
          const isUrgent = lead.nextCallDate && lead.nextCallDate <= today;
          return (
            <MobileTaskCard
              key={lead.id}
              lead={lead}
              isUrgent={isUrgent}
              today={today}
              statusDropdownOpen={statusDropdownOpen}
              setStatusDropdownOpen={setStatusDropdownOpen}
              handleQuickStatusChange={handleQuickStatusChange}
              onEdit={() => {
                setEditingLead(lead);
                setIsModalOpen(true);
              }}
            />
          );
        })}

        {sortedAndFilteredLeads.length === 0 && (
          <div className="text-center py-16 text-slate-400 bg-white rounded-2xl">
            <Clock size={40} className="mx-auto mb-3 opacity-20" />
            <p className="font-bold">אין משימות פעילות</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isModalOpen && editingLead && (
        <QuickEditModal
          lead={editingLead}
          onSave={handleSaveLead}
          onClose={() => {
            setIsModalOpen(false);
            setEditingLead(null);
          }}
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

// Mobile Task Card Component
// Mobile Task Card Component - COMPLETE & CORRECTED
const MobileTaskCard = ({
  lead,
  statusDropdownOpen,
  setStatusDropdownOpen,
  handleQuickStatusChange,
  onEdit,
}) => {
  // Helper function
  const getDaysUntil = (dateStr) => {
    if (!dateStr) return null;
    const targetDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);
    const diffTime = targetDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysUntil = getDaysUntil(lead.nextCallDate);
  const isUrgent = daysUntil !== null && daysUntil <= 2 && daysUntil >= 0;
  const isMissed = daysUntil !== null && daysUntil < 0 && lead.status === 2;

  return (
    <div
      className={`bg-white rounded-2xl p-4 border-2 shadow-sm active:scale-[0.98] transition-all relative ${
        isMissed
          ? "border-orange-200 bg-orange-50/30"
          : isUrgent
          ? "border-rose-200 bg-rose-50/30"
          : "border-slate-100"
      }`}
    >
      {/* Badges */}
      {isMissed && (
        <div className="absolute top-2 left-2 bg-orange-100 text-orange-700 px-2 py-1 rounded-lg text-[9px] font-black">
          ⏰ לא הספקתי
        </div>
      )}
      {isUrgent && !isMissed && (
        <div className="absolute top-2 left-2 bg-rose-100 text-rose-700 px-2 py-1 rounded-lg text-[9px] font-black">
          🔥 דחוף
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
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
      </div>

      {/* Call Date */}
      {lead.nextCallDate && (
        <div
          className={`flex items-center gap-2 mb-3 p-2 rounded-lg ${
            isMissed ? "bg-orange-100" : isUrgent ? "bg-rose-100" : "bg-blue-50"
          }`}
        >
          <Clock
            size={14}
            className={
              isMissed
                ? "text-orange-600"
                : isUrgent
                ? "text-rose-600"
                : "text-blue-600"
            }
          />
          <span
            className={`text-xs font-bold ${
              isMissed
                ? "text-orange-700"
                : isUrgent
                ? "text-rose-700"
                : "text-blue-700"
            }`}
          >
            {isMissed ? "לא הספקתי! " : isUrgent ? "דחוף! " : ""}שיחה חוזרת:{" "}
            {formatIsraeliDate(lead.nextCallDate)}
          </span>
        </div>
      )}

      {/* Contact Info */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-sm">
          <Phone size={14} className="text-pink-400" />
          <span className="font-bold text-slate-700">
            {lead.phone || "חסר"}
          </span>
        </div>
        {lead.email && (
          <div className="flex items-center gap-2 text-xs">
            <AtSign size={12} className="text-slate-400" />
            <span className="text-slate-500">{lead.email}</span>
          </div>
        )}
        {lead.regDate && (
          <div className="text-xs text-slate-400 font-semibold">
            נרשם: {formatIsraeliDate(lead.regDate)}
            {lead.regTime && <span className="mr-2">{lead.regTime}</span>}
          </div>
        )}
      </div>

      {/* Notes */}
      {lead.callDetails && (
        <div className="bg-slate-50 p-3 rounded-xl mb-3">
          <p className="text-xs text-slate-600 line-clamp-2">
            {lead.callDetails}
          </p>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="font-black text-pink-600 text-lg">
          ₪{lead.quote || 0}
        </div>
        <div className="flex gap-2">
          <a
            href={`https://wa.me/972${lead.phone?.substring(1)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold text-sm active:scale-95 transition-all"
          >
            <Phone size={16} />
            WhatsApp
          </a>
          <button
            onClick={onEdit}
            className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-colors active:scale-95"
          >
            <Edit2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

// Status Dropdown Component (Shared)
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
        className={`px-2.5 lg:px-3 py-1 rounded-full text-[9px] lg:text-[10px] font-black border flex items-center gap-1.5 w-fit cursor-pointer hover:opacity-80 transition-all ${
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

// Event Type Dropdown Component
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
              className={`w-full text-right px-3 py-2 hover:bg-slate-50 transition-all text-[11px] font-black ${
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

// Sort Icon Component
const SortIcon = ({ columnKey, config }) => {
  if (config.key !== columnKey)
    return <ArrowUpDown size={12} className="opacity-20 inline ml-1" />;
  return config.direction === "asc" ? (
    <ChevronUp size={12} className="inline ml-1 text-pink-500" />
  ) : (
    <ChevronDown size={12} className="inline ml-1 text-pink-500" />
  );
};

// Quick Edit Modal Component (Responsive) - OPTIMIZED
const QuickEditModal = ({ lead, onSave, onClose, onOpenPayments }) => {
  const [formData, setFormData] = useState(lead);

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-5xl my-4 sm:my-8 max-h-[calc(100vh-12rem)] sm:max-h-[90vh] rounded-2xl shadow-2xl flex flex-col mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Compact */}
        <div className="sticky top-0 bg-gradient-to-r from-pink-50 to-purple-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 flex justify-between items-center z-20 gap-3 flex-shrink-0 rounded-t-2xl">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/50 rounded-lg text-slate-400 transition-all flex-shrink-0"
            >
              <X size={20} />
            </button>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-black text-slate-800 truncate">
                עריכת {formData.name || "משימה"}
              </h3>
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 italic">
                עדכון מהיר • SHIRSHIZ CRM
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

        {/* Form Content - Scrollable */}
        <div className="overflow-y-auto flex-1">
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 pb-4 sm:pb-4">
            {/* 3 Columns Layout */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              {/* Column 1: Contact Info */}
              <div className="space-y-3">
                <SectionTitle icon={<User size={12} />} title="פרטי קשר" />
                <div className="space-y-2.5">
                  {/* שם + טלפון באותה שורה */}
                  <div className="grid grid-cols-2 gap-2">
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
                  </div>
                  <InputField
                    label="מייל"
                    value={formData.email}
                    onChange={(v) => setFormData({ ...formData, email: v })}
                    placeholder="email@example.com"
                    icon={<AtSign size={12} />}
                  />
                </div>
              </div>

              {/* Column 2: Status & Quote */}
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

              {/* Column 3: Demographics */}
              <div className="space-y-3">
                <SectionTitle
                  icon={<MapPin size={12} />}
                  title="פרטים נוספים"
                />
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
                {formData.eventType === "מאפס למקצוענית" &&
                  Number(formData.status) === 3 && (
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
                  placeholder="סיכום שיחה..."
                  value={formData.callDetails || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, callDetails: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Mobile Only */}
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
        className={`w-full p-2.5 bg-slate-50 border-2 border-transparent focus:border-pink-200 rounded-lg outline-none font-bold text-slate-800 text-sm transition-all ${
          icon ? "pl-9" : ""
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
