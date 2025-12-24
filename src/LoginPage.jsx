import React, { useState, useEffect } from "react";
import { Lock, Mail, Eye, EyeOff } from "lucide-react";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Load Assistant font
  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Assistant:wght@300;400;600;700;800&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const success = await onLogin(email, password);
      if (!success) {
        setError("אימייל או סיסמה שגויים");
      }
    } catch (err) {
      setError("שגיאה בהתחברות. נסי שוב.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[#F2B1AD] via-[#F5C4C1] to-[#F8D7D5] flex items-center justify-center p-4"
      style={{ fontFamily: "Assistant, sans-serif" }}
      dir="rtl"
    >
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-[#F2B1AD] rounded-full opacity-30 blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-white rounded-full opacity-20 blur-3xl"></div>
      </div>

      {/* Login Card */}
      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 lg:p-10 border border-[#F2B1AD]/20">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            {/* Profile Image Placeholder */}
            <div className="relative inline-block mb-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#F2B1AD] to-[#E8A19D] shadow-xl overflow-hidden border-4 border-white">
                {/* תמונת פרופיל - תחליף את ה-src עם התמונה של שיר */}
                <img
                  src="./shirProfile.webp"
                  alt="SHIRSHIZ Logo"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback אם התמונה לא נמצאה
                    e.target.style.display = "none";
                    e.target.parentElement.innerHTML =
                      '<div class="w-full h-full flex items-center justify-center text-white text-4xl font-black" style="font-family: Assistant, sans-serif;">S</div>';
                  }}
                />
              </div>
            </div>

            <h1 className="text-3xl font-black text-slate-800 mb-2">
              SHIRSHIZ CRM
            </h1>
            <p className="text-slate-400 font-bold text-sm">
              מערכת ניהול לקוחות
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border-2 border-rose-200 rounded-xl animate-in shake">
              <p className="text-rose-700 font-bold text-sm text-center">
                ⚠️ {error}
              </p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-black text-slate-500 mb-2 mr-1">
                אימייל
              </label>
              <div className="relative">
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#F2B1AD]">
                  <Mail size={20} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pr-12 pl-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none font-bold text-slate-700 focus:border-[#F2B1AD] focus:bg-white transition-all"
                  placeholder="shir@example.com"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-black text-slate-500 mb-2 mr-1">
                סיסמה
              </label>
              <div className="relative">
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#F2B1AD]">
                  <Lock size={20} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-12 pl-12 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none font-bold text-slate-700 focus:border-[#F2B1AD] focus:bg-white transition-all"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#F2B1AD] transition-colors"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#F2B1AD] to-[#E8A19D] text-white py-4 rounded-xl font-black text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  מתחבר...
                </span>
              ) : (
                "כניסה למערכת"
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-slate-400 font-semibold">
              © 2025 SHIRSHIZ - כל הזכויות שמורות
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
