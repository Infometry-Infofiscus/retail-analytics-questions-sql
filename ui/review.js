/**
 * Retail Analytics Text-to-SQL Dataset
 * Admin Review Dashboard — review.js
 *
 * Lets the maintainer:
 *  1. Load pending submissions from GitHub via the Contents API
 *  2. Preview the full JSON
 *  3. Move a file to submissions/reviewed/ (approve) or submissions/rejected/
 */

(function () {
  'use strict';

  const GITHUB_OWNER  = 'Infometry-Infofiscus';
  const GITHUB_REPO   = 'retail-analytics-questions-sql';
  const GITHUB_BRANCH = 'main';

  let TOKEN       = '';
  let currentTab  = 'pending';

  // Cached file lists (avoid re-fetching when switching tabs mid-session)
  const cache = { pending: null, reviewed: null, rejected: null };

  // ── DOM ────────────────────────────────────────────────────────

  const loginScreen  = document.getElementById('login-screen');
  const dashboard    = document.getElementById('dashboard');
  const patInput     = document.getElementById('pat-input');
  const patToggle    = document.getElementById('pat-toggle');
  const loginBtn     = document.getElementById('login-btn');
  const loginError   = document.getElementById('login-error');
  const logoutBtn    = document.getElementById('logout-btn');
  const refreshBtn   = document.getElementById('refresh-btn');

  const dashLoading  = document.getElementById('dash-loading');
  const dashEmpty    = document.getElementById('dash-empty');
  const dashErrMsg   = document.getElementById('dash-error-msg');
  const dashErrText  = document.getElementById('dash-error-text');
  const subList      = document.getElementById('submission-list');

  const statPending  = document.getElementById('stat-pending');
  const statReviewed = document.getElementById('stat-reviewed');
  const statRejected = document.getElementById('stat-rejected');

  const modalOverlay = document.getElementById('modal-overlay');
  const modalTitle   = document.getElementById('modal-title');
  const modalMeta    = document.getElementById('modal-meta');
  const modalJSON    = document.getElementById('modal-json');
  const modalFooter  = document.getElementById('modal-footer');
  const modalClose   = document.getElementById('modal-close');

  // ── GitHub API helpers ─────────────────────────────────────────

  function ghHeaders() {
    return {
      'Authorization':        `Bearer ${TOKEN}`,
      'Accept':               'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
  }

  async function listFolder(folder) {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/submissions/${folder}?ref=${GITHUB_BRANCH}`;
    const res = await fetch(url, { headers: ghHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    const items = await res.json();
    // Filter out .gitkeep
    return items.filter(f => f.type === 'file' && !f.name.startsWith('.gitkeep'));
  }

  async function getFileContent(path) {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}?ref=${GITHUB_BRANCH}`;
    const res = await fetch(url, { headers: ghHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json(); // { content (base64), sha, ... }
  }

  async function deleteFile(path, sha, commitMsg) {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { ...ghHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: commitMsg, sha, branch: GITHUB_BRANCH }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
  }

  async function createFile(path, content, sha, commitMsg) {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;
    const body = { message: commitMsg, content, branch: GITHUB_BRANCH };
    const res = await fetch(url, {
      method: 'PUT',
      headers: { ...ghHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
  }

  // Move = create in target + delete from source (GitHub has no rename API)
  async function moveFile(filename, fromFolder, toFolder, label) {
    const srcPath = `submissions/${fromFolder}/${filename}`;
    const dstPath = `submissions/${toFolder}/${filename}`;

    // 1. Get source file (need sha + content)
    const file = await getFileContent(srcPath);
    const content = file.content.replace(/\n/g, ''); // strip line breaks from base64

    // 2. Create in destination
    await createFile(
      dstPath,
      content,
      undefined,
      `review: move ${filename} → ${toFolder} (${label})`
    );

    // 3. Delete from source
    await deleteFile(srcPath, file.sha, `review: remove ${filename} from ${fromFolder}`);
  }

  // ── Auth / Login ──────────────────────────────────────────────

  patToggle.addEventListener('click', () => {
    const isPassword = patInput.type === 'password';
    patInput.type    = isPassword ? 'text' : 'password';
    patToggle.textContent = isPassword ? '🙈' : '👁';
  });

  loginBtn.addEventListener('click', async () => {
    TOKEN = patInput.value.trim();
    if (!TOKEN) {
      showLoginError('Please enter your GitHub PAT.');
      return;
    }

    loginBtn.disabled = true;
    loginBtn.querySelector('.btn-text').textContent = 'Verifying…';
    loginError.classList.add('hidden');

    try {
      // Quick auth check: fetch repo info
      const res = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`,
        { headers: ghHeaders() }
      );
      if (!res.ok) throw new Error('Invalid token or no access to repository.');

      loginScreen.classList.add('hidden');
      dashboard.classList.remove('hidden');
      loadTab('pending');
    } catch (e) {
      showLoginError(e.message);
      loginBtn.disabled = false;
      loginBtn.querySelector('.btn-text').textContent = 'Load Submissions';
    }
  });

  patInput.addEventListener('keydown', e => { if (e.key === 'Enter') loginBtn.click(); });

  function showLoginError(msg) {
    loginError.textContent = msg;
    loginError.classList.remove('hidden');
  }

  logoutBtn.addEventListener('click', () => {
    TOKEN = '';
    Object.keys(cache).forEach(k => cache[k] = null);
    loginScreen.classList.remove('hidden');
    dashboard.classList.add('hidden');
    patInput.value = '';
  });

  // ── Tabs ──────────────────────────────────────────────────────

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('tab-active'));
      btn.classList.add('tab-active');
      currentTab = btn.dataset.tab;
      loadTab(currentTab);
    });
  });

  refreshBtn.addEventListener('click', () => {
    cache[currentTab] = null; // invalidate cache for this tab
    loadTab(currentTab);
    // Also refresh stats
    refreshStats();
  });

  // ── Load a tab ────────────────────────────────────────────────

  async function loadTab(tab) {
    subList.innerHTML = '';
    dashEmpty.classList.add('hidden');
    dashErrMsg.classList.add('hidden');
    dashLoading.classList.remove('hidden');

    try {
      let files = cache[tab];
      if (!files) {
        files = await listFolder(tab);
        cache[tab] = files;
      }

      dashLoading.classList.add('hidden');

      if (files.length === 0) {
        dashEmpty.classList.remove('hidden');
        return;
      }

      renderList(files, tab);
      updateStats();
    } catch (e) {
      dashLoading.classList.add('hidden');
      dashErrText.textContent = e.message;
      dashErrMsg.classList.remove('hidden');
    }
  }

  // ── Render card list ──────────────────────────────────────────

  function renderList(files, tab) {
    subList.innerHTML = '';
    files.forEach(file => {
      const card = document.createElement('div');
      card.className = 'sub-card';
      card.dataset.filename = file.name;
      card.dataset.tab      = tab;

      const nameSlug = file.name.replace(/^retail_/, '').replace(/_\d+\.json$/, '').replace(/_/g, ' ');

      card.innerHTML = `
        <div class="sub-card-left">
          <div class="sub-card-icon">${tabIcon(tab)}</div>
        </div>
        <div class="sub-card-body">
          <div class="sub-card-name">${file.name}</div>
          <div class="sub-card-slug">${nameSlug}</div>
        </div>
        <div class="sub-card-actions">
          <button class="btn btn-sm btn-view" data-filename="${file.name}" data-path="${file.path}" data-tab="${tab}">
            👁 View
          </button>
          ${tab === 'pending' ? `
            <button class="btn btn-sm btn-approve" data-filename="${file.name}" data-tab="${tab}">
              ✅ Approve
            </button>
            <button class="btn btn-sm btn-reject" data-filename="${file.name}" data-tab="${tab}">
              ❌ Reject
            </button>
          ` : ''}
          ${tab === 'reviewed' ? `
            <button class="btn btn-sm btn-reject" data-filename="${file.name}" data-tab="${tab}">
              ❌ Move to Rejected
            </button>
          ` : ''}
          ${tab === 'rejected' ? `
            <button class="btn btn-sm btn-approve" data-filename="${file.name}" data-tab="${tab}">
              ✅ Move to Reviewed
            </button>
          ` : ''}
        </div>
      `;

      subList.appendChild(card);
    });

    // Delegate events
    subList.querySelectorAll('.btn-view').forEach(btn => {
      btn.addEventListener('click', () => openModal(btn.dataset.filename, btn.dataset.path, btn.dataset.tab));
    });
    subList.querySelectorAll('.btn-approve').forEach(btn => {
      btn.addEventListener('click', () => doMove(btn, btn.dataset.filename, btn.dataset.tab, 'reviewed'));
    });
    subList.querySelectorAll('.btn-reject').forEach(btn => {
      btn.addEventListener('click', () => doMove(btn, btn.dataset.filename, btn.dataset.tab, 'rejected'));
    });
  }

  function tabIcon(tab) {
    return { pending: '⏳', reviewed: '✅', rejected: '❌' }[tab] || '📄';
  }

  // ── Move action ───────────────────────────────────────────────

  async function doMove(btn, filename, fromTab, toTab) {
    const card = btn.closest('.sub-card');
    const allBtns = card.querySelectorAll('.btn');
    allBtns.forEach(b => b.disabled = true);
    btn.textContent = '⏳ Moving…';

    try {
      await moveFile(filename, fromTab, toTab, toTab === 'reviewed' ? 'approved' : 'rejected');

      // Update cache
      if (cache[fromTab]) cache[fromTab] = cache[fromTab].filter(f => f.name !== filename);
      cache[toTab] = null; // invalidate destination

      // Remove card with animation
      card.classList.add('sub-card--removed');
      setTimeout(() => {
        card.remove();
        if (subList.children.length === 0) dashEmpty.classList.remove('hidden');
        updateStats();
      }, 400);
    } catch (e) {
      allBtns.forEach(b => b.disabled = false);
      btn.textContent = '⚠ Retry';
      showToast(`Error: ${e.message}`, 'error');
    }
  }

  // ── Modal ─────────────────────────────────────────────────────

  async function openModal(filename, path, tab) {
    modalTitle.textContent = filename;
    modalMeta.textContent  = '';
    modalJSON.textContent  = 'Loading…';
    modalFooter.innerHTML  = '';
    modalOverlay.classList.remove('hidden');

    try {
      const file   = await getFileContent(path);
      const raw    = decodeURIComponent(escape(atob(file.content.replace(/\n/g, ''))));
      const parsed = JSON.parse(raw);

      modalMeta.innerHTML = `
        <span class="meta-pill">📁 ${tab}</span>
        <span class="meta-pill">📅 ${parsed.submitted_at ? new Date(parsed.submitted_at).toLocaleString() : 'unknown date'}</span>
        <span class="meta-pill">📊 ${(parsed.tables_used || []).join(', ')}</span>
      `;
      modalJSON.innerHTML = highlightJSON(JSON.stringify(parsed, null, 2));

      if (tab === 'pending') {
        modalFooter.innerHTML = `
          <button id="modal-approve" class="btn btn-primary btn-approve">✅ Approve → Reviewed</button>
          <button id="modal-reject"  class="btn btn-secondary btn-reject">❌ Reject</button>
        `;
        document.getElementById('modal-approve').addEventListener('click', async () => {
          closeModal();
          const card = subList.querySelector(`[data-filename="${filename}"]`);
          const btn  = card ? card.querySelector('.btn-approve') : document.createElement('button');
          await doMove(btn, filename, tab, 'reviewed');
        });
        document.getElementById('modal-reject').addEventListener('click', async () => {
          closeModal();
          const card = subList.querySelector(`[data-filename="${filename}"]`);
          const btn  = card ? card.querySelector('.btn-reject') : document.createElement('button');
          await doMove(btn, filename, tab, 'rejected');
        });
      } else if (tab === 'reviewed') {
        modalFooter.innerHTML = `<button id="modal-reject" class="btn btn-secondary btn-reject">❌ Move to Rejected</button>`;
        document.getElementById('modal-reject').addEventListener('click', async () => {
          closeModal();
          const card = subList.querySelector(`[data-filename="${filename}"]`);
          const btn  = card ? card.querySelector('.btn-reject') : document.createElement('button');
          await doMove(btn, filename, tab, 'rejected');
        });
      } else if (tab === 'rejected') {
        modalFooter.innerHTML = `<button id="modal-approve" class="btn btn-primary btn-approve">✅ Move to Reviewed</button>`;
        document.getElementById('modal-approve').addEventListener('click', async () => {
          closeModal();
          const card = subList.querySelector(`[data-filename="${filename}"]`);
          const btn  = card ? card.querySelector('.btn-approve') : document.createElement('button');
          await doMove(btn, filename, tab, 'reviewed');
        });
      }
    } catch (e) {
      modalJSON.textContent = `Error loading file: ${e.message}`;
    }
  }

  modalClose.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  function closeModal() {
    modalOverlay.classList.add('hidden');
  }

  // ── Stats ─────────────────────────────────────────────────────

  async function refreshStats() {
    try {
      const [p, r, rej] = await Promise.all([
        listFolder('pending'),
        listFolder('reviewed'),
        listFolder('rejected'),
      ]);
      cache.pending  = p;
      cache.reviewed = r;
      cache.rejected = rej;
      updateStats();
    } catch (_) {}
  }

  function updateStats() {
    const pCount   = cache.pending  ? cache.pending.length  : '?';
    const rCount   = cache.reviewed ? cache.reviewed.length : '?';
    const rejCount = cache.rejected ? cache.rejected.length : '?';
    statPending.textContent  = `⏳ ${pCount} Pending`;
    statReviewed.textContent = `✅ ${rCount} Reviewed`;
    statRejected.textContent = `❌ ${rejCount} Rejected`;
  }

  // ── Syntax highlight ──────────────────────────────────────────

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

  // ── Toast notification ────────────────────────────────────────

  function showToast(msg, type = 'info') {
    const t = document.createElement('div');
    t.className = `toast toast--${type}`;
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add('toast--visible'));
    setTimeout(() => {
      t.classList.remove('toast--visible');
      setTimeout(() => t.remove(), 300);
    }, 3500);
  }

})();
