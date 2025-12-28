const steps = [
  { id: 1, file: 'index.html', label: 'Pausa Intencional', phase: 'GRUPO 01 - AVALIANDO GANHOS E PERDAS' },
  { id: 2, file: 'step2.html', label: 'Estoque', phase: 'GRUPO 01 - AVALIANDO GANHOS E PERDAS' },
  { id: 3, file: 'step5.html', label: 'Débitos/Créditos', phase: 'GRUPO 01 - AVALIANDO GANHOS E PERDAS' },
  { id: 4, file: 'step6.html', label: 'Análise', phase: 'GRUPO 01 - AVALIANDO GANHOS E PERDAS' },
  { id: 5, file: 'step7.html', label: 'Ajustes', phase: 'GRUPO 02 - CORRIGINDO A ROTA' },
  { id: 6, file: 'step8.html', label: 'Organização', phase: 'GRUPO 02 - CORRIGINDO A ROTA' },
  { id: 7, file: 'step9.html', label: 'Treinamento', phase: 'GRUPO 02 - CORRIGINDO A ROTA' },
  { id: 8, file: 'step10.html', label: 'Entregue ao Abba', phase: 'GRUPO 02 - CORRIGINDO A ROTA' },
  { id: 9, file: 'step11.html', label: 'Final', phase: 'GRUPO 02 - CORRIGINDO A ROTA' }
];

const baseStorageKey = 'balancoRespostas';
const metaStorageSuffix = '_meta';
const sessionIdKey = 'balancoSessionId';
let currentStepId = null;

