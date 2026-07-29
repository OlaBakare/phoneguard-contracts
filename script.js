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
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
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

function setupHamburger() {
  const btn = document.getElementById('hamburgerBtn');
  const nav = document.getElementById('mobileNav');
  const backdrop = document.getElementById('mobileNavBackdrop');
  if (!btn || !nav) return;
  function open() {
    btn.classList.add('active');
    btn.setAttribute('aria-expanded', 'true');
    nav.classList.add('active');
    nav.setAttribute('aria-hidden', 'false');
    if (backdrop) backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    btn.classList.remove('active');
    btn.setAttribute('aria-expanded', 'false');
    nav.classList.remove('active');
    nav.setAttribute('aria-hidden', 'true');
    if (backdrop) backdrop.classList.remove('active');
    document.body.style.overflow = '';
  }
  btn.addEventListener('click', () => {
    const isOpen = btn.classList.contains('active');
    isOpen ? close() : open();
  });
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', close);
  });
  if (backdrop) backdrop.addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && btn.classList.contains('active')) close();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupHamburger);
} else {
  setupHamburger();
}

function formatMessage(title, message) {
  return `<strong>${title}</strong><p>${message}</p>`;
}

function isValidIMEI(value) {
  return /^\d{15}$/.test(value.trim());
}

const isWeb3Ready = () => typeof PhoneGuardWeb3 !== 'undefined' && typeof ethers !== 'undefined' && PhoneGuardWeb3.isConnected();

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
        await refreshWalletDisplay();
      }
    } catch (err) { console.error('Wallet connection failed:', err); }
  });
  document.addEventListener('phoneguard-account-changed', (e) => {
    updateButton(e.detail.account);
    refreshWalletDisplay();
  });
  if (PhoneGuardWeb3.isConnected()) {
    const account = await PhoneGuardWeb3.getAccount();
    updateButton(account);
  }
}

async function refreshWalletDisplay() {
  if (!isWeb3Ready()) return;
  try {
    const balance = await PhoneGuardWeb3.getBalance();
    const formatted = PhoneGuardWeb3.formatUnits(balance);
    const els = document.querySelectorAll('#walletBalanceDisplay, #dashBalance');
    els.forEach(el => { if (el) el.textContent = `${parseFloat(formatted).toFixed(4)} ETH`; });
  } catch (e) { /* noop */ }
}

async function setupMarketplaceForms() {
  const trackForm = document.getElementById('trackForm');
  const checkForm = document.getElementById('checkForm');
  const trackResult = document.getElementById('trackResult');
  const checkResult = document.getElementById('checkResult');

  if (trackForm && trackResult) {
    trackForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const imei = document.getElementById('track-imei').value;
      trackResult.classList.remove('hidden');
      if (!isValidIMEI(imei)) {
        trackResult.innerHTML = formatMessage('Invalid IMEI', 'Enter a 15-digit IMEI.');
        return;
      }
      if (isWeb3Ready()) {
        try {
          await PhoneGuardWeb3.reportStolen(imei);
          trackResult.innerHTML = formatMessage('Reported on chain', `IMEI ${imei} marked as stolen. Visible to all buyers, shops, and teams.`);
        } catch (err) {
          trackResult.innerHTML = formatMessage('Error', err.message || 'Could not submit.');
        }
      } else {
        trackResult.innerHTML = formatMessage('Connect wallet', 'Connect your wallet to report a stolen device on-chain.');
      }
    });
  }

  if (checkForm && checkResult) {
    checkForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const imei = document.getElementById('check-imei').value;
      checkResult.classList.remove('hidden');
      if (!isValidIMEI(imei)) {
        checkResult.innerHTML = formatMessage('Invalid IMEI', 'Enter a 15-digit IMEI.');
        return;
      }
      if (isWeb3Ready()) {
        try {
          const result = await PhoneGuardWeb3.checkDevice(imei);
          if (result[0]) {
            const status = result[2] ? 'Reported Stolen' : 'Clean';
            checkResult.innerHTML = formatMessage('On-chain result',
              `IMEI ${imei} — ${status}. Owner: ${PhoneGuardWeb3.shortenAddr(result[1])}. Registered: ${new Date(Number(result[3]) * 1000).toLocaleDateString()}.`);
          } else {
            checkResult.innerHTML = formatMessage('Not registered', 'This IMEI is not on the blockchain yet. Verify with the seller directly.');
          }
        } catch (err) {
          checkResult.innerHTML = formatMessage('Error', err.message);
        }
      } else {
        checkResult.innerHTML = formatMessage('Connect wallet', 'Connect your wallet to verify IMEI on-chain.');
      }
    });
  }
}

