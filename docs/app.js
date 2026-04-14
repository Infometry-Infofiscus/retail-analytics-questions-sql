/**
 * Retail Analytics Text-to-SQL Dataset
 * Submission Form — app.js
 */

(function () {
  'use strict';

  // ── DOM References ──────────────────────────────────────────

  const form           = document.getElementById('submission-form');
  const submitBtn      = document.getElementById('submit-btn');
  const resetBtn       = document.getElementById('reset-btn');
  const copyBtn        = document.getElementById('copy-btn');
  const successBanner  = document.getElementById('success-banner');
  const outputSection  = document.getElementById('output-section');
  const jsonOutput     = document.getElementById('json-output');

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
    const submission = {
      question:       fields.question.value.trim(),
      context:        fields.context.value.trim(),
      business_logic: fields.business_logic.value.trim(),
      tables_used:    getSelectedTables(),
      sql:            fields.sql.value.trim() || null,
    };

    // Remove null sql field if empty
    if (!submission.sql) {
      delete submission.sql;
      submission.sql = '';
    }

    return submission;
  }

  function formatJSON(obj) {
    return JSON.stringify(obj, null, 2);
  }

  // ── Syntax Highlighting (lightweight) ───────────────────────

  function highlightJSON(jsonString) {
    return jsonString
      .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, match => {
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            return `<span style="color:#7eb8e0">${match}</span>`;
          }
          return `<span style="color:#b5ddb5">${match}</span>`;
        }
        if (/true|false/.test(match)) {
          return `<span style="color:#e8c547">${match}</span>`;
        }
        if (/null/.test(match)) {
          return `<span style="color:#888">${match}</span>`;
        }
        return `<span style="color:#d4a5f5">${match}</span>`;
      });
  }

  // ── Form Submit ─────────────────────────────────────────────

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    if (!validate()) {
      // Scroll to first error
      const firstError = document.querySelector('.field-error.visible');
      if (firstError) {
        firstError.closest('.field-group').scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    const submission = buildSubmission();
    const formatted  = formatJSON(submission);

    // Show output
    jsonOutput.innerHTML = highlightJSON(formatted);
    outputSection.classList.remove('hidden');
    successBanner.classList.remove('hidden');

    // Scroll to output
    setTimeout(() => {
      outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    // Store raw JSON for copying
    jsonOutput.dataset.raw = formatted;
  });

  // ── Copy to Clipboard ────────────────────────────────────────

  copyBtn.addEventListener('click', function () {
    const raw = jsonOutput.dataset.raw;
    if (!raw) return;

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(raw).then(() => {
        showCopied();
      }).catch(() => {
        fallbackCopy(raw);
      });
    } else {
      fallbackCopy(raw);
    }
  });

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showCopied();
    } catch (err) {
      console.error('Copy failed:', err);
    }
    document.body.removeChild(ta);
  }

  function showCopied() {
    copyBtn.textContent = '✓ Copied!';
    copyBtn.classList.add('copied');
    setTimeout(() => {
      copyBtn.textContent = 'Copy to Clipboard';
      copyBtn.classList.remove('copied');
    }, 2500);
  }

  // ── Reset ────────────────────────────────────────────────────

  resetBtn.addEventListener('click', function () {
    form.reset();
    clearErrors();
    outputSection.classList.add('hidden');
    successBanner.classList.add('hidden');
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
      // Clear table error if at least one is checked
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