function getSessionId() {
  let id = sessionStorage.getItem(sessionIdKey);
  if (!id) {
    const fallback = () => `sess-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : fallback();
    sessionStorage.setItem(sessionIdKey, id);
  }
  return id;
}

function namespacedKey() {
  return `${baseStorageKey}_${getSessionId()}`;
}

function namespacedMetaKey() {
  return `${namespacedKey()}${metaStorageSuffix}`;
}

function getStorageData() {
  return JSON.parse(sessionStorage.getItem(namespacedKey()) || '{}');
}

function setStorageData(data) {
  sessionStorage.setItem(namespacedKey(), JSON.stringify(data));
}

function getMeta() {
  return JSON.parse(sessionStorage.getItem(namespacedMetaKey()) || '{}');
}

function setMeta(meta) {
  sessionStorage.setItem(namespacedMetaKey(), JSON.stringify(meta));
}

function ensureMeta() {
  const meta = getMeta();
  if (!meta.pageTitles) meta.pageTitles = {};
  if (!meta.fields) meta.fields = {};
  return meta;
}

function collectFieldMeta(field) {
  if (!field || !field.name) return;
  const meta = ensureMeta();
  const stepId = currentStepId || 0;
  // label extraction
  let labelText = field.closest('label')?.innerText || '';
  if (!labelText) {
    const lbl = field.closest('div')?.querySelector('label');
    labelText = lbl ? lbl.textContent : '';
  }
  labelText = (labelText || field.name).replace(/\s+/g, ' ').trim();
  // section extraction
  let section = null;
  const card = field.closest('.bg-gray-50');
  if (card) {
    const headerSpan = card.querySelector('.flex.items-center span');
    section = headerSpan ? headerSpan.textContent.trim() : null;
  }
  meta.fields[field.name] = { label: labelText, stepId, section };
  setMeta(meta);
}

function saveFormData(form) {
  if (!form) return;
  const data = getStorageData();
  form.querySelectorAll('input, textarea, select').forEach((field) => {
    if (!field.name) return;
    collectFieldMeta(field);
    if (field.type === 'checkbox') {
      data[field.name] = field.checked;
    } else if (field.type === 'radio') {
      if (field.checked) data[field.name] = field.value;
    } else {
      data[field.name] = field.value;
    }
  });
  setStorageData(data);
}

function restoreFormData(form) {
  if (!form) return;
  const data = getStorageData();
  form.querySelectorAll('input, textarea, select').forEach((field) => {
    if (!field.name) return;
    const stored = data[field.name];
    if (stored === undefined) return;
    if (field.type === 'checkbox') {
      field.checked = Boolean(stored);
    } else if (field.type === 'radio') {
      field.checked = field.value === stored;
    } else {
      field.value = stored;
    }
  });
}

function wireFormPersistence(form) {
  if (!form) return;
  const handler = () => saveFormData(form);
  form.addEventListener('input', handler);
  form.addEventListener('change', handler);
}

function highlightTabs(currentId) {
  document.querySelectorAll('[data-step-link]').forEach((link) => {
    const step = Number(link.dataset.stepLink);
    // limpar estilos para evitar conflito de utilitários Tailwind
    link.classList.remove(
      'bg-blue-600', 'text-white', 'border-blue-600', 'shadow', 'shadow-md',
      'bg-white', 'text-blue-700', 'border-blue-500', 'ring-2', 'ring-blue-500', 'ring-offset-1',
      'bg-gray-50', 'text-gray-700', 'border-gray-200'
    );

    if (step === currentId) {
      // estado ativo: quadro com borda azul e leve realce
      link.classList.add('bg-white', 'text-blue-700', 'border-blue-500', 'ring-2', 'ring-blue-500', 'ring-offset-1');
      link.setAttribute('aria-current', 'page');
    } else {
      // estado padrão
      link.classList.add('bg-gray-50', 'text-gray-700', 'border-gray-200');
      link.removeAttribute('aria-current');
    }
  });
}

function centerActiveMobileNav(currentId) {
  const containers = document.querySelectorAll('.overflow-x-auto');
  containers.forEach((container) => {
    const nav = container.querySelector('nav');
    if (!nav) return;
    const active = nav.querySelector(`[data-step-link="${currentId}"]`);
    if (!active) return;
    const target = active.offsetLeft - (container.clientWidth - active.clientWidth) / 2;
    const maxScroll = Math.max(0, nav.scrollWidth - container.clientWidth);
    container.scrollLeft = Math.max(0, Math.min(target, maxScroll));
  });
}

function initWizard(currentId) {
  currentStepId = currentId;
  const total = steps.length;
  const current = steps.find((s) => s.id === currentId);
  if (!current) return;

  const stepCountEl = document.getElementById('stepCount');
  const phaseLabelEl = document.getElementById('phaseLabel');
  const progressPercentEl = document.getElementById('progressPercent');
  const progressBarEl = document.getElementById('progressBar');
  // elementos mobile (quando presentes)
  const stepCountMobileEl = document.getElementById('stepCountMobile');
  const phaseLabelMobileEl = document.getElementById('phaseLabelMobile');
  const progressPercentMobileEl = document.getElementById('progressPercentMobile');
  const progressBarMobileEl = document.getElementById('progressBarMobile');
  const form = document.getElementById('balancoForm');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  const percent = Math.round((currentId / total) * 100);
  if (stepCountEl) stepCountEl.textContent = `Passo ${currentId} de ${total}`;
  if (phaseLabelEl) phaseLabelEl.textContent = current.phase;
  if (progressPercentEl) progressPercentEl.textContent = `${percent}%`;
  if (progressBarEl) progressBarEl.style.width = `${percent}%`;
  if (stepCountMobileEl) stepCountMobileEl.textContent = `Passo ${currentId} de ${total}`;
  if (phaseLabelMobileEl) phaseLabelMobileEl.textContent = current.phase;
  if (progressPercentMobileEl) progressPercentMobileEl.textContent = `${percent}%`;
  if (progressBarMobileEl) progressBarMobileEl.style.width = `${percent}%`;

  highlightTabs(currentId);
  // garantir que o ícone ativo esteja visível/centralizado no cabeçalho mobile
  centerActiveMobileNav(currentId);
  setTimeout(() => centerActiveMobileNav(currentId), 60);
  // coletar título da página
  const meta = ensureMeta();
  const pageTitleEl = document.querySelector('h2');
  if (pageTitleEl) {
    meta.pageTitles[currentId] = pageTitleEl.textContent.trim();
    setMeta(meta);
  }
  restoreFormData(form);
  wireFormPersistence(form);

  if (prevBtn) {
    prevBtn.disabled = currentId === 1;
    prevBtn.onclick = () => {
      saveFormData(form);
      if (currentId > 1) {
        window.location.href = steps[currentId - 2].file;
      }
    };
  }

  if (nextBtn) {
    nextBtn.disabled = currentId === total;
    nextBtn.textContent = currentId === total ? 'Finalizado' : 'Próximo';
    nextBtn.onclick = () => {
      saveFormData(form);
      if (currentId < total) {
        window.location.href = steps[currentId].file;
      }
    };
  }

  const downloadBtn = document.getElementById('downloadBtn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', async () => {
      // garantir que o estado atual do formulário seja salvo
      const form = document.getElementById('balancoForm');
      saveFormData(form);

      // limpar "cache" de versões antigas: manter apenas chaves presentes em meta atual
      const meta = ensureMeta();
      const dataRaw = getStorageData();
      const allowed = new Set(Object.keys(meta.fields || {}));
      const data = {};
      allowed.forEach((k) => { if (k in dataRaw) data[k] = dataRaw[k]; });
      setStorageData(data);

      // preparar PDF
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      const marginX = 15;
      const width = 180;
      let y = 16;

      // carregar logo como dataURL
      async function loadImageAsDataUrl(url) {
        try {
          const res = await fetch(url);
          const blob = await res.blob();
          return await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
        } catch (_) {
          return null;
        }
      }

      const logoUrl = 'assets/FechadoBalan%C3%A7oLogo.png';
      const logoDataUrl = await loadImageAsDataUrl(logoUrl);
      if (logoDataUrl) {
        // cabeçalho com logo
        doc.addImage(logoDataUrl, 'PNG', marginX, 8, 18, 18);
        doc.setFontSize(16);
        doc.setTextColor(33, 33, 33);
        doc.text('Fechado para Balanço – Resumo', marginX + 22, 16);
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('Gerado automaticamente a partir das respostas do seu balanço.', marginX + 22, 22);
        // mais espaçamento abaixo do cabeçalho
        y = 36;
      } else {
        // fallback sem logo
        doc.setFontSize(18);
        doc.setTextColor(33, 33, 33);
        doc.text('Fechado para Balanço – Resumo', marginX, y);
        y += 8;
        doc.setFontSize(11);
        doc.setTextColor(100, 100, 100);
        doc.text('Gerado automaticamente a partir das respostas do seu balanço.', marginX, y);
        // mais espaçamento abaixo do cabeçalho
        y += 16;
      }

      function addStepHeader(text) {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFillColor(67, 56, 202); // indigo-700
        doc.setDrawColor(67, 56, 202);
        doc.rect(marginX - 2, y - 6, width + 4, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(13);
        doc.text(text, marginX, y);
        doc.setTextColor(33, 33, 33);
        y += 10;
      }

      function addSectionHeader(text) {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFontSize(12);
        doc.setTextColor(79, 70, 229); // indigo-600
        doc.text(text, marginX, y);
        doc.setTextColor(33, 33, 33);
        y += 6;
      }

      function addBullet(text) {
        const lines = doc.splitTextToSize(text, width - 6);
        lines.forEach((line, idx) => {
          if (y > 280) { doc.addPage(); y = 20; }
          const prefix = idx === 0 ? '• ' : '  ';
          doc.text(prefix + line, marginX, y);
          y += 6;
        });
      }

      function addQA(label, value) {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFontSize(11);
        doc.setTextColor(79, 70, 229); // indigo-600 for label
        doc.text(label, marginX, y);
        y += 6;
        doc.setTextColor(33, 33, 33); // reset color for value
        const valueLines = doc.splitTextToSize(String(value), width);
        valueLines.forEach((line) => {
          if (y > 280) { doc.addPage(); y = 20; }
          doc.text(line, marginX, y);
          y += 6;
        });
        y += 4;
      }

      steps.forEach((s) => {
        const fields = Object.entries(meta.fields || {}).filter(([name, info]) => info.stepId === s.id);
        const answered = fields.filter(([name]) => {
          const val = data[name];
          if (val === undefined || val === null) return false;
          if (typeof val === 'boolean') return val === true;
          return String(val).trim() !== '';
        });
        if (answered.length === 0) return;

        const headerText = meta.pageTitles?.[s.id] || `Etapa ${s.id} – ${s.label}`;
        addStepHeader(headerText);

        // Etapa 8: sem frase adicional de contextualização conforme solicitado

        const bySection = {};
        answered.forEach(([name, info]) => {
          const section = (info.section || 'Itens');
          bySection[section] = bySection[section] || [];
          bySection[section].push({ name, info });
        });

        Object.entries(bySection).forEach(([sectionName, items]) => {
          addSectionHeader(sectionName);
          items.forEach(({ name, info }) => {
            const val = data[name];
            if (typeof val === 'boolean') {
              addBullet(info.label);
            } else {
              addQA(info.label, val);
            }
          });
          y += 2;
        });
        y += 4;
      });

      doc.save('balanco_resumo.pdf');
    });
  }
}
