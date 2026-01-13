import React, { useState } from "react";
import { Info, X } from "lucide-react";

export default function InfoPopup({ title, data, renderItem }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!data || data.length === 0) return null;

  return (
    <>
      {/* Info Icon Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        className="absolute top-3 left-3 p-1.5 bg-white/80 hover:bg-white rounded-full shadow-sm hover:shadow-md transition-all active:scale-95 group"
        aria-label="מידע נוסף"
      >
        <Info
          size={16}
          className="text-slate-400 group-hover:text-slate-600 transition-colors"
        />
      </button>

      {/* Popup Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-4 flex items-center justify-between">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Info size={20} />
                {title}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-full transition-all active:scale-95"
              >
                <X size={20} className="text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
              <div className="space-y-3">
                {data.map((item, index) => (
                  <div
                    key={index}
                    className="bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-emerald-200 transition-all"
                  >
                    {renderItem(item, index)}
                  </div>
                ))}
              </div>

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="w-full mt-4 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold transition-all active:scale-95"
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
