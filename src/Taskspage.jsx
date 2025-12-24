import React, { useState, useMemo } from "react";
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
} from "lucide-react";
import { useAppContext, STATUSES, SOURCES } from "./App";

export default function TasksPage() {
  const { leads, updateLead } = useAppContext();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({
    key: "nextCallDate",
    direction: "asc", // Default: oldest calls first (urgent)
  });
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);

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

  const getDropdownPosition = (buttonElement) => {
    if (!buttonElement) return "bottom";

    const rect = buttonElement.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    return spaceBelow < 200 && spaceAbove > spaceBelow ? "top" : "bottom";
  };

  // Filter: Only "חדש" (1) and "בתהליך" (2)
  const sortedAndFilteredLeads = useMemo(() => {
    let sortableLeads = [...leads];

    // Filter to show only active leads (status 1 or 2)
    sortableLeads = sortableLeads.filter((lead) => {
      const isActiveStatus =
        Number(lead.status) === 1 || Number(lead.status) === 2;
      const matchesSearch =
        (lead.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.phone || "").includes(searchTerm) ||
        (lead.city || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || Number(lead.status) === Number(statusFilter);

      return isActiveStatus && matchesSearch && matchesStatus;
    });

    // Sorting
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

  // Calculate urgent tasks
  const today = new Date().toISOString().split("T")[0];
  const urgentCount = sortedAndFilteredLeads.filter(
    (l) => l.nextCallDate && l.nextCallDate <= today
  ).length;

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
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800">
            משימות ופולואפים
          </h2>
          <p className="text-slate-400 font-bold text-sm">
            ניהול מעקבים אחרי לידים פעילים
          </p>
        </div>
        {urgentCount > 0 && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-6 py-3 rounded-xl font-black flex items-center gap-2">
            <AlertCircle size={20} />
            {urgentCount} משימות דחופות להיום!
          </div>
        )}
      </header>

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
            <option value="1">חדש</option>
            <option value="2">בתהליך</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
          <div className="text-sm font-bold text-blue-600 mb-1">
            לידים חדשים
          </div>
          <div className="text-3xl font-black text-blue-700">
            {
              sortedAndFilteredLeads.filter((l) => Number(l.status) === 1)
                .length
            }
          </div>
        </div>
        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
          <div className="text-sm font-bold text-amber-600 mb-1">
            בתהליך טיפול
          </div>
          <div className="text-3xl font-black text-amber-700">
            {
              sortedAndFilteredLeads.filter((l) => Number(l.status) === 2)
                .length
            }
          </div>
        </div>
        <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100">
          <div className="text-sm font-bold text-rose-600 mb-1">
            דורש מעקב היום
          </div>
          <div className="text-3xl font-black text-rose-700">{urgentCount}</div>
        </div>
      </div>

      {/* Table */}
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
                <th className="p-5">הצעה</th>
                <th className="p-5">הערות</th>
                <th className="p-5 text-center">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sortedAndFilteredLeads.map((lead) => {
                const isUrgent =
                  lead.nextCallDate && lead.nextCallDate <= today;
                return (
                  <tr
                    key={lead.id}
                    className={`hover:bg-slate-50/50 transition-colors group ${
                      isUrgent ? "bg-rose-50/30" : ""
                    }`}
                  >
                    <td className="p-5 font-bold text-slate-400">
                      {lead.regDate || "לא הוזן"}
                    </td>
                    <td className="p-5">
                      <div
                        className={`flex items-center gap-1.5 font-bold text-xs ${
                          isUrgent ? "text-rose-600" : "text-blue-600"
                        }`}
                      >
                        <Clock size={12} />
                        {lead.nextCallDate || "אין מעקב"}
                        {isUrgent && (
                          <span className="bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded text-[9px] font-black">
                            דחוף!
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="relative">
                        <button
                          ref={(el) => {
                            if (el && statusDropdownOpen === lead.id) {
                              const position = getDropdownPosition(el);
                              el.dataset.dropdownPosition = position;
                            }
                          }}
                          onClick={() => {
                            const newOpen =
                              statusDropdownOpen === lead.id ? null : lead.id;
                            setStatusDropdownOpen(newOpen);
                          }}
                          className={`px-3 py-1 rounded-full text-[10px] font-black border flex items-center gap-1.5 w-fit cursor-pointer hover:opacity-80 transition-all ${
                            STATUSES[lead.status]?.color
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              STATUSES[lead.status]?.dot
                            }`}
                          ></span>
                          {STATUSES[lead.status]?.label}
                          <span className="text-[8px] opacity-50">▼</span>
                        </button>

                        {statusDropdownOpen === lead.id && (
                          <div
                            className={`absolute left-0 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 min-w-[120px] animate-in fade-in duration-200 ${(() => {
                              const button = document.querySelector(
                                `[data-dropdown-position]`
                              );
                              const position =
                                button?.dataset.dropdownPosition || "bottom";
                              return position === "top"
                                ? "bottom-full mb-1 slide-in-from-bottom-1"
                                : "top-full mt-1 slide-in-from-top-1";
                            })()}`}
                          >
                            {Object.entries(STATUSES).map(
                              ([statusKey, statusVal]) => (
                                <button
                                  key={statusKey}
                                  onClick={() =>
                                    handleQuickStatusChange(
                                      lead.id,
                                      Number(statusKey)
                                    )
                                  }
                                  className={`w-full text-right px-3 py-2 hover:bg-slate-50 transition-all flex items-center gap-2 text-[11px] font-black ${
                                    Number(lead.status) === Number(statusKey)
                                      ? "bg-slate-50"
                                      : ""
                                  }`}
                                >
                                  <span
                                    className={`w-2 h-2 rounded-full ${statusVal.dot}`}
                                  ></span>
                                  {statusVal.label}
                                </button>
                              )
                            )}
                          </div>
                        )}
                      </div>
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
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black border flex items-center gap-1.5 w-fit ${
                          SOURCES[lead.source]?.color || SOURCES["אחר"].color
                        }`}
                      >
                        {lead.source}
                      </span>
                    </td>
                    <td className="p-5 font-black text-pink-600">
                      ₪{lead.quote || 0}
                    </td>
                    <td className="p-5">
                      <div className="text-xs text-slate-500 max-w-[200px] truncate">
                        {lead.callDetails || "אין הערות"}
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex justify-center gap-1">
                        <a
                          href={`https://wa.me/972${lead.phone?.substring(1)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="פתח WhatsApp"
                        >
                          <Phone size={16} />
                        </a>
                        <button
                          onClick={() => {
                            setEditingLead(lead);
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="ערוך"
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
              <p className="font-bold text-lg">אין משימות פעילות כרגע</p>
              <p className="text-sm">
                כל הלידים טופלו או אין שיחות חוזרות מתוכננות
              </p>
            </div>
          )}
        </div>
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
        />
      )}
    </div>
  );
}

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

// Quick Edit Modal Component
const QuickEditModal = ({ lead, onSave, onClose }) => {
  const [formData, setFormData] = useState(lead);

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-y-auto flex flex-col animate-in zoom-in duration-200">
        <div className="sticky top-0 bg-white px-8 py-6 border-b border-slate-50 flex justify-between items-center z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-all"
            >
              <X size={24} />
            </button>
            <div>
              <h3 className="text-2xl font-black text-slate-800">
                עריכת משימה - {formData.name}
              </h3>
              <p className="text-xs font-bold text-slate-400 mt-0.5 italic">
                עדכון מהיר לפולואפ
              </p>
            </div>
          </div>
          <button
            onClick={() => onSave(formData)}
            className="bg-pink-600 text-white px-8 py-3 rounded-xl shadow-lg font-black hover:bg-pink-700 transition-all active:scale-95"
          >
            שמירת נתונים
          </button>
        </div>

        <div className="p-8 space-y-8 flex-1">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <SectionTitle icon={<User size={14} />} title="פרטי קשר" />
              <div className="space-y-3">
                <InputField
                  label="שם הלקוחה *"
                  value={formData.name}
                  onChange={(v) => setFormData({ ...formData, name: v })}
                  placeholder="שם מלא"
                />
                <InputField
                  label="טלפון * (10 ספרות)"
                  value={formData.phone}
                  onChange={(v) => setFormData({ ...formData, phone: v })}
                  placeholder="05XXXXXXXX"
                />
                <InputField
                  label="כתובת מייל"
                  value={formData.email}
                  onChange={(v) => setFormData({ ...formData, email: v })}
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
                  value={formData.status}
                  onChange={(v) => setFormData({ ...formData, status: v })}
                  options={Object.entries(STATUSES).map(([k, v]) => ({
                    val: k,
                    label: v.label,
                  }))}
                  dynamicClass={STATUSES[formData.status]?.color}
                />
                <SelectField
                  label="מקור הגעה"
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
                <InputField
                  label="הצעת מחיר (₪)"
                  type="number"
                  value={formData.quote}
                  onChange={(v) => setFormData({ ...formData, quote: v })}
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
                  value={formData.nextCallDate}
                  onChange={(v) =>
                    setFormData({ ...formData, nextCallDate: v })
                  }
                />
                <InputField
                  label="תאריך אירוע"
                  type="date"
                  value={formData.eventDate}
                  onChange={(v) => setFormData({ ...formData, eventDate: v })}
                />
              </div>
            </div>
            <div className="space-y-3">
              <SectionTitle icon={<AtSign size={14} />} title="סיכום שיחה" />
              <textarea
                className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-sm text-slate-700 focus:ring-2 focus:ring-pink-100 min-h-[100px] resize-none"
                placeholder="מה שיר סיכמה עם הלקוחה?"
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
  );
};

// Form Components
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
          className={`w-full p-3 bg-transparent font-black outline-none cursor-pointer text-sm ${
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
