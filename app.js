window.App = (() => {
  const LS_JOINED = "joined_webinars";
  const LS_PROFILE = "profile_data";
  const LS_AUTH = "auth_state";

  const webinars = [
    { id: "w1", title: "Обзор изменений законодательства США (2025)", date: "10 янв", level: "Базовый" },
    { id: "w2", title: "Конфиденциальность и комплаенс (GDPR/CCPA)", date: "18 янв", level: "Средний" },
    { id: "w3", title: "Договоры: ключевые условия и риски", date: "25 янв", level: "Для всех" },
  ];

  function safeJsonParse(value, fallback) {
    try { return JSON.parse(value) ?? fallback; } catch { return fallback; }
  }

  function getJoined() { return safeJsonParse(localStorage.getItem(LS_JOINED), []); }
  function setJoined(arr) { localStorage.setItem(LS_JOINED, JSON.stringify(arr)); }
  function clearJoined() { localStorage.removeItem(LS_JOINED); }

  function getProfile() { return safeJsonParse(localStorage.getItem(LS_PROFILE), {}); }
  function setProfile(data) { localStorage.setItem(LS_PROFILE, JSON.stringify(data)); }

  function getAuth() { return safeJsonParse(localStorage.getItem(LS_AUTH), { isLoggedIn: false }); }
  function setAuth(auth) { localStorage.setItem(LS_AUTH, JSON.stringify(auth)); }

  function showToast(id) {
    const el = document.getElementById(id);
    if (!el) return;
    bootstrap.Toast.getOrCreateInstance(el).show();
  }

  function renderNavStatus() {
    const el = document.getElementById("navStatus");
    if (!el) return;

    const auth = getAuth();
    const profile = getProfile();

    el.classList.remove("d-none");
    el.textContent = auth.isLoggedIn
      ? `Вы вошли${profile.name ? " • " + profile.name : ""}`
      : "Вход не выполнен";
  }

  function renderWebinars() {
    const grid = document.getElementById("webinarGrid");
    if (!grid) return;

    const auth = getAuth();
    const isLoggedIn = !!auth.isLoggedIn;
    const joined = new Set(getJoined());

    grid.innerHTML = webinars.map(w => {
      const isJoined = joined.has(w.id);

      const disabled = !isLoggedIn || isJoined;
      const btnClass = isJoined ? "btn-success" : (isLoggedIn ? "btn-primary" : "btn-outline-primary");
      const btnText = isJoined ? "Вы записаны" : (isLoggedIn ? "Записаться" : "Войдите, чтобы записаться");

      return `
        <div class="col-12 col-md-6 col-lg-4">
          <div class="card h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start">
                <h2 class="h6 mb-2">${w.title}</h2>
                <span class="badge text-bg-light border">${w.level}</span>
              </div>
              <p class="text-secondary mb-3">Дата: <strong>${w.date}</strong></p>
              <button class="btn ${btnClass} w-100"
                      data-webinar-id="${w.id}"
                      ${disabled ? "disabled" : ""}>
                ${btnText}
              </button>
            </div>
          </div>
        </div>
      `;
    }).join("");

    grid.querySelectorAll("button[data-webinar-id]").forEach(btn => {
      btn.addEventListener("click", () => {
        const authNow = getAuth();
        if (!authNow.isLoggedIn) {
          showToast("authToast");
          return;
        }

        const id = btn.getAttribute("data-webinar-id");
        const joinedArr = getJoined();

        if (!joinedArr.includes(id)) {
          joinedArr.push(id);
          setJoined(joinedArr);
          showToast("joinToast");
          renderWebinars();
        }
      });
    });
  }

  function renderMyWebinars() {
    const listEl = document.getElementById("myWebinarsList");
    if (!listEl) return;

    const joinedIds = getJoined();
    if (!joinedIds.length) {
      listEl.innerHTML = `<div class="text-secondary">Вы пока не записаны ни на один вебинар.</div>`;
      return;
    }

    const items = joinedIds
      .map(id => webinars.find(w => w.id === id))
      .filter(Boolean);

    listEl.innerHTML = `
      <div class="list-group">
        ${items.map(w => `
          <div class="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <div class="fw-semibold">${w.title}</div>
              <div class="text-secondary small">Дата: ${w.date} • Уровень: ${w.level}</div>
            </div>
            <span class="badge text-bg-success">Записан(а)</span>
          </div>
        `).join("")}
      </div>
    `;
  }

  function initIndexPage() {
    renderNavStatus();
    renderWebinars();
  }

  function initProfilePage() {
    const form = document.getElementById("profileForm");
    const alertBox = document.getElementById("alertBox");

    const authStatus = document.getElementById("authStatus");
    const loginBtn = document.getElementById("loginBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const clearJoinedBtn = document.getElementById("clearJoinedBtn");

    function showAlert(type, text) {
      alertBox.className = `alert alert-${type}`;
      alertBox.textContent = text;
      alertBox.classList.remove("d-none");
    }

    function refreshAuthUI() {
      const auth = getAuth();
      const profile = getProfile();

      if (auth.isLoggedIn) {
        authStatus.textContent = `Статус: вход выполнен${profile.name ? " • " + profile.name : ""}`;
        logoutBtn.classList.remove("d-none");
        loginBtn.classList.add("d-none");
      } else {
        authStatus.textContent = "Статус: вход не выполнен";
        logoutBtn.classList.add("d-none");
        loginBtn.classList.remove("d-none");
      }
    }

    // Подгружаем сохранённый профиль
    const saved = getProfile();
    if (saved.name) document.getElementById("name").value = saved.name;
    if (saved.email) document.getElementById("email").value = saved.email;
    if (saved.role) document.getElementById("role").value = saved.role;

    // Войти / зарегистрироваться (симуляция)
    loginBtn?.addEventListener("click", () => {
      const emailVal = document.getElementById("email").value.trim();
      if (!emailVal) {
        showAlert("warning", "Введите email в форме профиля, затем нажмите «Войти / зарегистрироваться».");
        return;
      }
      setAuth({ isLoggedIn: true });
      showAlert("success", "Вход выполнен. Теперь вы можете записываться на вебинары.");
      refreshAuthUI();
    });

    // Выйти + сброс записей (demo)
    logoutBtn?.addEventListener("click", () => {
      setAuth({ isLoggedIn: false });
      clearJoined();
      showAlert("secondary", "Вы вышли из аккаунта. Записи на вебинары сброшены (демо).");
      refreshAuthUI();
      renderMyWebinars();
    });

    // Очистить список записей
    clearJoinedBtn?.addEventListener("click", () => {
      clearJoined();
      showAlert("secondary", "Список «Мои вебинары» очищен.");
      renderMyWebinars();
    });

    // Сохранить профиль
    form?.addEventListener("submit", (e) => {
      e.preventDefault();

      if (!form.checkValidity()) {
        form.classList.add("was-validated");
        return;
      }

      const data = {
        name: document.getElementById("name").value.trim(),
        email: document.getElementById("email").value.trim(),
        role: document.getElementById("role").value
      };
      setProfile(data);

      showAlert("success", "Профиль сохранён.");
      refreshAuthUI();
    });

    refreshAuthUI();
    renderMyWebinars();
  }

  return { initIndexPage, initProfilePage };
})();
