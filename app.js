// ManutenPão — lógica da aplicação
const KEY = "manutenpao_db_v2";
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// ---------- Estado / persistência ----------
let db = load();
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  const seed = JSON.parse(JSON.stringify(window.SEED));
  localStorage.setItem(KEY, JSON.stringify(seed));
  return seed;
}
function save() { localStorage.setItem(KEY, JSON.stringify(db)); }

// ---------- Helpers ----------
const slug = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const fmtDate = (iso) => { if (!iso) return "—"; const [y,m,d] = iso.split("-"); return `${d}/${m}/${y}`; };
const eqById = (id) => db.equipments.find(e => e.id === id);
const clientById = (id) => db.clients.find(c => c.id === id);
const clientIdForEquip = (equipId) => {
  const e = eqById(equipId); if (!e) return "";
  return (db.clients.find(c => c.name === e.client) || {}).id || "";
};

// ---------- Perfil / controle de acesso ----------
// role: "gestor" (gestão/colaborador — vê tudo, distribui) | "mecanico" (vê só as suas OS)
let currentUser = { role: "gestor", name: "Gestão" };
const isManager = () => currentUser.role === "gestor";
const visibleOrders = () => isManager()
  ? db.orders
  : db.orders.filter(o => o.tech === currentUser.name);
function nextOsId() {
  const nums = db.orders.map(o => parseInt(o.id.replace(/\D/g, ""), 10) || 0);
  return "OS-" + (Math.max(1040, ...nums) + 1);
}
function nextEqId() {
  const nums = db.equipments.map(e => parseInt(e.id.replace(/\D/g, ""), 10) || 0);
  return "EQ-" + String(Math.max(0, ...nums) + 1).padStart(4, "0");
}
function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove("show"), 2600);
}
const statusBadge = (s) => `<span class="badge b-${slug(s)}">${s}</span>`;
const prioCls = (p) => "p-" + slug(p);

// ---------- Navegação ----------
const TITLES = { dashboard: "Dashboard executivo", equipamentos: "Gestão de equipamentos", os: "Ordens de Serviço" };
function goto(view) {
  $$(".view").forEach(v => v.classList.add("hidden"));
  $("#view-" + view).classList.remove("hidden");
  $$(".nav-item").forEach(n => n.classList.toggle("active", n.dataset.view === view));
  $("#viewTitle").textContent = TITLES[view];
  toggleSidebar(false);
  if (view === "dashboard") renderDashboard();
  if (view === "equipamentos") renderEquip();
  if (view === "os") renderOs();
}
function toggleSidebar(force) {
  const sb = $("#sidebar");
  const open = force !== undefined ? force : !sb.classList.contains("open");
  sb.classList.toggle("open", open);
  $("#sidebarBackdrop").classList.toggle("show", open);
}
$$(".nav-item").forEach(b => b.addEventListener("click", () => goto(b.dataset.view)));
$$("[data-goto]").forEach(b => b.addEventListener("click", () => goto(b.dataset.goto)));
$("#hamburger").addEventListener("click", () => toggleSidebar());
$("#sidebarBackdrop").addEventListener("click", () => toggleSidebar(false));

// ---------- Dashboard ----------
let charts = {};
function renderDashboard() {
  const eq = db.equipments;
  const vo = visibleOrders();
  const counts = {
    Alocado: eq.filter(e => e.status === "Alocado").length,
    "Disponível": eq.filter(e => e.status === "Disponível").length,
    "Manutenção": eq.filter(e => e.status === "Manutenção").length,
  };
  const osOpen = vo.filter(o => o.status !== "Concluída").length;
  $("#kpiAlloc").textContent = counts.Alocado;
  $("#kpiAvail").textContent = counts["Disponível"];
  $("#kpiMaint").textContent = counts["Manutenção"];
  $("#kpiOs").textContent = osOpen;

  // OS recentes (respeitando o perfil ativo)
  const recent = [...vo].sort((a, b) => b.opened.localeCompare(a.opened)).slice(0, 5);
  $("#recentOsTable tbody").innerHTML = recent.length ? recent.map(o => `
    <tr>
      <td class="os-code">${o.id}</td>
      <td>${eqById(o.equip)?.model || o.equip}</td>
      <td><span class="prio ${prioCls(o.priority)}">${o.priority}</span></td>
      <td>${o.tech || "<i>—</i>"}</td>
      <td>${statusBadge(o.status)}</td>
    </tr>`).join("") : `<tr><td colspan="5" class="empty">Nenhuma OS atribuída a você.</td></tr>`;

  drawCharts(counts, vo);
}

