import React, { useState } from "react";
import {
  X,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  AlertCircle,
} from "lucide-react";

export default function PaymentsModal({
  totalAmount,
  payments = [],
  onSave,
  onClose,
}) {
  const [paymentsList, setPaymentsList] = useState(
    payments.length > 0 ? payments : [{ date: "", amount: "", note: "" }]
  );

  const [error, setError] = useState("");

  // Calculate totals
  const paidTotal = paymentsList.reduce(
    (sum, p) => sum + (Number(p.amount) || 0),
    0
  );
  const remaining = totalAmount - paidTotal;

  // Add new payment row
  const addPayment = () => {
    setPaymentsList([...paymentsList, { date: "", amount: "", note: "" }]);
    setError("");
  };

  // Remove payment row
  const removePayment = (index) => {
    if (paymentsList.length === 1) {
      setError("חייב להיות לפחות תשלום אחד");
      return;
    }
    const newList = paymentsList.filter((_, i) => i !== index);
    setPaymentsList(newList);
    setError("");
  };

  // Update payment field
  const updatePayment = (index, field, value) => {
    const newList = [...paymentsList];
    newList[index][field] = value;
    setPaymentsList(newList);
    setError("");
  };

  // Validate & Save
  const handleSave = () => {
    // Check if all payments have date and amount
    const hasEmpty = paymentsList.some(
      (p) => !p.date || !p.amount || Number(p.amount) <= 0
    );
    if (hasEmpty) {
      setError("יש למלא תאריך וסכום בכל התשלומים");
      return;
    }

    // Check if total matches
    if (paidTotal !== totalAmount) {
      setError(
        `סכום התשלומים (₪${paidTotal}) לא תואם להצעת המחיר (₪${totalAmount})`
      );
      return;
    }

    // Sort by date (earliest first)
    const sortedPayments = [...paymentsList].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    onSave(sortedPayments);
  };

  // Format Israeli date for display
  const formatIsraeliDate = (dateStr) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      onClick={onClose}
      dir="rtl"
    >
      <div
        className="bg-white w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col animate-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: "inherit" }}
      >
        {/* Header */}
        <div className="flex-shrink-0 bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4 border-b border-emerald-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <DollarSign size={20} className="text-emerald-600" />
            </div>
            <div style={{ fontFamily: "inherit" }}>
              <h3 className="text-xl font-black text-slate-800">
                ניהול תשלומים
              </h3>
              <p className="text-xs font-bold text-emerald-600">
                סה"כ עסקה: ₪{totalAmount?.toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-xl text-slate-400 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="overflow-y-auto flex-1 p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl flex items-center gap-2 text-sm font-bold">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
              <div className="text-[9px] font-black text-emerald-600 uppercase mb-1">
                סה"כ עסקה
              </div>
              <div className="text-lg font-black text-emerald-700">
                ₪{totalAmount?.toLocaleString()}
              </div>
            </div>
            <div
              className={`p-3 rounded-xl border ${
                paidTotal === totalAmount
                  ? "bg-green-50 border-green-100"
                  : "bg-blue-50 border-blue-100"
              }`}
            >
              <div
                className={`text-[9px] font-black uppercase mb-1 ${
                  paidTotal === totalAmount ? "text-green-600" : "text-blue-600"
                }`}
              >
                סה"כ תשלומים
              </div>
              <div
                className={`text-lg font-black ${
                  paidTotal === totalAmount ? "text-green-700" : "text-blue-700"
                }`}
              >
                ₪{paidTotal.toLocaleString()}
              </div>
            </div>
            <div
              className={`p-3 rounded-xl border ${
                remaining === 0
                  ? "bg-slate-50 border-slate-100"
                  : remaining > 0
                  ? "bg-orange-50 border-orange-100"
                  : "bg-rose-50 border-rose-100"
              }`}
            >
              <div
                className={`text-[9px] font-black uppercase mb-1 ${
                  remaining === 0
                    ? "text-slate-400"
                    : remaining > 0
                    ? "text-orange-600"
                    : "text-rose-600"
                }`}
              >
                יתרה
              </div>
              <div
                className={`text-lg font-black ${
                  remaining === 0
                    ? "text-slate-400"
                    : remaining > 0
                    ? "text-orange-700"
                    : "text-rose-700"
                }`}
              >
                ₪{Math.abs(remaining).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Payments List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-3">
              <h4
                className="text-sm font-black text-slate-600"
                style={{ fontFamily: "inherit" }}
              >
                תשלומים ({paymentsList.length})
              </h4>
              <button
                onClick={addPayment}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg font-bold text-xs hover:bg-emerald-200 transition-all active:scale-95"
                style={{ fontFamily: "inherit" }}
              >
                <Plus size={14} />
                הוסף תשלום
              </button>
            </div>

            {paymentsList.map((payment, index) => (
              <PaymentRow
                key={index}
                index={index}
                payment={payment}
                onUpdate={updatePayment}
                onRemove={removePayment}
                canRemove={paymentsList.length > 1}
                formatIsraeliDate={formatIsraeliDate}
              />
            ))}
          </div>

          {/* Quick Fill Buttons */}
          <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div
              className="text-xs font-black text-slate-500 uppercase mb-3"
              style={{ fontFamily: "inherit" }}
            >
              מילוי מהיר
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  const today = new Date().toISOString().split("T")[0];
                  setPaymentsList([
                    { date: today, amount: totalAmount, note: "תשלום מלא" },
                  ]);
                  setError("");
                }}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
                style={{ fontFamily: "inherit" }}
              >
                תשלום מלא היום
              </button>
              <button
                onClick={() => {
                  const today = new Date().toISOString().split("T")[0];
                  const eventDate = new Date();
                  eventDate.setMonth(eventDate.getMonth() + 1);
                  const eventDateStr = eventDate.toISOString().split("T")[0];
                  setPaymentsList([
                    {
                      date: today,
                      amount: Math.round(totalAmount * 0.25),
                      note: "מקדמה 25%",
                    },
                    {
                      date: eventDateStr,
                      amount: Math.round(totalAmount * 0.75),
                      note: "יתרה ביום האירוע",
                    },
                  ]);
                  setError("");
                }}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
                style={{ fontFamily: "inherit" }}
              >
                מקדמה 25% + יתרה
              </button>
              <button
                onClick={() => {
                  const today = new Date();
                  const perPayment = Math.round(totalAmount / 3);
                  const remainder = totalAmount - perPayment * 2;
                  const payments = [];
                  for (let i = 0; i < 3; i++) {
                    const paymentDate = new Date(today);
                    paymentDate.setMonth(paymentDate.getMonth() + i);
                    payments.push({
                      date: paymentDate.toISOString().split("T")[0],
                      amount: i === 2 ? remainder : perPayment,
                      note: `תשלום ${i + 1}/3`,
                    });
                  }
                  setPaymentsList(payments);
                  setError("");
                }}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
                style={{ fontFamily: "inherit" }}
              >
                3 תשלומים שווים
              </button>
            </div>
          </div>
        </div>

        {/* Footer - Sticky */}
        <div className="flex-shrink-0 p-6 border-t border-slate-100 bg-white flex gap-3">
          <button
            onClick={handleSave}
            className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-black hover:bg-emerald-700 transition-all active:scale-95"
            style={{ fontFamily: "inherit" }}
          >
            שמור תשלומים
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all active:scale-95"
            style={{ fontFamily: "inherit" }}
          >
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}

