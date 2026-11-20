/**
 * ui.js — Thành phần UI dùng chung: header động theo vai trò, toast, badge, tiện ích
 */
(function () {
  'use strict';

  // ═══════════ Tiện ích ═══════════
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtVND = (n) => (n || 0).toLocaleString('vi-VN') + '₫';
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
  const initial = (name) => (name || '?').trim().split(/\s+/).pop().charAt(0).toUpperCase();

  // ═══════════ Toast ═══════════
  let toastTimer;
  function showToast(msg, type = 'success') {
    let box = document.getElementById('appToast');
    if (!box) {
      box = document.createElement('div');
      box.id = 'appToast';
      box.className = 'pointer-events-none fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 opacity-0 transition-all duration-200';
      box.innerHTML = '<div class="flex items-center gap-2.5 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lift"><span data-icon></span><span id="toastMsg"></span></div>';
      document.body.appendChild(box);
    }
    const icon = box.querySelector('[data-icon]');
    const ok = '<svg class="h-[18px] w-[18px] text-brand-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>';
    const bad = '<svg class="h-[18px] w-[18px] text-brand-rose" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>';
    icon.innerHTML = type === 'error' ? bad : ok;
    box.querySelector('#toastMsg').textContent = msg;
    box.classList.remove('opacity-0');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => box.classList.add('opacity-0'), 3000);
  }

  // ═══════════ Badge trạng thái ═══════════
  const BOOKING_STATUS = {
    pending:    { label: 'Chờ xác nhận', cls: 'bg-amber-100 text-amber-700' },
    confirmed:  { label: 'Đã xác nhận',  cls: 'bg-brand-teal-soft text-brand-teal' },
    completed:  { label: 'Hoàn thành',   cls: 'bg-emerald-100 text-emerald-700' },
    cancelled:  { label: 'Đã hủy',       cls: 'bg-brand-rose-soft text-brand-rose' },
  };
  const PAYMENT_STATUS = {
    unpaid:   { label: 'Chưa thanh toán', cls: 'bg-slate-100 text-slate-600' },
    paid:     { label: 'Đã thanh toán',   cls: 'bg-emerald-100 text-emerald-700' },
    refunded: { label: 'Đã hoàn tiền',    cls: 'bg-brand-rose-soft text-brand-rose' },
  };
  function statusBadge(status, map) {
    const s = (map || BOOKING_STATUS)[status];
    return `<span class="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${s ? s.cls : 'bg-slate-100 text-slate-500'}">${esc(s ? s.label : status)}</span>`;
  }
  const bookingBadge = (s) => statusBadge(s, BOOKING_STATUS);
  const paymentBadge = (s) => statusBadge(s, PAYMENT_STATUS);

  // ═══════════ Header động theo vai trò ═══════════
  function headerHTML(active) {
    const u = Auth.user;
    const navLink = (href, label, key) => `
      <a href="${href}" class="text-sm font-semibold transition-colors duration-200 ${active === key ? 'text-brand-teal' : 'text-slate-600 hover:text-slate-900'}">${label}</a>`;

    const nav = [
      navLink('index.html', 'Khám phá', 'home'),
      Auth.isLogged() ? navLink('favorites.html', 'Yêu thích', 'favorites') : '',
      Auth.isLogged() ? navLink('my-bookings.html', 'Đơn của tôi', 'bookings') : '',
      Auth.isHostOrAdmin() ? navLink('host.html', 'Dashboard chủ nhà', 'host') : '',
      Auth.isAdmin() ? navLink('admin.html', 'Quản trị', 'admin') : '',
    ].join('');

    const guestActions = `
      <a href="auth.html?mode=login${location.search.includes('next=') ? location.search.slice(location.search.indexOf('next=')) : ''}"
         class="hidden rounded-full px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-100 sm:block">Đăng nhập</a>
      <a href="auth.html?mode=register"
         class="rounded-full bg-brand-rose px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift hover:bg-rose-600 active:translate-y-0">Đăng ký</a>`;

    const userMenu = u ? `
      <div class="relative" id="userMenuWrap">
        <button id="userMenuBtn" class="flex items-center gap-2 rounded-full border border-slate-200 py-1 pl-1 pr-3 transition-all duration-200 hover:border-brand-teal hover:shadow-soft" aria-haspopup="true">
          <span class="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-brand-teal text-sm font-extrabold text-white">
            ${u.avatar ? `<img src="${esc(u.avatar)}" alt="" class="h-full w-full object-cover" />` : esc(initial(u.fullName))}
          </span>
          <span class="hidden max-w-[120px] truncate text-sm font-bold text-slate-800 sm:block">${esc(u.fullName)}</span>
          <svg class="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
        </button>
        <div id="userMenu" class="absolute right-0 top-full z-50 mt-2 hidden w-64 overflow-hidden rounded-2xl bg-white shadow-bar ring-1 ring-slate-900/5">
          <div class="border-b border-slate-100 bg-slate-50 px-4 py-3.5">
            <p class="truncate text-sm font-extrabold text-slate-900">${esc(u.fullName)}</p>
            <p class="mt-0.5 truncate text-xs text-slate-500">${esc(u.email || '')}</p>
            <span class="mt-2 inline-flex items-center gap-1 rounded-full bg-brand-teal-soft px-2 py-0.5 text-[11px] font-bold text-brand-teal">
              <svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/></svg>
              ${esc(Auth.roleLabel(u.role))}
            </span>
          </div>
          <nav class="p-2 text-sm font-semibold text-slate-700">
            <a href="profile.html" class="flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-colors duration-200 hover:bg-slate-50">
              <svg class="h-4.5 w-4.5 h-[18px] w-[18px] text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
              Hồ sơ cá nhân
            </a>
            <a href="favorites.html" class="flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-colors duration-200 hover:bg-slate-50">
              <svg class="h-[18px] w-[18px] text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
              Phòng yêu thích
            </a>
            ${Auth.role() !== 'admin' ? `<a href="my-bookings.html" class="flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-colors duration-200 hover:bg-slate-50">
              <svg class="h-[18px] w-[18px] text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              Đơn của tôi
            </a>` : ''}
            ${Auth.isHostOrAdmin() ? `<a href="host.html" class="flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-colors duration-200 hover:bg-slate-50">
              <svg class="h-[18px] w-[18px] text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l9-8 9 8M5 10v10h5v-6h4v6h5V10"/></svg>
              Dashboard chủ nhà
            </a>` : ''}
            ${Auth.isAdmin() ? `<a href="admin.html" class="flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-colors duration-200 hover:bg-slate-50">
              <svg class="h-[18px] w-[18px] text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
              Trang quản trị
            </a>` : ''}
            <button id="darkToggle" type="button"
              class="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-slate-700 transition-colors duration-200 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800">
              <span id="darkToggleIcon" class="text-base">🌙</span>
              <span id="darkToggleLabel">Chế độ tối</span>
            </button>
            <div class="my-1.5 border-t border-slate-100"></div>
            <button id="logoutBtn" class="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-brand-rose transition-colors duration-200 hover:bg-brand-rose-soft">
              <svg class="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
              Đăng xuất
            </button>
          </nav>
        </div>
      </div>` : guestActions;

    return `
      <div class="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="index.html" class="flex items-center gap-2.5">
          <span class="grid h-10 w-10 place-items-center rounded-xl bg-brand-teal text-white shadow-soft">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l9-8 9 8M5 10v10h5v-6h4v6h5V10"/></svg>
          </span>
          <span class="text-xl font-extrabold tracking-tight text-slate-900">Stay<span class="text-brand-teal">Nest</span></span>
        </a>
        <nav class="hidden items-center gap-7 lg:flex">${nav}</nav>
        <div class="flex items-center gap-2">${userMenu}</div>
      </div>`;
  }

  /** Vẽ header vào #appHeader (mọi trang gọi sau khi Auth.loadUser) */
  function renderHeader(active) {
    const el = document.getElementById('appHeader');
    if (!el) return;
    el.className = 'sticky top-0 z-40 w-full border-b border-slate-100 bg-white/85 backdrop-blur-md';
    el.innerHTML = headerHTML(active);

    // Dropdown avatar
    const btn = document.getElementById('userMenuBtn');
    const menu = document.getElementById('userMenu');
    if (btn && menu) {
      btn.addEventListener('click', (e) => { e.stopPropagation(); menu.classList.toggle('hidden'); });
      document.addEventListener('click', () => menu.classList.add('hidden'));
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') menu.classList.add('hidden'); });
    }
    const logout = document.getElementById('logoutBtn');
    if (logout) {
      logout.addEventListener('click', async () => {
        await Auth.logout();
        showToast('Đã đăng xuất. Hẹn gặp lại!');
        setTimeout(() => location.replace('index.html'), 700);
      });
    }

    // Dark mode toggle
    const darkBtn = document.getElementById('darkToggle');
    const darkIcon = document.getElementById('darkToggleIcon');
    function syncDarkIcon() {
      const isDark = document.documentElement.classList.contains('dark');
      const icon = document.getElementById('darkToggleIcon');
      const label = document.getElementById('darkToggleLabel');
      if (icon) icon.textContent = isDark ? '☀️' : '🌙';
      if (label) label.textContent = isDark ? 'Chế độ sáng' : 'Chế độ tối';
    }
    syncDarkIcon();
    if (darkBtn) {
      darkBtn.addEventListener('click', () => {
        const isDark = document.documentElement.classList.toggle('dark');
        try { localStorage.setItem('staynest_dark', isDark ? '1' : '0'); } catch (_) {}
        syncDarkIcon();
      });
    }
  }

  // ═══════════ Thẻ phòng dùng chung (trang chủ / dashboard) ═══════════
  const FALLBACK_IMAGES = [
    '1502672260266-1c1ef2d93688', '1560448204-e02f11c3d0e2', '1600585154340-be6161a56a0c',
    '1580587771525-78b9dba3b914', '1512918728675-ed5a9ecdebfd', '1520250497591-112f2f40a3f4',
    '1568605114967-8130f3a36994', '1512917774080-9991f1c4c750',
  ].map(id => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&h=600&q=80`);

  function roomImage(room, i = 0) {
    return (room.images && room.images.length) ? room.images[0] : FALLBACK_IMAGES[i % FALLBACK_IMAGES.length];
  }

  const ROOM_TYPE_LABEL = {
    standard: 'Phòng tiêu chuẩn', deluxe: 'Phòng Deluxe', suite: 'Suite',
    villa: 'Villa', entire_homestay: 'Homestay nguyên căn',
  };

  /**
   * Thẻ phòng. opts.actions = HTML gắn vào ảnh (VD nút sửa/xóa ở dashboard)
   * opts.hrefFn(room) → đường dẫn khi click thẻ
   */
  function roomCard(room, i, opts = {}) {
    const city = room.address?.city || 'Việt Nam';
    const isNew = !room.totalReviews;
    const isLoved = room.rating >= 4.8;
    const badge = isNew
      ? '<span class="absolute right-3 top-3 rounded-full bg-brand-teal px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-soft">Mới</span>'
      : isLoved
        ? '<span class="absolute right-3 top-3 rounded-full bg-brand-rose px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-soft">Yêu thích</span>'
        : '';
    const desc = (room.description || '').split('\n')[0];
    return `
      <article class="room-card group cursor-pointer" data-room-id="${room._id}" data-room-index="${i}">
        <div class="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100">
          <img loading="lazy" class="card-img h-full w-full object-cover" src="${esc(roomImage(room, i))}" alt="${esc(room.name)}" />
          <span class="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-slate-800 shadow-soft backdrop-blur">
            <svg class="h-3.5 w-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 1l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.4l-5.2 2.7 1-5.8L1.5 7.2l5.9-.9L10 1z"/></svg>
            ${Number(room.rating ?? 0).toFixed(1)}
          </span>
          ${badge}
          ${opts.actions || ''}
        </div>
        <div class="px-1 pt-4">
          <h3 class="truncate text-base font-bold text-slate-900 transition-colors duration-200 group-hover:text-brand-teal">${esc(room.name)}</h3>
          <p class="mt-0.5 flex items-center gap-1 text-xs font-medium text-slate-500">
            <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            ${esc(city)} · ${esc(ROOM_TYPE_LABEL[room.roomType] || room.roomType)}
          </p>
          <p class="mt-1.5 truncate text-sm text-slate-500">${esc(desc)} · ${room.capacity} khách</p>
          <div class="mt-2.5 flex items-center justify-between">
            <p class="text-base font-extrabold text-slate-900">${fmtVND(room.pricePerNight)} <span class="text-xs font-semibold text-slate-400">/ đêm</span></p>
            ${opts.trailing || ''}
          </div>
        </div>
      </article>`;
  }

  // ═══════════ Phòng yêu thích (lưu trên server) ═══════════
  const HEART_PATH = '<path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>';

  const favorites = {
    ids: new Set(),
    loaded: false,

    /** Nạp danh sách ID phòng đã lưu (chỉ khi đăng nhập, 1 lần mỗi phiên trang) */
    async load() {
      if (!Auth.isLogged()) return this.ids;
      if (this.loaded) return this.ids;
      try {
        const res = await API.get('/favorites/ids');
        this.ids = new Set(res.data || []);
        this.loaded = true;
      } catch (_) { /* API lỗi → nút ♥ vẫn hoạt động theo trạng thái cục bộ */ }
      return this.ids;
    },

    has(id) { return this.ids.has(id); },

    /** Toggle yêu thích. Trả về trạng thái mới (true/false), null khi chưa đăng nhập */
    async toggle(roomId) {
      if (!Auth.isLogged()) {
        UI.showToast('Đăng nhập để lưu phòng vào yêu thích nhé!');
        setTimeout(() => {
          const next = location.pathname.split('/').pop() + location.search;
          location.assign('auth.html?mode=login&next=' + encodeURIComponent(next));
        }, 1200);
        return null;
      }
      try {
        const res = await API.post('/favorites/' + roomId + '/toggle', {});
        if (res.data.favorited) this.ids.add(roomId);
        else this.ids.delete(roomId);
        UI.showToast(res.data.message);
        return res.data.favorited;
      } catch (err) {
        UI.showToast(API.serverMessage(err), 'error');
        return null;
      }
    },
  };

  /** Nút ♥ gắn lên ảnh thẻ phòng (extraClass: vị trí tuỳ trang) */
  function favBtnHTML(roomId, extraClass = '') {
    const on = favorites.has(roomId);
    return `
      <button type="button" data-fav-btn="${esc(roomId)}" aria-label="Lưu vào yêu thích" title="${on ? 'Bỏ khỏi yêu thích' : 'Lưu vào yêu thích'}"
        class="fav-btn grid h-9 w-9 place-items-center rounded-full bg-white/95 shadow-soft backdrop-blur transition-all duration-200 hover:scale-110 ${extraClass}">
        <svg class="h-[18px] w-[18px] transition-colors duration-200 ${on ? 'text-brand-rose' : 'text-slate-600'}" fill="${on ? 'currentColor' : 'none'}" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">${HEART_PATH}</svg>
      </button>`;
  }

  /** Gắn sự kiện cho mọi nút [data-fav-btn] trong root. onDone(id, favorited) gọi sau khi toggle thành công */
  function bindFavButtons(root, onDone) {
    (root || document).querySelectorAll('[data-fav-btn]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        e.preventDefault();
        const id = btn.dataset.favBtn;
        const newState = await favorites.toggle(id);
        if (newState === null) return;
        const svg = btn.querySelector('svg');
        svg.setAttribute('fill', newState ? 'currentColor' : 'none');
        svg.classList.toggle('text-brand-rose', newState);
        svg.classList.toggle('text-slate-600', !newState);
        btn.title = newState ? 'Bỏ khỏi yêu thích' : 'Lưu vào yêu thích';
        if (typeof onDone === 'function') onDone(id, newState);
      });
    });
  }

  // Ap dung che do toi da luu
  try { if (localStorage.getItem('staynest_dark') === '1') document.documentElement.classList.add('dark'); } catch (_) {}

  window.UI = {
    esc, fmtVND, fmtDate, initial, showToast,
    bookingBadge, paymentBadge, roomCard, roomImage, ROOM_TYPE_LABEL, FALLBACK_IMAGES,
    renderHeader,
    favorites, favBtnHTML, bindFavButtons,
  };
})();
