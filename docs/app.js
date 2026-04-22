/**
 * Retail Analytics Text-to-SQL Dataset
 * GitHub Pages Submission Form — app.js
 */

(function () {
  'use strict';

  // ── DOM References ───────────────────────────────────────────

  const form             = document.getElementById('submission-form');
  const resetBtn         = document.getElementById('reset-btn');
  const copyBtn          = document.getElementById('copy-btn');
  const downloadBtn      = document.getElementById('download-btn');
  const newSubmissionBtn = document.getElementById('new-submission-btn');
  const outputSection    = document.getElementById('output-section');
  const jsonOutput       = document.getElementById('json-output');
  const suggestedFilename = document.getElementById('suggested-filename');

  const fields = {
    question:       document.getElementById('question'),
    context:        document.getElementById('context'),
    business_logic: document.getElementById('business_logic'),
    sql:            document.getElementById('sql'),
  };

  const errorEls = {
    question:       document.getElementById('error-question'),
    context:        document.getElementById('error-context'),
    business_logic: document.getElementById('error-business_logic'),
    tables:         document.getElementById('error-tables'),
  };

  // Step elements
  const step1 = document.getElementById('step-1');
  const step2 = document.getElementById('step-2');
  const step3 = document.getElementById('step-3');
  const stepLine2 = document.getElementById('step-line-2');

  // ── Helpers ──────────────────────────────────────────────────

  let tables = [];

  const tableInput = document.getElementById("table-input");
  const addTableBtn = document.getElementById("add-table-btn");
  const tableList = document.getElementById("table-list");

  addTableBtn.addEventListener("click", addTable);

  tableInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      addTable();
    }
  });

  function addTable() {
    const value = tableInput.value.trim();

    if (!value) return;

    if (!tables.includes(value)) {
      tables.push(value);
      renderTables();
    }

    tableInput.value = "";
  }

  function renderTables() {
    tableList.innerHTML = "";

    tables.forEach((table, index) => {
      const tag = document.createElement("div");
      tag.className = "table-tag";

      tag.innerHTML = `
        <span>${table}</span>
        <span class="remove-btn" data-index="${index}">&times;</span>
      `;

      tableList.appendChild(tag);
    });

    // ✅ FIX: bind remove event INSIDE render
    document.querySelectorAll(".remove-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const index = e.target.getAttribute("data-index");
        tables.splice(index, 1);
        renderTables();
      });
    });
  }

  function clearErrors() {
    Object.values(errorEls).forEach(el => {
      el.textContent = '';
      el.classList.remove('visible');
    });
    Object.values(fields).forEach(el => el.classList.remove('field-error-state'));
  }

  function showError(key, msg) {
    if (errorEls[key]) {
      errorEls[key].textContent = msg;
      errorEls[key].classList.add('visible');
    }
    if (fields[key]) {
      fields[key].classList.add('field-error-state');
      fields[key].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // ── Validation ───────────────────────────────────────────────

  function validate() {
    clearErrors();
    let valid = true;

    ['question', 'context', 'business_logic'].forEach(key => {
      const val = fields[key].value.trim();
      if (!val) {
        if (valid) showError(key, 'This field is required.');
        valid = false;
      } else if (val.length < 20) {
        if (valid) showError(key, 'Please provide a bit more detail (at least 20 characters).');
        valid = false;
      }
    });

    if (tables.length === 0) {
	  errorEls.tables.textContent = 'Please add at least one table.';
	  errorEls.tables.classList.add('visible');
	  tableInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
	  valid = false;
	}

    return valid;
  }

  // ── Filename generation ──────────────────────────────────────

  function generateFilename(question) {
    // Extract 2-4 meaningful words from the question for the filename
    const stopWords = new Set([
      'the','a','an','is','are','was','were','be','been','being',
      'have','has','had','do','does','did','will','would','could',
      'should','may','might','shall','can','need','dare','ought',
      'which','what','who','how','when','where','why','that','this',
      'these','those','and','or','but','if','in','on','at','to',
      'for','of','with','by','from','up','about','into','through',
      'during','our','their','its','my','your','we','they','i','it'
    ]);

    const words = question
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w))
      .slice(0, 4);

    const slug = words.length > 0 ? words.join('_') : 'usecase';
    return `retail_${slug}.json`;
  }

  // ── JSON builder ─────────────────────────────────────────────

  function buildSubmission() {
    const sqlVal = fields.sql.value.trim();
    return {
      question:       fields.question.value.trim(),
      context:        fields.context.value.trim(),
      business_logic: fields.business_logic.value.trim(),
      tables_used:    tables,
      sql:            sqlVal || ''
    };
  }

  function formatJSON(obj) {
    return JSON.stringify(obj, null, 2);
  }

  // ── Syntax highlighting ──────────────────────────────────────

  function highlight(json) {
    return json
      .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, m => {
        if (/^"/.test(m)) {
          return /:$/.test(m)
            ? `<span style="color:#7eb8e0">${m}</span>`
            : `<span style="color:#b5ddb5">${m}</span>`;
        }
        if (/true|false/.test(m)) return `<span style="color:#e8c547">${m}</span>`;
        if (/null/.test(m))       return `<span style="color:#888">${m}</span>`;
        return `<span style="color:#d4a5f5">${m}</span>`;
      });
  }

  // ── Step progress ────────────────────────────────────────────

  function setStepDone(stepEl, lineEl) {
    stepEl.classList.remove('active');
    stepEl.classList.add('done');
    if (lineEl) lineEl.classList.add('done');
  }

  function activateStep(stepEl) {
    stepEl.classList.add('active');
  }

  // ── Form Submit ──────────────────────────────────────────────

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) return;

    const submission = buildSubmission();
    const formatted  = formatJSON(submission);
    const filename   = generateFilename(submission.question);

    // Render output
    jsonOutput.innerHTML = highlight(formatted);
    jsonOutput.dataset.raw = formatted;
    jsonOutput.dataset.filename = filename;
    suggestedFilename.textContent = filename;

    // Show output
    outputSection.classList.remove('hidden');

    // Update steps
    setStepDone(step1, null);
    activateStep(step2);

    // Scroll to output
    setTimeout(() => {
      outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  });

  // ── Copy ─────────────────────────────────────────────────────

  copyBtn.addEventListener('click', function () {
    const raw = jsonOutput.dataset.raw;
    if (!raw) return;

    const write = () => {
      copyBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copied!`;
      copyBtn.classList.add('copied');
      setTimeout(() => {
        copyBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy`;
        copyBtn.classList.remove('copied');
      }, 2200);
    };

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(raw).then(write).catch(() => fallbackCopy(raw, write));
    } else {
      fallbackCopy(raw, write);
    }
  });

  function fallbackCopy(text, cb) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); cb(); } catch (err) { console.error(err); }
    document.body.removeChild(ta);
  }

  // ── Download ─────────────────────────────────────────────────

  downloadBtn.addEventListener('click', function () {
    const raw      = jsonOutput.dataset.raw;
    const filename = jsonOutput.dataset.filename || 'retail_usecase.json';
    if (!raw) return;

    const blob = new Blob([raw], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Advance step
    setStepDone(step2, stepLine2);
    activateStep(step3);
  });

  // ── Reset / New submission ────────────────────────────────────

  function doReset() {
    form.reset();
    clearErrors();
    outputSection.classList.add('hidden');
    jsonOutput.textContent = '';
    jsonOutput.dataset.raw = '';

    // Reset checkboxes styling
    document.querySelectorAll('.checkbox-item').forEach(item => {
      item.style.borderColor = '';
      item.style.background  = '';
    });

    // Reset steps
    [step1, step2, step3].forEach(s => { s.classList.remove('done', 'active'); });
    step1.classList.add('active');
    document.querySelectorAll('.step-line').forEach(l => l.classList.remove('done'));

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  resetBtn.addEventListener('click', doReset);
  newSubmissionBtn.addEventListener('click', doReset);

  // ── Checkbox visual sync ──────────────────────────────────────

  document.querySelectorAll('.checkbox-item').forEach(item => {
    item.querySelector('input').addEventListener('change', function () {
      if (this.checked) {
        item.style.borderColor = 'rgba(232,197,71,.4)';
        item.style.background  = 'rgba(232,197,71,.04)';
      } else {
        item.style.borderColor = '';
        item.style.background  = '';
      }
      if (tables.length > 0) {
        errorEls.tables.textContent = '';
        errorEls.tables.classList.remove('visible');
      }
    });
  });

  // ── Auto-grow textareas ───────────────────────────────────────

  document.querySelectorAll('.field-textarea').forEach(ta => {
    ta.addEventListener('input', function () {
      this.style.height = 'auto';
      this.style.height = Math.max(this.scrollHeight, 72) + 'px';
    });
  });

})();
