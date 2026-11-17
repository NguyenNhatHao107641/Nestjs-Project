/**
 * api.js — Fetch wrapper dùng chung toàn Frontend StayNest
 * - Tự gắn Bearer token từ localStorage
 * - Tự refresh token khi gặp 401 rồi retry 1 lần
 * - Chuẩn hóa lỗi theo shape HttpExceptionFilter: { statusCode, message }
 */
(function () {
  'use strict';

  const ACCESS_KEY = 'access_token';
  const REFRESH_KEY = 'refresh_token';

  function serverMessage(err) {
    const body = err && err.serverBody ? err.serverBody : err;
    const m = body && body.message;
    if (Array.isArray(m)) return m.join(' · ');
    if (typeof m === 'string' && m !== '[object Object]') return m;
    return 'Có lỗi xảy ra. Vui lòng thử lại.';
  }

  /**
   * Gọi API. auth=true sẽ gắn token và tự refresh khi 401.
   * opts: { method, body, auth, _noRetry }
   */
  async function request(path, opts = {}) {
    const method = opts.method || 'GET';
    const headers = { 'Content-Type': 'application/json' };
    if (opts.auth !== false) {
      const token = localStorage.getItem(ACCESS_KEY);
      if (token) headers.Authorization = 'Bearer ' + token;
    }

    let res;
    try {
      res = await fetch(path, {
        method,
        headers,
        body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      });
    } catch (networkErr) {
      const e = new Error('Không thể kết nối tới máy chủ. Hãy chắc chắn API đang chạy.');
      e.statusCode = 0;
      throw e;
    }

    let data = null;
    try { data = await res.json(); } catch (_) { /* body rỗng */ }

    // 401 → thử refresh token rồi gọi lại đúng 1 lần
    if (res.status === 401 && opts.auth !== false && !opts._noRetry) {
      const refreshed = await Auth.refreshTokens();
      if (refreshed) {
        return request(path, { ...opts, _noRetry: true });
      }
      // refresh thất bại → token hết hạn hoàn toàn
      Auth.clearSession();
      const e = new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      e.statusCode = 401;
      e.expired = true;
      throw e;
    }

    if (!res.ok || (data && data.success === false)) {
      const e = new Error();
      e.statusCode = res.status;
      e.serverBody = data;
      throw e;
    }
    return data;
  }

  window.API = {
    request,
    get: (path, opts) => request(path, { ...opts, method: 'GET' }),
    post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
    patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
    del: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
    serverMessage,
    ACCESS_KEY,
    REFRESH_KEY,
  };
})();