function drawCharts(counts, vo) {
  Object.values(charts).forEach(c => c && c.destroy());
  const COL = { primary: "#1E3A5F", sec: "#F5A623", alloc: "#3066be", avail: "#1f9d57", maint: "#e08a00", crit: "#d6453d" };
  const baseOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { font: { family: "Inter" }, padding: 14, usePointStyle: true } } } };

  charts.status = new Chart($("#chartStatus"), {
    type: "doughnut",
    data: { labels: ["Alocados", "Disponíveis", "Manutenção"],
      datasets: [{ data: [counts.Alocado, counts["Disponível"], counts["Manutenção"]], backgroundColor: [COL.alloc, COL.avail, COL.maint], borderWidth: 0 }] },
    options: { ...baseOpts, cutout: "62%" }
  });

  const osStatuses = ["Aberta", "Em andamento", "Concluída"];
  charts.os = new Chart($("#chartOs"), {
    type: "pie",
    data: { labels: osStatuses,
      datasets: [{ data: osStatuses.map(s => vo.filter(o => o.status === s).length), backgroundColor: [COL.alloc, COL.maint, COL.avail], borderWidth: 0 }] },
    options: baseOpts
  });

  const techs = db.technicians;
  charts.tech = new Chart($("#chartTech"), {
    type: "bar",
    data: { labels: techs,
      datasets: [
        { label: "Abertas/Em andamento", data: techs.map(t => vo.filter(o => o.tech === t && o.status !== "Concluída").length), backgroundColor: COL.sec, borderRadius: 6 },
        { label: "Concluídas", data: techs.map(t => vo.filter(o => o.tech === t && o.status === "Concluída").length), backgroundColor: COL.primary, borderRadius: 6 }
      ] },
    options: { ...baseOpts, scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } } } }
  });
}

// ---------- Equipamentos ----------
function renderEquip() {
  const sf = $("#eqStatusFilter").value;
  const q = slug($("#eqSearch").value);
  const list = db.equipments.filter(e =>
    (!sf || e.status === sf) &&
    (!q || slug(e.id + e.model + e.client + e.city).includes(q)));
  const grid = $("#eqGrid");
  if (!list.length) { grid.innerHTML = `<div class="empty">Nenhum equipamento encontrado.</div>`; return; }
  grid.innerHTML = list.map(e => `
    <div class="eq-card s-${slug(e.status)}">
      <div class="eq-top">
        <div>
          <div class="eq-tag">${e.id}</div>
          <div class="eq-model">${e.model}</div>
          <div class="eq-type">${e.type}</div>
        </div>
        ${statusBadge(e.status)}
      </div>
      <div class="eq-meta">
        <div class="row">🏢 <b>${e.client || "Em estoque"}</b></div>
        <div class="row">📍 ${e.city || "—"}</div>
        ${e.notes ? `<div class="row">📝 ${e.notes}</div>` : ""}
      </div>
      <div class="eq-actions">
        <button class="btn btn-ghost btn-sm" data-edit-eq="${e.id}">Editar</button>
        ${isManager() ? `<button class="btn btn-ghost btn-sm" data-os-eq="${e.id}">Abrir OS</button>` : ""}
      </div>
    </div>`).join("");
  $$("[data-edit-eq]", grid).forEach(b => b.onclick = () => openEqModal(b.dataset.editEq));
  $$("[data-os-eq]", grid).forEach(b => b.onclick = () => openOsModal(null, b.dataset.osEq));
}
$("#eqStatusFilter").addEventListener("change", renderEquip);
$("#eqSearch").addEventListener("input", renderEquip);

// ---------- OS (Kanban) ----------
const KB_COLS = ["Aberta", "Em andamento", "Concluída"];
let draggedOsId = null;

function renderOs() {
  const cf = $("#osClientFilter").value, tf = $("#osTechFilter").value, df = $("#osDateFilter").value;
  const base = visibleOrders().filter(o =>
    (!cf || o.clientId === cf) && (!tf || o.tech === tf) && (!df || o.opened === df));

  KB_COLS.forEach(col => {
    const list = base.filter(o => o.status === col).sort((a, b) => b.opened.localeCompare(a.opened));
    const colEl = $(`.kb-col[data-col="${col}"]`);
    colEl.querySelector(".kb-count").textContent = list.length;
    const listEl = colEl.querySelector(".kb-list");
    listEl.innerHTML = list.length
      ? list.map(kanbanCard).join("")
      : `<div class="kb-empty">Sem OS nesta coluna</div>`;
    bindCard(listEl);
  });
}

