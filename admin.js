(() => {
  const sb = window.fsSupabase;
  if (!sb) return console.error("Supabase lipsește.");

  const ADMIN_EMAIL = "alexandrujoanta6@gmail.com";
  const CONTENT = "fs_public_content";
  const MSG = "fs_public_messages";
  let editingId = null;

  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c =>
    ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

  async function admin() {
    const {data} = await sb.auth.getUser();
    const yes = data.user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    window.fsIsAdmin = yes;
    document.body.classList.toggle("fs-is-admin", yes);
    return yes;
  }

  function styles() {
    if ($("fsProStyles")) return;
    const s = document.createElement("style");
    s.id = "fsProStyles";
    s.textContent = `
      #fsAdminOpen{position:fixed;right:15px;bottom:90px;z-index:9998}
      #fsAdminBox{position:fixed;inset:2%;z-index:10000;overflow:auto;
        background:#07120b;color:#f2f7f1;border:1px solid #9df21b;
        border-radius:22px;padding:18px;box-shadow:0 0 0 9999px #000b}
      #fsAdminBox *{box-sizing:border-box}
      #fsAdminBox input,#fsAdminBox textarea,#fsAdminBox select{
        width:100%;padding:12px;margin:7px 0;background:#142319;
        color:white;border:1px solid #456b34;border-radius:10px}
      #fsAdminBox button{padding:10px 13px;margin:4px;background:#19351d;
        color:#9df21b;border:1px solid #456b34;border-radius:10px;font-weight:bold}
      #fsAdminBox .primary{background:#9df21b;color:#14200a}
      #fsAdminBox .admin-item{padding:12px;border-bottom:1px solid #29472d}
      #fsAdminBox h2,#fsAdminBox h3{color:#9df21b}
      .messages-badge{position:absolute;top:-5px;right:-5px;background:#ff3535;
        color:white;border-radius:50%;min-width:17px;height:17px;font-size:10px;
        display:grid;place-items:center}
      #messagesButton{position:relative}
      #messagesBadge[hidden]{display:none}
      #fsMessagesPage{max-width:850px;margin:auto;padding:18px 14px 110px}
      .fs-message{background:linear-gradient(145deg,#14251a,#0b160e);
        border:1px solid #355b30;border-radius:16px;padding:16px;margin:12px 0}
      .fs-message h3{color:#9df21b;margin:0 0 8px}
      .fs-message small{color:#9cae9f}
      .fs-message p{white-space:pre-wrap;line-height:1.5}
      .fs-message.unread{border-color:#9df21b;box-shadow:0 0 15px #9df21b18}
    `;
    document.head.append(s);
  }

  async function openAdmin() {
    if (!await admin()) return alert("Acces doar pentru Alex.");
    let box = $("fsAdminBox");
    if (!box) {
      box = document.createElement("div");
      box.id = "fsAdminBox";
      document.body.append(box);
    }

    box.innerHTML = `
      <header style="display:flex;justify-content:space-between;align-items:center">
        <h2>🚜 ADMIN PANEL PRO</h2>
        <button id="apClose">✖ Închide</button>
      </header>
      <p>Administrator: Alex · Farming Simulator GUIDE PRO</p>

      <h3>📢 Publică mesaj</h3>
      <input id="msgTitle" placeholder="Titlu anunț">
      <textarea id="msgBody" rows="4" placeholder="Scrie mesajul pentru comunitate..."></textarea>
      <select id="msgType">
        <option value="normal">📣 Anunț</option>
        <option value="important">⚠️ Important</option>
        <option value="update">🚜 Update</option>
      </select>
      <button class="primary" id="msgSend">🚀 Publică mesajul</button>
      <p id="msgStatus"></p>
      <hr>
      <h3>📨 Mesaje publicate</h3>
      <div id="msgAdminList">Se încarcă...</div>
      <hr>
      <h3>📚 Conținut site</h3>
      <form id="contentForm">
        <select id="cCategory">
          <option value="games">Jocuri</option><option value="machines">Utilaje</option>
          <option value="crops">Culturi</option><option value="animals">Animale</option>
          <option value="guides">Ghiduri</option><option value="info">Info</option>
        </select>
        <input id="cSlug" placeholder="Slug / identificator">
        <input id="cTitle" required placeholder="Titlu">
        <textarea id="cBody" rows="4" required placeholder="Descriere"></textarea>
        <input id="cImage" type="url" placeholder="URL imagine">
        <button class="primary">💾 Salvează conținut</button>
        <button type="button" id="cReset">＋ Nou</button>
      </form>
      <p id="cStatus"></p>
      <div id="contentList">Se încarcă...</div>
    `;

    $("apClose").onclick = () => box.remove();
    $("msgSend").onclick = sendMessage;
    $("cReset").onclick = resetContent;
    $("contentForm").onsubmit = saveContent;
    await loadMessagesAdmin();
    await loadContent();
  }

  async function sendMessage() {
    if (!await admin()) return;
    const title = $("msgTitle").value.trim();
    const body = $("msgBody").value.trim();
    const type = $("msgType").value;
    if (!title || !body) return $("msgStatus").textContent = "Completează titlul și mesajul.";

    $("msgStatus").textContent = "Se publică...";
    const {error} = await sb.from(MSG).insert({
      title, body, type, author:"Alex",
      created_at:new Date().toISOString()
    });
    if (error) return $("msgStatus").textContent = "Eroare: " + error.message;
    $("msgTitle").value = "";
    $("msgBody").value = "";
    $("msgStatus").textContent = "✅ Mesaj publicat!";
    await loadMessagesAdmin();
    await renderMessages();
  }

  async function loadMessagesAdmin() {
    const area = $("msgAdminList");
    if (!area) return;
    const {data,error} = await sb.from(MSG).select("*").order("created_at",{ascending:false});
    if (error) return area.textContent = error.message;
    area.innerHTML = (data||[]).map(m=>`
      <div class="admin-item">
        <b>${esc(m.title)}</b> · ${esc(m.type)}
        <p>${esc(m.body)}</p>
        <button data-medit="${esc(m.id)}">✏️ Editează</button>
        <button data-mdel="${esc(m.id)}">🗑 Șterge</button>
      </div>`).join("") || "Nu există mesaje.";

    area.querySelectorAll("[data-mdel]").forEach(b=>b.onclick=async()=>{
      if (!confirm("Ștergi mesajul?") || !await admin()) return;
      const {error}=await sb.from(MSG).delete().eq("id",b.dataset.mdel);
      if(error) alert(error.message);
      await loadMessagesAdmin(); await renderMessages();
    });

    area.querySelectorAll("[data-medit]").forEach(b=>b.onclick=async()=>{
      const m=data.find(x=>String(x.id)===b.dataset.medit);
      if(!m) return;
      const title=prompt("Titlu:",m.title);
      if(title===null)return;
      const body=prompt("Mesaj:",m.body);
      if(body===null)return;
      const {error}=await sb.from(MSG).update({title,body,updated_at:new Date().toISOString()}).eq("id",m.id);
      if(error)alert(error.message);
      await loadMessagesAdmin(); await renderMessages();
    });
  }

  async function saveContent(e) {
    e.preventDefault();
    if(!await admin())return;
    const payload={
      category:$("cCategory").value,
      slug:$("cSlug").value.trim()||null,
      title:$("cTitle").value.trim(),
      body:$("cBody").value.trim(),
      image_url:$("cImage").value.trim()||null,
      updated_at:new Date().toISOString()
    };
    const q=editingId
      ? sb.from(CONTENT).update(payload).eq("id",editingId)
      : sb.from(CONTENT).insert(payload);
    const {error}=await q;
    $("cStatus").textContent=error?"❌ "+error.message:"✅ Salvat!";
    if(!error){resetContent();await loadContent();await renderContent();}
  }

  function resetContent(){
    editingId=null;$("contentForm").reset();
    $("cStatus").textContent="Formular nou.";
  }

  async function loadContent(){
    const area=$("contentList");if(!area)return;
    const {data,error}=await sb.from(CONTENT).select("*").order("created_at",{ascending:false});
    if(error)return area.textContent=error.message;
    area.innerHTML=(data||[]).map(x=>`
      <div class="admin-item">
        <b>${esc(x.title)}</b> (${esc(x.category)})
        <button data-cedit="${esc(x.id)}">✏️</button>
        <button data-cdel="${esc(x.id)}">🗑</button>
      </div>`).join("");
    area.querySelectorAll("[data-cedit]").forEach(b=>b.onclick=()=>{
      const x=data.find(a=>String(a.id)===b.dataset.cedit);if(!x)return;
      editingId=x.id;$("cCategory").value=x.category;$("cSlug").value=x.slug||"";
      $("cTitle").value=x.title;$("cBody").value=x.body;$("cImage").value=x.image_url||"";
      $("cStatus").textContent="Editezi: "+x.title;
    });
    area.querySelectorAll("[data-cdel]").forEach(b=>b.onclick=async()=>{
      if(!confirm("Ștergi conținutul?")||!await admin())return;
      const {error}=await sb.from(CONTENT).delete().eq("id",b.dataset.cdel);
      if(error)alert(error.message);await loadContent();await renderContent();
    });
  }

  async function renderContent(){
    const {data,error}=await sb.from(CONTENT).select("*").order("created_at",{ascending:false});
    if(error)return;
    let area=$("fsCloudContent");
    if(!area){area=document.createElement("section");area.id="fsCloudContent";area.className="section";$("home")?.append(area);}
    if(!area)return;
    area.innerHTML=`<div class="section-head"><h2>📚 Conținut nou</h2></div>`+
      (data||[]).map(x=>`<article class="fs-message">
        ${x.image_url?`<img src="${esc(x.image_url)}" style="width:100%;max-height:240px;object-fit:cover;border-radius:12px">`:""}
        <small>${esc(x.category)}</small><h3>${esc(x.title)}</h3><p>${esc(x.body)}</p>
      </article>`).join("");
  }

  async function renderMessages(){
    const {data,error}=await sb.from(MSG).select("*").order("created_at",{ascending:false});
    if(error)return;
    const page=$("page");if(!page)return;
    page.hidden=false;$("home").hidden=true;
    page.innerHTML=`<section id="fsMessagesPage">
      <header class="settings-head"><h2>✉️ Mesaje</h2><button data-go="home">← Acasă</button></header>
      <p>📢 Anunțuri oficiale de la Alex · Doar citire</p>
      ${(data||[]).map(m=>`<article class="fs-message">
        <h3>${m.type==="important"?"⚠️":m.type==="update"?"🚜":"📣"} ${esc(m.title)}</h3>
        <small>Alex · ${new Date(m.created_at).toLocaleString("ro-RO")}</small>
        <p>${esc(m.body)}</p>
      </article>`).join("")||"<p>Nu există mesaje momentan.</p>"}
    </section>`;
    page.querySelector('[data-go="home"]').onclick=()=>{page.hidden=true;$("home").hidden=false;};
    localStorage.setItem("fsMessagesSeen",data?.[0]?.created_at||"");
    updateBadge(data||[]);
  }

  async function updateBadge(messages){
    const seen=localStorage.getItem("fsMessagesSeen")||"";
    const unread=messages.filter(m=>m.created_at>seen).length;
    const badge=$("messagesBadge");
    if(badge){badge.textContent=unread;badge.hidden=!unread;}
  }

  document.addEventListener("click",e=>{
    const go=e.target.closest("[data-go]")?.dataset.go;
    if(go==="messages")renderMessages();
  });

  async function init() {
    styles();

    const isAdmin = await admin();
    let b = $("fsAdminOpen");

    if (isAdmin) {
      // Creează butonul o singură dată și doar pentru administrator
      if (!b) {
        b = document.createElement("button");
        b.id = "fsAdminOpen";
        b.className = "cta";
        b.textContent = "🛠 Admin Panel";
        b.onclick = openAdmin;
        document.body.append(b);
      }
    } else {
      // Nu afișa panoul/butonul pentru ceilalți utilizatori
      b?.remove();
      $("fsAdminBox")?.remove();
    }

    await renderContent();

    const { data } = await sb
      .from(MSG)
      .select("*")
      .order("created_at", { ascending: false });

    updateBadge(data || []);
  }

  window.addEventListener("load",init);
  window.addEventListener("fs-admin-status",()=>admin());
  sb.auth.onAuthStateChange(()=>setTimeout(init,0));
})();