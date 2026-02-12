const uploadForm = document.getElementById("uploadForm");
const rowsBody = document.getElementById("rows");
const exportBtn = document.getElementById("exportBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const autoBtn = document.getElementById("autoBtn");
const stopBtn = document.getElementById("stopBtn");
const playDurationSelect = document.getElementById("playDuration");
const statRows = document.getElementById("statRows");
const statCurrent = document.getElementById("statCurrent");
const statStatus = document.getElementById("statStatus");
const currentNameEl = document.getElementById("currentName");
const currentStatusRadios = document.querySelectorAll('input[name="currentStatus"]');
const currentNoteEl = document.getElementById("currentNote");

let entries = [];
let currentIndex = -1;
let autoTimer = null;
let player = null;
let qcData = {};

function setStats() {
  statRows.textContent = entries.length || 0;
  statCurrent.textContent = currentIndex >= 0 ? currentIndex + 1 : "-";
  const current = entries[currentIndex];
  if (current && qcData[current.index]) {
    statStatus.textContent = qcData[current.index].status || "Pending";
  } else {
    statStatus.textContent = "-";
  }
}

function onYouTubeIframeAPIReady() {
  player = new YT.Player("player", {
    height: "100%",
    width: "100%",
    playerVars: {
      autoplay: 0,
      controls: 1,
      modestbranding: 1,
    },
  });
}

if (typeof YT !== "undefined" && YT.Player) {
  onYouTubeIframeAPIReady();
} else {
  window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
}

function extractVideoId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?\s]+)/,
    /youtube\.com\/embed\/([^&?\s]+)/,
  ];
  for (const pattern of patterns) {
    const match = String(url).match(pattern);
    if (match) return match[1];
  }
  return null;
}

function extractTimestamp(url) {
  if (!url) return 0;
  const match = String(url).match(/[?&]t=(\d+)/);
  return match ? Number(match[1]) : 0;
}

function parseExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

        const entries = [];
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const name = String(row[0] || "").trim();
          const link = String(row[1] || "").trim();

          if (!name && !link) continue;
          if (i === 0 && name.toLowerCase() === "name") continue;

          const videoId = extractVideoId(link);
          const timestamp = extractTimestamp(link);

          entries.push({
            index: entries.length + 1,
            name,
            link,
            videoId,
            timestamp,
          });
        }

        resolve(entries);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function createRow(entry) {
  const tr = document.createElement("tr");
  tr.dataset.index = entry.index;

  const qc = qcData[entry.index] || {};
  const groupName = `status_${entry.index}`;

  tr.innerHTML = `
    <td>${entry.index}</td>
    <td>${entry.name || ""}</td>
    <td>${entry.timestamp}s</td>
    <td>
      <div class="radio-group-inline">
        <label class="radio-label-small">
          <input type="radio" name="${groupName}" value="" ${!qc.status ? "checked" : ""} />
          <span>Pending</span>
        </label>
        <label class="radio-label-small">
          <input type="radio" name="${groupName}" value="pass" ${qc.status === "pass" ? "checked" : ""} />
          <span>Pass</span>
        </label>
        <label class="radio-label-small">
          <input type="radio" name="${groupName}" value="fail" ${qc.status === "fail" ? "checked" : ""} />
          <span>Fail</span>
        </label>
      </div>
    </td>
    <td>
      <input class="note-input" data-field="note" placeholder="Type notes" value="${qc.note || ""}" />
    </td>
  `;

  tr.addEventListener("click", (e) => {
    if (e.target.tagName !== "INPUT") {
      playAt(entry.index - 1);
    }
  });

  tr.querySelectorAll(`input[name="${groupName}"]`).forEach((radio) => {
    radio.addEventListener("change", (e) => {
      e.stopPropagation();
      if (!qcData[entry.index]) qcData[entry.index] = {};
      qcData[entry.index].status = radio.value;
      setStats();
    });
  });

  tr.querySelector("[data-field='note']").addEventListener("input", (e) => {
    e.stopPropagation();
    if (!qcData[entry.index]) qcData[entry.index] = {};
    qcData[entry.index].note = e.target.value;
  });

  return tr;
}

function renderRows() {
  rowsBody.innerHTML = "";
  entries.forEach((entry) => {
    rowsBody.appendChild(createRow(entry));
  });
}

function updateRowFocus() {
  rowsBody.querySelectorAll("tr").forEach((row) => {
    row.classList.toggle(
      "is-active",
      Number(row.dataset.index) === currentIndex + 1
    );
  });
}

