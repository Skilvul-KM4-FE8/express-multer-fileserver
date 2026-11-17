const rowsEl = document.querySelector("#rows");
const cardsEl = document.querySelector("#cards");
const emptyEl = document.querySelector("#empty");
const errorEl = document.querySelector("#error");
const daysEl = document.querySelector("#days");
const refreshEl = document.querySelector("#refresh");

const fmtSize = (bytes) => {
  const units = ["B", "KB", "MB", "GB"];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n < 10 && i > 0 ? n.toFixed(1) : Math.round(n)} ${units[i]}`;
};

const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const cell = (text, className) => {
  const td = document.createElement("td");
  td.textContent = text;
  if (className) td.className = className;
  return td;
};

const card = (label, value, hint) => {
  const el = document.createElement("div");
  el.className = "card";
  const l = document.createElement("span");
  l.className = "card-label";
  l.textContent = label;
  const v = document.createElement("strong");
  v.textContent = value;
  el.append(l, v);
  if (hint) {
    const h = document.createElement("small");
    h.textContent = hint;
    el.append(h);
  }
  return el;
};

const render = (data) => {
  const { summary, files, days } = data;

  cardsEl.replaceChildren(
    card("Total file", String(summary.totalFiles), fmtSize(summary.totalSize)),
    card("Belum pernah diakses", String(summary.neverAccessed)),
    card(
      `Tidak dipakai ${days} hari`,
      String(summary.unusedFiles),
      fmtSize(summary.unusedSize)
    )
  );

  rowsEl.replaceChildren(
    ...files.map((file) => {
      const tr = document.createElement("tr");
      tr.className = file.unused ? "unused" : "";
      tr.append(
        cell(file.filename, "mono"),
        cell(fmtSize(file.size), "num"),
        cell(fmtDate(file.uploadedAt)),
        cell(fmtDate(file.lastAccessedAt)),
        cell(String(file.accessCount), "num")
      );
      const status = document.createElement("td");
      const badge = document.createElement("span");
      badge.className = `badge ${file.unused ? "bad" : "good"}`;
      badge.textContent = file.unused ? "tidak terpakai" : "aktif";
      status.append(badge);
      tr.append(status);
      return tr;
    })
  );

  emptyEl.hidden = files.length > 0;
};

const load = async () => {
  const days = Number(daysEl.value);
  refreshEl.disabled = true;
  errorEl.hidden = true;
  try {
    const res = await fetch(`/api/stats?days=${days}`);
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || `HTTP ${res.status}`);
    }
    render(json.data);
  } catch (err) {
    errorEl.textContent = `Gagal memuat data: ${err.message}`;
    errorEl.hidden = false;
  } finally {
    refreshEl.disabled = false;
  }
};

daysEl.addEventListener("change", load);
refreshEl.addEventListener("click", load);
load();
