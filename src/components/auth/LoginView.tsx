import React, { useState } from 'react';
import { Eye, EyeOff, KeyRound, LogIn } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';

export const LoginView: React.FC = () => {
  const { login } = useInventory();
  const [email, setEmail] = useState('purinventorybi@gmail.com');
  const [password, setPassword] = useState('magang2026tw3');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email.trim()) {
      setErrorMsg('Silakan masukkan alamat email.');
      return;
    }
    if (!password) {
      setErrorMsg('Silakan masukkan kata sandi.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(email, password);
      if (!res.success) {
        setErrorMsg(res.message || 'Login gagal. Periksa email dan kata sandi Anda.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Terjadi kesalahan saat login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#eef2f6] font-sans select-none">
      {/* LEFT SECTION: Blue Architectural Showcase Banner */}
      <div className="relative w-full md:w-1/2 lg:w-5/12 bg-[#04457e] text-white flex flex-col justify-between p-8 sm:p-12 lg:p-16 overflow-hidden min-h-[380px] md:min-h-screen">
        {/* Background Architectural Overlay Graphic */}
        <div
          className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-25 pointer-events-none"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1200&auto=format&fit=crop&q=80')`,
          }}
        />
        {/* Subtle Gradient vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#04457e]/90 via-[#033663]/95 to-[#022849] pointer-events-none" />

        {/* Top Header Placeholder / Subtle Stamp */}
        <div className="relative z-10">
          <span className="text-xs font-semibold tracking-wider text-sky-200/80 uppercase">
            Sign In Portal
          </span>
        </div>

        {/* Center Hero: Bank Indonesia Emblem & Title */}
        <div className="relative z-10 my-auto py-8 text-center flex flex-col items-center">
          {/* Bank Indonesia Emblem Logo */}
          <div className="w-22 h-22 sm:w-28 sm:h-28 rounded-full bg-white flex items-center justify-center p-1.5 mb-6 shadow-2xl shadow-black/30 border-2 border-white/70">
            <img
              src="/logo-bi.png"
              alt="Logo Bank Indonesia"
              className="w-full h-full object-contain rounded-full"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Large Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-wider uppercase drop-shadow-md">
            PUR INVENTORY
          </h1>

          {/* Subtitle */}
          <div className="mt-3 space-y-0.5">
            <p className="text-sm sm:text-base font-medium text-sky-100/90 leading-snug">
              Pengelolaan Uang Rupiah
            </p>
            <p className="text-sm sm:text-base font-semibold text-white tracking-tight">
              Bank Indonesia Sulawesi Selatan
            </p>
          </div>
        </div>

        {/* Bottom Copyright Text */}
        <div className="relative z-10 text-center">
          <p className="text-xs text-sky-200/80 font-medium">
            &copy; Laode Raihan Pratama | Magang PUR TW III | 2026
          </p>
        </div>
      </div>

      {/* RIGHT SECTION: Clean Card & Login Form */}
      <div className="w-full md:w-1/2 lg:w-7/12 flex items-center justify-center p-6 sm:p-10 lg:p-16 bg-[#eef2f6]">
        <div className="w-full max-w-md flex flex-col items-center">
          {/* Top Logo / Badge */}
          <div className="mb-6 flex flex-col items-center">
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center p-0.5 border border-slate-200 shadow-2xs flex-shrink-0">
                <img
                  src="/logo-bi.png"
                  alt="Logo Bank Indonesia"
                  className="w-full h-full object-contain rounded-full"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-black text-[#04457e] tracking-tight">PUR</span>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-sky-100 text-[#04457e]">
                    SULSEL
                  </span>
                </div>
                <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-tighter">Logistik Souvenir</p>
              </div>
            </div>
          </div>

          {/* Login Card */}
          <div className="w-full bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-6 sm:p-8">
            <div className="mb-6 text-left">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Selamat Datang
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Silakan masuk untuk mengakses sistem inventaris PUR
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              {/* Email Input */}
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-semibold text-slate-700" htmlFor="login-email">
                  Email address
                </label>
                <div className="relative">
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    required
                    className="w-full px-4 py-3 text-sm font-medium rounded-xl bg-[#f1f5f9] text-slate-900 border border-transparent focus:border-[#04457e] focus:bg-white focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-semibold text-slate-700" htmlFor="login-password">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-3 pr-11 text-sm font-medium rounded-xl bg-[#f1f5f9] text-slate-900 border border-transparent focus:border-[#04457e] focus:bg-white focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="flex items-center justify-between pt-0.5">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs font-semibold text-sky-700 hover:text-[#04457e] hover:underline cursor-pointer transition-colors"
                >
                  Lupa password?
                </button>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  id="btn-submit-sign-in"
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-[#04457e] hover:bg-[#033663] active:bg-[#022849] text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-[#04457e]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Sign In</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Copyright for mobile / footer */}
          <p className="mt-6 text-xs text-slate-400 font-medium text-center">
            &copy; Laode Raihan Pratama | Magang PUR TW III | 2026
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#04457e]/10 text-[#04457e] flex items-center justify-center mx-auto">
              <KeyRound className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">Bantuan Kata Sandi</h3>
              <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                Silahkan hubungi developer magang tw 3 2026 di instagram{' '}
                <a
                  href="https://instagram.com/rhannprtmaa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-[#04457e] hover:underline"
                >
                  @rhannprtmaa
                </a>{' '}
                jika ingin mengubah kata sandi atau sandinya bermalasah
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="w-full py-2.5 bg-[#04457e] text-white text-xs font-bold rounded-xl hover:bg-[#033663] transition-colors cursor-pointer"
              >
                Mengerti &amp; Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
