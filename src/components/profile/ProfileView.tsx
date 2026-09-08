import React, { useState, useRef } from 'react';
import {
  User as UserIcon,
  Mail,
  Building2,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  Camera,
  Upload,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Save,
  Check,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';

export const ProfileView: React.FC = () => {
  const { currentUser, updateProfile, changePassword, addToast } = useInventory();

  // Profile fields
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [department, setDepartment] = useState(currentUser.department || 'Unit PUR & Logistik BI Sulsel');
  const [avatar, setAvatar] = useState(currentUser.avatar || '/logo-bi.png');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle avatar file upload
  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      addToast('Ukuran file maksimal 2MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatar(reader.result);
        addToast('Foto berhasil dimuat. Klik "Simpan Perubahan" untuk menyimpan.', 'info');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetToBiLogo = () => {
    setAvatar('/logo-bi.png');
    addToast('Avatar diatur ke Logo Bank Indonesia.', 'info');
  };

  // Submit profile details
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('Nama pengguna tidak boleh kosong.', 'error');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      addToast('Format email tidak valid.', 'error');
      return;
    }

    setIsSavingProfile(true);
    setProfileSuccessMsg('');

    setTimeout(() => {
      const res = updateProfile({
        name: name.trim(),
        email: email.trim(),
        department: department.trim(),
        avatar,
      });

      setIsSavingProfile(false);
      if (res.success) {
        setProfileSuccessMsg('Profil dan identitas pengguna berhasil diperbarui!');
        setTimeout(() => setProfileSuccessMsg(''), 4000);
      }
    }, 400);
  };

  // Submit password change
  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!newPassword) {
      setPasswordError('Silakan masukkan kata sandi baru.');
      return;
    }

    if (newPassword.length < 5) {
      setPasswordError('Kata sandi baru minimal 5 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    setIsSavingPassword(true);

    setTimeout(() => {
      const res = changePassword(currentPassword, newPassword);
      setIsSavingPassword(false);

      if (res.success) {
        setPasswordSuccess('Kata sandi akun Anda berhasil diperbarui!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(''), 4000);
      } else {
        setPasswordError(res.message || 'Gagal mengubah kata sandi.');
      }
    }, 400);
  };

  return (
    <div id="profile-view-container" className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#04457e] to-[#03335e] rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-[#04457e]/15 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-sky-200 border border-white/10 mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-300" />
              <span>Akun Internal &bull; Hak Akses Administrator</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Profil &amp; Pengaturan Akun
            </h1>
            <p className="text-sm text-sky-100/90 mt-1 max-w-2xl leading-relaxed">
              Kelola informasi profil, nama pengguna, foto profil/logo instansi, dan keamanan kata sandi akun sistem PUR Inventory Bank Indonesia.
            </p>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Avatar & Summary Profile Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 text-center">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider text-left mb-4">
              Foto Profil &amp; Identitas
            </h2>

            {/* Avatar Display */}
            <div className="relative inline-block mx-auto mb-4 group">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-white border-4 border-slate-100 shadow-md p-2 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-[1.02]">
                <img
                  src={avatar || '/logo-bi.png'}
                  alt={name}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Upload trigger overlay button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 p-2.5 bg-[#04457e] hover:bg-[#033663] text-white rounded-2xl shadow-lg border-2 border-white transition-all cursor-pointer"
                title="Ganti Foto Profil"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarFileUpload}
            />

            <h3 className="text-base font-bold text-slate-900 mt-1">{name || 'Nama Pengguna'}</h3>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">{email || 'email@bi.go.id'}</p>

            <div className="mt-3 flex items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-[#04457e] border border-blue-100">
                <ShieldCheck className="w-3 h-3 text-[#04457e]" />
                ADMINISTRATOR
              </span>
            </div>

            {/* Quick Avatar Actions */}
            <div className="mt-6 pt-5 border-t border-slate-100 space-y-2">
              <button
                id="btn-use-bi-logo"
                type="button"
                onClick={handleResetToBiLogo}
                className="w-full py-2.5 px-3 text-xs font-bold text-[#04457e] bg-blue-50 hover:bg-blue-100/80 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer border border-blue-100"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Gunakan Logo Bank Indonesia
              </button>

              <button
                id="btn-upload-avatar"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-3 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer border border-slate-200"
              >
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                Unggah File Gambar Baru
              </button>
              <p className="text-[10px] text-slate-400 mt-1">
                Mendukung format PNG, JPG, atau WebP (maks. 2MB).
              </p>
            </div>
          </div>

          {/* Account Details Box */}
          <div className="bg-slate-50/80 rounded-3xl border border-slate-200/80 p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#04457e]" />
              Satuan Kerja
            </h4>
            <div className="text-xs text-slate-600 space-y-1.5">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Kantor:</span>
                <span className="font-semibold text-slate-800 text-right">Bank Indonesia Prov. Sulsel</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Unit:</span>
                <span className="font-semibold text-slate-800 text-right">{department}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Status Akun:</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Aktif
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Profile & Change Password Forms */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Ganti Username & Data Profil */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-7">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#04457e] flex items-center justify-center">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Perbarui Username &amp; Profil</h3>
                  <p className="text-xs text-slate-500">Sesuaikan nama lengkap, username, dan departemen akun Anda</p>
                </div>
              </div>
            </div>

            {profileSuccessMsg && (
              <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{profileSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nama Pengguna / Username <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="input-profile-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Masukkan nama pengguna"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:outline-none focus:border-[#04457e] focus:ring-2 focus:ring-[#04457e]/15 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Alamat Email Akun <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="input-profile-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contoh@gmail.com"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:outline-none focus:border-[#04457e] focus:ring-2 focus:ring-[#04457e]/15 transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Departemen / Satuan Kerja
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-profile-department"
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Unit PUR & Logistik"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:outline-none focus:border-[#04457e] focus:ring-2 focus:ring-[#04457e]/15 transition-all"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  id="btn-save-profile"
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-5 py-2.5 bg-[#04457e] hover:bg-[#033663] active:bg-[#022849] text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-[#04457e]/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingProfile ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      Simpan Perubahan Profil
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Card 2: Ganti Password / Keamanan */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-7">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Ganti Kata Sandi (Password)</h3>
                  <p className="text-xs text-slate-500">Perbarui kata sandi untuk mengamankan akses masuk ke sistem</p>
                </div>
              </div>
            </div>

            {passwordError && (
              <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSavePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Kata Sandi Saat Ini
                </label>
                <div className="relative">
                  <input
                    id="input-current-password"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Masukkan kata sandi lama Anda"
                    className="w-full px-3.5 pr-10 py-2.5 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:outline-none focus:border-[#04457e] focus:ring-2 focus:ring-[#04457e]/15 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Opsional jika ini pertama kali Anda mengatur kata sandi kustom.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Kata Sandi Baru <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="input-new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimal 5 karakter"
                      className="w-full px-3.5 pr-10 py-2.5 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:outline-none focus:border-[#04457e] focus:ring-2 focus:ring-[#04457e]/15 transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Konfirmasi Kata Sandi Baru <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="input-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi kata sandi baru"
                      className="w-full px-3.5 pr-10 py-2.5 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:outline-none focus:border-[#04457e] focus:ring-2 focus:ring-[#04457e]/15 transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {newPassword && confirmPassword && (
                <div className="flex items-center gap-1.5 text-xs">
                  {newPassword === confirmPassword ? (
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Kata sandi cocok
                    </span>
                  ) : (
                    <span className="text-rose-600 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Kata sandi belum cocok
                    </span>
                  )}
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  id="btn-save-password"
                  type="submit"
                  disabled={isSavingPassword}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-slate-900/10 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingPassword ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Memperbarui...
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-3.5 h-3.5" />
                      Perbarui Kata Sandi
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
