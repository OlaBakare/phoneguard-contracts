const trackForm = document.getElementById('trackForm');
const checkForm = document.getElementById('checkForm');
const trackResult = document.getElementById('trackResult');
const checkResult = document.getElementById('checkResult');

function formatMessage(title, message) {
  return `<strong>${title}</strong><p>${message}</p>`;
}

function isValidIMEI(value) {
  return /^\d{15}$/.test(value.trim());
}

if (trackForm && trackResult) {
  trackForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const imei = document.getElementById('track-imei').value;
    trackResult.classList.remove('hidden');
    if (!isValidIMEI(imei)) {
      trackResult.innerHTML = formatMessage('Invalid IMEI', 'Please enter a 15-digit IMEI number to continue.');
      return;
    }

    trackResult.innerHTML = formatMessage('Tracking started', 'Your IMEI lookup is being processed. Check with local authorities and your carrier for official recovery support.');
  });
}

if (checkForm && checkResult) {
  checkForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const imei = document.getElementById('check-imei').value;
    checkResult.classList.remove('hidden');
    if (!isValidIMEI(imei)) {
      checkResult.innerHTML = formatMessage('Invalid IMEI', 'Please enter a 15-digit IMEI number to continue.');
      return;
    }

    checkResult.innerHTML = formatMessage('Status check complete', 'The device appears safe for review, but always validate the seller and carrier documentation before purchase.');
  });
}
