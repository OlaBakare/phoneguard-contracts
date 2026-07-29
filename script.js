(function applyInitialTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark' || savedTheme === 'light') {
    document.documentElement.setAttribute('data-theme', savedTheme);
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();

function setupThemeToggle() {
  const toggleBtn = document.getElementById('themeToggle');
  if (!toggleBtn) return;

  function updateToggleUI() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const isDark = currentTheme === 'dark';
    toggleBtn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    toggleBtn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    const textSpan = toggleBtn.querySelector('.theme-toggle-text');
    if (textSpan) {
      textSpan.textContent = isDark ? 'Light' : 'Dark';
    }
  }

  updateToggleUI();

  toggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
    updateToggleUI();
  });

  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        const osTheme = e.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', osTheme);
        updateToggleUI();
      }
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupThemeToggle);
} else {
  setupThemeToggle();
}

function formatMessage(title, message) {
  return `<strong>${title}</strong><p>${message}</p>`;
}

function isValidIMEI(value) {
  return /^\d{15}$/.test(value.trim());
}

async function setupWeb3Forms() {
  const trackForm = document.getElementById('trackForm');
  const checkForm = document.getElementById('checkForm');
  const trackResult = document.getElementById('trackResult');
  const checkResult = document.getElementById('checkResult');

  if (!trackForm && !checkForm) return;

  const isWeb3Ready = typeof PhoneGuardWeb3 !== 'undefined' && typeof ethers !== 'undefined';

  if (trackForm && trackResult) {
    trackForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const imei = document.getElementById('track-imei').value;
      trackResult.classList.remove('hidden');
      if (!isValidIMEI(imei)) {
        trackResult.innerHTML = formatMessage('Invalid IMEI', 'Please enter a 15-digit IMEI number to continue.');
        return;
      }
      if (isWeb3Ready && PhoneGuardWeb3.isConnected()) {
        try {
          await PhoneGuardWeb3.reportStolen(imei);
          const result = await PhoneGuardWeb3.checkDevice(imei);
          const status = result[2] ? 'Stolen' : 'Clean';
          trackResult.innerHTML = formatMessage('On-chain report submitted',
            `IMEI ${imei} reported. On-chain status: <strong>${status}</strong>. Transaction recorded to the blockchain.`);
        } catch (err) {
          trackResult.innerHTML = formatMessage('Blockchain error', err.message || 'Could not submit to chain. Using offline mode.');
        }
      } else {
        trackResult.innerHTML = formatMessage('Tracking started', 'Your IMEI lookup is being processed. Connect a wallet to submit on-chain reports.');
      }
    });
  }

  if (checkForm && checkResult) {
    checkForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const imei = document.getElementById('check-imei').value;
      checkResult.classList.remove('hidden');
      if (!isValidIMEI(imei)) {
        checkResult.innerHTML = formatMessage('Invalid IMEI', 'Please enter a 15-digit IMEI number to continue.');
        return;
      }
      if (isWeb3Ready && PhoneGuardWeb3.isConnected()) {
        try {
          const result = await PhoneGuardWeb3.checkDevice(imei);
          if (result[0]) {
            const status = result[2] ? '🚨 Reported Stolen' : '✅ Clean';
            const owner = PhoneGuardWeb3.shortenAddr(result[1]);
            checkResult.innerHTML = formatMessage('On-chain verification',
              `IMEI ${imei} — Status: ${status}. Owner: ${owner}. Registered: ${new Date(Number(result[3]) * 1000).toLocaleDateString()}.`);
          } else {
            checkResult.innerHTML = formatMessage('Not on chain', 'This IMEI has not been registered on the blockchain. It may still be safe, but verify with the seller directly.');
          }
        } catch (err) {
          checkResult.innerHTML = formatMessage('Blockchain lookup error', err.message);
        }
      } else {
        checkResult.innerHTML = formatMessage('Status check complete', 'The device appears safe for review. Connect a wallet to verify on-chain.');
      }
    });
  }
}

async function setupWalletButton() {
  const btn = document.getElementById('walletConnect');
  if (!btn) return;

  function updateButton(account) {
    if (account) {
      btn.innerHTML = `${PhoneGuardWeb3.shortenAddr(account)}`;
      btn.classList.add('connected');
    } else {
      btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12H7M21 12l-4-4m4 4l-4 4"/></svg> Connect Wallet`;
      btn.classList.remove('connected');
    }
  }

  btn.addEventListener('click', async () => {
    if (PhoneGuardWeb3.isConnected()) return;
    try {
      const account = await PhoneGuardWeb3.connect();
      if (account) {
        updateButton(account);
      }
    } catch (err) {
      console.error('Wallet connection failed:', err);
    }
  });

  document.addEventListener('phoneguard-account-changed', (e) => {
    updateButton(e.detail.account);
  });

  if (PhoneGuardWeb3.isConnected()) {
    const account = await PhoneGuardWeb3.getAccount();
    updateButton(account);
  }
}

async function setupDashboardWeb3() {
  const walletInfoEl = document.getElementById('walletInfo');
  if (!walletInfoEl) return;
  if (PhoneGuardWeb3.isConnected()) {
    const account = await PhoneGuardWeb3.getAccount();
    walletInfoEl.textContent = `Connected: ${PhoneGuardWeb3.shortenAddr(account)}`;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    await setupWeb3Forms();
    await setupWalletButton();
    await setupDashboardWeb3();
  });
} else {
  (async () => {
    await setupWeb3Forms();
    await setupWalletButton();
    await setupDashboardWeb3();
  })();
}
