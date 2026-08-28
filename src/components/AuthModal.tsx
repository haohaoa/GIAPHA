import React, { useState } from 'react';
import { AuthUser, AdminCredentials } from '../types/family';
import { ConfirmModal } from './ConfirmModal';
import { 
  X, 
  LogIn, 
  LogOut, 
  CheckCircle2, 
  Shield, 
  Sparkles, 
  Crown, 
  UserCheck, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  KeyRound, 
  Settings2,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AuthModalProps {
  isOpen: boolean;
  user: AuthUser | null;
  adminCreds: AdminCredentials;
  onClose: () => void;
  onLogin: (user: AuthUser) => void;
  onLogout: () => void;
  onUpdateAdminCreds: (creds: AdminCredentials) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  user,
  adminCreds,
  onClose,
  onLogin,
  onLogout,
  onUpdateAdminCreds,
}) => {
  if (!isOpen) return null;

  const [username, setUsername] = useState(adminCreds.username || 'haohao051103@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Mode for changing password when logged in
  const [isChangingCreds, setIsChangingCreds] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [newUsername, setNewUsername] = useState(adminCreds.username);
  const [newDisplayName, setNewDisplayName] = useState(adminCreds.displayName);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [credsSuccessMessage, setCredsSuccessMessage] = useState<string | null>(null);

  // Quick fill sample admin credentials
  const handleQuickFill = () => {
    setUsername(adminCreds.username);
    setPassword(adminCreds.password);
    setLoginError(null);
  };

  // Handle Admin Password Login
  const handleAdminLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError(null);

    const inputUser = username.trim().toLowerCase();
    const inputPass = password.trim();

    if (!inputUser || !inputPass) {
      setLoginError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // Validate credentials against current adminCreds or standard fallbacks
      const validUsernames = [
        adminCreds.username.toLowerCase(),
        adminCreds.email.toLowerCase(),
        'admin',
        'haohao051103@gmail.com',
      ];

      const validPasswords = [
        adminCreds.password,
        'admin',
        'admin123',
        'haohao2026',
      ];

      const isUserMatch = validUsernames.includes(inputUser);
      const isPassMatch = validPasswords.includes(inputPass) || inputPass === adminCreds.password;

      if (isUserMatch && isPassMatch) {
        const adminUser: AuthUser = {
          id: 'admin_primary',
          email: adminCreds.email || (inputUser.includes('@') ? inputUser : 'admin@giapha.vn'),
          name: adminCreds.displayName || 'Hảo Hảo (Quản Trị Viên)',
          provider: 'password',
          role: 'admin',
          isAdmin: true,
        };

        onLogin(adminUser);
        setIsLoading(false);
        try {
          confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
        } catch {}
        onClose();
      } else {
        setIsLoading(false);
        setLoginError(
          `Tên đăng nhập hoặc mật khẩu không chính xác! Gợi ý mặc định: Tên đăng nhập "${adminCreds.username}" hoặc "admin" • Mật khẩu "${adminCreds.password}"`
        );
      }
    }, 300);
  };

  // Handle Guest / Viewer Login
  const handleGuestLogin = () => {
    const viewerUser: AuthUser = {
      id: `guest_${Date.now()}`,
      email: 'khach@giapha.vn',
      name: 'Thành viên dòng họ (Chế độ xem)',
      provider: 'guest',
      role: 'viewer',
      isAdmin: false,
    };

    onLogin(viewerUser);
    onClose();
  };

  // Handle Save New Admin Credentials
  const handleSaveNewCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setCredsSuccessMessage(null);

    if (!newUsername.trim()) {
      setLoginError('Tên đăng nhập không được để trống.');
      return;
    }

    if (newPassword && newPassword !== confirmNewPassword) {
      setLoginError('Mật khẩu mới và xác nhận mật khẩu không trùng khớp.');
      return;
    }

    const updated: AdminCredentials = {
      username: newUsername.trim(),
      password: newPassword.trim() ? newPassword.trim() : adminCreds.password,
      displayName: newDisplayName.trim() || 'Quản Trị Viên',
      email: newUsername.includes('@') ? newUsername.trim() : adminCreds.email,
    };

    onUpdateAdminCreds(updated);

    // Update active user state too if currently admin
    if (user && user.isAdmin) {
      onLogin({
        ...user,
        name: updated.displayName,
        email: updated.email,
      });
    }

    setCredsSuccessMessage('Đã cập nhật thông tin và mật khẩu Quản Trị Viên thành công!');
    setIsChangingCreds(false);
    setNewPassword('');
    setConfirmNewPassword('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative z-50 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">Xác Thực Quản Trị Viên</h3>
              <p className="text-[11px] text-slate-400">Đăng nhập bằng Tên đăng nhập & Mật khẩu</p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-auth-modal"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
          {user ? (
            /* Logged in state */
            <div className="space-y-4 text-center">
              <div className="relative inline-block">
                <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center border-2 shadow-lg ${
                  user.isAdmin 
                    ? 'bg-amber-950/80 border-amber-500/80 text-amber-400 shadow-amber-950/50' 
                    : 'bg-slate-900 border-slate-700 text-slate-300'
                }`}>
                  {user.isAdmin ? (
                    <Crown className="w-8 h-8 fill-amber-400/30 text-amber-400" />
                  ) : (
                    <Shield className="w-8 h-8 text-emerald-400" />
                  )}
                </div>
                <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-slate-900 flex items-center justify-center font-bold text-[10px] ${
                  user.isAdmin ? 'bg-amber-500 text-slate-950' : 'bg-emerald-500 text-slate-950'
                }`}>
                  {user.isAdmin ? '★' : '✓'}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-base text-slate-100">{user.name}</h4>
                <p className="text-slate-400 text-xs">{user.email}</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  {user.isAdmin ? (
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-300 bg-amber-950/60 px-3 py-1 rounded-full border border-amber-600/60 shadow-sm">
                      <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span>Quản Trị Viên Dòng Họ (Admin)</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-blue-300 bg-blue-950/60 px-3 py-1 rounded-full border border-blue-600/60">
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Thành viên (Chế độ xem)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status explanation */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-left text-slate-300 space-y-1.5">
                <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>Quyền hạn tài khoản hiện tại:</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {user.isAdmin
                    ? '✓ Toàn quyền thêm (+), sửa, xóa thành viên, tra cứu và tải xuống file Excel đính kèm thông tin bảo mật gia phả.'
                    : '• Chế độ xem: Bạn có thể thu phóng cây phả hệ, tìm kiếm thành viên và tra cứu cách xưng hô.'}
                </p>
              </div>

              {credsSuccessMessage && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-700/50 rounded-xl flex items-center gap-2 text-emerald-300 text-[11px]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{credsSuccessMessage}</span>
                </div>
              )}

              {/* Admin Change Password & Credentials Section */}
              {user.isAdmin && (
                <div className="pt-2 border-t border-slate-800 text-left">
                  {!isChangingCreds ? (
                    <button
                      type="button"
                      id="btn-toggle-change-creds"
                      onClick={() => setIsChangingCreds(true)}
                      className="w-full bg-slate-800 hover:bg-slate-750 text-slate-200 py-2 rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-2 text-xs font-semibold"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                      <span>Đổi Tên Đăng Nhập & Mật Khẩu Quản Trị</span>
                    </button>
                  ) : (
                    <form onSubmit={handleSaveNewCredentials} className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-3">
                      <div className="font-bold text-amber-300 text-xs flex items-center justify-between">
                        <span>Cập Nhật Thông Tin Đăng Nhập Admin</span>
                        <button
                          type="button"
                          onClick={() => setIsChangingCreds(false)}
                          className="text-slate-400 hover:text-white"
                        >
                          ✕
                        </button>
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Tên hiển thị Quản Trị Viên:</label>
                        <input
                          type="text"
                          value={newDisplayName}
                          onChange={(e) => setNewDisplayName(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Tên đăng nhập (Username/Email):</label>
                        <input
                          type="text"
                          value={newUsername}
                          onChange={(e) => setNewUsername(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-amber-500 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Mật khẩu mới (bỏ trống nếu không đổi):</label>
                        <input
                          type="password"
                          placeholder="Nhập mật khẩu mới..."
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-amber-500 font-mono"
                        />
                      </div>

                      {newPassword && (
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Xác nhận mật khẩu mới:</label>
                          <input
                            type="password"
                            placeholder="Nhập lại mật khẩu mới..."
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-amber-500 font-mono"
                          />
                        </div>
                      )}

                      <div className="flex gap-2 pt-1">
                        <button
                          type="submit"
                          className="flex-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold py-2 rounded-xl text-xs transition-colors shadow"
                        >
                          Lưu Thông Tin
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsChangingCreds(false)}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-xl text-xs"
                        >
                          Hủy
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Logout & Switch View */}
              <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
                <button
                  type="button"
                  id="btn-logout"
                  onClick={() => setShowLogoutConfirm(true)}
                  className="w-full bg-red-950/40 hover:bg-red-900/60 text-red-300 font-semibold py-2.5 rounded-xl border border-red-800/60 transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Đăng Xuất Khỏi Hệ Thống</span>
                </button>
              </div>
            </div>
          ) : (
            /* Not logged in: Admin Password Form */
            <form onSubmit={handleAdminLogin} className="space-y-4">
              {/* Default Credential Quick Helper Badge */}
              <div className="p-3.5 bg-gradient-to-br from-amber-950/50 via-slate-900 to-slate-950 rounded-2xl border border-amber-500/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs">
                    <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span>Tài Khoản Quản Trị Mặc Định:</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleQuickFill}
                    className="text-[10px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-2 py-0.5 rounded-lg border border-amber-500/40 font-bold transition-colors"
                  >
                    Tự điền nhanh
                  </button>
                </div>

                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-[11px] font-mono space-y-1 text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Tên đăng nhập:</span>
                    <span className="text-amber-300 font-bold">{adminCreds.username}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Mật khẩu:</span>
                    <span className="text-emerald-400 font-bold">{adminCreds.password}</span>
                  </div>
                </div>
              </div>

              {/* Login Error Notification */}
              {loginError && (
                <div className="p-3 bg-red-950/50 border border-red-800/70 rounded-xl flex items-start gap-2 text-red-200 text-[11px]">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              {/* Username Input */}
              <div className="space-y-1">
                <label className="block text-slate-300 font-semibold text-xs flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tên đăng nhập hoặc Email Quản Trị:</span>
                </label>
                <input
                  type="text"
                  id="input-admin-username"
                  placeholder="Ví dụ: haohao051103@gmail.com hoặc admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none text-xs"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <label className="block text-slate-300 font-semibold text-xs flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Mật khẩu:</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="input-admin-password"
                    placeholder="Nhập mật khẩu quản trị..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 pr-10 text-slate-100 placeholder-slate-500 focus:outline-none text-xs font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Admin Button */}
              <button
                type="submit"
                id="btn-submit-admin-login"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold py-3 rounded-xl shadow-xl flex items-center justify-center gap-2 transition-transform active:scale-98 disabled:opacity-60 text-xs mt-2"
              >
                <LogIn className="w-4 h-4 fill-slate-950" />
                <span>{isLoading ? 'Đang xác thực...' : 'Đăng Nhập Quản Trị Viên'}</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-3 text-[10px] text-slate-500 uppercase tracking-wider">Hoặc</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              {/* Enter as Guest / Viewer */}
              <button
                type="button"
                id="btn-guest-viewer-login"
                onClick={handleGuestLogin}
                className="w-full bg-slate-800/80 hover:bg-slate-800 text-slate-300 font-semibold py-2.5 rounded-xl border border-slate-700/80 flex items-center justify-center gap-2 transition-colors text-xs"
              >
                <UserCheck className="w-4 h-4 text-blue-400" />
                <span>Truy Cập Chế Độ Xem (Không Cần Mật Khẩu)</span>
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded-xl"
          >
            Đóng
          </button>
        </div>

        {/* Confirmation Modal before Logout */}
        <ConfirmModal
          isOpen={showLogoutConfirm}
          type="logout"
          title="Xác Nhận Đăng Xuất"
          confirmText="Đăng Xuất"
          cancelText="Ở Lại"
          message={
            <div className="space-y-1 text-slate-300">
              <p>Bạn có chắc chắn muốn đăng xuất khỏi tài khoản <strong>{user?.name || 'Quản Trị Viên'}</strong> không?</p>
              <p className="text-slate-400 text-xs mt-1">Sau khi đăng xuất, bạn sẽ chuyển về chế độ chỉ xem gia phả và cần mật khẩu để chỉnh sửa lại.</p>
            </div>
          }
          onConfirm={() => {
            setShowLogoutConfirm(false);
            onLogout();
            onClose();
          }}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      </div>
    </div>
  );
};