function kanbanCard(o) {
  const e = eqById(o.equip);
  const c = clientById(o.clientId);
  const assign = isManager()
    ? `<select class="kb-assign" data-assign="${o.id}" title="Distribuir para mecânico">
         <option value="">Não atribuído</option>
         ${db.technicians.map(t => `<option value="${t}" ${t === o.tech ? "selected" : ""}>${t}</option>`).join("")}
       </select>`
    : `<span class="kb-tech ${o.tech ? "" : "unassigned"}">🔧 ${o.tech || "Não atribuído"}</span>`;
  return `
    <div class="kb-card bl-${slug(o.priority)}" draggable="true" data-os="${o.id}">
      <div class="kb-top">
        <span class="os-code">${o.id}</span>
        <span class="prio ${prioCls(o.priority)}">${o.priority}</span>
      </div>
      <div class="kb-equip">${e?.model || o.equip}</div>
      <div class="kb-client">🏢 ${c?.name || "—"}</div>
      <div class="kb-foot">${assign}<span class="kb-date">${fmtDate(o.opened)}</span></div>
      ${statusSeal(o)}
    </div>`;
}

function statusSeal(o) {
  if (o.status === "Concluída" && o.closedBy)
    return `<div class="kb-seal seal-done">✔ Concluída por ${o.closedBy} · ${fmtDate(o.closedAt)}</div>`;
  if (o.status === "Em andamento" && o.startedBy)
    return `<div class="kb-seal seal-doing">▶ Iniciada por ${o.startedBy} · ${fmtDate(o.startedAt)}</div>`;
  return "";
}

function bindCard(listEl) {
  $$(".kb-card", listEl).forEach(card => {
    card.addEventListener("click", (ev) => {
      if (ev.target.closest(".kb-assign")) return;
      openOsDetail(card.dataset.os);
    });
    card.addEventListener("dragstart", () => { draggedOsId = card.dataset.os; card.classList.add("dragging"); });
    card.addEventListener("dragend", () => card.classList.remove("dragging"));
  });
  $$(".kb-assign", listEl).forEach(sel => {
    sel.addEventListener("change", () => assignTech(sel.dataset.assign, sel.value));
    sel.addEventListener("click", (ev) => ev.stopPropagation());
  });
}

function assignTech(osId, tech) {
  const o = db.orders.find(x => x.id === osId); if (!o) return;
  o.tech = tech;
  logEvent(o, tech ? `Distribuída ao mecânico ${tech}` : "Atribuição removida");
  save(); renderOs(); renderDashboard();
  toast(tech ? `OS ${osId} distribuída a ${tech}` : `OS ${osId} sem atribuição`);
}

function moveOs(osId, newStatus) {
  const o = db.orders.find(x => x.id === osId); if (!o || o.status === newStatus) return;
  // Regra: concluir exige baixa técnica registrada
  if (newStatus === "Concluída" && !(o.resolution && o.resolution.trim())) {
    openBaixaModal(osId);
    return;
  }
  completeMove(o, newStatus);
}
function completeMove(o, newStatus) {
  const prev = o.status;
  o.status = newStatus;
  applyStatusMeta(o, newStatus, prev);
  logEvent(o, `Status alterado: ${prev} → ${newStatus}`);
  syncEquipStatus(o.equip, newStatus);
  save(); renderOs(); renderDashboard();
  toast(`OS ${o.id}: ${newStatus}`);
}

// Baixa técnica obrigatória ao concluir
function openBaixaModal(osId) {
  const o = db.orders.find(x => x.id === osId); if (!o) return;
  $("#baixaOsId").value = osId;
  $("#baixaTitle").textContent = `Baixa técnica — ${osId}`;
  $("#baixaText").value = o.resolution || "";
  openModal("#baixaModal");
  setTimeout(() => $("#baixaText").focus(), 60);
}
$("#baixaForm").addEventListener("submit", (ev) => {
  ev.preventDefault();
  const o = db.orders.find(x => x.id === $("#baixaOsId").value); if (!o) return;
  const txt = $("#baixaText").value.trim();
  if (!txt) { toast("Informe a baixa técnica para concluir"); return; }
  o.resolution = txt;
  logEvent(o, "Baixa técnica registrada.");
  closeModal();
  completeMove(o, "Concluída");
});

