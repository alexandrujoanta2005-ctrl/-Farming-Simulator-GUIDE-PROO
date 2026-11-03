// FIX: dezactiveaza cache-ul vechi PWA
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.unregister()));

      if ("caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
    } catch (err) {
      console.warn("Curatarea cache-ului PWA nu a reusit:", err);
    }
  });
}

// Farming Simulator GUIDE PRO - app.js

const games = [25, 22, 19, 17, 15, 13, 11, 2009];
const gameBox = document.querySelector("#games");

function renderGames() {
  if (!gameBox) return;

  gameBox.innerHTML = "";

  games.forEach((g, i) => {
    const d = document.createElement("button");
    d.className = "game " + (i === 0 ? "active" : "");

    d.innerHTML = `
      <strong>Farming<br>Simulator
        <span style="color:#a4f31c">${g}</span>
      </strong>
      <div class="tractor">🚜</div>
      <small>${i === 0 ? "✓" : ""}</small>
    `;

    d.onclick = () => go("fs" + g);
    gameBox.append(d);
  });
}

const pages = {
  all: [
    "allTitle",
    "choose",
    games.map(g => `
      <article>
        <b>Farming Simulator ${g}</b>
        <p>${tr("editionInfo")}</p>
      </article>
    `).join("")
  ],

  fs25: [
    "fs25",
    "currentGuide",
    [
      "smallTractors",
      "mediumTractors",
      "largeTractors",
      "combines",
      "loaders",
      "trailers",
      "crops",
      "animals",
      "beginner"
    ].map(x => `
      <article onclick="go('machines')">
        <b>${tr(x)} →</b>
        <p>${tr("catalogInfo")}</p>
      </article>
    `).join("")
  ],

  machines: [
    "catalog",
    "catalogDesc",
    [
      "smallTractors",
      "mediumTractors",
      "largeTractors",
      "combines",
      "loaders",
      "trailers",
      "seeders",
      "cultivators"
    ].map(x => `
      <article>
        <b>🚜 ${tr(x)}</b>
        <p>${tr("machineInfo")}</p>
      </article>
    `).join("")
  ],

  crops: [
    "cropsTitle",
    "cropsDesc",
    [
      "wheat",
      "barley",
      "oats",
      "canola",
      "sunflower",
      "corn",
      "soy",
      "grapes"
    ].map(x => `
      <article>
        <b>🌿 ${tr(x)}</b>
        <p>${tr("cropInfo")}</p>
      </article>
    `).join("")
  ],

  animals: [
    "animalsTitle",
    "animalsDesc",
    [
      "cows",
      "sheep",
      "pigs",
      "chickens",
      "horses",
      "bees"
    ].map(x => `
      <article>
        <b>🐄 ${tr(x)}</b>
        <p>${tr("animalInfo")}</p>
      </article>
    `).join("")
  ],

  guides: [
    "guidesTitle",
    "guidesDesc",
    [
      "beginner",
      "money",
      "economy",
      "productions",
      "tip"
    ].map(x => `
      <article>
        <b>📘 ${tr(x)}</b>
        <p>${tr("guideInfo")}</p>
      </article>
    `).join("")
  ],

  info: [
    "infoTitle",
    "unofficial",
    `
      <article>
        <b>Farming Simulator GUIDE PRO</b>
        <p>${tr("independent")}</p>
      </article>
    `
  ]
};

let previousPage = "home";

function go(id) {
  if (id === "settings") {
    openSettings();
    return;
  }

  document.querySelectorAll("[data-go]").forEach(b => {
    b.classList.toggle("active", b.dataset.go === id);
  });

  const home = document.querySelector("#home");
  const page = document.querySelector("#page");

  if (id === "home") {
    home.hidden = false;
    page.hidden = true;
    window.scrollTo(0, 0);
    return;
  }

  previousPage = id;

  const p = pages[id] || pages.fs25;

  home.hidden = true;
  page.hidden = false;

  page.innerHTML = `
    <h1>${tr(p[0])}</h1>
    <p style="color:#a9bbaa">${tr(p[1])}</p>
    <div class="itemlist">${p[2]}</div>
    <button class="cta" onclick="go('home')" style="margin-top:20px">
      ${tr("back")}
    </button>
  `;

  window.scrollTo(0, 0);
}

