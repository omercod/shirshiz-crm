import React, { useState, useMemo } from "react";
import {
  Users,
  Target,
  DollarSign,
  TrendingUp,
  PieChart,
  Calendar,
} from "lucide-react";
import { useAppContext, SOURCES } from "./App";

export default function StatsPage() {
  const { leads } = useAppContext();
  const [statsTimeFilter, setStatsTimeFilter] = useState("month"); // day, week, month, year, all, custom
  const [customDateRange, setCustomDateRange] = useState({
    from: "",
    to: "",
  });
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  // Calculate Statistics
  const stats = useMemo(() => {
    const now = new Date();
    let filtered = [...leads];

    if (statsTimeFilter !== "all") {
      const limit = new Date();

      if (statsTimeFilter === "day") {
        // Today only
        const today = new Date().toISOString().split("T")[0];
        filtered = leads.filter((l) => l.regDate === today);
      } else if (statsTimeFilter === "custom") {
        // Custom date range
        if (customDateRange.from && customDateRange.to) {
          const fromDate = new Date(customDateRange.from);
          const toDate = new Date(customDateRange.to);
          filtered = leads.filter((l) => {
            const leadDate = new Date(l.regDate);
            return leadDate >= fromDate && leadDate <= toDate;
          });
        }
      } else {
        // Week, month, year
        if (statsTimeFilter === "week") limit.setDate(now.getDate() - 7);
        if (statsTimeFilter === "month") limit.setMonth(now.getMonth() - 1);
        if (statsTimeFilter === "year")
          limit.setFullYear(now.getFullYear() - 1);

        filtered = leads.filter((l) => new Date(l.regDate) >= limit);
      }
    }

    const total = filtered.length;
    const closed = filtered.filter((l) => Number(l.status) === 3).length;
    const newLeads = filtered.filter((l) => Number(l.status) === 1).length;
    const inProgress = filtered.filter((l) => Number(l.status) === 2).length;
    const conversion = total > 0 ? ((closed / total) * 100).toFixed(1) : 0;
    const totalRevenue = filtered
      .filter((l) => Number(l.status) === 3)
      .reduce((acc, curr) => acc + Number(curr.quote || 0), 0);
    const potentialRevenue = filtered
      .filter((l) => Number(l.status) === 2)
      .reduce((acc, curr) => acc + Number(curr.quote || 0), 0);
    const avgDealSize = closed > 0 ? Math.round(totalRevenue / closed) : 0;

    // Group by source for chart
    const sourceData = {};
    filtered.forEach((l) => {
      sourceData[l.source] = (sourceData[l.source] || 0) + 1;
    });

    // Group by status
    const statusData = {
      new: newLeads,
      inProgress: inProgress,
      closed: closed,
      irrelevant: filtered.filter((l) => Number(l.status) === 4).length,
    };

    // Monthly trend (last 6 months)
    const monthlyData = {};
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      monthlyData[key] = { total: 0, closed: 0 };
    }

    leads.forEach((l) => {
      const leadDate = l.regDate ? l.regDate.substring(0, 7) : null;
      if (leadDate && monthlyData[leadDate]) {
        monthlyData[leadDate].total++;
        if (Number(l.status) === 3) monthlyData[leadDate].closed++;
      }
    });

    return {
      total,
      closed,
      newLeads,
      inProgress,
      conversion,
      totalRevenue,
      potentialRevenue,
      avgDealSize,
      sourceData,
      statusData,
      monthlyData,
    };
  }, [leads, statsTimeFilter, customDateRange]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-400">
      {/* Header */}
      <header className="mb-8">
        <h2 className="text-3xl font-black text-slate-800">ביצועים וניתוח</h2>
        <p className="text-slate-400 font-bold text-sm">
          נתוני ביצועים ותובנות עסקיות
        </p>
      </header>

      {/* Time Filter */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border shadow-sm">
        <div className="flex items-center gap-2 text-slate-500 font-bold">
          <TrendingUp size={20} className="text-pink-500" /> נתוני צמיחה
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {["day", "week", "month", "year", "all"].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setStatsTimeFilter(t);
                  setShowCustomPicker(false);
                }}
                className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
                  statsTimeFilter === t
                    ? "bg-white text-pink-600 shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {t === "day"
                  ? "היום"
                  : t === "week"
                  ? "שבוע"
                  : t === "month"
                  ? "חודש"
                  : t === "year"
                  ? "שנה"
                  : "הכל"}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              setStatsTimeFilter("custom");
              setShowCustomPicker(!showCustomPicker);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              statsTimeFilter === "custom"
                ? "bg-pink-600 text-white shadow-lg"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Calendar size={16} />
            מותאם אישית
          </button>
        </div>
      </div>

      {/* Custom Date Range Picker */}
      {showCustomPicker && (
        <div className="bg-white p-6 rounded-2xl border shadow-sm animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-4">
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
                className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none font-bold text-sm focus:border-pink-400 transition-all"
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
                  setCustomDateRange({ ...customDateRange, to: e.target.value })
                }
                className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none font-bold text-sm focus:border-pink-400 transition-all"
              />
            </div>
            <button
              onClick={() => {
                if (customDateRange.from && customDateRange.to) {
                  setShowCustomPicker(false);
                }
              }}
              disabled={!customDateRange.from || !customDateRange.to}
              className="mt-7 px-6 py-3 bg-pink-600 text-white rounded-xl font-black hover:bg-pink-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all"
            >
              הצג
            </button>
          </div>
          {customDateRange.from && customDateRange.to && (
            <div className="mt-3 text-xs font-bold text-slate-500 text-center">
              מציג נתונים מ-{customDateRange.from} עד {customDateRange.to}
            </div>
          )}
        </div>
      )}

      {/* Quick Stats Cards */}
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

      {/* Charts Section */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Source Distribution */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <h4 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
            <PieChart size={18} className="text-pink-500" /> התפלגות מקורות הגעה
          </h4>
          <div className="space-y-4">
            {Object.entries(stats.sourceData)
              .sort((a, b) => b[1] - a[1])
              .map(([source, count]) => {
                const percent =
                  stats.total > 0
                    ? ((count / stats.total) * 100).toFixed(0)
                    : 0;
                return (
                  <div key={source} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-black text-slate-600">
                      <span className="flex items-center gap-2">
                        <span>{SOURCES[source]?.icon || "❓"}</span>
                        {source}
                      </span>
                      <span>
                        {count} לידים ({percent}%)
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                      <div
                        className={`h-full transition-all duration-1000 ${
                          SOURCES[source]?.color.split(" ")[0] || "bg-slate-400"
                        }`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Motivation Card */}
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
                : stats.totalRevenue.toLocaleString()}
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

      {/* Status Breakdown & KPIs */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Status Funnel */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <h4 className="text-lg font-black text-slate-800 mb-6">
            משפך מכירות 📊
          </h4>
          <div className="space-y-3">
            <FunnelItem
              label="לידים חדשים"
              count={stats.statusData.new}
              color="bg-blue-500"
              percent={
                stats.total > 0
                  ? ((stats.statusData.new / stats.total) * 100).toFixed(0)
                  : 0
              }
            />
            <FunnelItem
              label="בתהליך טיפול"
              count={stats.statusData.inProgress}
              color="bg-amber-500"
              percent={
                stats.total > 0
                  ? ((stats.statusData.inProgress / stats.total) * 100).toFixed(
                      0
                    )
                  : 0
              }
            />
            <FunnelItem
              label="סגירות מוצלחות"
              count={stats.statusData.closed}
              color="bg-emerald-500"
              percent={stats.conversion}
            />
            <FunnelItem
              label="לא רלוונטי"
              count={stats.statusData.irrelevant}
              color="bg-rose-500"
              percent={
                stats.total > 0
                  ? ((stats.statusData.irrelevant / stats.total) * 100).toFixed(
                      0
                    )
                  : 0
              }
            />
          </div>
        </div>

        {/* Key Metrics */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <h4 className="text-lg font-black text-slate-800 mb-6">
            מדדי ביצוע מרכזיים 🎯
          </h4>
          <div className="space-y-4">
            <MetricItem
              label="ממוצע עסקה"
              value={`₪${stats.avgDealSize.toLocaleString()}`}
              icon="💰"
            />
            <MetricItem
              label="שיעור המרה"
              value={`${stats.conversion}%`}
              icon="📈"
              color={
                Number(stats.conversion) >= 20
                  ? "text-emerald-600"
                  : "text-amber-600"
              }
            />
            <MetricItem
              label="לידים פעילים"
              value={stats.inProgress}
              icon="🔄"
            />
            <MetricItem
              label="הכנסה פוטנציאלית"
              value={`₪${stats.potentialRevenue.toLocaleString()}`}
              icon="💎"
              color="text-purple-600"
            />
          </div>
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <h4 className="text-lg font-black text-slate-800 mb-6">
          מגמת לידים - 6 חודשים אחרונים 📅
        </h4>
        <div className="flex items-end justify-between gap-2 h-48">
          {Object.entries(stats.monthlyData).map(([month, data]) => {
            const maxValue = Math.max(
              ...Object.values(stats.monthlyData).map((d) => d.total)
            );
            const height = maxValue > 0 ? (data.total / maxValue) * 100 : 0;
            const closedHeight =
              data.total > 0 ? (data.closed / data.total) * 100 : 0;

            return (
              <div
                key={month}
                className="flex-1 flex flex-col items-center gap-2"
              >
                <div className="w-full relative" style={{ height: "10rem" }}>
                  <div
                    className="absolute bottom-0 w-full bg-slate-200 rounded-t-lg transition-all duration-500"
                    style={{ height: `${height}%` }}
                  >
                    <div
                      className="absolute bottom-0 w-full bg-pink-500 rounded-t-lg transition-all duration-500"
                      style={{ height: `${closedHeight}%` }}
                    ></div>
                  </div>
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-black text-slate-600">
                    {data.total}
                  </div>
                </div>
                <div className="text-[9px] font-black text-slate-400">
                  {new Date(month + "-01").toLocaleDateString("he-IL", {
                    month: "short",
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-center gap-6 mt-6 text-xs font-bold">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-slate-200"></div>
            <span className="text-slate-600">סה״כ לידים</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-pink-500"></div>
            <span className="text-slate-600">נסגרו בהצלחה</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-components
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

const FunnelItem = ({ label, count, color, percent }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs font-black text-slate-600">
      <span>{label}</span>
      <span>
        {count} ({percent}%)
      </span>
    </div>
    <div className="w-full h-8 bg-slate-50 rounded-xl overflow-hidden border border-slate-100 flex items-center">
      <div
        className={`h-full ${color} transition-all duration-1000 flex items-center justify-center text-white text-xs font-black`}
        style={{ width: `${percent}%`, minWidth: "2rem" }}
      >
        {percent}%
      </div>
    </div>
  </div>
);

const MetricItem = ({ label, value, icon, color = "text-slate-800" }) => (
  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
    <div className="flex items-center gap-3">
      <span className="text-2xl">{icon}</span>
      <span className="text-sm font-bold text-slate-600">{label}</span>
    </div>
    <div className={`text-xl font-black ${color}`}>{value}</div>
  </div>
);
