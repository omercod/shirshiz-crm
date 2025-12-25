import React, { useState, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  X,
} from "lucide-react";
import { useAppContext, STATUSES, EVENT_TYPES } from "./App";

export default function CalendarPage() {
  const { leads, updateLead } = useAppContext();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedLead, setSelectedLead] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

    const events = [];

    leads.forEach((lead) => {
      // שיחה חוזרת
      if (lead.nextCallDate === dateStr) {
        events.push({ ...lead, type: "שיחה" });
      }

      // אירוע ראשון
      if (lead.eventDate === dateStr) {
        const eventType = lead.eventType || "אחר";
        events.push({ ...lead, type: eventType });
      }

      // 🎂 אירוע שני - רק למי שבאפס למקצוענית + נסגר
      if (
        lead.event2Date === dateStr &&
        lead.eventType === "מאפס למקצוענית" &&
        lead.status === 3
      ) {
        events.push({ ...lead, type: "מאפס למקצוענית - מפגש 2" });
      }
    });

    return events;
  };

  const isToday = (day) => {
    if (!day) return false;
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const getEventStyle = (eventType) => {
    const styles = {
      שיחה: {
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-100",
        emoji: "📞",
      },
      "מאפס למקצוענית": {
        bg: "bg-pink-50",
        text: "text-pink-700",
        border: "border-pink-100",
        emoji: "🎓",
      },
      "מאפס למקצוענית - מפגש 2": {
        bg: "bg-pink-70",
        text: "text-pink-700",
        border: "border-pink-100",
        emoji: "🎓",
      },
      "סדנת וינטאג'": {
        bg: "bg-purple-50",
        text: "text-purple-700",
        border: "border-purple-100",
        emoji: "🎂",
      },
      אחר: {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-100",
        emoji: "📦",
      },
    };

    return styles[eventType] || styles["אחר"];
  };
  const prevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    );
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-400">
      {/* Header */}
      <header className="mb-6 lg:mb-8">
        <h2 className="text-2xl lg:text-3xl font-black text-slate-800">
          יומן פגישות
        </h2>
        <p className="text-slate-400 font-bold text-xs lg:text-sm">
          ניהול אירועים ושיחות חוזרות
        </p>
      </header>

      {/* Calendar Container */}
      <div className="bg-white p-4 lg:p-6 rounded-2xl lg:rounded-[2rem] border border-slate-200 shadow-sm">
        {/* Calendar Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 lg:mb-8 gap-3 lg:gap-4">
          <div className="flex items-center gap-2 lg:gap-3">
            <div className="p-2 lg:p-3 bg-pink-50 rounded-lg lg:rounded-xl text-pink-600">
              <CalendarIcon size={20} className="lg:hidden" />
              <CalendarIcon size={24} className="hidden lg:block" />
            </div>
            <h3 className="text-lg lg:text-xl font-black text-slate-800">
              היומן של שיר
            </h3>
          </div>
          <div className="flex items-center bg-slate-50 p-1.5 rounded-xl border border-slate-100 shadow-sm">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-white rounded-lg transition-all active:scale-95"
            >
              <ChevronRight size={18} />
            </button>
            <span className="px-4 lg:px-6 font-black text-slate-700 text-sm lg:text-base whitespace-nowrap">
              {new Intl.DateTimeFormat("he-IL", {
                month: "long",
                year: "numeric",
              }).format(currentDate)}
            </span>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-white rounded-lg transition-all active:scale-95"
            >
              <ChevronLeft size={18} />
            </button>
          </div>
        </div>

        {/* Desktop Calendar Grid */}
        <div className="hidden lg:grid grid-cols-7 border-t border-r border-slate-100">
          {/* Day Headers */}
          {["א", "ב", "ג", "ד", "ה", "ו", "ש"].map((day) => (
            <div
              key={day}
              className="p-3 text-center font-black text-slate-400 bg-slate-50/30 border-b border-l border-slate-100 text-xs uppercase"
            >
              {day}
            </div>
          ))}

          {/* Calendar Days */}
          {calendarDays.map((day, idx) => {
            const dayEvents = getEventsForDay(day);
            const today = isToday(day);

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
                          today
                            ? "w-6 h-6 bg-pink-600 text-white rounded-lg flex items-center justify-center"
                            : "text-slate-300"
                        }`}
                      >
                        {day}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {dayEvents.map((ev) => {
                        const style = getEventStyle(ev.type);
                        return (
                          <button
                            key={`${ev.id}-${ev.type}`}
                            onClick={() => {
                              setSelectedLead(ev);
                              setIsModalOpen(true);
                            }}
                            className={`w-full text-right p-1.5 rounded-md text-[11px] font-black truncate border transition-all hover:translate-x-0.5 ${style.bg} ${style.text} ${style.border}`}
                          >
                            {style.emoji} {ev.name}
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

        {/* Mobile List View */}
        <div className="lg:hidden space-y-2">
          {calendarDays
            .filter((day) => day && getEventsForDay(day).length > 0)
            .map((day) => {
              const dayEvents = getEventsForDay(day);
              const today = isToday(day);
              const dateStr = `${currentDate.getFullYear()}-${String(
                currentDate.getMonth() + 1
              ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

              return (
                <div
                  key={day}
                  className={`bg-slate-50 rounded-xl p-3 border-2 ${
                    today ? "border-pink-200 bg-pink-50" : "border-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-sm ${
                        today
                          ? "bg-pink-600 text-white"
                          : "bg-white text-slate-700"
                      }`}
                    >
                      {day}
                    </div>
                    <div className="flex-1">
                      <div className="font-black text-slate-800 text-sm">
                        {new Intl.DateTimeFormat("he-IL", {
                          weekday: "long",
                        }).format(new Date(dateStr))}
                      </div>
                      <div className="text-xs text-slate-400 font-bold">
                        {dayEvents.length} אירועים
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {dayEvents.map((ev) => {
                      const style = getEventStyle(ev.type);
                      return (
                        <button
                          key={`${ev.id}-${ev.type}`}
                          onClick={() => {
                            setSelectedLead(ev);
                            setIsModalOpen(true);
                          }}
                          className={`w-full text-right p-3 rounded-lg font-bold text-sm border-2 transition-all active:scale-95 ${style.bg} ${style.text} ${style.border}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{style.emoji}</span>
                            <div className="flex-1 text-right">
                              <div className="truncate">{ev.name}</div>
                              <div className="text-xs opacity-75">
                                {ev.type}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

          {calendarDays.filter((day) => day && getEventsForDay(day).length > 0)
            .length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <CalendarIcon size={40} className="mx-auto mb-3 opacity-20" />
              <p className="font-bold">אין אירועים החודש</p>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 lg:mt-6 flex flex-wrap gap-3 lg:gap-6 justify-center items-center text-xs font-bold">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-pink-600"></div>
            <span className="text-slate-600">היום</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-slate-600">📞 שיחה</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-pink-500"></div>
            <span className="text-slate-600">🎓 מאפס (מפגש 1)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-pink-700"></div>
            <span className="text-slate-600">🎓 מאפס (מפגש 2)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-slate-600">🎂 סדנת וינטאג׳</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-slate-600">📦 אחר</span>
          </div>
        </div>
      </div>

      {/* Quick View Modal */}
      {isModalOpen && selectedLead && (
        <QuickViewModal
          lead={selectedLead}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedLead(null);
          }}
          onUpdate={updateLead}
        />
      )}
    </div>
  );
}

// Quick View Modal - Compact & Efficient
const QuickViewModal = ({ lead, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    ...lead,
    nextCallDate: lead.nextCallDate || "",
    eventDate: lead.eventDate || "",
    event2Date: lead.event2Date || "",
    eventType: lead.eventType || "אחר",
    quote: lead.quote || "",
    city: lead.city || "",
    status: lead.status || 1,
    callDetails: lead.callDetails || "",
  });

  const handleSave = async () => {
    await onUpdate(lead.id, formData);
    onClose();
  };

  const getEventType = () => {
    if (lead.type) {
      const style = {
        שיחה: { emoji: "📞", color: "blue" },
        "מאפס למקצוענית": { emoji: "🎓", color: "pink" },
        "מאפס למקצוענית - מפגש 2": { emoji: "🎂", color: "purple" },
        "סדנת וינטאג'": { emoji: "🎂", color: "purple" },
        אחר: { emoji: "📦", color: "emerald" },
      };
      return style[lead.type] || style["אחר"];
    }
    return { emoji: "📦", color: "emerald" };
  };

  const eventInfo = getEventType();
  const isClosed = Number(lead.status) === 3;

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end lg:items-center justify-center p-0 lg:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full lg:max-w-3xl max-h-[92vh] rounded-t-[2rem] lg:rounded-[2rem] shadow-2xl flex flex-col animate-in slide-in-from-bottom lg:zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Compact */}
        <div
          className={`flex-shrink-0 bg-gradient-to-r from-${eventInfo.color}-50 to-${eventInfo.color}-100/50 px-4 lg:px-6 py-3 lg:py-4 border-b border-${eventInfo.color}-100`}
        >
          <div className="flex justify-between items-center gap-3">
            <div className="flex items-center gap-2 lg:gap-3 flex-1 min-w-0">
              <span className="text-xl lg:text-2xl flex-shrink-0">
                {eventInfo.emoji}
              </span>
              <div className="min-w-0">
                <h3 className="text-base lg:text-xl font-black text-slate-800 truncate">
                  {lead.name}
                </h3>
                <p
                  className={`text-[10px] lg:text-xs font-bold text-${eventInfo.color}-600`}
                >
                  {lead.event2Date || lead.eventDate || lead.nextCallDate}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 lg:p-2 hover:bg-white/50 rounded-lg text-slate-400 transition-all flex-shrink-0"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body - Scrollable */}
        <div className="overflow-y-auto flex-1">
          <div className="p-4 lg:p-6 space-y-4 pb-24">
            {/* Contact Info - Always visible */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl">
                <div className="text-[9px] font-black text-slate-400 uppercase mb-1">
                  טלפון
                </div>
                <div className="font-black text-slate-800 text-sm">
                  {lead.phone}
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl">
                <div className="text-[9px] font-black text-slate-400 uppercase mb-1">
                  עיר
                </div>
                <div className="font-black text-slate-800 text-sm">
                  {formData.city || "לא צוין"}
                </div>
              </div>
            </div>

            {/* Closed Lead - Event Type, Quote & Dates */}
            {isClosed && (
              <div className="space-y-3">
                {/* Event Type & Quote - 2 Columns */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {/* Event Type */}
                  <div>
                    <label className="text-[10px] font-black text-slate-500 mb-1.5 block px-1">
                      סוג האירוע
                    </label>
                    <div
                      className={`p-0.5 rounded-xl border-2 ${
                        EVENT_TYPES[formData.eventType || "אחר"]?.color ||
                        "bg-slate-50"
                      }`}
                    >
                      <select
                        className="w-full p-2.5 bg-transparent font-black outline-none cursor-pointer text-sm"
                        value={formData.eventType || "אחר"}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            eventType: e.target.value,
                          })
                        }
                      >
                        {Object.keys(EVENT_TYPES).map((type) => (
                          <option
                            key={type}
                            value={type}
                            className="bg-white text-slate-800"
                          >
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Quote */}
                  <div>
                    <label className="text-[10px] font-black text-slate-500 mb-1.5 block px-1">
                      הצעת מחיר (₪)
                    </label>
                    <input
                      type="number"
                      className="w-full p-3 bg-slate-50 border-2 border-transparent focus:border-pink-200 rounded-xl outline-none font-bold text-slate-800 text-sm"
                      value={formData.quote}
                      onChange={(e) =>
                        setFormData({ ...formData, quote: e.target.value })
                      }
                      placeholder="990"
                    />
                  </div>
                </div>

                {/* Event Dates */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {/* Event Date 1 */}
                  <div>
                    <label className="text-[10px] font-black text-slate-500 mb-1.5 block px-1">
                      אירוע ראשון
                    </label>
                    <input
                      type="date"
                      className="w-full p-3 bg-slate-50 border-2 border-transparent focus:border-pink-200 rounded-xl outline-none font-bold text-slate-800 text-sm"
                      value={formData.eventDate}
                      onChange={(e) =>
                        setFormData({ ...formData, eventDate: e.target.value })
                      }
                    />
                  </div>

                  {/* Event Date 2 - Only for מאפס למקצוענית */}
                  {formData.eventType === "מאפס למקצוענית" && (
                    <div>
                      <label className="text-[10px] font-black text-slate-500 mb-1.5 block px-1">
                        🎂 אירוע שני (מפגש 2)
                      </label>
                      <input
                        type="date"
                        className="w-full p-3 bg-slate-50 border-2 border-transparent focus:border-pink-200 rounded-xl outline-none font-bold text-slate-800 text-sm"
                        value={formData.event2Date}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            event2Date: e.target.value,
                          })
                        }
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Active Lead - 2 Columns Layout */}
            {!isClosed && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
                  {/* Column 1 */}
                  <div className="space-y-3">
                    {/* Status */}
                    <div>
                      <label className="text-[10px] font-black text-slate-500 mb-1.5 block px-1">
                        סטטוס
                      </label>
                      <div
                        className={`p-0.5 rounded-xl border-2 ${
                          STATUSES[formData.status]?.color || "bg-slate-50"
                        }`}
                      >
                        <select
                          className="w-full p-2.5 bg-transparent font-black outline-none cursor-pointer text-sm"
                          value={formData.status}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              status: Number(e.target.value),
                            })
                          }
                        >
                          {Object.entries(STATUSES).map(([k, v]) => (
                            <option
                              key={k}
                              value={k}
                              className="bg-white text-slate-800"
                            >
                              {v.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Quote */}
                    <div>
                      <label className="text-[10px] font-black text-slate-500 mb-1.5 block px-1">
                        הצעת מחיר (₪)
                      </label>
                      <input
                        type="number"
                        className="w-full p-3 bg-slate-50 border-2 border-transparent focus:border-pink-200 rounded-xl outline-none font-bold text-slate-800 text-sm"
                        value={formData.quote}
                        onChange={(e) =>
                          setFormData({ ...formData, quote: e.target.value })
                        }
                        placeholder="990"
                      />
                    </div>
                  </div>

                  {/* Column 2 */}
                  <div className="space-y-3">
                    {/* City */}
                    <div>
                      <label className="text-[10px] font-black text-slate-500 mb-1.5 block px-1">
                        עיר
                      </label>
                      <input
                        type="text"
                        className="w-full p-3 bg-slate-50 border-2 border-transparent focus:border-pink-200 rounded-xl outline-none font-bold text-slate-800 text-sm"
                        value={formData.city}
                        onChange={(e) =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                        placeholder="רמת גן"
                      />
                    </div>

                    {/* Next Call Date */}
                    <div>
                      <label className="text-[10px] font-black text-slate-500 mb-1.5 block px-1">
                        שיחה חוזרת
                      </label>
                      <input
                        type="date"
                        className="w-full p-3 bg-slate-50 border-2 border-transparent focus:border-pink-200 rounded-xl outline-none font-bold text-slate-800 text-sm"
                        value={formData.nextCallDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            nextCallDate: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Notes - Full Width */}
                <div>
                  <label className="text-[10px] font-black text-slate-500 mb-1.5 block px-1">
                    הערות לשיחה
                  </label>
                  <textarea
                    className="w-full p-3 bg-slate-50 border-none rounded-xl outline-none font-bold text-sm text-slate-700 focus:ring-2 focus:ring-pink-100 min-h-[100px] resize-none"
                    placeholder="הוסיפי הערות מהשיחה..."
                    value={formData.callDetails}
                    onChange={(e) =>
                      setFormData({ ...formData, callDetails: e.target.value })
                    }
                  />
                </div>
              </>
            )}

            {/* Notes for Closed Leads */}
            {isClosed && (
              <div>
                <label className="text-[10px] font-black text-slate-500 mb-1.5 block px-1">
                  הערות
                </label>
                <textarea
                  className="w-full p-3 bg-slate-50 border-none rounded-xl outline-none font-bold text-sm text-slate-700 focus:ring-2 focus:ring-pink-100 min-h-[80px] resize-none"
                  placeholder="הערות..."
                  value={formData.callDetails}
                  onChange={(e) =>
                    setFormData({ ...formData, callDetails: e.target.value })
                  }
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer - Sticky */}
        <div className="flex-shrink-0 p-4 lg:p-6 border-t border-slate-100 bg-white">
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="flex-1 bg-pink-600 text-white py-3 rounded-xl font-black hover:bg-pink-700 transition-all active:scale-95 text-sm lg:text-base"
            >
              שמירה
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all active:scale-95 text-sm lg:text-base"
            >
              סגירה
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