// Navigare

document.querySelectorAll("[data-go]").forEach(b => {
  b.addEventListener("click", () => go(b.dataset.go));
});

// ================= SETTINGS =================

const prefKey = "fs-guide-pro-settings";

const defaults = {
  language: "ro",
  theme: "dark",
  contrast: false,
  animations: true,
  vibration: false,
  largeText: false,
  favoriteGame: "25",
  platform: "PC"
};

function getPrefs() {
  try {
    return {
      ...defaults,
      ...JSON.parse(localStorage.getItem(prefKey) || "{}")
    };
  } catch {
    return { ...defaults };
  }
}

function applyPrefs(p = getPrefs()) {
  document.documentElement.lang = p.language;

  document.body.classList.toggle(
    "light-mode",
    p.theme === "light"
  );

  document.body.classList.toggle(
    "high-contrast",
    !!p.contrast
  );

  document.body.classList.toggle(
    "no-animations",
    !p.animations
  );

  document.body.classList.toggle(
    "large-text",
    !!p.largeText
  );
}

function savePrefs(p) {
  localStorage.setItem(prefKey, JSON.stringify(p));
  applyPrefs(p);

  if (window.fsCloudSavePrefs) {
    window.fsCloudSavePrefs(p)
      .then(({ error }) => {
        if (error) {
          console.warn(
            "Setările nu s-au sincronizat în cloud:",
            error.message
          );
        } else {
          console.info("Setări sincronizate în cloud.");
        }
      })
      .catch(console.error);
  }
}

// ================= OPEN SETTINGS =================