// Drop zones (colunas)
$$(".kb-list").forEach(zone => {
  zone.addEventListener("dragover", (ev) => { ev.preventDefault(); zone.classList.add("drag-over"); });
  zone.addEventListener("dragleave", () => zone.classList.remove("drag-over"));
  zone.addEventListener("drop", (ev) => {
    ev.preventDefault(); zone.classList.remove("drag-over");
    if (draggedOsId) moveOs(draggedOsId, zone.dataset.status);
    draggedOsId = null;
  });
});

["osClientFilter", "osTechFilter", "osDateFilter"].forEach(id =>
  $("#" + id).addEventListener("change", renderOs));

// ---------- Modal de equipamento ----------
function openEqModal(id) {
  const e = id ? eqById(id) : null;
  $("#eqModalTitle").textContent = e ? "Editar Equipamento" : "Cadastro de Equipamento";
  $("#eqId").value = e ? e.id : "";
  $("#eqTag").value = e ? e.id : nextEqId();
  $("#eqTag").readOnly = !!e;
  $("#eqModel").value = e?.model || "";
  $("#eqType").value = e?.type || "Forno";
  $("#eqStatus").value = e?.status || "Disponível";
  $("#eqClient").value = e?.client || "";
  $("#eqCity").value = e?.city || "";
  $("#eqNotes").value = e?.notes || "";
  openModal("#eqModal");
}
$("#newEqBtn").addEventListener("click", () => openEqModal());
$("#eqForm").addEventListener("submit", (ev) => {
  ev.preventDefault();
  const editing = $("#eqId").value;
  const data = {
    id: editing || $("#eqTag").value.trim(),
    model: $("#eqModel").value.trim(), type: $("#eqType").value,
    status: $("#eqStatus").value, client: $("#eqClient").value.trim(),
    city: $("#eqCity").value.trim(), notes: $("#eqNotes").value.trim()
  };
  if (editing) {
    Object.assign(eqById(editing), data);
    toast("Equipamento atualizado");
  } else {
    if (eqById(data.id)) { toast("Nº de patrimônio já existe"); return; }
    db.equipments.push(data); toast("Equipamento cadastrado");
  }
  save(); closeModal(); renderEquip();
});

// ---------- Modal de OS ----------
function fillClientSelects() {
  const opts = db.clients.map(c => `<option value="${c.id}">${c.name} — ${c.city}</option>`).join("");
  $("#osClient").innerHTML = `<option value="" disabled selected>Selecione um cliente...</option>` + opts;
  $("#osClientFilter").innerHTML = `<option value="">Todos os clientes</option>` + opts;
}
function fillEquipByClient(clientId, selectEquip) {
  const c = clientById(clientId);
  const list = c ? db.equipments.filter(e => e.client === c.name) : [];
  $("#osEquip").innerHTML = list.length
    ? list.map(e => `<option value="${e.id}">${e.id} — ${e.model}</option>`).join("")
    : `<option value="" disabled selected>Nenhum equipamento alocado a este cliente</option>`;
  if (selectEquip && list.some(e => e.id === selectEquip)) $("#osEquip").value = selectEquip;
}
function fillTechSelects() {
  const opts = db.technicians.map(t => `<option value="${t}">${t}</option>`).join("");
  $("#osTech").innerHTML = `<option value="">Não atribuído</option>` + opts;
  $("#osTechFilter").innerHTML = `<option value="">Todos os mecânicos</option>` + opts;
}
function toggleResolution() {
  $("#osResolutionField").classList.toggle("hidden", $("#osStatus").value !== "Concluída");
}
$("#osStatus").addEventListener("change", toggleResolution);

function openOsModal(id, presetEquip) {
  const o = id ? db.orders.find(x => x.id === id) : null;
  const clientId = o ? o.clientId : (presetEquip ? clientIdForEquip(presetEquip) : "");
  $("#osModalTitle").textContent = o ? `Editar ${o.id}` : "Abertura de Ordem de Serviço";
  $("#osId").value = o ? o.id : "";
  $("#osClient").value = clientId;
  fillEquipByClient(clientId, o ? o.equip : presetEquip);
  $("#osPriority").value = o?.priority || "Média";
  $("#osTech").value = o?.tech || "";
  $("#osStatus").value = o?.status || "Aberta";
  $("#osDesc").value = o?.desc || "";
  $("#osResolution").value = o?.resolution || "";
  toggleResolution();
  openModal("#osModal");
}
$("#newOsBtn").addEventListener("click", () => openOsModal());
$("#quickNewOs").addEventListener("click", () => openOsModal());

