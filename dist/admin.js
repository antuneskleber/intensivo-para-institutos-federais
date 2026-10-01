// Painel de Controle de Acesso e Gestão de Alunos - IFintenso
(async function () {
  const config = window.FIREBASE_CONFIG;
  const adminEmails = window.ADMIN_EMAILS || ["djkleber@gmail.com"];
  const readOnlyAdminEmails = window.READ_ONLY_ADMIN_EMAILS || ["mariecristinefortesrocha@gmail.com"];

  const loadingState = document.getElementById("loadingState");
  const authGate = document.getElementById("authGate");
  const gateMessage = document.getElementById("gateMessage");
  const gateLoginBtn = document.getElementById("gateLoginBtn");
  const dashboardView = document.getElementById("dashboardView");
  const adminProfile = document.getElementById("adminProfile");
  const adminAvatar = document.getElementById("adminAvatar");
  const adminName = document.getElementById("adminName");
  const adminLogoutBtn = document.getElementById("adminLogoutBtn");
  const readOnlyBanner = document.getElementById("readOnlyBanner");

  const kpiTotalUsers = document.getElementById("kpiTotalUsers");
  const kpiActiveUsers = document.getElementById("kpiActiveUsers");
  const kpiBlockedUsers = document.getElementById("kpiBlockedUsers");
  const kpiTotalQuestions = document.getElementById("kpiTotalQuestions");
  const kpiAverageRate = document.getElementById("kpiAverageRate");
  const kpiOpenReports = document.getElementById("kpiOpenReports");

  const searchInput = document.getElementById("searchInput");
  const statusFilter = document.getElementById("statusFilter");
  const sortBy = document.getElementById("sortBy");
  const refreshBtn = document.getElementById("refreshBtn");
  const usersTableBody = document.getElementById("usersTableBody");
  const detailModalContainer = document.getElementById("detailModalContainer");
  const reportsList = document.getElementById("reportsList");
  const reportStatusFilter = document.getElementById("reportStatusFilter");

  let auth = null;
  let db = null;
  let currentAdmin = null;
  let currentCanWrite = false;
  let allStudents = [];
  let allReports = [];
  const defaultAvatar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2394a3b8'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";

  function toast(msg) {
    const t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.style.cssText = "position:fixed;right:20px;bottom:20px;background:#063b35;color:#fff;padding:12px 18px;border-radius:0;z-index:9999;box-shadow:0 10px 30px rgba(6,59,53,0.3);font-size:0.9rem;font-weight:700;";
    t.style.display = "block";
    setTimeout(() => { t.style.display = "none"; }, 2500);
  }

  function formatDate(timestamp) {
    if (!timestamp) return "Nunca acessou";
    const value = typeof timestamp.toMillis === "function" ? timestamp.toMillis() : timestamp;
    const d = new Date(value);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  }

  function escapeHTML(value) {
    return String(value || "").replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
  }

  try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
    const { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");
    const { getFirestore, collection, getDocs, doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");

    const app = initializeApp(config);
    auth = getAuth(app);
    db = getFirestore(app);

    onAuthStateChanged(auth, async (user) => {
      loadingState.classList.add("hidden");
      currentAdmin = user;

      if (!user) {
        dashboardView.classList.add("hidden");
        adminProfile.classList.add("hidden");
        authGate.classList.remove("hidden");
        gateMessage.textContent = "Este painel é de acesso exclusivo para a administração. Faça login com a conta Google autorizada.";
        gateLoginBtn.classList.remove("hidden");
        return;
      }

      const isFullAdmin = adminEmails.includes(user.email);
      const isReadOnlyAdmin = readOnlyAdminEmails.includes(user.email);
      if (!isFullAdmin && !isReadOnlyAdmin) {
        dashboardView.classList.add("hidden");
        adminProfile.classList.add("hidden");
        authGate.classList.remove("hidden");
        gateMessage.innerHTML = `A conta <b>${user.email}</b> não tem privilégios de administrador.<br>Acesse com a conta autorizada.`;
        gateLoginBtn.classList.add("hidden");
        return;
      }

      authGate.classList.add("hidden");
      dashboardView.classList.remove("hidden");
      adminProfile.classList.remove("hidden");
      currentCanWrite = isFullAdmin;
      readOnlyBanner.classList.toggle("hidden", currentCanWrite);

      if (adminAvatar) adminAvatar.src = user.photoURL || defaultAvatar;
      if (adminName) adminName.textContent = `${(user.displayName || "Admin").split(" ")[0]}${isReadOnlyAdmin ? " · Leitura" : ""}`;

      loadDashboard();
    });

    async function loadDashboard() {
      await Promise.all([loadStudents(), loadReports()]);
    }

    async function loadReports() {
      if (!reportsList) return;
      reportsList.innerHTML = `<p class="muted">Carregando relatos...</p>`;
      try {
        const snap = await getDocs(collection(db, "reports"));
        allReports = [];
        snap.forEach(item => allReports.push({ id: item.id, ...item.data() }));
        allReports.sort((a,b) => (b.createdAt?.toMillis?.() || b.clientCreatedAt || 0) - (a.createdAt?.toMillis?.() || a.clientCreatedAt || 0));
        renderReports();
        renderKPIs();
      } catch (err) {
        console.error("Erro ao carregar relatos:", err);
        reportsList.innerHTML = `<p class="report-error">Erro ao consultar relatos: ${escapeHTML(err.message)}</p>`;
      }
    }

    function renderReports() {
      if (!reportsList) return;
      const status = reportStatusFilter ? reportStatusFilter.value : "all";
      const categoryLabels = {
        question: "Erro em questão",
        answer: "Gabarito divergente",
        content: "Conteúdo ou alternativas",
        technical: "Falha técnica",
        accessibility: "Acessibilidade",
        other: "Outro apontamento"
      };
      const reports = allReports.filter(report => status === "all" || report.status === status);
      if (!reports.length) {
        reportsList.innerHTML = `<p class="muted">Nenhum relato encontrado neste filtro.</p>`;
        return;
      }
      reportsList.innerHTML = reports.map(report => `
        <article class="report-card ${report.status === 'resolved' ? 'resolved' : ''}">
          <div class="report-card-head">
            <div>
              <span class="report-category">${escapeHTML(categoryLabels[report.category] || report.category)}</span>
              <strong>${escapeHTML(report.userName || 'Estudante')}</strong>
              <small>${escapeHTML(report.userEmail || 'Sem e-mail')} · ${formatDate(report.createdAt || report.clientCreatedAt)}</small>
            </div>
            <span class="status-badge ${report.status === 'resolved' ? 'active' : 'pending'}">${report.status === 'resolved' ? 'Resolvido' : 'Aberto'}</span>
          </div>
          <p>${escapeHTML(report.message)}</p>
          ${report.question ? `
            <div class="report-question-context">
              <b>Questão:</b> ${escapeHTML(report.question)}
              ${report.institution ? `<small>${escapeHTML(report.institution)} ${report.exam ? '· ' + escapeHTML(report.exam) : ''}</small>` : ''}
            </div>
          ` : ''}
          <div class="report-card-foot">
            <small>Tela: ${escapeHTML(report.page || '#home')}</small>
            ${currentCanWrite ? `
              <button class="btn-sm" onclick="window.toggleReportStatus('${report.id}','${report.status === 'resolved' ? 'open' : 'resolved'}')">
                ${report.status === 'resolved' ? 'Reabrir' : 'Marcar como resolvido'}
              </button>
            ` : '<span class="read-only-label">Somente leitura</span>'}
          </div>
        </article>
      `).join('');
    }

    window.toggleReportStatus = async function(reportId, status) {
      if (!currentCanWrite) return toast("Esta conta possui acesso somente de leitura.");
      try {
        await setDoc(doc(db, "reports", reportId), {
          status,
          reviewedAt: Date.now(),
          reviewedBy: currentAdmin.email
        }, { merge: true });
        const report = allReports.find(item => item.id === reportId);
        if (report) report.status = status;
        renderReports();
        renderKPIs();
        toast(status === 'resolved' ? 'Relato marcado como resolvido.' : 'Relato reaberto.');
      } catch(err) {
        console.error("Erro ao atualizar relato:", err);
        toast("Erro ao atualizar relato: " + err.message);
      }
    };

    async function loadStudents() {
      try {
        usersTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px; color:var(--muted);">Carregando estudantes...</td></tr>`;
        const snap = await getDocs(collection(db, "users"));
        allStudents = [];

        snap.forEach((d) => {
          const data = d.data();
          allStudents.push({
            id: d.id,
            ...data,
            name: data.userName || "Estudante",
            email: data.userEmail || "Sem e-mail",
            photo: data.userPhoto || "",
            status: data.status || "active",
            state: data.state || "Nacional",
            institution: data.institution || "Geral",
            level: data.level || "integrado",
            answered: data.answered || 0,
            correct: data.correct || 0,
            errors: data.errors || [],
            bySubject: data.bySubject || {},
            lastUpdated: data.lastUpdated || data.lastLoginAt || 0,
            createdAt: data.createdAt || 0
          });
        });

        renderKPIs();
        renderTable();
      } catch (err) {
        console.error("Erro ao carregar estudantes:", err);
        usersTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px; color:var(--red);">Erro ao consultar estudantes: ${err.message}</td></tr>`;
      }
    }

    function renderKPIs() {
      const total = allStudents.length;
      const active = allStudents.filter(u => u.status !== "blocked").length;
      const blocked = allStudents.filter(u => u.status === "blocked").length;
      const totalQ = allStudents.reduce((sum, u) => sum + u.answered, 0);

      const withAnswers = allStudents.filter(u => u.answered > 0);
      const avgRate = withAnswers.length
        ? Math.round(withAnswers.reduce((sum, u) => sum + (u.correct / u.answered), 0) / withAnswers.length * 100)
        : 0;

      kpiTotalUsers.textContent = total;
      kpiActiveUsers.textContent = active;
      kpiBlockedUsers.textContent = blocked;
      kpiTotalQuestions.textContent = totalQ;
      kpiAverageRate.textContent = `${avgRate}%`;

      if (kpiOpenReports) {
        const openCount = allReports.filter(r => r.status === "open").length;
        kpiOpenReports.textContent = openCount;
      }
    }

    function renderTable() {
      const query = (searchInput.value || "").toLowerCase().trim();
      const status = statusFilter.value;
      const sort = sortBy.value;

      let filtered = allStudents.filter(u => {
        const matchQuery = u.name.toLowerCase().includes(query) ||
                           u.email.toLowerCase().includes(query) ||
                           u.state.toLowerCase().includes(query) ||
                           u.institution.toLowerCase().includes(query);
        const matchStatus = status === "all" || u.status === status;
        return matchQuery && matchStatus;
      });

      filtered.sort((a, b) => {
        if (sort === "lastActive") return b.lastUpdated - a.lastUpdated;
        if (sort === "questions") return b.answered - a.answered;
        if (sort === "rate") {
          const rateA = a.answered ? a.correct / a.answered : 0;
          const rateB = b.answered ? b.correct / b.answered : 0;
          return rateB - rateA;
        }
        if (sort === "name") return a.name.localeCompare(b.name);
        return 0;
      });

      if (!filtered.length) {
        usersTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px; color:var(--muted);">Nenhum estudante encontrado para este filtro.</td></tr>`;
        return;
      }

      usersTableBody.innerHTML = filtered.map(u => {
        const rate = u.answered ? Math.round((u.correct / u.answered) * 100) : 0;
        let rateClass = "good";
        if (rate < 50) rateClass = "bad";
        else if (rate < 70) rateClass = "warn";

        const isBlocked = u.status === "blocked";

        return `
          <tr>
            <td>
              <div class="student-cell">
                <img class="student-avatar" src="${u.photo || defaultAvatar}" alt="Avatar">
                <div class="student-info">
                  <b>${escapeHTML(u.name)}</b>
                  <small>${escapeHTML(u.email)}</small>
                </div>
              </div>
            </td>
            <td>
              <b>${escapeHTML(u.state)}</b>
              <small style="display:block; color:var(--muted);">${escapeHTML(u.institution)}</small>
            </td>
            <td>
              <span class="status-badge ${isBlocked ? 'blocked' : 'active'}">
                ${isBlocked ? 'Bloqueado' : 'Ativo'}
              </span>
            </td>
            <td>
              <small>${formatDate(u.lastUpdated)}</small>
            </td>
            <td>
              <b>${u.answered}</b> questões
              <span class="rate-badge ${rateClass}">${rate}% acerto</span>
            </td>
            <td>
              <div class="action-buttons">
                <button class="btn-sm" onclick="window.openDetailModal('${u.id}')">Ver Detalhes</button>
                ${currentCanWrite ? `
                  <button class="btn-sm ${isBlocked ? 'btn-unblock' : 'btn-block'}" onclick="window.toggleUserStatus('${u.id}', '${isBlocked ? 'active' : 'blocked'}')">
                    ${isBlocked ? 'Desbloquear' : 'Suspender'}
                  </button>
                ` : '<span class="read-only-label">Somente leitura</span>'}
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }

    window.toggleUserStatus = async function (userId, newStatus) {
      if (!currentCanWrite) return toast("Esta conta possui acesso somente de leitura.");
      const actionText = newStatus === "blocked" ? "bloquear" : "liberar";
      if (!confirm(`Deseja realmente ${actionText} o acesso deste estudante?`)) return;

      try {
        const userRef = doc(db, "users", userId);
        await setDoc(userRef, { status: newStatus }, { merge: true });

        const u = allStudents.find(x => x.id === userId);
        if (u) u.status = newStatus;

        renderKPIs();
        renderTable();
        toast(`Acesso do aluno foi ${newStatus === 'blocked' ? 'suspenso' : 'liberado'} com sucesso!`);
      } catch (err) {
        console.error("Erro ao alterar status:", err);
        toast("Erro ao alterar status: " + err.message);
      }
    };

    window.openDetailModal = function (userId) {
      const u = allStudents.find(x => x.id === userId);
      if (!u) return;

      const isBlocked = u.status === "blocked";
      const subjectRows = Object.entries(u.bySubject || {});

      detailModalContainer.innerHTML = `
        <div class="modal-overlay" onclick="if(event.target === this) window.closeDetailModal()">
          <div class="detail-modal">
            <div class="detail-modal-header">
              <div class="student-cell">
                <img class="student-avatar" src="${u.photo || defaultAvatar}" alt="Avatar">
                <div class="student-info">
                  <h3 style="margin:0;">${escapeHTML(u.name)}</h3>
                  <small>${escapeHTML(u.email)} · ${escapeHTML(u.state)} (${escapeHTML(u.institution)})</small>
                </div>
              </div>
              <button class="btn light" onclick="window.closeDetailModal()" style="padding:6px 12px; font-size:1.1rem;">&times;</button>
            </div>

            <div class="detail-section">
              <h4>Controle de Acesso</h4>
              <div style="display:flex; justify-content:space-between; align-items:center; background:#f4f8f5; padding:12px 16px; border:1px solid var(--line);">
                <div>
                  Status Atual: <span class="status-badge ${isBlocked ? 'blocked' : 'active'}">${isBlocked ? 'Bloqueado' : 'Ativo (Liberado)'}</span>
                </div>
                ${currentCanWrite ? `
                  <button class="btn-sm ${isBlocked ? 'btn-unblock' : 'btn-block'}" onclick="window.toggleUserStatus('${u.id}', '${isBlocked ? 'active' : 'blocked'}'); window.closeDetailModal();">
                    ${isBlocked ? 'Desbloquear Aluno' : 'Suspender Aluno'}
                  </button>
                ` : '<span class="read-only-label">Somente leitura</span>'}
              </div>
            </div>

            <div class="detail-section">
              <h4>Desempenho por Matéria</h4>
              ${subjectRows.length ? subjectRows.map(([sub, stat]) => {
                const subRate = stat.answered ? Math.round(stat.correct / stat.answered * 100) : 0;
                return `<div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--line);">
                  <span><b>${escapeHTML(sub)}</b> (${stat.answered} resolvidas)</span>
                  <span style="font-weight:800; color:var(--forest2);">${subRate}% acerto</span>
                </div>`;
              }).join('') : '<p style="color:var(--muted);">Nenhum simulado por matéria concluído ainda.</p>'}
            </div>

            <div class="detail-section">
              <h4>Caderno de Erros Recentes (${u.errors.length} registrados)</h4>
              ${u.errors.length ? u.errors.slice(0, 10).map((e, idx) => `
                <div class="error-item">
                  <b>${idx + 1}. ${escapeHTML(e.text)}</b><br>
                  <span style="color:#b52e3b;">Gabarito: ${escapeHTML(e.answer)}</span><br>
                  <small style="color:var(--muted);">${escapeHTML(e.explanation)}</small>
                </div>
              `).join('') : '<p style="color:var(--muted);">Nenhum erro registrado.</p>'}
            </div>

            <div style="text-align:right; margin-top:20px;">
              <button class="btn primary" onclick="window.closeDetailModal()">Fechar</button>
            </div>
          </div>
        </div>
      `;
    };

    window.closeDetailModal = function () {
      detailModalContainer.innerHTML = "";
    };

    searchInput.addEventListener("input", renderTable);
    statusFilter.addEventListener("change", renderTable);
    sortBy.addEventListener("change", renderTable);
    refreshBtn.addEventListener("click", loadDashboard);
    if (reportStatusFilter) reportStatusFilter.addEventListener("change", renderReports);

    gateLoginBtn.addEventListener("click", async () => {
      try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      } catch (err) {
        console.error("Erro no login:", err);
      }
    });

    adminLogoutBtn.addEventListener("click", async () => {
      await signOut(auth);
      location.reload();
    });

  } catch (err) {
    console.error("Falha ao inicializar painel:", err);
    loadingState.innerHTML = `<h3 style="color:var(--red);">Erro ao iniciar painel administrativo</h3><p>${err.message}</p>`;
  }
})();