function openSettings() {
  const page = document.querySelector("#page");
  const home = document.querySelector("#home");

  home.hidden = true;
  page.hidden = false;

  document.querySelectorAll("[data-go]").forEach(b => {
    b.classList.toggle(
      "active",
      b.dataset.go === "settings"
    );
  });

  const p = getPrefs();

  page.innerHTML = `
    <div class="settings-page">

      <header class="settings-head">
        <button class="settings-back" id="settingsBack">
          ← ÎNAPOI
        </button>

        <div>
          <small>GUIDE PRO</small>
          <h2>⚙ Setări</h2>
        </div>
      </header>

      <!-- PROFIL -->

      <div class="profile-card">
        <div class="profile-avatar" id="profileAvatar">👤</div>

        <div class="profile-info">
          <b id="profileName">Contul meu</b>
          <small id="profileEmail">
            Conectează-te pentru sincronizare
          </small>
          <small>
            Profil Google • sincronizare Supabase
          </small>
        </div>

        <button id="connectGoogle">Conectare</button>
      </div>

      <!-- GALERIE FOTO -->

      <div style="
        display:flex;
        gap:10px;
        flex-wrap:wrap;
        margin:12px 0 20px;
      ">
        <button type="button" id="chooseProfilePhoto">
          📷 Schimbă poza
        </button>

        <button type="button" id="resetProfilePhoto">
          ↩️ Resetează poza
        </button>

        <input
          type="file"
          id="profilePhotoInput"
          accept="image/*"
          hidden
        >
      </div>

      <!-- PERSONALIZARE -->

      <section class="settings-group">
        <h3>🎨 Personalizare</h3>

        <div class="setting-row">
          <div>
            <strong>🌐 Limba</strong>
            <small>Limba interfeței</small>
          </div>

          <select id="prefLanguage">
            <option value="ro">🇷🇴 Română</option>
            <option value="en">🇬🇧 English</option>
            <option value="de">🇩🇪 Deutsch</option>
            <option value="fr">🇫🇷 Français</option>
            <option value="it">🇮🇹 Italiano</option>
            <option value="es">🇪🇸 Español</option>
            <option value="pl">🇵🇱 Polski</option>
          </select>
        </div>

        <div class="setting-row">
          <div>
            <strong>🎨 Temă</strong>
            <small>Aspect luminos sau întunecat</small>
          </div>

          <select id="prefTheme">
            <option value="dark">Întunecată</option>
            <option value="light">Luminoasă</option>
          </select>
        </div>

        ${[
          ["prefContrast", "♿ Contrast ridicat", "Accesibilitate"],
          ["prefAnimations", "✨ Animații", "Efecte vizuale"],
          ["prefVibration", "📳 Vibrații", "Feedback tactil"],
          ["prefLargeText", "🔎 Text mărit", "Lizibilitate"]
        ].map(([id, label, desc]) => `
          <div class="setting-row">
            <div>
              <strong>${label}</strong>
              <small>${desc}</small>
            </div>
            <input id="${id}" type="checkbox">
          </div>
        `).join("")}
      </section>

      <!-- NOTIFICARI -->

      <section class="settings-group">
        <h3>🔔 Notificări și instalare</h3>

        <div class="setting-row">
          <div>
            <strong>Notificări</strong>
            <small>Permite notificările browserului</small>
          </div>
          <button id="enableNotifications">Activează</button>
        </div>

        <div class="setting-row">
          <div>
            <strong>📲 Instalare aplicație</strong>
            <small>Instrucțiuni pentru dispozitiv</small>
          </div>
          <button id="installHelp">Instrucțiuni</button>
        </div>
      </section>

      <!-- JOC FAVORIT -->

      <section class="settings-group">
        <h3>🚜 Preferințe joc</h3>

        <div class="setting-row">
          <div>
            <strong>Joc favorit</strong>
            <small>Alege ediția preferată</small>
          </div>

          <select id="favoriteGame">
            ${games.map(g => `
              <option value="${g}">FS ${g}</option>
            `).join("")}
          </select>
        </div>

        <div class="setting-row">
          <div>
            <strong>Platformă</strong>
            <small>Platforma de joc</small>
          </div>

          <select id="platform">
            <option>PC</option>
            <option>PlayStation</option>
            <option>Xbox</option>
            <option>Mac</option>
          </select>
        </div>
      </section>

      <!-- DATE -->

      <section class="settings-group">
        <h3>💾 Date și aplicație</h3>

        <div class="setting-row">
          <div>
            <strong>Backup setări</strong>
            <small>Exportă preferințele într-un fișier</small>
          </div>
          <button id="exportPrefs">Export</button>
        </div>

        <div class="setting-row">
          <div>
            <strong>Resetare</strong>
            <small>Revino la setările implicite</small>
          </div>
          <button id="resetPrefs">Reset</button>
        </div>

        <div class="setting-row">
          <div>
            <strong>Despre aplicație</strong>
            <small>Farming Simulator GUIDE PRO</small>
          </div>
          <button id="aboutApp">Despre</button>
        </div>
      </section>

      <!-- SALVARE -->

      <div class="settings-savebar">
        <button class="settings-save" id="saveSettings">
          💾 SALVEAZĂ SETĂRILE
        </button>
      </div>

    </div>
  `;

  // ================= INCARCARE SETARI =================

  const ids = [
    "prefLanguage",
    "prefTheme",
    "prefContrast",
    "prefAnimations",
    "prefVibration",
    "prefLargeText",
    "favoriteGame",
    "platform"
  ];

  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    if (el.type === "checkbox") {
      const key = id.replace("pref", "").toLowerCase();
      el.checked = !!p[key];
    } else {
      el.value = p[id] ??
        (id === "favoriteGame" ? "25" : "PC");
    }
  });

  // ================= BACK =================

  document.getElementById("settingsBack").onclick = () => {
    go(previousPage === "settings" ? "home" : previousPage);
  };

  // ================= PROFIL GOOGLE =================

  const profileName = document.getElementById("profileName");
  const profileEmail = document.getElementById("profileEmail");
  const profileAvatar = document.getElementById("profileAvatar");
  const connectButton = document.getElementById("connectGoogle");

  const photoInput = document.getElementById("profilePhotoInput");
  const customPhotoKey = "fs-guide-pro-custom-profile-photo";

  // Afisare fotografie profil

  function showProfilePhoto(src) {
    profileAvatar.innerHTML = "";

    if (!src) {
      profileAvatar.textContent = "👤";
      return;
    }

    const img = document.createElement("img");
    img.src = src;
    img.alt = "Fotografie profil";

    img.style.cssText = `
      width:100%;
      height:100%;
      object-fit:cover;
      border-radius:50%;
      display:block;
    `;

    profileAvatar.appendChild(img);
  }

  // ================= GALERIE =================

  document.getElementById("chooseProfilePhoto").onclick = () => {
    photoInput.click();
  };

  photoInput.onchange = () => {
    const file = photoInput.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Alege un fișier imagine.");
      photoInput.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      try {
        localStorage.setItem(customPhotoKey, reader.result);
        showProfilePhoto(reader.result);
      } catch (err) {
        alert("Poza este prea mare. Alege o fotografie mai mică.");
        console.error(err);
      }
    };

    reader.readAsDataURL(file);
  };

  // ================= RESET POZA =================

  document.getElementById("resetProfilePhoto").onclick = () => {
    localStorage.removeItem(customPhotoKey);
    photoInput.value = "";
    refreshGoogleProfile();
  };

  // ================= GOOGLE PROFILE =================

  async function refreshGoogleProfile() {
    const supabase = window.fsSupabase;

    if (!supabase) {
      profileName.textContent = "Contul meu";
      profileEmail.textContent = "Supabase nu este configurat";
      connectButton.textContent = "Conectare";
      showProfilePhoto(localStorage.getItem(customPhotoKey) || "");
      return;
    }

    const {
      data: { session },
      error
    } = await supabase.auth.getSession();

    if (error) {
      console.warn("Nu am putut citi sesiunea:", error.message);
    }

    const user = session?.user;

    if (user) {
      const metadata = user.user_metadata || {};

      profileName.textContent =
        metadata.full_name ||
        metadata.name ||
        user.email ||
        "Utilizator";

      profileEmail.textContent =
        user.email || "Cont Google conectat";

      const avatarUrl =
        metadata.avatar_url ||
        metadata.picture;

      showProfilePhoto(
        localStorage.getItem(customPhotoKey) ||
        avatarUrl ||
        ""
      );

      connectButton.textContent = "Deconectare";

      connectButton.onclick = async () => {
        const { error: signOutError } =
          await supabase.auth.signOut();

        if (signOutError) {
          alert(
            "Deconectarea a eșuat: " +
            signOutError.message
          );
        }

        await refreshGoogleProfile();
      };

    } else {
      profileName.textContent = "Contul meu";
      profileEmail.textContent =
        "Conectează-te pentru sincronizare";

      showProfilePhoto(
        localStorage.getItem(customPhotoKey) || ""
      );

      connectButton.textContent = "Conectare Google";

      connectButton.onclick = async () => {
        const { error: oauthError } =
          await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
              redirectTo: window.location.href.split("#")[0]
            }
          });

        if (oauthError) {
          alert(
            "Conectarea Google a eșuat: " +
            oauthError.message
          );
        }
      };
    }
  }

  refreshGoogleProfile();

  // Actualizare profil dupa login/logout

  if (!window.fsProfileListenerAdded && window.fsSupabase) {
    window.fsProfileListenerAdded = true;

    window.fsSupabase.auth.onAuthStateChange(() => {
      setTimeout(() => {
        if (document.getElementById("profileEmail")) {
          refreshGoogleProfile();
        }
      }, 0);
    });
  }

  // ================= SALVARE SETARI =================

  document.getElementById("saveSettings").onclick = () => {
    const next = {
      ...getPrefs(),

      language:
        document.getElementById("prefLanguage").value,

      theme:
        document.getElementById("prefTheme").value,

      contrast:
        document.getElementById("prefContrast").checked,

      animations:
        document.getElementById("prefAnimations").checked,

      vibration:
        document.getElementById("prefVibration").checked,

      largeText:
        document.getElementById("prefLargeText").checked,

      favoriteGame:
        document.getElementById("favoriteGame").value,

      platform:
        document.getElementById("platform").value
    };

    savePrefs(next);
    renderApp();
    openSettings();

    alert("Setările au fost salvate!");
  };

  // ================= NOTIFICARI =================

  document.getElementById("enableNotifications").onclick =
    async () => {
      if (!("Notification" in window)) {
        alert("Browserul nu suportă notificări.");
        return;
      }

      alert(
        "Permisiune: " +
        await Notification.requestPermission()
      );
    };

  // ================= INSTALARE =================

  document.getElementById("installHelp").onclick = () => {
    alert(
      /iPhone|iPad/i.test(navigator.userAgent)
        ? "Safari: Partajare → Add to Home Screen."
        : "Din meniul browserului alege Install/Add to Home Screen."
    );
  };

  // ================= RESET SETARI =================

  document.getElementById("resetPrefs").onclick = () => {
    if (confirm("Resetezi toate setările?")) {
      localStorage.removeItem(prefKey);
      applyPrefs();
      openSettings();
    }
  };

  // ================= EXPORT =================

  document.getElementById("exportPrefs").onclick = () => {
    const blob = new Blob(
      [JSON.stringify(getPrefs(), null, 2)],
      { type: "application/json" }
    );

    const a = document.createElement("a");

    a.href = URL.createObjectURL(blob);
    a.download = "fs-guide-pro-settings.json";
    a.click();

    URL.revokeObjectURL(a.href);
  };

  // ================= ABOUT =================

  document.getElementById("aboutApp").onclick = () => {
    alert(
      "Farming Simulator GUIDE PRO\nGhid neoficial."
    );
  };
}

