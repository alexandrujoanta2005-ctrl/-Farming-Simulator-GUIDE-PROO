
(() => {
  const sb = window.fsSupabase;
  if (!sb) {
    console.error("Supabase nu este configurat.");
    return;
  }

  const ADMIN_EMAIL = "alexandrujoanta6@gmail.com";
  const TABLE = "fs_public_content";
  const BUCKET = "fs-admin-images";

  let editingId = null;
  let isAdmin = false;

  const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[ch]));

  async function checkAdmin() {
    const { data } = await sb.auth.getUser();
    const user = data?.user;

    isAdmin = !!user &&
      user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    window.fsIsAdmin = isAdmin;
    document.body.classList.toggle("fs-is-admin", isAdmin);

    return isAdmin;
  }

  function addStyles() {
    if (document.getElementById("fsAdminStyles")) return;

    const style = document.createElement("style");
    style.id = "fsAdminStyles";

    style.textContent = `
      #fsAdminOpen {
        position:fixed;
        right:14px;
        bottom:85px;
        z-index:9998;
      }

      #fsAdminBox {
        position:fixed;
        inset:3%;
        z-index:10000;
        overflow:auto;
        background:#09130c;
        color:#f2f7f1;
        border:2px solid #9df21b;
        border-radius:18px;
        padding:18px;
        box-shadow:0 0 0 9999px #000a;
        font-family:Arial,sans-serif;
      }

      #fsAdminBox * {
        box-sizing:border-box;
      }

      #fsAdminBox h2,
      #fsAdminBox h3 {
        color:#9df21b;
      }

      #fsAdminBox input,
      #fsAdminBox textarea,
      #fsAdminBox select {
        width:100%;
        margin:7px 0;
        padding:11px;
        background:#142319;
        color:white;
        border:1px solid #456b34;
        border-radius:9px;
      }

      #fsAdminBox button {
        padding:10px 13px;
        margin:4px;
        border:1px solid #456b34;
        border-radius:9px;
        background:#19351d;
        color:#9df21b;
        font-weight:bold;
        cursor:pointer;
      }

      #fsAdminBox .admin-primary {
        background:#9df21b;
        color:#14200a;
      }

      #fsAdminBox .admin-item {
        padding:12px;
        border-bottom:1px solid #29472d;
      }

      #fsAdminBox .admin-status {
        color:#ffd18a;
        white-space:pre-wrap;
      }

      @media(max-width:520px) {
        #fsAdminBox {
          inset:2%;
          padding:12px;
        }
      }
    `;

    document.head.append(style);
  }

  async function uploadImage(file) {
    if (!file) return null;

    if (!file.type.startsWith("image/")) {
      throw new Error("Selectează o imagine.");
    }

    if (file.size > 8 * 1024 * 1024) {
      throw new Error("Imaginea trebuie să fie sub 8 MB.");
    }

    const ext = (file.name.split(".").pop() || "jpg")
      .replace(/[^a-z0-9]/gi, "");

    const path = `${Date.now()}-${crypto.randomUUID()}.${ext}`;

    const { error } = await sb.storage
      .from(BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type
      });

    if (error) throw error;

    const { data } = sb.storage
      .from(BUCKET)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  async function openAdmin() {
    if (!(await checkAdmin())) {
      alert("Acces permis doar administratorului.");
      return;
    }

    let box = document.getElementById("fsAdminBox");

    if (!box) {
      box = document.createElement("div");
      box.id = "fsAdminBox";
      document.body.append(box);
    }

    box.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <h2>🛠 ADMIN PANEL PRO</h2>
        <button id="adminClose">✖ Închide</button>
      </div>

      <p>Editează conținutul public și încarcă fotografii.</p>

      <form id="adminForm">

        <label>Categorie</label>
        <select id="adminCategory">
          <option value="games">Jocuri Farming Simulator</option>
          <option value="machines">Utilaje</option>
          <option value="crops">Culturi</option>
          <option value="animals">Animale</option>
          <option value="guides">Ghiduri</option>
          <option value="info">Articole / Info</option>
        </select>

        <label>Slug / identificator</label>
        <input id="adminSlug" placeholder="fs25 / fs22 / fendt-1050">

        <label>Titlu</label>
        <input id="adminTitle" required placeholder="Titlul">

        <label>Descriere / conținut</label>
        <textarea id="adminBody" rows="5" required
          placeholder="Scrie descrierea..."></textarea>

        <label>Imagine din galerie</label>
        <input id="adminImage" type="file" accept="image/*">

        <div id="adminImagePreview"></div>

        <label>URL imagine (opțional)</label>
        <input id="adminImageUrl" placeholder="https://...">

        <button class="admin-primary" type="submit">
          💾 Salvează
        </button>

        <button type="button" id="adminNew">
          ＋ Conținut nou
        </button>

        <p class="admin-status" id="adminStatus"></p>
      </form>

      <hr>

      <h3>📚 Conținut existent</h3>

      <button id="adminRefresh">↻ Reîncarcă lista</button>

      <div id="adminList">Se încarcă...</div>
    `;

    document.getElementById("adminClose").onclick = () => box.remove();

    document.getElementById("adminNew").onclick = resetForm;

    document.getElementById("adminRefresh").onclick = loadList;

    document.getElementById("adminImage").onchange = () => {
      const file = document.getElementById("adminImage").files?.[0];
      const preview = document.getElementById("adminImagePreview");

      preview.innerHTML = "";

      if (file) {
        const img = document.createElement("img");
        img.src = URL.createObjectURL(file);
        img.style.cssText =
          "max-width:180px;max-height:130px;border-radius:10px";

        preview.append(img);
      }
    };

    document.getElementById("adminForm").onsubmit = saveContent;

    await loadList();
  }

  function resetForm() {
    editingId = null;

    document.getElementById("adminForm").reset();

    document.getElementById("adminImagePreview").innerHTML = "";

    document.getElementById("adminStatus").textContent =
      "Formular pregătit pentru conținut nou.";
  }

  async function saveContent(event) {
    event.preventDefault();

    if (!(await checkAdmin())) {
      alert("Nu ai drepturi de administrator.");
      return;
    }

    const status = document.getElementById("adminStatus");
    status.textContent = "Se salvează...";

    const category = document.getElementById("adminCategory").value;
    const slug = document.getElementById("adminSlug").value.trim();
    const title = document.getElementById("adminTitle").value.trim();
    const body = document.getElementById("adminBody").value.trim();

    let image_url =
      document.getElementById("adminImageUrl").value.trim() || null;

    try {
      const file = document.getElementById("adminImage").files?.[0];

      if (file) {
        image_url = await uploadImage(file);
      }

      const payload = {
        category,
        slug: slug || null,
        title,
        body,
        image_url,
        updated_at: new Date().toISOString()
      };

      let result;

      if (editingId) {
        result = await sb.from(TABLE)
          .update(payload)
          .eq("id", editingId);
      } else {
        result = await sb.from(TABLE)
          .insert(payload);
      }

      if (result.error) throw result.error;

      status.textContent = "✅ Salvat în Supabase!";

      resetForm();

      await loadList();
      await renderPublicContent();

    } catch (error) {
      console.error(error);

      status.textContent =
        "❌ " + (error.message || "Eroare la salvare.");
    }
  }

  async function loadList() {
    const list = document.getElementById("adminList");
    if (!list) return;

    list.textContent = "Se încarcă...";

    const { data, error } = await sb.from(TABLE)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      list.textContent = "Eroare Supabase: " + error.message;
      return;
    }

    list.innerHTML = (data || []).map(item => `
      <div class="admin-item">
        <b>${esc(item.title)}</b>
        <small>(${esc(item.category)})</small>

        ${item.image_url ? `
          <br>
          <img src="${esc(item.image_url)}"
            style="max-width:100px;max-height:70px;margin:7px">
        ` : ""}

        <br>

        <button data-edit="${esc(item.id)}">✏️ Editează</button>
        <button data-delete="${esc(item.id)}">🗑 Șterge</button>
      </div>
    `).join("") || "<p>Nu există conținut.</p>";

    list.querySelectorAll("[data-edit]").forEach(button => {
      button.onclick = () => {
        const item = data.find(
          x => String(x.id) === button.dataset.edit
        );

        if (!item) return;

        editingId = item.id;

        document.getElementById("adminCategory").value =
          item.category || "info";

        document.getElementById("adminSlug").value =
          item.slug || "";

        document.getElementById("adminTitle").value =
          item.title || "";

        document.getElementById("adminBody").value =
          item.body || "";

        document.getElementById("adminImageUrl").value =
          item.image_url || "";

        document.getElementById("adminImagePreview").innerHTML =
          item.image_url
            ? `<img src="${esc(item.image_url)}"
                style="max-width:180px;max-height:130px">`
            : "";

        document.getElementById("adminStatus").textContent =
          "Editezi: " + item.title;
      };
    });

    list.querySelectorAll("[data-delete]").forEach(button => {
      button.onclick = async () => {
        if (!confirm("Ștergi definitiv acest element?")) return;

        if (!(await checkAdmin())) {
          alert("Acces interzis.");
          return;
        }

        const { error } = await sb.from(TABLE)
          .delete()
          .eq("id", button.dataset.delete);

        if (error) {
          alert(error.message);
        } else {
          await loadList();
          await renderPublicContent();
        }
      };
    });
  }

  async function renderPublicContent() {
    const { data, error } = await sb.from(TABLE)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Conținut public:", error.message);
      return;
    }

    let area = document.getElementById("fsCloudContent");

    if (!area) {
      area = document.createElement("section");
      area.id = "fsCloudContent";
      area.className = "section";
      document.querySelector("#home")?.append(area);
    }

    if (!area) return;

    area.innerHTML = `
      <div class="section-head">
        <h2>📚 Conținut public nou</h2>
      </div>
      ${(data || []).map(item => `
        <article style="padding:14px;margin:10px 0;
          background:#142016;border:1px solid #29472d;border-radius:12px">

          ${item.image_url ? `
            <img src="${esc(item.image_url)}"
              alt="${esc(item.title)}"
              loading="lazy"
              style="width:100%;max-height:240px;object-fit:cover;border-radius:10px">
          ` : ""}

          <small>${esc(item.category)}</small>
          <h3>${esc(item.title)}</h3>
          <p style="white-space:pre-wrap">${esc(item.body)}</p>
        </article>
      `).join("")}
    `;
  }

  async function syncAdmin() {
    await checkAdmin();

    const oldButton = document.getElementById("fsAdminOpen");

    if (isAdmin && !oldButton) {
      const button = document.createElement("button");
      button.id = "fsAdminOpen";
      button.className = "cta";
      button.textContent = "🛠 Admin Panel";
      button.onclick = openAdmin;
      document.body.append(button);
    }

    if (!isAdmin) oldButton?.remove();
  }

  addStyles();

  window.addEventListener("load", async () => {
    await syncAdmin();
    await renderPublicContent();
  });

  window.addEventListener("fs-admin-status", syncAdmin);

  sb.auth.onAuthStateChange(() => {
    setTimeout(syncAdmin, 0);
  });
})();
