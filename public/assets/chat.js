/**
 * chat.js — Widget chat AI tư vấn homestay (StayNest)
 * - Nút nổi góc phải dưới, mở panel chat.
 * - Gọi POST /chat, lưu lịch sử hội thoại.
 * - Không yêu cầu đăng nhập.
 */
(function () {
  'use strict';

  const HISTORY_KEY = 'staynest_chat_history';

  function loadHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }
    catch (_) { return []; }
  }
  function saveHistory(h) {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(-20))); } catch (_) {}
  }

  // Inject CSS
  const style = document.createElement('style');
  style.textContent = `
    #sn-chat-btn { position:fixed; right:20px; bottom:20px; z-index:9998; width:56px; height:56px; border-radius:50%; border:none; cursor:pointer; background:linear-gradient(135deg,#0D9488,#14B8A6); color:#fff; font-size:24px; box-shadow:0 8px 24px rgba(13,148,136,.35); display:flex; align-items:center; justify-content:center; transition:transform .2s; }
    #sn-chat-btn:hover { transform:scale(1.08); }
    #sn-chat-panel { position:fixed; right:20px; bottom:88px; z-index:9998; width:360px; max-width:calc(100vw - 40px); height:520px; max-height:calc(100vh - 120px); background:#fff; border-radius:16px; box-shadow:0 12px 40px rgba(0,0,0,.18); display:none; flex-direction:column; overflow:hidden; font-family:inherit; }
    #sn-chat-panel.open { display:flex; }
    #sn-chat-header { background:linear-gradient(135deg,#0D9488,#14B8A6); color:#fff; padding:14px 16px; display:flex; align-items:center; justify-content:space-between; }
    #sn-chat-header h4 { margin:0; font-size:15px; font-weight:600; }
    #sn-chat-header button { background:transparent; border:none; color:#fff; font-size:20px; cursor:pointer; line-height:1; }
    #sn-chat-messages { flex:1; overflow-y:auto; padding:12px 14px; background:#F8FAFC; display:flex; flex-direction:column; gap:8px; }
    .sn-msg { max-width:82%; padding:9px 12px; border-radius:12px; font-size:14px; line-height:1.45; white-space:pre-wrap; word-break:break-word; }
    .sn-msg.user { align-self:flex-end; background:#0D9488; color:#fff; border-bottom-right-radius:4px; }
    .sn-msg.bot { align-self:flex-start; background:#fff; color:#1F2937; border:1px solid #E5E7EB; border-bottom-left-radius:4px; }
    .sn-msg.typing { color:#6B7280; font-style:italic; }
    #sn-chat-inputrow { display:flex; gap:8px; padding:10px; border-top:1px solid #E5E7EB; background:#fff; }
    #sn-chat-input { flex:1; border:1px solid #D1D5DB; border-radius:10px; padding:9px 12px; font-size:14px; outline:none; }
    #sn-chat-input:focus { border-color:#0D9488; }
    #sn-chat-send { background:#0D9488; color:#fff; border:none; border-radius:10px; padding:9px 14px; cursor:pointer; font-weight:600; }
    #sn-chat-send:disabled { opacity:.5; cursor:not-allowed; }
  `;
  document.head.appendChild(style);

  // Build DOM
  const btn = document.createElement('button');
  btn.id = 'sn-chat-btn';
  btn.title = 'Chat tư vấn homestay';
  btn.innerHTML = '💬';
  document.body.appendChild(btn);

  const panel = document.createElement('div');
  panel.id = 'sn-chat-panel';
  panel.innerHTML = `
    <div id="sn-chat-header">
      <h4>💬 Trợ lý Homestay</h4>
      <button id="sn-chat-close" aria-label="Đóng">×</button>
    </div>
    <div id="sn-chat-messages"></div>
    <div id="sn-chat-inputrow">
      <input id="sn-chat-input" type="text" placeholder="Hỏi về phòng, giá, địa điểm hay số khách..." maxlength="2000" />
      <button id="sn-chat-send">Gửi</button>
    </div>
  `;
  document.body.appendChild(panel);

  const messagesEl = panel.querySelector('#sn-chat-messages');
  const inputEl = panel.querySelector('#sn-chat-input');
  const sendBtn = panel.querySelector('#sn-chat-send');
  const closeBtn = panel.querySelector('#sn-chat-close');

  let history = loadHistory();
  let sending = false;

  function addMsg(role, text, typing) {
    const div = document.createElement('div');
    div.className = 'sn-msg ' + (role === 'user' ? 'user' : 'bot') + (typing ? ' typing' : '');
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  // Render history
  if (history.length === 0) {
    addMsg('bot', 'Xin chào! 👋 Tôi là trợ lý Homestay. Hãy hỏi tôi về phòng, giá, địa điểm hay số khách nhé.');
  } else {
    history.forEach((h) => addMsg(h.role, h.content));
  }

  function open() { panel.classList.add('open'); inputEl.focus(); }
  function close() { panel.classList.remove('open'); }

  btn.addEventListener('click', () => panel.classList.contains('open') ? close() : open());
  closeBtn.addEventListener('click', close);

  async function send() {
    const text = inputEl.value.trim();
    if (!text || sending) return;
    sending = true;
    sendBtn.disabled = true;
    inputEl.value = '';
    addMsg('user', text);
    history.push({ role: 'user', content: text });
    const typingEl = addMsg('bot', 'Đang trả lời...', true);

    try {
      const res = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: history.slice(-8) }),
      });
      const data = await res.json().catch(() => ({}));
      typingEl.remove();
      if (!res.ok) {
        const msg = (data && data.message) || 'Có lỗi xảy ra, vui lòng thử lại.';
        addMsg('bot', msg);
      } else {
        const reply = (data && data.data && data.data.reply) || (data && data.reply) || '...';
        addMsg('bot', reply);
        history.push({ role: 'assistant', content: reply });
        saveHistory(history);
      }
    } catch (_) {
      typingEl.remove();
      addMsg('bot', 'Không thể kết nối tới máy chủ. Hãy chắc chắn API đang chạy.');
    } finally {
      sending = false;
      sendBtn.disabled = false;
      inputEl.focus();
    }
  }

  sendBtn.addEventListener('click', send);
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  });
})();