// ================= EVENTS =================

document.querySelectorAll("[data-action=notifications]").forEach(b => {
  b.addEventListener("click", openSettings);
});

document.addEventListener("click", e => {
  if (
    getPrefs().vibration &&
    navigator.vibrate &&
    e.target.closest("button")
  ) {
    navigator.vibrate(25);
  }
});

// ================= TRANSLATIONS =================

function renderApp() {
  document.querySelectorAll("[data-go]").forEach(btn => {
    const id = btn.dataset.go;
    const key = id === "all" ? "all" : id;
    const span = btn.querySelector("span");

    if (span) {
      span.nextSibling.textContent = tr(key);
    } else if (btn.closest(".quick")) {
      const icons = {
        home: "⌂ ",
        all: "▱ ",
        fs25: "🎮 ",
        machines: "🚜 ",
        crops: "🌿 ",
        animals: "🐄 ",
        info: "ⓘ "
      };

      btn.textContent = (icons[id] || "") + tr(key);
    }
  });

  const hero = document.querySelector(".hero-copy");

  if (hero) {
    hero.querySelector(".pill").textContent = "NEW";
    hero.querySelector("p").textContent = tr("description");
    hero.querySelector(".cta").textContent = tr("enter");
  }

  const heads = document.querySelectorAll(".section-head h2");
  const keys = ["all", "categories", "popular", "news"];

  heads.forEach((h, i) => {
    if (keys[i]) h.textContent = tr(keys[i]);
  });

  document.querySelectorAll(".section-head button").forEach(b => {
    b.textContent = tr("viewAll");
  });

  renderGames();
}