// Payment Row Component
const PaymentRow = ({
  index,
  payment,
  onUpdate,
  onRemove,
  canRemove,
  formatIsraeliDate,
}) => {
  return (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-black text-slate-500 uppercase">
          תשלום #{index + 1}
        </span>
        {canRemove && (
          <button
            onClick={() => onRemove(index)}
            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all active:scale-95"
            title="מחק תשלום"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Date */}
        <div>
          <label className="text-[10px] font-black text-slate-500 mb-1.5 block px-1">
            תאריך תשלום *
          </label>
          <div className="relative">
            <Calendar
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="date"
              className="w-full pr-3 pl-10 py-2.5 bg-white border-2 border-slate-200 focus:border-emerald-300 rounded-xl outline-none font-bold text-slate-800 text-sm"
              value={payment.date}
              onChange={(e) => onUpdate(index, "date", e.target.value)}
            />
          </div>
          {payment.date && (
            <div className="text-[10px] text-slate-400 font-semibold mt-1 px-1">
              {formatIsraeliDate(payment.date)}
            </div>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className="text-[10px] font-black text-slate-500 mb-1.5 block px-1">
            סכום (₪) *
          </label>
          <div className="relative">
            <DollarSign
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="number"
              className="w-full pr-3 pl-10 py-2.5 bg-white border-2 border-slate-200 focus:border-emerald-300 rounded-xl outline-none font-bold text-slate-800 text-sm"
              value={payment.amount}
              onChange={(e) => onUpdate(index, "amount", e.target.value)}
              placeholder="0"
              min="0"
            />
          </div>
        </div>
      </div>

      {/* Note */}
      <div>
        <label className="text-[10px] font-black text-slate-500 mb-1.5 block px-1">
          הערה (אופציונלי)
        </label>
        <input
          type="text"
          className="w-full px-3 py-2.5 bg-white border-2 border-slate-200 focus:border-emerald-300 rounded-xl outline-none font-bold text-slate-800 text-sm"
          value={payment.note}
          onChange={(e) => onUpdate(index, "note", e.target.value)}
          placeholder='לדוגמה: "מקדמה", "יתרה", "תשלום 1/3"'
        />
      </div>
    </div>
  );
};
