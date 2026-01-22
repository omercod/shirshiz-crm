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
import InfoPopup from "./components/InfoPopup";

export default function StatsPage() {
  const { leads } = useAppContext();
  const [statsTimeFilter, setStatsTimeFilter] = useState("month");
  const [customDateRange, setCustomDateRange] = useState({ from: "", to: "" });
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  const stats = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    let filtered = [...leads];

    if (statsTimeFilter !== "all") {
      if (statsTimeFilter === "day") {
        // היום - תאריך מקומי
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        const todayStr = `${year}-${month}-${day}`;
        filtered = leads.filter((l) => l.regDate === todayStr);
      } else if (statsTimeFilter === "week") {
        // מיום ראשון עד היום
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dayOfWeek = today.getDay(); // 0 = ראשון, 1 = שני, ..., 6 = שבת
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - dayOfWeek); // חזרה ליום ראשון
        startOfWeek.setHours(0, 0, 0, 0);

        filtered = leads.filter((l) => {
          const leadDate = new Date(l.regDate);
          leadDate.setHours(0, 0, 0, 0);
          return leadDate >= startOfWeek && leadDate <= today;
        });
      } else if (statsTimeFilter === "month") {
        // מה-1 בחודש עד היום
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);

        filtered = leads.filter((l) => {
          const leadDate = new Date(l.regDate);
          leadDate.setHours(0, 0, 0, 0);
          return leadDate >= startOfMonth && leadDate <= today;
        });
      } else if (statsTimeFilter === "year") {
        // מ-1.1 עד היום
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        startOfYear.setHours(0, 0, 0, 0);

        filtered = leads.filter((l) => {
          const leadDate = new Date(l.regDate);
          leadDate.setHours(0, 0, 0, 0);
          return leadDate >= startOfYear && leadDate <= today;
        });
      } else if (statsTimeFilter === "custom") {
        // מותאם אישית
        if (customDateRange.from && customDateRange.to) {
          const fromDate = new Date(customDateRange.from);
          fromDate.setHours(0, 0, 0, 0);
          const toDate = new Date(customDateRange.to);
          toDate.setHours(23, 59, 59, 999);

          filtered = leads.filter((l) => {
            const leadDate = new Date(l.regDate);
            leadDate.setHours(0, 0, 0, 0);
            return leadDate >= fromDate && leadDate <= toDate;
          });
        }
      }
    }

    const total = filtered.length;

    // פונקציה עוזרת - תאריך מקומי
    const getLocalDateString = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    // 🔥 חישוב closed לפי תאריך תשלום ראשון
    const closedLeads = leads.filter((lead) => {
      if (Number(lead.status) !== 3) return false;
      if (!lead.payments || lead.payments.length === 0) return false;

      const sortedPayments = [...lead.payments].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );
      const firstPaymentDate = new Date(sortedPayments[0].date);
      firstPaymentDate.setHours(0, 0, 0, 0);

      const today = new Date();
      const todayStr = getLocalDateString(today);
      today.setHours(0, 0, 0, 0);

      if (statsTimeFilter === "all") return true;
      if (statsTimeFilter === "day") return sortedPayments[0].date === todayStr;
      if (statsTimeFilter === "week") {
        const dayOfWeek = today.getDay();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - dayOfWeek);
        startOfWeek.setHours(0, 0, 0, 0);
        return firstPaymentDate >= startOfWeek && firstPaymentDate <= today;
      }
      if (statsTimeFilter === "month") {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);
        return firstPaymentDate >= startOfMonth && firstPaymentDate <= today;
      }
      if (statsTimeFilter === "year") {
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        startOfYear.setHours(0, 0, 0, 0);
        return firstPaymentDate >= startOfYear && firstPaymentDate <= today;
      }
      if (statsTimeFilter === "custom") {
        if (customDateRange.from && customDateRange.to) {
          const fromDate = new Date(customDateRange.from);
          fromDate.setHours(0, 0, 0, 0);
          const toDate = new Date(customDateRange.to);
          toDate.setHours(23, 59, 59, 999);
          return firstPaymentDate >= fromDate && firstPaymentDate <= toDate;
        }
      }
      return false;
    });

    const closed = closedLeads.length;
    const newLeads = filtered.filter((l) => Number(l.status) === 1).length;
    const inProgress = filtered.filter((l) => Number(l.status) === 2).length;
    const conversion = total > 0 ? ((closed / total) * 100).toFixed(1) : 0;
    const totalRevenue = closedLeads.reduce(
      (acc, curr) => acc + Number(curr.quote || 0),
      0
    );
    const potentialRevenue = filtered
      .filter((l) => Number(l.status) === 2)
      .reduce((acc, curr) => acc + Number(curr.quote || 0), 0);
    const avgDealSize = closed > 0 ? Math.round(totalRevenue / closed) : 0;

    // 💰 חישוב מחזור (Revenue) - לפי תאריך תשלום ראשון
    const calculateRevenue = () => {
      let revenue = 0;
      const today = new Date();
      const todayStr = getLocalDateString(today);
      today.setHours(0, 0, 0, 0);

      leads.forEach((lead) => {
        if (lead.payments && lead.payments.length > 0) {
          const sortedPayments = [...lead.payments].sort(
            (a, b) => new Date(a.date) - new Date(b.date)
          );

          const firstPaymentDate = new Date(sortedPayments[0].date);
          firstPaymentDate.setHours(0, 0, 0, 0);

          let isInRange = false;

          if (statsTimeFilter === "all") {
            isInRange = true;
          } else if (statsTimeFilter === "day") {
            isInRange = sortedPayments[0].date === todayStr;
          } else if (statsTimeFilter === "week") {
            const dayOfWeek = today.getDay();
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - dayOfWeek);
            startOfWeek.setHours(0, 0, 0, 0);
            isInRange =
              firstPaymentDate >= startOfWeek && firstPaymentDate <= today;
          } else if (statsTimeFilter === "month") {
            const startOfMonth = new Date(
              today.getFullYear(),
              today.getMonth(),
              1
            );
            startOfMonth.setHours(0, 0, 0, 0);
            isInRange =
              firstPaymentDate >= startOfMonth && firstPaymentDate <= today;
          } else if (statsTimeFilter === "year") {
            const startOfYear = new Date(today.getFullYear(), 0, 1);
            startOfYear.setHours(0, 0, 0, 0);
            isInRange =
              firstPaymentDate >= startOfYear && firstPaymentDate <= today;
          } else if (statsTimeFilter === "custom") {
            if (customDateRange.from && customDateRange.to) {
              const fromDate = new Date(customDateRange.from);
              fromDate.setHours(0, 0, 0, 0);
              const toDate = new Date(customDateRange.to);
              toDate.setHours(23, 59, 59, 999);
              isInRange =
                firstPaymentDate >= fromDate && firstPaymentDate <= toDate;
            }
          }

          if (isInRange) {
            const totalPayments = sortedPayments.reduce(
              (sum, p) => sum + (Number(p.amount) || 0),
              0
            );
            revenue += totalPayments;
          }
        }
      });

      return revenue;
    };

    // 💸 חישוב הכנסות בפועל (Cash Flow) - לפי תאריכי תשלום
    const calculateCashFlow = () => {
      let cashFlow = 0;
      const today = new Date();
      const todayStr = getLocalDateString(today);
      today.setHours(0, 0, 0, 0);

      leads.forEach((lead) => {
        if (lead.payments && lead.payments.length > 0) {
          lead.payments.forEach((payment) => {
            const paymentDate = new Date(payment.date);
            paymentDate.setHours(0, 0, 0, 0);

            let isInRange = false;

            if (statsTimeFilter === "all") {
              isInRange = true;
            } else if (statsTimeFilter === "day") {
              isInRange = payment.date === todayStr;
            } else if (statsTimeFilter === "week") {
              const dayOfWeek = today.getDay();
              const startOfWeek = new Date(today);
              startOfWeek.setDate(today.getDate() - dayOfWeek);
              startOfWeek.setHours(0, 0, 0, 0);
              isInRange = paymentDate >= startOfWeek && paymentDate <= today;
            } else if (statsTimeFilter === "month") {
              const startOfMonth = new Date(
                today.getFullYear(),
                today.getMonth(),
                1
              );
              startOfMonth.setHours(0, 0, 0, 0);
              isInRange = paymentDate >= startOfMonth && paymentDate <= today;
            } else if (statsTimeFilter === "year") {
              const startOfYear = new Date(today.getFullYear(), 0, 1);
              startOfYear.setHours(0, 0, 0, 0);
              isInRange = paymentDate >= startOfYear && paymentDate <= today;
            } else if (statsTimeFilter === "custom") {
              if (customDateRange.from && customDateRange.to) {
                const fromDate = new Date(customDateRange.from);
                fromDate.setHours(0, 0, 0, 0);
                const toDate = new Date(customDateRange.to);
                toDate.setHours(23, 59, 59, 999);
                isInRange = paymentDate >= fromDate && paymentDate <= toDate;
              }
            }

            if (isInRange) {
              cashFlow += Number(payment.amount) || 0;
            }
          });
        }
      });

      return cashFlow;
    };

    // 📈 הכנסות עתידיות - תשלומים שעוד לא הגיעו
    const calculateFutureRevenue = () => {
      let futureRevenue = 0;
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      leads.forEach((lead) => {
        if (lead.payments && lead.payments.length > 0) {
          lead.payments.forEach((payment) => {
            const paymentDate = new Date(payment.date);
            paymentDate.setHours(0, 0, 0, 0);

            if (paymentDate > today) {
              futureRevenue += Number(payment.amount) || 0;
            }
          });
        }
      });

      return futureRevenue;
    };

    const filteredRevenue = calculateRevenue();
    const filteredCashFlow = calculateCashFlow();
    const futureRevenue = calculateFutureRevenue();

    // 💸 הכנת נתונים לפופאפ הכנסות - מקובץ לפי לקוח
    const cashFlowDetails = (() => {
      const today = new Date();
      const todayStr = getLocalDateString(today);
      today.setHours(0, 0, 0, 0);

      const leadPaymentsMap = new Map(); // leadId -> { lead info, payments[] }

      leads.forEach((lead) => {
        if (lead.payments && lead.payments.length > 0) {
          const relevantPayments = [];

          lead.payments.forEach((payment) => {
            const paymentDate = new Date(payment.date);
            paymentDate.setHours(0, 0, 0, 0);

            let isInRange = false;

            if (statsTimeFilter === "all") {
              isInRange = true;
            } else if (statsTimeFilter === "day") {
              isInRange = payment.date === todayStr;
            } else if (statsTimeFilter === "week") {
              const dayOfWeek = today.getDay();
              const startOfWeek = new Date(today);
              startOfWeek.setDate(today.getDate() - dayOfWeek);
              startOfWeek.setHours(0, 0, 0, 0);
              isInRange = paymentDate >= startOfWeek && paymentDate <= today;
            } else if (statsTimeFilter === "month") {
              const startOfMonth = new Date(
                today.getFullYear(),
                today.getMonth(),
                1
              );
              startOfMonth.setHours(0, 0, 0, 0);
              isInRange = paymentDate >= startOfMonth && paymentDate <= today;
            } else if (statsTimeFilter === "year") {
              const startOfYear = new Date(today.getFullYear(), 0, 1);
              startOfYear.setHours(0, 0, 0, 0);
              isInRange = paymentDate >= startOfYear && paymentDate <= today;
            } else if (statsTimeFilter === "custom") {
              if (customDateRange.from && customDateRange.to) {
                const fromDate = new Date(customDateRange.from);
                fromDate.setHours(0, 0, 0, 0);
                const toDate = new Date(customDateRange.to);
                toDate.setHours(23, 59, 59, 999);
                isInRange = paymentDate >= fromDate && paymentDate <= toDate;
              }
            }

            if (isInRange) {
              relevantPayments.push(payment);
            }
          });

          if (relevantPayments.length > 0) {
            leadPaymentsMap.set(lead.id, {
              name: lead.name,
              eventType: lead.eventType || "לא צוין",
              payments: relevantPayments.sort(
                (a, b) => new Date(a.date) - new Date(b.date)
              ),
            });
          }
        }
      });

      // המר ל-array וסדר לפי תשלום אחרון
      return Array.from(leadPaymentsMap.values()).sort((a, b) => {
        // 🔥 מצא תשלום אחרון של כל לקוח
        const lastPaymentA = a.payments[a.payments.length - 1];
        const lastPaymentB = b.payments[b.payments.length - 1];

        const dateA = new Date(lastPaymentA.date);
        const dateB = new Date(lastPaymentB.date);

        // מיון מהחדש לישן
        return dateB - dateA;
      });
    })();

    const sourceData = {};
    filtered.forEach((l) => {
      sourceData[l.source] = (sourceData[l.source] || 0) + 1;
    });

    const statusData = {
      new: newLeads,
      inProgress: inProgress,
      closed: closed,
      irrelevant: filtered.filter((l) => Number(l.status) === 4).length,
    };

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

    // חישוב השוואת סדנאות - לפי תאריך תשלום ראשון
    const workshopClosedLeads = leads.filter((lead) => {
      // רק נסגר
      if (Number(lead.status) !== 3) return false;

      // חייב להיות מאפס למקצוענית או וינטאג'
      if (
        lead.eventType !== "מאפס למקצוענית" &&
        lead.eventType !== "סדנת וינטאג'"
      ) {
        return false;
      }

      // חייב להיות לפחות תשלום אחד
      if (!lead.payments || lead.payments.length === 0) return false;

      // מצא תשלום ראשון
      const sortedPayments = [...lead.payments].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );
      const firstPaymentDate = new Date(sortedPayments[0].date);
      firstPaymentDate.setHours(0, 0, 0, 0);

      // סינון לפי טווח זמן
      const today = new Date();
      const todayStr = getLocalDateString(today);
      today.setHours(0, 0, 0, 0);

      if (statsTimeFilter === "all") {
        return true;
      } else if (statsTimeFilter === "day") {
        return sortedPayments[0].date === todayStr;
      } else if (statsTimeFilter === "week") {
        const dayOfWeek = today.getDay();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - dayOfWeek);
        startOfWeek.setHours(0, 0, 0, 0);
        return firstPaymentDate >= startOfWeek && firstPaymentDate <= today;
      } else if (statsTimeFilter === "month") {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);
        return firstPaymentDate >= startOfMonth && firstPaymentDate <= today;
      } else if (statsTimeFilter === "year") {
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        startOfYear.setHours(0, 0, 0, 0);
        return firstPaymentDate >= startOfYear && firstPaymentDate <= today;
      } else if (statsTimeFilter === "custom") {
        if (customDateRange.from && customDateRange.to) {
          const fromDate = new Date(customDateRange.from);
          fromDate.setHours(0, 0, 0, 0);
          const toDate = new Date(customDateRange.to);
          toDate.setHours(23, 59, 59, 999);
          return firstPaymentDate >= fromDate && firstPaymentDate <= toDate;
        }
      }

      return false;
    });

    const proCount = workshopClosedLeads.filter(
      (l) => l.eventType === "מאפס למקצוענית"
    ).length;

    const vintageCount = workshopClosedLeads.filter(
      (l) => l.eventType === "סדנת וינטאג'"
    ).length;

    const workshopTotal = proCount + vintageCount;
    const proPercentage =
      workshopTotal > 0 ? ((proCount / workshopTotal) * 100).toFixed(1) : 0;
    const vintagePercentage =
      workshopTotal > 0 ? ((vintageCount / workshopTotal) * 100).toFixed(1) : 0;

    // 📊 הכנת נתונים לפופאפ
    const closedLeadsDetails = closedLeads
      .map((lead) => {
        const sortedPayments = [...(lead.payments || [])].sort(
          (a, b) => new Date(a.date) - new Date(b.date)
        );
        const firstPaymentDate = sortedPayments[0]?.date || "לא זמין";

        // 💰 חישוב סכום כולל
        const totalAmount = sortedPayments.reduce(
          (sum, payment) => sum + (Number(payment.amount) || 0),
          0
        );

        return {
          name: lead.name,
          eventType: lead.eventType,
          firstPaymentDate: firstPaymentDate,
          totalAmount: totalAmount,
          quote: lead.quote,
        };
      })
      .sort((a, b) => {
        // 🔥 מיון מהחדש לישן - לפי תאריך סגירה
        const dateA = new Date(a.firstPaymentDate);
        const dateB = new Date(b.firstPaymentDate);
        return dateB - dateA; // הפוך - החדש ראשון
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
      filteredRevenue,
      filteredCashFlow,
      futureRevenue,
      proCount,
      vintageCount,
      workshopTotal,
      proPercentage,
      closedLeadsDetails,
      vintagePercentage,
      cashFlowDetails,
    };
  }, [leads, statsTimeFilter, customDateRange]);

  return (
    <div className="space-y-4 lg:space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 lg:gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-black text-slate-800">
            סטטיסטיקות ונתונים
          </h2>
          <p className="text-slate-400 font-bold text-xs lg:text-sm">
            ניתוח ביצועים והצלחות
          </p>
        </div>

        {/* Time Filter */}
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {[
            { val: "day", label: "היום" },
            { val: "week", label: "השבוע" },
            { val: "month", label: "החודש" },
            { val: "year", label: "השנה" },
            { val: "all", label: "הכל" },
          ].map((opt) => (
            <button
              key={opt.val}
              onClick={() => {
                setStatsTimeFilter(opt.val);
                setShowCustomPicker(false);
              }}
              className={`px-3 lg:px-4 py-2 rounded-lg lg:rounded-xl font-black text-xs lg:text-sm transition-all active:scale-95 ${
                statsTimeFilter === opt.val
                  ? "bg-pink-600 text-white shadow-lg"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
          <button
            onClick={() => {
              setStatsTimeFilter("custom");
              setShowCustomPicker(!showCustomPicker);
            }}
            className={`flex items-center gap-1.5 px-3 lg:px-4 py-2 rounded-lg lg:rounded-xl font-black text-xs lg:text-sm transition-all active:scale-95 ${
              statsTimeFilter === "custom"
                ? "bg-pink-600 text-white shadow-lg"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Calendar size={14} className="lg:hidden" />
            <Calendar size={16} className="hidden lg:block" />
            מותאם אישית
          </button>
        </div>
      </header>

      {/* Custom Date Range Picker */}
      {showCustomPicker && (
        <div className="bg-white p-4 lg:p-6 rounded-xl lg:rounded-2xl border shadow-sm animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 lg:gap-4">
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
                className="w-full p-2.5 lg:p-3 bg-slate-50 border-2 border-slate-200 rounded-lg lg:rounded-xl outline-none font-bold text-sm focus:border-pink-400 transition-all"
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
                className="w-full p-2.5 lg:p-3 bg-slate-50 border-2 border-slate-200 rounded-lg lg:rounded-xl outline-none font-bold text-sm focus:border-pink-400 transition-all"
              />
            </div>
            <button
              onClick={() => {
                if (customDateRange.from && customDateRange.to) {
                  setShowCustomPicker(false);
                }
              }}
              disabled={!customDateRange.from || !customDateRange.to}
              className="px-4 lg:px-6 py-2.5 lg:py-3 bg-pink-600 text-white rounded-lg lg:rounded-xl font-black hover:bg-pink-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all active:scale-95 text-sm"
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

      {/* Main Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard
          icon={<Users size={20} className="lg:hidden" />}
          iconLarge={<Users size={24} className="hidden lg:block" />}
          title="סה״כ לידים"
          value={stats.total}
          color="blue"
        />
        <StatCard
          icon={<Target size={20} className="lg:hidden" />}
          iconLarge={<Target size={24} className="hidden lg:block" />}
          title="אחוז המרה"
          value={`${stats.conversion}%`}
          color="emerald"
        />
        <StatCard
          icon={<TrendingUp size={20} className="lg:hidden" />}
          iconLarge={<TrendingUp size={24} className="hidden lg:block" />}
          title="💼 מחזור"
          value={`₪${stats.filteredRevenue.toLocaleString()}`}
          color="purple"
          subtitle="סך עסקאות"
        />
        <div className="relative">
          <InfoPopup
            title={`💰 הכנסות בפועל • ${
              stats.cashFlowDetails?.length || 0
            } לקוחות`}
            data={stats.cashFlowDetails || []}
            renderItem={(customer, index) => (
              <div className="space-y-3">
                {/* Customer Header with Number */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-slate-400">
                      #{index + 1}
                    </span>
                    <div>
                      <div className="text-sm font-black text-slate-700">
                        {customer.name}
                      </div>
                      <div className="text-xs text-slate-500 font-bold">
                        🎓 {customer.eventType}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full font-bold">
                    {customer.payments.length} תשלומים
                  </span>
                </div>

                {/* Payments List */}
                <div className="space-y-2">
                  {customer.payments.map((payment, paymentIndex) => (
                    <div
                      key={paymentIndex}
                      className="flex items-center justify-between bg-white rounded-lg p-2 border border-slate-100"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-full font-bold">
                          #{paymentIndex + 1}
                        </span>
                        <div className="text-xs">
                          <div className="font-bold text-slate-600">
                            📅 {payment.date}
                          </div>
                          {payment.description && (
                            <div className="text-slate-400 text-[10px]">
                              {payment.description}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-sm font-black text-pink-600">
                        ₪{Number(payment.amount).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total for this customer */}
                <div className="flex items-center justify-between bg-pink-50 rounded-lg p-2 border border-pink-200">
                  <span className="text-xs font-bold text-slate-600">
                    סה"כ:
                  </span>
                  <span className="text-sm font-black text-pink-700">
                    ₪
                    {customer.payments
                      .reduce((sum, p) => sum + Number(p.amount || 0), 0)
                      .toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          />

          <StatCard
            icon={<DollarSign size={20} className="lg:hidden" />}
            iconLarge={<DollarSign size={24} className="hidden lg:block" />}
            title="💰 הכנסות"
            value={`₪${stats.filteredCashFlow.toLocaleString()}`}
            color="pink"
            subtitle="כסף בפועל"
          />
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <div className="relative bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 lg:p-6 rounded-2xl lg:rounded-[2rem] border border-emerald-200">
          {/* Info Popup */}
          <InfoPopup
            title="עסקאות שנסגרו"
            data={stats.closedLeadsDetails || []}
            renderItem={(lead, index) => (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-slate-700">
                    {lead.name}
                  </span>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-bold">
                    #{index + 1}
                  </span>
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-500">
                      📅 תאריך סגירה:
                    </span>
                    <span className="font-bold">{lead.firstPaymentDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-500">🎓 סדנה:</span>
                    <span className="font-bold">
                      {lead.eventType || "לא צוין"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-500">
                      💰 סכום כולל:
                    </span>
                    <span className="font-black text-emerald-600">
                      ₪{lead.totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          />

          <div className="text-xs lg:text-sm font-black text-emerald-600 mb-1 lg:mb-2">
            עסקאות שנסגרו
          </div>
          <div className="text-2xl lg:text-4xl font-black text-emerald-700">
            {stats.closed}
          </div>
          <div className="text-[10px] lg:text-xs text-emerald-600 font-bold mt-1 lg:mt-2">
            מתוך {stats.total} לידים
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 lg:p-6 rounded-2xl lg:rounded-[2rem] border border-amber-200">
          <div className="text-xs lg:text-sm font-black text-amber-600 mb-1 lg:mb-2">
            💸 הכנסות עתידיות
          </div>
          <div className="text-2xl lg:text-4xl font-black text-amber-700">
            ₪{stats.futureRevenue.toLocaleString()}
          </div>
          <div className="text-[10px] lg:text-xs text-amber-600 font-bold mt-1 lg:mt-2">
            תשלומים ממתינים
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 lg:p-6 rounded-2xl lg:rounded-[2rem] border border-blue-200">
          <div className="text-xs lg:text-sm font-black text-blue-600 mb-1 lg:mb-2">
            📊 עסקה ממוצעת
          </div>
          <div className="text-2xl lg:text-4xl font-black text-blue-700">
            ₪{stats.avgDealSize.toLocaleString()}
          </div>
          <div className="text-[10px] lg:text-xs text-blue-600 font-bold mt-1 lg:mt-2">
            לליד שנסגר
          </div>
        </div>

        <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-4 lg:p-6 rounded-2xl lg:rounded-[2rem] border border-pink-200">
          <div className="text-xs lg:text-sm font-black text-pink-600 mb-1 lg:mb-2">
            💼 הכנסות פוטנציאליות
          </div>
          <div className="text-2xl lg:text-4xl font-black text-pink-700">
            ₪{stats.potentialRevenue.toLocaleString()}
          </div>
          <div className="text-[10px] lg:text-xs text-pink-600 font-bold mt-1 lg:mt-2">
            {stats.inProgress} עסקאות בתהליך
          </div>
        </div>
      </div>

      {/* Workshop Comparison Section */}
      <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border-2 border-slate-100">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="p-2 sm:p-2.5 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl">
            <TrendingUp size={20} className="sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-800">
              השוואת סדנאות
            </h3>
            <p className="text-[10px] sm:text-xs text-slate-400 font-bold">
              מאפס למקצוענית vs סדנת וינטאג'
            </p>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* Pro Course */}
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-4 border-2 border-pink-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🎓</span>
                <h4 className="text-sm font-black text-slate-700">
                  מאפס למקצוענית
                </h4>
              </div>
              <div className="text-3xl sm:text-4xl font-black text-pink-600 mb-1">
                {stats.proCount}
              </div>
              <div className="text-xs font-bold text-pink-700">
                {stats.proPercentage}% מסך הסגירות
              </div>
            </div>

            {/* Vintage */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border-2 border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🎂</span>
                <h4 className="text-sm font-black text-slate-700">
                  סדנת וינטאג'
                </h4>
              </div>
              <div className="text-3xl sm:text-4xl font-black text-purple-600 mb-1">
                {stats.vintageCount}
              </div>
              <div className="text-xs font-bold text-purple-700">
                {stats.vintagePercentage}% מסך הסגירות
              </div>
            </div>

            {/* Total */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border-2 border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">📊</span>
                <h4 className="text-sm font-black text-slate-700">
                  סה"כ סגירות
                </h4>
              </div>
              <div className="text-3xl sm:text-4xl font-black text-slate-700 mb-1">
                {stats.workshopTotal}
              </div>
              <div className="text-xs font-bold text-slate-500">
                סדנאות שנסגרו
              </div>
            </div>
          </div>

          {/* Visual Bar Comparison */}
          <div className="space-y-3">
            <div className="text-xs font-black text-slate-500 uppercase tracking-wide">
              התפלגות סגירות
            </div>

            {/* Pro Bar */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-bold text-slate-600">
                  🎓 מאפס למקצוענית
                </span>
                <span className="text-xs font-black text-pink-600">
                  {stats.proCount} ({stats.proPercentage}%)
                </span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-500 to-pink-600 rounded-full transition-all duration-500"
                  style={{ width: `${stats.proPercentage}%` }}
                />
              </div>
            </div>

            {/* Vintage Bar */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-bold text-slate-600">
                  🎂 סדנת וינטאג'
                </span>
                <span className="text-xs font-black text-purple-600">
                  {stats.vintageCount} ({stats.vintagePercentage}%)
                </span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-500"
                  style={{ width: `${stats.vintagePercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          {stats.workshopTotal > 0 && (
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                <span className="text-base">
                  {stats.proCount > stats.vintageCount
                    ? "🏆"
                    : stats.proCount === stats.vintageCount
                    ? "🤝"
                    : "📈"}
                </span>
                <span>
                  {stats.proCount > stats.vintageCount
                    ? "מאפס למקצוענית מובילה במכירות"
                    : stats.proCount === stats.vintageCount
                    ? "שתי הסדנאות בשוויון מושלם"
                    : "סדנת וינטאג' מובילה במכירות"}
                </span>
              </div>
            </div>
          )}

          {stats.workshopTotal === 0 && (
            <div className="text-center py-6 text-slate-400">
              <span className="text-2xl mb-2 block">📊</span>
              <p className="text-sm font-bold">אין עדיין סגירות בתקופה זו</p>
            </div>
          )}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Status Distribution */}
        <div className="bg-white p-4 lg:p-6 rounded-2xl lg:rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 lg:gap-3 mb-4 lg:mb-6">
            <div className="p-2 lg:p-3 bg-blue-50 rounded-lg lg:rounded-xl text-blue-600">
              <PieChart size={20} className="lg:hidden" />
              <PieChart size={24} className="hidden lg:block" />
            </div>
            <h3 className="text-lg lg:text-xl font-black text-slate-800">
              פילוח לפי סטטוס
            </h3>
          </div>

          <div className="space-y-3 lg:space-y-4">
            <StatusBar
              label="חדש"
              value={stats.statusData.new}
              total={stats.total}
              color="bg-blue-500"
            />
            <StatusBar
              label="בתהליך"
              value={stats.statusData.inProgress}
              total={stats.total}
              color="bg-amber-500"
            />
            <StatusBar
              label="נסגר"
              value={stats.statusData.closed}
              total={stats.total}
              color="bg-emerald-500"
            />
            <StatusBar
              label="לא רלוונטי"
              value={stats.statusData.irrelevant}
              total={stats.total}
              color="bg-rose-500"
            />
          </div>
        </div>

        {/* Source Distribution */}
        <div className="bg-white p-4 lg:p-6 rounded-2xl lg:rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 lg:gap-3 mb-4 lg:mb-6">
            <div className="p-2 lg:p-3 bg-pink-50 rounded-lg lg:rounded-xl text-pink-600">
              <TrendingUp size={20} className="lg:hidden" />
              <TrendingUp size={24} className="hidden lg:block" />
            </div>
            <h3 className="text-lg lg:text-xl font-black text-slate-800">
              מקורות הגעה
            </h3>
          </div>

          <div className="space-y-2 lg:space-y-3">
            {Object.entries(stats.sourceData)
              .sort(([, a], [, b]) => b - a)
              .map(([source, count]) => (
                <div
                  key={source}
                  className="flex items-center justify-between p-3 lg:p-4 bg-slate-50 rounded-xl lg:rounded-2xl"
                >
                  <div className="flex items-center gap-2 lg:gap-3 flex-1 min-w-0">
                    <span
                      className={`px-2 lg:px-2.5 py-1 rounded-lg text-[9px] lg:text-[10px] font-black border flex-shrink-0 ${
                        SOURCES[source]?.color || SOURCES["אחר"].color
                      }`}
                    >
                      {source}
                    </span>
                    <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-pink-500 h-full transition-all duration-500"
                        style={{
                          width: `${(count / stats.total) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <span className="font-black text-slate-800 text-sm lg:text-base ml-2 lg:ml-3 flex-shrink-0">
                    {count}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="bg-white p-4 lg:p-6 rounded-2xl lg:rounded-[2rem] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 lg:gap-3 mb-4 lg:mb-6">
          <div className="p-2 lg:p-3 bg-emerald-50 rounded-lg lg:rounded-xl text-emerald-600">
            <Calendar size={20} className="lg:hidden" />
            <Calendar size={24} className="hidden lg:block" />
          </div>
          <h3 className="text-lg lg:text-xl font-black text-slate-800">
            מגמה 6 חודשים
          </h3>
        </div>

        <div className="space-y-2 lg:space-y-3">
          {Object.entries(stats.monthlyData).map(([month, data]) => {
            const maxValue = Math.max(
              ...Object.values(stats.monthlyData).map((d) => d.total)
            );
            const monthName = new Intl.DateTimeFormat("he-IL", {
              month: "short",
            }).format(new Date(month + "-01"));

            return (
              <div key={month} className="space-y-1 lg:space-y-1.5">
                <div className="flex items-center justify-between text-xs lg:text-sm">
                  <span className="font-black text-slate-600">{monthName}</span>
                  <span className="font-bold text-slate-400">
                    {data.total} לידים • {data.closed} נסגרו
                  </span>
                </div>
                <div className="flex gap-1 lg:gap-1.5">
                  <div className="flex-1 bg-slate-100 rounded-full h-4 lg:h-5 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full transition-all duration-500"
                      style={{
                        width: `${
                          maxValue > 0 ? (data.total / maxValue) * 100 : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                  <div className="flex-1 bg-slate-100 rounded-full h-4 lg:h-5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-500"
                      style={{
                        width: `${
                          maxValue > 0 ? (data.closed / maxValue) * 100 : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 lg:mt-6 flex flex-wrap gap-3 lg:gap-4 justify-center text-xs font-bold">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-slate-600">סה״כ לידים</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-slate-600">נסגרו</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
const StatCard = ({ icon, iconLarge, title, value, color }) => {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    pink: "bg-pink-50 text-pink-600 border-pink-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
  };

  const textColors = {
    blue: "text-blue-700",
    emerald: "text-emerald-700",
    pink: "text-pink-700",
    amber: "text-amber-700",
    purple: "text-purple-700",
  };

  return (
    <div
      className={`${colors[color]} p-3 lg:p-6 rounded-xl lg:rounded-2xl border`}
    >
      <div className="mb-2 lg:mb-3">
        {icon}
        {iconLarge}
      </div>
      <div className="text-[10px] lg:text-sm font-black uppercase mb-1 lg:mb-2 opacity-80">
        {title}
      </div>
      <div className={`text-xl lg:text-3xl font-black ${textColors[color]}`}>
        {value}
      </div>
    </div>
  );
};

// Status Bar Component
const StatusBar = ({ label, value, total, color }) => {
  const percentage = total > 0 ? (value / total) * 100 : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-1 lg:mb-1.5">
        <span className="font-black text-slate-700 text-xs lg:text-sm">
          {label}
        </span>
        <span className="font-bold text-slate-400 text-xs lg:text-sm">
          {value} ({percentage.toFixed(0)}%)
        </span>
      </div>
      <div className="bg-slate-100 rounded-full h-3 lg:h-4 overflow-hidden">
        <div
          className={`${color} h-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};