// ================= START =================

applyPrefs();
renderGames();
renderApp();
// ================= CMS ADMIN (Alex) =================
// Adaugă editor pentru articole și elemente noi în Supabase.
(() => {
  const CMS_ADMIN = "alexandrujoanta6@gmail.com";
  const CMS_TABLE = "fs_public_content";
  let cmsUser = null;
  let cmsRows = [];
  let cmsCategory = "general";
  const cmsSlug = (s) => String(s || "item").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const cmsEsc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function cmsIsAdmin(){ return (cmsUser?.email || "").toLowerCase() === CMS_ADMIN; }
  function cmsCategoryForPage(id){ return ({machines:"machines",crops:"crops",animals:"animals",guides:"guides",fs25:"fs25",info:"info",all:"all"})[id] || "general"; }
  async function cmsLoad(){
    const sb=window.fsSupabase; if(!sb) return;
    const {data:{session}}=await sb.auth.getSession(); cmsUser=session?.user||null;
    const {data,error}=await sb.from(CMS_TABLE).select("*").order("created_at",{ascending:false});
    if(error){console.warn("CMS:",error.message);return;} cmsRows=data||[];
  }
  function cmsModal(row={}){
    if(!cmsIsAdmin()) return;
    const old=document.getElementById("fsCmsModal"); if(old)old.remove();
    const modal=document.createElement("div"); modal.id="fsCmsModal";
    modal.style.cssText="position:fixed;inset:0;z-index:99999;background:#000b;display:grid;place-items:center;padding:16px;overflow:auto";
    modal.innerHTML=`<form id="fsCmsForm" style="background:#101b12;color:#eaffea;border:1px solid #4b8d35;border-radius:16px;padding:20px;width:min(520px,100%);display:grid;gap:12px;max-height:90vh;overflow:auto">
      <h2 style="margin:0;color:#a4f31c">✏️ Editor GUIDE PRO</h2>
      <label>Categorie<select name="category" style="width:100%;padding:10px"><option value="machines">Utilaje</option><option value="crops">Culturi</option><option value="animals">Animale</option><option value="guides">Ghiduri</option><option value="fs25">FS25</option><option value="info">Info</option><option value="general">General</option></select></label>
      <label>Titlu<input name="title" required maxlength="180" style="width:100%;padding:10px" value="${cmsEsc(row.title||"")}"></label>
      <label>Descriere / conținut<textarea name="body" rows="6" style="width:100%;padding:10px">${cmsEsc(row.body||row.content||"")}</textarea></label>
      <label>URL imagine<input name="image_url" style="width:100%;padding:10px" placeholder="https://..." value="${cmsEsc(row.image_url||"")}"></label>
      <label>Încarcă imagine<input type="file" name="image" accept="image/*"></label>
      <small id="fsCmsStatus"></small><div style="display:flex;gap:8px;flex-wrap:wrap"><button type="submit" style="padding:12px;background:#a4f31c;color:#071008;font-weight:bold">💾 Salvează</button>${row.id?'<button type="button" id="fsCmsDelete" style="padding:12px;background:#a33;color:white">🗑 Șterge</button>':''}<button type="button" id="fsCmsClose" style="padding:12px">Închide</button></div></form>`;
    document.body.append(modal); const form=modal.querySelector("form"); form.elements.category.value=row.category||cmsCategory;
    modal.querySelector("#fsCmsClose").onclick=()=>modal.remove();
    modal.querySelector("#fsCmsDelete")?.addEventListener("click",async()=>{if(!confirm("Ștergi acest articol?"))return;const {error}=await window.fsSupabase.from(CMS_TABLE).delete().eq("id",row.id);if(error)alert(error.message);else{modal.remove();await cmsRefresh();}});
    form.onsubmit=async e=>{e.preventDefault();const status=modal.querySelector("#fsCmsStatus");status.textContent="Se salvează...";const sb=window.fsSupabase;if(!sb){status.textContent="Supabase nu este configurat.";return;}
      let image_url=form.elements.image_url.value.trim();const file=form.elements.image.files[0];
      if(file){const ext=(file.name.split(".").pop()||"jpg").toLowerCase();const path=`cms/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;const up=await sb.storage.from("fs-admin-images").upload(path,file,{upsert:true});if(up.error){status.textContent="Upload: "+up.error.message;return;}image_url=sb.storage.from("fs-admin-images").getPublicUrl(path).data.publicUrl;}
      const title=form.elements.title.value.trim(),category=form.elements.category.value;const payload={category,slug:row.slug||cmsSlug(title),title,body:form.elements.body.value.trim(),image_url,updated_at:new Date().toISOString()};
      let q=row.id?sb.from(CMS_TABLE).update(payload).eq("id",row.id):sb.from(CMS_TABLE).upsert(payload,{onConflict:"slug"});const result=await q;if(result.error){status.textContent=result.error.message;return;}modal.remove();await cmsRefresh();
    };
  }
  async function cmsRefresh(){await cmsLoad();if(previousPage&&previousPage!=="home"&&previousPage!=="settings")go(previousPage);else cmsAddAdminButton();}
  function cmsAddAdminButton(){if(!cmsIsAdmin())return;const home=document.querySelector("#home");if(!home||document.getElementById("fsCmsAddHome"))return;const b=document.createElement("button");b.id="fsCmsAddHome";b.textContent="＋ Adaugă conținut (ADMIN)";b.className="cta";b.style.cssText="margin:12px;padding:12px;background:#a4f31c;color:#071008";b.onclick=()=>cmsModal({category:"general"});home.prepend(b);}
  function cmsDecoratePage(id){const page=document.querySelector("#page");if(!page)return;const cat=cmsCategoryForPage(id);const list=page.querySelector(".itemlist");if(!list)return;
    // Override articole salvate după slug/titlu și atașează butoane admin.
    list.querySelectorAll("article").forEach((art,i)=>{const titleEl=art.querySelector("b,strong,h3");if(!titleEl)return;const title=titleEl.textContent.trim();const slug=cmsSlug(title);const saved=cmsRows.find(r=>r.category===cat&&(r.slug===slug||r.title===title));if(saved){titleEl.textContent=saved.title;const p=art.querySelector("p");if(p)p.textContent=saved.body||"";if(saved.image_url){const img=document.createElement("img");img.src=saved.image_url;img.alt=saved.title;img.style.cssText="width:100%;max-height:190px;object-fit:cover;border-radius:10px";art.prepend(img);}art.dataset.cmsId=saved.id;}
      if(cmsIsAdmin()){const edit=document.createElement("button");edit.type="button";edit.textContent="✏️ Editează";edit.style.cssText="margin-top:8px;padding:8px;background:#243d20;color:#a4f31c;border:1px solid #4b8d35;border-radius:8px";edit.onclick=e=>{e.stopPropagation();cmsModal(saved||{category:cat,title,body:art.querySelector("p")?.textContent||"",slug});};art.append(edit);}
    });
    cmsRows.filter(r=>r.category===cat&&!list.querySelector(`[data-cms-id="${r.id}"]`)).forEach(r=>{const art=document.createElement("article");art.dataset.cmsId=r.id;art.innerHTML=`${r.image_url?`<img src="${cmsEsc(r.image_url)}" alt="" style="width:100%;max-height:190px;object-fit:cover;border-radius:10px">`:""}<b>${cmsEsc(r.title)}</b><p>${cmsEsc(r.body||"")}</p>`;if(cmsIsAdmin()){const e=document.createElement("button");e.textContent="✏️ Editează";e.onclick=()=>cmsModal(r);art.append(e);}list.append(art);});
    if(cmsIsAdmin()){const add=document.createElement("button");add.className="cta";add.textContent="＋ Adaugă articol";add.style="margin:12px 0;padding:12px;background:#a4f31c;color:#071008";add.onclick=()=>cmsModal({category:cat});list.append(add);}
  }
  // Integrare cu navigarea existentă fără să înlocuiască funcțiile originale.
  const oldGo=window.go;
  if(typeof oldGo==="function")window.go=function(id){oldGo(id);if(id!=="home"&&id!=="settings")cmsDecoratePage(id);};
  document.addEventListener("DOMContentLoaded",async()=>{await cmsLoad();cmsAddAdminButton();if(previousPage&&previousPage!=="home")cmsDecoratePage(previousPage);});
  if(window.fsSupabase)window.fsSupabase.auth.onAuthStateChange(()=>setTimeout(cmsRefresh,100));
})();
