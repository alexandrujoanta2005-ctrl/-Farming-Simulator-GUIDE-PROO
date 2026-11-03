
(() => {
  "use strict";

  const sb = window.fsSupabase;

  if (!sb) {
    console.error("Supabase nu este configurat!");
    return;
  }

  const TABLE = "fs_public_messages";
  const $ = id => document.getElementById(id);

  const esc = text => String(text ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));

  const ICONS = {
    close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 6 6 18M6 6l12 12"/></svg>`,
    refresh: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.5 9a7 7 0 0 1 12-2L20 12M4 12l2.5 5a7 7 0 0 0 12-2"/></svg>`,
    bell: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>`,
    empty: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 5h16v14H4z"/><path d="m4 7 8 6 8-6"/></svg>`
  };

  function addStyles() {
    if ($("messagesProStyle")) return;

    const style = document.createElement("style");
    style.id = "messagesProStyle";

    style.textContent = `
      #messagesButton { position:relative; }

      #messagesBadge {
        position:absolute;
        top:-5px;
        right:-5px;
        min-width:19px;
        height:19px;
        padding:0 5px;
        display:flex;
        align-items:center;
        justify-content:center;
        background:#ff365d;
        color:#fff;
        border:2px solid #071008;
        border-radius:30px;
        font-size:10px;
        font-weight:900;
        box-shadow:0 0 12px #ff365d55;
        z-index:5;
      }

      #messagesBadge[hidden] {
        display:none!important;
      }

      #messagesOverlay {
        position:fixed;
        inset:0;
        z-index:10001;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:16px;
        background:rgba(0,0,0,.78);
        backdrop-filter:blur(12px);
        animation:msgFade .2s ease;
      }

      #messagesOverlay[hidden] {
        display:none!important;
      }

      #messagesWindow {
        width:100%;
        max-width:780px;
        max-height:88vh;
        overflow:hidden;
        display:flex;
        flex-direction:column;
        background:linear-gradient(145deg,#0b170e,#050b07);
        color:#edf7ed;
        border:1px solid #9df21b55;
        border-radius:24px;
        box-shadow:0 0 45px #9df21b13,0 25px 90px #000a;
        animation:msgOpen .25s ease;
      }

      #messagesWindow * {
        box-sizing:border-box;
      }

      #messagesWindow .msg-header {
        padding:22px 22px 16px;
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:12px;
        border-bottom:1px solid #ffffff0d;
      }

      #messagesWindow .msg-heading {
        display:flex;
        align-items:center;
        gap:12px;
      }

      #messagesWindow .msg-heading-icon {
        width:46px;
        height:46px;
        display:grid;
        place-items:center;
        color:#9df21b;
        background:#9df21b12;
        border:1px solid #9df21b30;
        border-radius:15px;
      }

      #messagesWindow .msg-heading-icon svg {
        width:23px;
        height:23px;
      }

      #messagesWindow h2 {
        margin:0;
        color:#a5ff24;
        font-size:21px;
        font-weight:900;
      }

      #messagesWindow .msg-subtitle {
        margin:5px 0 0;
        color:#91a594;
        font-size:12px;
      }

      #messagesWindow .msg-header-actions {
        display:flex;
        gap:8px;
      }

      #messagesWindow button {
        display:flex;
        align-items:center;
        justify-content:center;
        gap:7px;
        padding:10px 13px;
        border-radius:12px;
        border:1px solid #9df21b30;
        background:#9df21b0d;
        color:#a5ff24;
        font-weight:800;
        cursor:pointer;
        transition:.2s ease;
      }

      #messagesWindow button:hover {
        background:#9df21b20;
        border-color:#9df21b75;
        transform:translateY(-1px);
      }

      #messagesWindow button svg {
        width:17px;
        height:17px;
      }

      #messagesWindow .msg-content {
        overflow-y:auto;
        padding:18px 22px 22px;
      }

      #messagesWindow .msg-info {
        display:flex;
        align-items:center;
        gap:8px;
        color:#94a895;
        font-size:12px;
        margin-bottom:18px;
      }

      #messagesWindow .msg-info svg {
        width:16px;
        height:16px;
        color:#a5ff24;
      }

      #messagesWindow .msg-card {
        position:relative;
        overflow:hidden;
        background:linear-gradient(145deg,#13251a,#09130c);
        border:1px solid #345d35;
        border-radius:17px;
        padding:17px;
        margin:13px 0;
        transition:.2s ease;
      }

      #messagesWindow .msg-card:hover {
        border-color:#9df21b75;
        box-shadow:0 0 22px #9df21b0c;
      }

      #messagesWindow .msg-card.important {
        border-color:#ffb52d65;
      }

      #messagesWindow .msg-card.update {
        border-color:#46b8ff55;
      }

      #messagesWindow .msg-card h3 {
        margin:0 0 11px;
        color:#a5ff24;
        font-size:16px;
        line-height:1.4;
      }

      #messagesWindow .msg-card.important h3 {
        color:#ffc45b;
      }

      #messagesWindow .msg-card.update h3 {
        color:#69caff;
      }

      #messagesWindow .msg-meta {
        display:flex;
        flex-wrap:wrap;
        align-items:center;
        gap:8px;
        color:#8ea18f;
        font-size:11px;
        margin-bottom:12px;
      }

      #messagesWindow .msg-author {
        color:#a5ff24;
        font-weight:800;
      }

      #messagesWindow .msg-card p {
        margin:0;
        white-space:pre-wrap;
        overflow-wrap:anywhere;
        line-height:1.75;
        color:#d9e8dc;
        font-size:14px;
      }

      #messagesWindow .msg-empty,
      #messagesWindow .msg-loading,
      #messagesWindow .msg-error {
        padding:45px 15px;
        text-align:center;
        color:#8ea18f;
      }

      #messagesWindow .msg-empty svg {
        width:45px;
        height:45px;
        color:#9df21b;
        margin-bottom:12px;
      }

      #messagesWindow .msg-empty h3 {
        color:#e9f5e9;
        margin:10px 0;
      }

      #messagesWindow .msg-loading {
        color:#a5ff24;
      }

      #messagesWindow .msg-error {
        color:#ff7777;
      }

      #messagesWindow .msg-footer {
        padding:12px 22px;
        border-top:1px solid #ffffff0d;
        color:#617666;
        font-size:11px;
        text-align:center;
      }

      @keyframes msgFade {
        from { opacity:0; }
        to { opacity:1; }
      }

      @keyframes msgOpen {
        from { opacity:0;transform:translateY(12px) scale(.98); }
        to { opacity:1;transform:translateY(0) scale(1); }
      }

      @media(max-width:600px) {
        #messagesOverlay { padding:8px; }
        #messagesWindow { max-height:92vh;border-radius:20px; }
        #messagesWindow .msg-header { padding:16px; }
        #messagesWindow .msg-content { padding:14px 15px 18px; }
        #messagesWindow h2 { font-size:17px; }
        #messagesWindow .msg-heading-icon { width:40px;height:40px; }
        #messagesWindow .msg-card { padding:14px; }
        #messagesWindow .msg-footer { padding:10px; }
      }
    `;

    document.head.appendChild(style);
  }

  function createOverlay() {
    let overlay = $("messagesOverlay");
    if (overlay) return overlay;

    overlay = document.createElement("div");
    overlay.id = "messagesOverlay";
    overlay.hidden = true;

    overlay.innerHTML = `
      <section id="messagesWindow" role="dialog" aria-modal="true" aria-labelledby="messagesTitle">
        <header class="msg-header">
          <div class="msg-heading">
            <div class="msg-heading-icon">${ICONS.bell}</div>
            <div>
              <h2 id="messagesTitle">Mesaje oficiale</h2>
              <p class="msg-subtitle">Anunțuri oficiale Farming Simulator GUIDE PRO</p>
            </div>
          </div>

          <div class="msg-header-actions">
            <button id="messagesRefresh" aria-label="Reîncarcă">${ICONS.refresh}</button>
            <button id="messagesClose" aria-label="Închide">${ICONS.close}</button>
          </div>
        </header>

        <div class="msg-content">
          <div class="msg-info">${ICONS.bell} Anunțuri publicate de Alex</div>
          <div id="messagesList" class="msg-loading">Se încarcă mesajele...</div>
        </div>

        <footer class="msg-footer">Farming Simulator GUIDE PRO · Mesaje oficiale</footer>
      </section>
    `;

    document.body.appendChild(overlay);

    $("messagesClose").onclick = closeMessages;
    $("messagesRefresh").onclick = loadMessages;

    overlay.addEventListener("click", e => {
      if (e.target === overlay) closeMessages();
    });

    return overlay;
  }

  function closeMessages() {
    const overlay = $("messagesOverlay");
    if (overlay) overlay.hidden = true;
  }

  function handleEscape(e) {
    if (e.key === "Escape") closeMessages();
  }

  async function loadMessages() {
    const list = $("messagesList");
    if (!list) return;

    list.className = "msg-loading";
    list.textContent = "Se încarcă mesajele...";

    const { data, error } = await sb
      .from(TABLE)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      list.className = "msg-error";
      list.textContent = "Nu am putut încărca mesajele. Verifică conexiunea.";
      console.error(error);
      return;
    }

    const messages = data || [];

    if (!messages.length) {
      list.className = "msg-empty";
      list.innerHTML = `${ICONS.empty}<h3>Nu există mesaje momentan</h3><p>Revino mai târziu pentru anunțuri noi.</p>`;
      markRead(messages);
      updateBadge(messages);
      return;
    }

    list.className = "";

    list.innerHTML = messages.map(m => {
      const type = m.type || "normal";
      const icon = type === "important" ? "⚠️" :
                   type === "update" ? "🚜" : "📣";

      return `
        <article class="msg-card ${esc(type)}">
          <h3>${icon} ${esc(m.title || "Anunț oficial")}</h3>
          <div class="msg-meta">
            <span class="msg-author">● Alex</span>
            <span>·</span>
            <time>${esc(new Date(m.created_at).toLocaleString("ro-RO"))}</time>
          </div>
          <p>${esc(m.body || "")}</p>
        </article>
      `;
    }).join("");

    markRead(messages);
    updateBadge(messages);
  }

  function markRead(messages) {
    const newest = messages[0]?.created_at || "";
    localStorage.setItem("fsMessagesSeen", newest);
  }

  function updateBadge(messages) {
    const badge = $("messagesBadge");
    if (!badge) return;

    const seen = localStorage.getItem("fsMessagesSeen") || "";
    const unread = messages.filter(m => m.created_at > seen).length;

    badge.textContent = unread > 99 ? "99+" : unread;
    badge.hidden = unread === 0;
  }

  async function refreshBadge() {
    const { data, error } = await sb
      .from(TABLE)
      .select("created_at")
      .order("created_at", { ascending: false });

    if (!error) updateBadge(data || []);
  }

  async function openMessages() {
    const overlay = createOverlay();
    overlay.hidden = false;
    document.addEventListener("keydown", handleEscape);
    await loadMessages();
  }

  function init() {
    addStyles();
    createOverlay();

    const button = $("messagesButton");
    if (button) {
      button.addEventListener("click", e => {
        e.preventDefault();
        e.stopImmediatePropagation();
        openMessages();
      }, true);
    }

    refreshBadge();
  }

  window.fsOpenMessages = openMessages;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
