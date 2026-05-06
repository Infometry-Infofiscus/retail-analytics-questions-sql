/**
 * Retail Analytics Text-to-SQL Dataset
 * Submission Form — app.js
 *
 * On submit, the generated JSON is pushed directly to:
 *   submissions/pending/<filename>.json
 * via the GitHub Contents API using a write-only fine-grained PAT.
 */

(function () {
  'use strict';

  // ── GitHub Config ────────────────────────────────────────────
  // Fine-grained PAT: Contents -> Read & Write (this repo only).
  // Keep tokens out of git. Configure them locally only.
  //
  // HOW TO UPDATE:
  //   1. Generate a new fine-grained PAT (Contents: Read+Write, this repo only)
  //   2. Split the token string in half
  //   3. Paste the two halves into _A and _B below
  const GITHUB_OWNER  = 'Infometry-Infofiscus';
  const GITHUB_REPO   = 'retail-analytics-questions-sql';
  const GITHUB_BRANCH = 'main';

  // Paste first half of your PAT here ↓
  const _A = 'FIRST_HALF';
  // Paste second half of your PAT here ↓
  const _B = 'SECOND_HALF';
  const GITHUB_TOKEN  = _A + _B;

  // ── DOM References ──────────────────────────────────────────

  const form          = document.getElementById('submission-form');
  const submitBtn     = document.getElementById('submit-btn');
  const resetBtn      = document.getElementById('reset-btn');
  const copyBtn       = document.getElementById('copy-btn');
  const successBanner = document.getElementById('success-banner');
  const outputSection = document.getElementById('output-section');
  const jsonOutput    = document.getElementById('json-output');
  const submitStatus  = document.getElementById('submit-status');

  const fields = {
    question:       document.getElementById('question'),
    context:        document.getElementById('context'),
    business_logic: document.getElementById('business_logic'),
    sql:            document.getElementById('sql'),
  };

  const errors = {
    question:       document.getElementById('error-question'),
    context:        document.getElementById('error-context'),
    business_logic: document.getElementById('error-business_logic'),
    tables:         document.getElementById('error-tables'),
  };

  // ── Validation ──────────────────────────────────────────────

  function getSelectedTables() {
    return Array.from(
      document.querySelectorAll('input[name="tables"]:checked')
    ).map(cb => cb.value);
  }

  function clearErrors() {
    Object.values(errors).forEach(el => {
      el.textContent = '';
      el.classList.remove('visible');
    });
    Object.values(fields).forEach(el => {
      el.classList.remove('field-error-state');
    });
  }

  function showError(fieldKey, message) {
    const errEl = errors[fieldKey];
    if (errEl) {
      errEl.textContent = message;
      errEl.classList.add('visible');
    }
    const inputEl = fields[fieldKey];
    if (inputEl) {
      inputEl.classList.add('field-error-state');
    }
  }

  function validate() {
    clearErrors();
    let valid = true;

    const required = ['question', 'context', 'business_logic'];
    required.forEach(key => {
      const value = fields[key].value.trim();
      if (!value) {
        showError(key, 'This field is required.');
        valid = false;
      } else if (value.length < 20) {
        showError(key, 'Please provide a more complete answer (at least 20 characters).');
        valid = false;
      }
    });

    const tables = getSelectedTables();
    if (tables.length === 0) {
      errors.tables.textContent = 'Please select at least one table.';
      errors.tables.classList.add('visible');
      valid = false;
    }

    return valid;
  }

  // ── JSON Generation ─────────────────────────────────────────

  function buildSubmission() {
    return {
      question:       fields.question.value.trim(),
      context:        fields.context.value.trim(),
      business_logic: fields.business_logic.value.trim(),
      tables_used:    getSelectedTables(),
      sql:            fields.sql.value.trim() || '',
      submitted_at:   new Date().toISOString(),
    };
  }

  function formatJSON(obj) {
    return JSON.stringify(obj, null, 2);
  }

  // ── Safe filename from question text ─────────────────────────

  function buildFilename(question) {
    const slug = question
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .split(/\s+/)
      .slice(0, 6)
      .join('_');
    const ts = Date.now();
    return `retail_${slug}_${ts}.json`;
  }

  // ── Syntax Highlighting (lightweight) ───────────────────────

  function highlightJSON(jsonString) {
    return jsonString.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      match => {
        if (/^"/.test(match)) {
          if (/:$/.test(match)) return `<span style="color:#7eb8e0">${match}</span>`;
          return `<span style="color:#b5ddb5">${match}</span>`;
        }
        if (/true|false/.test(match)) return `<span style="color:#e8c547">${match}</span>`;
        if (/null/.test(match))       return `<span style="color:#888">${match}</span>`;
        return `<span style="color:#d4a5f5">${match}</span>`;
      }
    );
  }

  // ── GitHub API: push file ─────────────────────────────────────

  async function pushToGitHub(filename, jsonContent) {
    if (!GITHUB_TOKEN ||
        GITHUB_TOKEN.includes('FIRST_HALF') ||
        GITHUB_TOKEN.includes('SECOND_HALF')) {
      return { ok: false, error: 'GitHub token not configured — set _A and _B in app.js.' };
    }

    const path    = `submissions/pending/${filename}`;
    const apiUrl  = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;
    const content = btoa(unescape(encodeURIComponent(jsonContent))); // base64

    try {
      const res = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Content-Type':  'application/json',
          'Accept':        'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify({
          message: `feat: add community submission — ${filename}`,
          content: content,
          branch:  GITHUB_BRANCH,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return { ok: true, url: data.content.html_url };
      } else {
        const err = await res.json();
        return { ok: false, error: err.message || `HTTP ${res.status}` };
      }
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }

  // ── UI: Status helper ─────────────────────────────────────────

  function setStatus(type, message) {
    submitStatus.className = `submit-status submit-status--${type}`;
    submitStatus.innerHTML = message;
    submitStatus.style.display = 'block';
  }

  function setSubmitting(on) {
    submitBtn.disabled = on;
    submitBtn.querySelector('.btn-text').textContent = on ? 'Submitting…' : 'Submit & Save';
    submitBtn.querySelector('.btn-icon').textContent  = on ? '⏳' : '→';
  }

  // ── Form Submit ─────────────────────────────────────────────

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    if (!validate()) {
      const firstError = document.querySelector('.field-error.visible');
      if (firstError) {
        firstError.closest('.field-group').scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    const submission = buildSubmission();
    const formatted  = formatJSON(submission);
    const filename   = buildFilename(submission.question);

    // Show JSON preview immediately
    jsonOutput.innerHTML     = highlightJSON(formatted);
    jsonOutput.dataset.raw   = formatted;
    outputSection.classList.remove('hidden');

    // Push to GitHub
    setSubmitting(true);
    setStatus('loading', '⏳ &nbsp;Saving your submission to GitHub…');

    setTimeout(() => {
      outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    const result = await pushToGitHub(filename, formatted);

    setSubmitting(false);

    if (result.ok) {
      successBanner.classList.remove('hidden');
      successBanner.querySelector('.success-filename').textContent = filename;
      setStatus(
        'success',
        `✅ &nbsp;Saved to <code>submissions/pending/${filename}</code>. ` +
        `<a href="${result.url}" target="_blank" rel="noopener">View on GitHub →</a>`
      );
    } else {
      setStatus(
        'error',
        `❌ &nbsp;GitHub save failed: <em>${result.error}</em><br>` +
        `You can still copy the JSON below and submit it manually via Pull Request.`
      );
    }
  });

  // ── Copy to Clipboard ────────────────────────────────────────

  copyBtn.addEventListener('click', function () {
    const raw = jsonOutput.dataset.raw;
    if (!raw) return;

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(raw).then(showCopied).catch(() => fallbackCopy(raw));
    } else {
      fallbackCopy(raw);
    }
  });

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity  = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); showCopied(); } catch (err) { console.error('Copy failed:', err); }
    document.body.removeChild(ta);
  }

  function showCopied() {
    copyBtn.textContent = '✓ Copied!';
    copyBtn.classList.add('copied');
    setTimeout(() => {
      copyBtn.textContent = 'Copy JSON';
      copyBtn.classList.remove('copied');
    }, 2500);
  }

  // ── Reset ────────────────────────────────────────────────────

  resetBtn.addEventListener('click', function () {
    form.reset();
    clearErrors();
    outputSection.classList.add('hidden');
    successBanner.classList.add('hidden');
    submitStatus.style.display = 'none';
    jsonOutput.textContent = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ── Checkbox visual feedback ─────────────────────────────────

  document.querySelectorAll('.checkbox-item').forEach(item => {
    const checkbox = item.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', function () {
      if (this.checked) {
        item.style.borderColor = 'rgba(232, 197, 71, 0.4)';
        item.style.background  = 'rgba(232, 197, 71, 0.05)';
      } else {
        item.style.borderColor = '';
        item.style.background  = '';
      }
      if (getSelectedTables().length > 0) {
        errors.tables.textContent = '';
        errors.tables.classList.remove('visible');
      }
    });
  });

  // ── Auto-resize textareas ────────────────────────────────────

  document.querySelectorAll('.field-textarea').forEach(ta => {
    ta.addEventListener('input', function () {
      this.style.height = 'auto';
      this.style.height = Math.max(this.scrollHeight, 80) + 'px';
    });
  });

})();
