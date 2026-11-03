
(() => {
  const sb = window.fsSupabase;
  if (!sb) {
    console.error("Supabase nu este configurat!");
    return;
  }

  const TABLE = "fs_public_messages";
  const $ = id => document.getElementById(id);

  const esc = text => String(text ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;"
  }[c]));

  function addStyles() {
    if ($("messagesProStyle")) return;

    const style = document.createElement("style");
    style.id = "messagesProStyle";
    style.textContent = `
      #messagesButton { position:relative; }
      #messagesBadge {
        position:absolute;top:-5px;right:-5px;
        background:#ff3535;color:white;
        border-radius:50%;min-width:18px;height:18px;
        display:grid;place-items:center;font-size:10px;
        font-weight:900;
      }
      #messagesBadge[hidden] { display:none!important; }

      #messagesOverlay {
        position:fixed;inset:0;z-index:10001;
        background:#000c;display:flex;justify-content:center;
        align-items:center;padding:12px;
      }
      #messagesOverlay[hidden] { display:none; }
      #messagesWindow {
        background:#07120b;color:#f2f7f1;
        border:1px solid #9df21b;border-radius:20px;
        width:100%;max-width:800px;max-height:90vh;
        overflow:auto;padding:18px;
      }
      #messagesWindow h2 { color:#9df21b; }
      #messagesWindow .msg-card {
        background:linear-gradient(145deg,#14251a,#0b160e);
        border:1px solid #355b30;border-radius:15px;
        padding:15px;margin:12px 0;
      }
      #messagesWindow .msg-card h3 { color:#9df21b;margin:0 0 8px; }
      #messagesWindow .msg-card p {
        white-space:pre-wrap;line-height:1.6;
      }
      #messagesWindow small { color:#9cae9f; }
      #messagesWindow button {
        padding:10px 14px;border-radius:10px;
        border:1px solid #456b34;background:#19351d;
        color:#9df21b;font-weight:bold;
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
      <div id="messagesWindow">
        <header style="display:flex;justify-content:space-between;align-items:center">
          <h2>✉️ Mesaje oficiale</h2>
          <button id="messagesClose">✖</button>
        </header>
        <p>📢 Anunțuri publicate de Alex</p>
        <div id="messagesList">Se încarcă mesajele...</div>
      </div>
    `;

    document.body.appendChild(overlay);

    $("messagesClose").onclick = closeMessages;

    overlay.addEventListener("click", e => {
      if (e.target === overlay) closeMessages();
    });

    return overlay;
  }

  function closeMessages() {
    const overlay = $("messagesOverlay");
    if (overlay) overlay.hidden = true;
  }

  async function loadMessages() {
    const list = $("messagesList");
    if (!list) return;

    list.innerHTML = "Se încarcă mesajele...";

    const { data, error } = await sb
      .from(TABLE)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      list.innerHTML = `<p>❌ ${esc(error.message)}</p>`;
      return;
    }

    const messages = data || [];

    list.innerHTML = messages.map(m => `
      <article class="msg-card">
        <h3>
          ${m.type === "important" ? "⚠️" :
            m.type === "update" ? "🚜" : "📣"}
          ${esc(m.title)}
        </h3>
        <small>
          Alex · ${new Date(m.created_at).toLocaleString("ro-RO")}
        </small>
        <p>${esc(m.body)}</p>
      </article>
    `).join("") || "<p>📭 Nu există mesaje momentan.</p>";

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

  async function openMessages() {
    const overlay = createOverlay();
    overlay.hidden = false;
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

  async function refreshBadge() {
    const { data, error } = await sb
      .from(TABLE)
      .select("created_at")
      .order("created_at", { ascending: false });

    if (!error) updateBadge(data || []);
  }

  window.fsOpenMessages = openMessages;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