$("#osForm").addEventListener("submit", (ev) => {
  ev.preventDefault();
  const editing = $("#osId").value;
  const status = $("#osStatus").value;
  const clientId = $("#osClient").value;
  const equip = $("#osEquip").value;
  if (!clientId) { toast("Selecione um cliente da base"); return; }
  if (!equip) { toast("Este cliente não possui equipamento em comodato"); return; }
  if (status === "Concluída" && !$("#osResolution").value.trim()) {
    $("#osResolutionField").classList.remove("hidden");
    $("#osResolution").focus();
    toast("Registre a baixa técnica para concluir a OS");
    return;
  }
  const fields = {
    clientId, equip, priority: $("#osPriority").value,
    tech: $("#osTech").value, status,
    desc: $("#osDesc").value.trim(), resolution: $("#osResolution").value.trim()
  };
  if (editing) {
    const o = db.orders.find(x => x.id === editing);
    const prevStatus = o.status;
    Object.assign(o, fields);
    applyStatusMeta(o, status, prevStatus);
    if (status === "Concluída" && prevStatus !== "Concluída") logEvent(o, "Baixa técnica registrada.");
    if (prevStatus !== status) logEvent(o, `Status alterado: ${prevStatus} → ${status}`);
    toast("OS atualizada");
  } else {
    const o = { id: nextOsId(), ...fields, opened: today(), events: [] };
    logEvent(o, "OS aberta");
    if (o.tech) logEvent(o, `Atribuída a ${o.tech}`);
    applyStatusMeta(o, o.status, "Aberta");
    if (o.status === "Concluída") logEvent(o, "Baixa técnica registrada.");
    db.orders.push(o); toast("OS aberta com sucesso");
  }
  // Sincroniza status do equipamento
  syncEquipStatus(fields.equip, status);
  save(); closeModal(); renderOs(); renderDashboard();
});

function syncEquipStatus(equipId, osStatus) {
  const e = eqById(equipId); if (!e) return;
  const active = db.orders.some(o => o.equip === equipId && o.status !== "Concluída");
  if (active) e.status = "Manutenção";
  else if (e.status === "Manutenção") e.status = e.client ? "Alocado" : "Disponível";
}

function today() {
  // Data fixa do ambiente do projeto (2026-06-02) para consistência do seed
  return "2026-06-02";
}
function logEvent(o, desc, by = currentUser.name) {
  o.events = o.events || [];
  o.events.push({ when: today(), desc, by });
}
// Marca/limpa quem iniciou e quem concluiu (com data), conforme o status
function applyStatusMeta(o, newStatus, prevStatus) {
  if (newStatus === "Em andamento" && !o.startedBy) { o.startedBy = currentUser.name; o.startedAt = today(); }
  if (newStatus === "Concluída") { o.closedBy = currentUser.name; o.closedAt = today(); }
  else if (prevStatus === "Concluída") { o.closedBy = ""; o.closedAt = ""; }
}

