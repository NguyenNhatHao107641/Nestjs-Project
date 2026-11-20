/**
 * auth.js — Quản lý trạng thái đăng nhập & phân quyền (RBAC)
 * Vai trò: admin (Quản trị viên), host (Chủ nhà), customer (Khách hàng)
 */
(function () {
  'use strict';

  const USER_KEY = 'current_user';

  function qs(name) {
    return new URLSearchParams(location.search).get(name);
  }

  const Auth = {
    accessToken: () => localStorage.getItem('access_token') || '',
    refreshToken: () => localStorage.getItem('refresh_token') || '',
    user: null,

    isLogged() { return !!this.accessToken(); },
    role() { return this.user ? this.user.role : null; },
    isAdmin() { return this.role() === 'admin'; },
    isHost() { return this.role() === 'host'; },
    isHostOrAdmin() { return this.role() === 'host' || this.role() === 'admin'; },

    ROLE_LABEL: { admin: 'Quản trị viên', host: 'Chủ nhà', customer: 'Khách hàng' },
    roleLabel(role) { return this.ROLE_LABEL[role || this.role()] || 'Khách hàng'; },

    setTokens(accessToken, refreshToken) {
      localStorage.setItem('access_token', accessToken || '');
      if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
    },

    saveUser(user) {
      this.user = user || null;
      if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
      else localStorage.removeItem(USER_KEY);
      document.dispatchEvent(new CustomEvent('auth-changed'));
    },

    clearSession() {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      this.saveUser(null);
    },

    /** Lấy thông tin user từ /users/me (fallback cache nếu API lỗi) */
    async loadUser() {
      if (!this.isLogged()) return null;
      try {
        const res = await API.get('/users/me');
        this.saveUser(res.data);
      } catch (err) {
        // 401 đã được xử lý (refresh) trong API wrapper; nếu vẫn lỗi dùng cache
        if (!this.user) {
          try { this.user = JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch (_) { /* bỏ qua */ }
        }
      }
      return this.user;
    },

    /** Đăng nhập → lưu token → tải hồ sơ */
    async login(email, password) {
      const res = await API.post('/auth/login', { email, password }, { auth: false });
      this.setTokens(res.data.accessToken, res.data.refreshToken);
      await this.loadUser();
      return this.user;
    },

    /** Đăng ký (role: customer | host) → tự đăng nhập */
    async register(payload) {
      await API.post('/auth/register', payload, { auth: false });
      return this.login(payload.email, payload.password);
    },

    /** Đăng xuất: thu hồi refresh token ở server rồi xóa phiên ở máy */
    async logout() {
      // Logout phải luôn thành công ở phía client, kể cả access token đã cũ
      // (ví dụ user bị xóa sau khi chạy lại npm run seed).
      try { await API.post('/auth/logout', {}, { _noRetry: true }); } catch (_) { /* 401/404: bỏ qua */ }
      this.clearSession();
    },

    /** POST /auth/refresh — cấp lại access token (gọi nội bộ bởi api.js) */
    async refreshTokens() {
      const rt = this.refreshToken();
      if (!rt) return false;
      try {
        const res = await fetch('/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: rt }),
        });
        const data = await res.json();
        if (!res.ok || data.success === false) return false;
        this.setTokens(data.data.accessToken, data.data.refreshToken);
        return true;
      } catch (_) {
        return false;
      }
    },

    /** Guard: yêu cầu đăng nhập — chưa đăng nhập sẽ redirect trang auth */
    requireAuth(nextPath) {
      if (this.isLogged()) return true;
      const next = nextPath || location.pathname.split('/').pop() + location.search;
      location.replace('auth.html?mode=login&next=' + encodeURIComponent(next));
      return false;
    },

    /** Guard: yêu cầu đúng vai trò — sai quyền sẽ chuyển về trang chủ kèm toast */
    requireRole(roles, nextPath) {
      if (!this.requireAuth(nextPath)) return false;
      if (!roles.includes(this.role())) {
        location.replace('index.html?denied=1');
        return false;
      }
      return true;
    },

    /** Đường dẫn sau khi đăng nhập/đăng ký thành công */
    nextUrl() {
      const next = qs('next');
      return next ? next : 'index.html';
    },
  };

  // Khôi phục user từ cache ngay lập tức (tránh nhấp nháy header)
  try { Auth.user = JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch (_) { /* bỏ qua */ }

  window.Auth = Auth;
})();