async function setupWalletActions() {
  const depositBtn = document.getElementById('depositBtn');
  const withdrawBtn = document.getElementById('withdrawBtn');
  const dashDepositBtn = document.getElementById('dashDepositBtn');
  const dashCheckBtn = document.getElementById('dashCheckBtn');
  const dashRegisterBtn = document.getElementById('dashRegisterBtn');
  const dashSellBtn = document.getElementById('dashSellBtn');

  if (depositBtn) {
    depositBtn.addEventListener('click', async () => {
      if (!isWeb3Ready()) return alert('Connect your wallet first.');
      const amt = prompt('Enter ETH amount to deposit:', '0.1');
      if (!amt || isNaN(amt) || Number(amt) <= 0) return;
      try {
        await PhoneGuardWeb3.deposit(PhoneGuardWeb3.parseUnits(amt));
        await refreshWalletDisplay();
        alert(`Deposited ${amt} ETH successfully.`);
      } catch (err) { alert('Deposit failed: ' + err.message); }
    });
  }

  if (withdrawBtn) {
    withdrawBtn.addEventListener('click', async () => {
      if (!isWeb3Ready()) return alert('Connect your wallet first.');
      const amt = prompt('Enter ETH amount to withdraw:', '0.05');
      if (!amt || isNaN(amt) || Number(amt) <= 0) return;
      try {
        await PhoneGuardWeb3.withdraw(PhoneGuardWeb3.parseUnits(amt));
        await refreshWalletDisplay();
        alert(`Withdrew ${amt} ETH successfully.`);
      } catch (err) { alert('Withdraw failed: ' + err.message); }
    });
  }

  if (dashDepositBtn) {
    dashDepositBtn.addEventListener('click', async () => {
      if (!isWeb3Ready()) return alert('Connect your wallet first.');
      const amt = prompt('Enter ETH amount to deposit:', '0.1');
      if (!amt || isNaN(amt) || Number(amt) <= 0) return;
      try {
        await PhoneGuardWeb3.deposit(PhoneGuardWeb3.parseUnits(amt));
        await refreshWalletDisplay();
        alert(`Deposited ${amt} ETH.`);
      } catch (err) { alert('Deposit failed: ' + err.message); }
    });
  }

  if (dashCheckBtn) {
    dashCheckBtn.addEventListener('click', () => {
      const imei = prompt('Enter 15-digit IMEI to check:');
      if (!imei || !isValidIMEI(imei)) return alert('Invalid IMEI.');
      window.location.href = 'index.html#marketplace';
    });
  }

  if (dashRegisterBtn) {
    dashRegisterBtn.addEventListener('click', async () => {
      if (!isWeb3Ready()) return alert('Connect your wallet first.');
      const imei = prompt('Enter 15-digit IMEI to register:');
      if (!imei || !isValidIMEI(imei)) return alert('Invalid IMEI.');
      try {
        await PhoneGuardWeb3.registerDevice(imei, '');
        alert(`Device ${imei} registered on-chain.`);
      } catch (err) { alert('Registration failed: ' + err.message); }
    });
  }

  if (dashSellBtn) {
    dashSellBtn.addEventListener('click', async () => {
      if (!isWeb3Ready()) return alert('Connect your wallet first.');
      const imei = prompt('Enter IMEI of device to sell:');
      if (!imei || !isValidIMEI(imei)) return alert('Invalid IMEI.');
      const price = prompt('Enter price in ETH:');
      if (!price || isNaN(price) || Number(price) <= 0) return alert('Invalid price.');
      try {
        await PhoneGuardWeb3.createListing(imei, PhoneGuardWeb3.parseUnits(price), 'For sale');
        alert(`Device ${imei} listed for ${price} ETH.`);
      } catch (err) { alert('Listing failed: ' + err.message); }
    });
  }
}

async function setupDashboard() {
  const walletInfoEl = document.getElementById('walletInfo');
  if (walletInfoEl && isWeb3Ready()) {
    const account = await PhoneGuardWeb3.getAccount();
    walletInfoEl.textContent = `Connected: ${PhoneGuardWeb3.shortenAddr(account)}`;
  }
  await refreshWalletDisplay();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    await setupWalletButton();
    await setupMarketplaceForms();
    await setupWalletActions();
    await setupDashboard();
  });
} else {
  (async () => {
    await setupWalletButton();
    await setupMarketplaceForms();
    await setupWalletActions();
    await setupDashboard();
  })();
}