// ---------- Detalhe / rastreabilidade da OS ----------
function openOsDetail(id) {
  const o = db.orders.find(x => x.id === id); if (!o) return;
  const e = eqById(o.equip);
  const c = clientById(o.clientId);
  $("#osDetailTitle").innerHTML = `${o.id} ${statusBadge(o.status)}`;
  const events = (o.events && o.events.length) ? o.events : [{ when: o.opened, desc: "OS aberta" }];
  $("#osDetailBody").innerHTML = `
    <div class="od-grid">
      <div class="od-item"><span class="k">Cliente (base)</span>${c?.name || "—"}<br><small>${c?.city || ""}</small></div>
      <div class="od-item"><span class="k">Equipamento</span>${e?.model || o.equip}<br><small>${o.equip}</small></div>
      <div class="od-item"><span class="k">Prioridade</span><span class="prio ${prioCls(o.priority)}">${o.priority}</span></div>
      <div class="od-item"><span class="k">Mecânico</span>${o.tech || "Não atribuído"}</div>
      <div class="od-item"><span class="k">Abertura</span>${fmtDate(o.opened)}</div>
      <div class="od-item"><span class="k">Status</span>${statusBadge(o.status)}</div>
    </div>
    <div class="od-item"><span class="k">Descrição do problema</span>${o.desc}</div>
    ${o.resolution ? `<div class="od-item"><span class="k">Baixa técnica</span>${o.resolution}${o.closedBy ? `<br><small class="closed-by">✔ Concluída por <b>${o.closedBy}</b> em ${fmtDate(o.closedAt)}</small>` : ""}</div>` : ""}
    <div><span class="k" style="color:var(--muted);font-size:11.5px;text-transform:uppercase;letter-spacing:.4px">Rastreabilidade</span>
      <div class="timeline">
        ${events.map(ev => `<div class="tl-item"><div class="t">${fmtDate(ev.when)}${ev.by ? ` · ${ev.by}` : ""}</div><div class="d">${ev.desc}</div></div>`).join("")}
      </div>
    </div>
    <div class="form-actions os-detail-actions">
      <button class="btn btn-ghost" data-close>Fechar</button>
      ${isManager() ? `<button class="btn btn-ghost" id="detEditBtn">Editar OS</button>` : ""}
      ${detailActions(o)}
    </div>`;
  openModal("#osDetailModal");
  const editBtn = $("#detEditBtn");
  if (editBtn) editBtn.onclick = () => { closeModal(); openOsModal(id); };
  $$("[data-move]", $("#osDetailBody")).forEach(b => b.onclick = () => {
    const target = b.dataset.move;
    closeModal();
    moveOs(o.id, target); // trata baixa técnica obrigatória ao concluir
  });
}

// Ações de status por toque (mobile-friendly) conforme status atual e perfil
function detailActions(o) {
  if (o.status === "Aberta")
    return `<button class="btn btn-primary" data-move="Em andamento">▶ Iniciar atendimento</button>`;
  if (o.status === "Em andamento")
    return `<button class="btn btn-primary" data-move="Concluída">✔ Concluir OS</button>`;
  if (o.status === "Concluída" && isManager())
    return `<button class="btn btn-ghost" data-move="Em andamento">↩ Reabrir OS</button>`;
  return "";
}

// ---------- Busca global ----------
$("#globalSearch").addEventListener("keydown", (ev) => {
  if (ev.key !== "Enter") return;
  const q = slug(ev.target.value); if (!q) return;
  const eq = db.equipments.find(e => slug(e.id + e.model).includes(q));
  const os = visibleOrders().find(o => slug(o.id + o.desc).includes(q));
  if (os) { goto("os"); openOsDetail(os.id); }
  else if (eq) { goto("equipamentos"); $("#eqSearch").value = ev.target.value; renderEquip(); }
  else toast("Nada encontrado para essa busca");
});

// ---------- Modal helpers ----------
function openModal(sel) { $(sel).classList.remove("hidden"); }
function closeModal() { $$(".modal-overlay").forEach(m => m.classList.add("hidden")); }
$$(".modal-overlay").forEach(ov => {
  ov.addEventListener("click", (e) => { if (e.target === ov || e.target.hasAttribute("data-close")) closeModal(); });
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

// ---------- Perfil ativo ----------
function fillProfileSelect() {
  $("#profileSelect").innerHTML =
    `<option value="gestor">Gestão / Colaborador</option>` +
    db.technicians.map(t => `<option value="mec::${t}">🔧 ${t}</option>`).join("");
}
function applyRole() {
  const show = isManager() ? "" : "none";
  $("#newOsBtn").style.display = show;
  $("#quickNewOs").style.display = show;
  $("#osTechFilter").style.display = show; // mecânico só vê as suas → filtro desnecessário
  $("#profileHint").textContent = isManager()
    ? "Acesso total — gestão e distribuição"
    : `Mecânico — vê apenas as OS atribuídas a ${currentUser.name}`;
  const active = $(".nav-item.active")?.dataset.view || "dashboard";
  goto(active);
}
$("#profileSelect").addEventListener("change", (e) => {
  const v = e.target.value;
  currentUser = v === "gestor"
    ? { role: "gestor", name: "Gestão" }
    : { role: "mecanico", name: v.replace("mec::", "") };
  applyRole();
  if (!isManager()) goto("os"); // mecânico vai direto para a sua tela de trabalho
});

// ---------- Boot ----------
fillClientSelects();
fillTechSelects();
fillProfileSelect();
$("#osClient").addEventListener("change", () => fillEquipByClient($("#osClient").value));
applyRole();