function playAt(index) {
  if (index < 0 || index >= entries.length) return;
  
  const entry = entries[index];
  currentIndex = index;

  if (!player || !player.loadVideoById) {
    alert("YouTube player not ready yet");
    return;
  }

  player.loadVideoById({
    videoId: entry.videoId,
    startSeconds: entry.timestamp,
  });
  
  setTimeout(() => {
    if (player && player.playVideo) {
      player.playVideo();
    }
  }, 500);

  currentNameEl.textContent = entry.name || "Unnamed";
  const qc = qcData[entry.index] || {};
  
  currentStatusRadios.forEach((radio) => {
    radio.checked = radio.value === (qc.status || "");
  });
  
  currentNoteEl.value = qc.note || "";

  updateRowFocus();
  setStats();
}

function stopAuto() {
  if (autoTimer) {
    clearTimeout(autoTimer);
    autoTimer = null;
    autoBtn.style.display = "block";
    stopBtn.style.display = "none";
    
    if (player && player.pauseVideo) {
      player.pauseVideo();
    }
  }
}

function startAuto() {
  if (!entries.length || !player) return;

  if (autoTimer) {
    stopAuto();
    return;
  }

  const duration = Number(playDurationSelect.value) * 1000;
  autoBtn.style.display = "none";
  stopBtn.style.display = "block";
  
  if (player && player.playVideo && currentIndex >= 0) {
    player.playVideo();
  }

  function playNext() {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= entries.length) {
      stopAuto();
      return;
    }
    playAt(nextIndex);
    autoTimer = setTimeout(playNext, duration);
  }

  if (currentIndex < 0) {
    playAt(0);
    autoTimer = setTimeout(playNext, duration);
  } else {
    autoTimer = setTimeout(playNext, duration);
  }
}

currentStatusRadios.forEach((radio) => {
  radio.addEventListener("change", () => {
    if (currentIndex < 0) return;
    const entry = entries[currentIndex];
    if (!qcData[entry.index]) qcData[entry.index] = {};
    qcData[entry.index].status = radio.value;
    
    const row = rowsBody.querySelector(`tr[data-index="${entry.index}"]`);
    if (row) {
      const groupName = `status_${entry.index}`;
      row.querySelectorAll(`input[name="${groupName}"]`).forEach((r) => {
        r.checked = r.value === radio.value;
      });
    }
    setStats();
  });
});

currentNoteEl.addEventListener("input", () => {
  if (currentIndex < 0) return;
  const entry = entries[currentIndex];
  if (!qcData[entry.index]) qcData[entry.index] = {};
  qcData[entry.index].note = currentNoteEl.value;
  
  const row = rowsBody.querySelector(`tr[data-index="${entry.index}"]`);
  if (row) {
    row.querySelector("[data-field='note']").value = currentNoteEl.value;
  }
});

uploadForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  stopAuto();

  const fileInput = document.getElementById("excelFile");
  const file = fileInput.files[0];

  if (!file) return;

  try {
    entries = await parseExcel(file);
    qcData = {};
    currentIndex = -1;
    
    setStats();
    renderRows();
  } catch (error) {
    alert("Failed to parse Excel file: " + error.message);
  }
});

prevBtn.addEventListener("click", () => {
  stopAuto();
  playAt(currentIndex - 1);
});

nextBtn.addEventListener("click", () => {
  stopAuto();
  playAt(currentIndex + 1);
});

autoBtn.addEventListener("click", startAuto);
stopBtn.addEventListener("click", stopAuto);

exportBtn.addEventListener("click", () => {
  if (!entries.length) return;

  const headers = ["Index", "Name", "Link", "Timestamp", "Status", "Notes"];
  const lines = [headers.join(",")];

  entries.forEach((entry) => {
    const qc = qcData[entry.index] || {};
    const values = [
      entry.index,
      `"${(entry.name || "").replace(/"/g, '""')}"`,
      entry.link,
      entry.timestamp,
      qc.status || "",
      `"${(qc.note || "").replace(/"/g, '""')}"`,
    ];
    lines.push(values.join(","));
  });

  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "qc-results.csv";
  link.click();
  URL.revokeObjectURL(url);
});

// Prevent accidental page refresh/close with unsaved work
window.addEventListener("beforeunload", (event) => {
  // Only warn if there's actual work done
  if (entries.length > 0 || Object.keys(qcData).length > 0) {
    const message = "⚠️ Warning: If you refresh or leave this page, you will lose all your work! Make sure to export your results before leaving.";
    event.preventDefault();
    event.returnValue = message; // For older browsers
    return message;
  }
});
