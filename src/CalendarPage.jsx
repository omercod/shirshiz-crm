import React, { useState, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { useAppContext } from "./App";

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
    return leads.filter(
      (l) => l.eventDate === dateStr || l.nextCallDate === dateStr
    );
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

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-400">
      {/* Header */}
      <header className="mb-8">
        <h2 className="text-3xl font-black text-slate-800">יומן פגישות</h2>
        <p className="text-slate-400 font-bold text-sm">
          ניהול אירועים ושיחות חוזרות
        </p>
      </header>

      {/* Calendar Container */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
        {/* Calendar Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-pink-50 rounded-xl text-pink-600">
              <CalendarIcon size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-800">היומן של שיר</h3>
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

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 border-t border-r border-slate-100">
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
                        const isEvent =
                          ev.eventDate ===
                          `${currentDate.getFullYear()}-${String(
                            currentDate.getMonth() + 1
                          ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                        return (
                          <button
                            key={ev.id}
                            onClick={() => {
                              setSelectedLead(ev);
                              setIsModalOpen(true);
                            }}
                            className={`w-full text-right p-1.5 rounded-md text-[12px] font-black truncate border transition-all hover:translate-x-0.5 ${
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

        {/* Legend */}
        <div className="mt-6 flex gap-6 justify-center items-center text-xs font-bold">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-slate-600">אירוע עוגה 🎂</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-slate-600">שיחה חוזרת 📞</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-pink-600"></div>
            <span className="text-slate-600">היום</span>
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

// Quick View Modal Component
const QuickViewModal = ({ lead, onClose, onUpdate }) => {
  const [notes, setNotes] = useState(lead.callDetails || "");

  const handleSaveNotes = async () => {
    await onUpdate(lead.id, { ...lead, callDetails: notes });
    onClose();
  };

  const getEventType = () => {
    const today = new Date().toISOString().split("T")[0];
    if (lead.eventDate === today)
      return { type: "אירוע", emoji: "🎂", color: "emerald" };
    if (lead.nextCallDate === today)
      return { type: "שיחה", emoji: "📞", color: "blue" };
    if (lead.eventDate) return { type: "אירוע", emoji: "🎂", color: "emerald" };
    return { type: "שיחה", emoji: "📞", color: "blue" };
  };

  const eventInfo = getEventType();

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        {/* Header */}
        <div
          className={`bg-${eventInfo.color}-50 p-6 border-b border-${eventInfo.color}-100`}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{eventInfo.emoji}</span>
                <h3 className="text-2xl font-black text-slate-800">
                  {lead.name}
                </h3>
              </div>
              <p className={`text-sm font-bold text-${eventInfo.color}-600`}>
                {eventInfo.type} • {lead.eventDate || lead.nextCallDate}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-xl text-slate-400 transition-all"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl">
              <div className="text-[10px] font-black text-slate-400 uppercase mb-1">
                טלפון
              </div>
              <div className="font-black text-slate-800">{lead.phone}</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl">
              <div className="text-[10px] font-black text-slate-400 uppercase mb-1">
                עיר
              </div>
              <div className="font-black text-slate-800">
                {lead.city || "לא צוין"}
              </div>
            </div>
          </div>

          {/* Status & Quote */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl">
              <div className="text-[10px] font-black text-slate-400 uppercase mb-1">
                סטטוס
              </div>
              <div className="font-black text-slate-800">
                {lead.status === 1
                  ? "חדש"
                  : lead.status === 2
                  ? "בתהליך"
                  : lead.status === 3
                  ? "נסגר"
                  : "לא רלוונטי"}
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl">
              <div className="text-[10px] font-black text-slate-400 uppercase mb-1">
                הצעת מחיר
              </div>
              <div className="font-black text-pink-600">₪{lead.quote || 0}</div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[10px] font-black text-slate-500 mb-2 block">
              הערות לשיחה
            </label>
            <textarea
              className="w-full p-4 bg-slate-50 border-none rounded-xl outline-none font-bold text-sm text-slate-700 focus:ring-2 focus:ring-pink-100 min-h-[120px] resize-none"
              placeholder="הוסיפי הערות או סיכום..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSaveNotes}
              className="flex-1 bg-pink-600 text-white py-4 rounded-xl font-black hover:bg-pink-700 transition-all"
            >
              שמירה
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-xl font-bold hover:bg-slate-200 transition-all"
            >
              סגירה
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
