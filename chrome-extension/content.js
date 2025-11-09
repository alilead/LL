/**
 * LeadLab Chrome Extension - Content Script
 * Captures lead information from any webpage
 */

// LinkedIn profile scraper
function scrapeLinkedInProfile() {
  const profile = {};

  // Name
  const nameEl = document.querySelector('.text-heading-xlarge, .pv-text-details__left-panel h1');
  if (nameEl) profile.name = nameEl.textContent.trim();

  // Title
  const titleEl = document.querySelector('.text-body-medium, .pv-text-details__left-panel .text-body-medium');
  if (titleEl) profile.title = titleEl.textContent.trim();

  // Company
  const companyEl = document.querySelector('.pv-text-details__right-panel .pv-text-details__right-panel-item-text');
  if (companyEl) profile.company = companyEl.textContent.trim();

  // Location
  const locationEl = document.querySelector('.pv-text-details__left-panel .text-body-small');
  if (locationEl) profile.location = locationEl.textContent.trim();

  // About
  const aboutEl = document.querySelector('.pv-about__summary-text');
  if (aboutEl) profile.about = aboutEl.textContent.trim();

  return profile;
}

// Gmail email scraper
function scrapeGmailEmail() {
  const email = {};

  // From
  const fromEl = document.querySelector('[email]');
  if (fromEl) {
    email.from = fromEl.getAttribute('email');
    email.name = fromEl.getAttribute('name') || fromEl.textContent.trim();
  }

  // Subject
  const subjectEl = document.querySelector('h2.hP');
  if (subjectEl) email.subject = subjectEl.textContent.trim();

  // Body
  const bodyEl = document.querySelector('.a3s.aiL');
  if (bodyEl) email.body = bodyEl.textContent.trim();

  // Extract company from email domain
  if (email.from) {
    const domain = email.from.split('@')[1];
    email.company = domain?.split('.')[0];
  }

  return email;
}

// Generic webpage scraper
function scrapeWebpage() {
  const data = {
    url: window.location.href,
    title: document.title,
  };

  // Try to find email addresses
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
  const bodyText = document.body.textContent;
  const emails = bodyText.match(emailRegex);
  if (emails && emails.length > 0) {
    data.email = emails[0];
  }

  // Try to find phone numbers
  const phoneRegex = /(\+\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}/g;
  const phones = bodyText.match(phoneRegex);
  if (phones && phones.length > 0) {
    data.phone = phones[0];
  }

  // Try to extract meta tags
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    data.description = metaDescription.content;
  }

  return data;
}

// Create floating capture button
function createCaptureButton() {
  const button = document.createElement('button');
  button.id = 'leadlab-capture-btn';
  button.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  `;
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 56px;
    height: 56px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 50%;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    cursor: pointer;
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-center;
    transition: transform 0.2s, box-shadow 0.2s;
  `;

  button.addEventListener('mouseenter', () => {
    button.style.transform = 'scale(1.1)';
    button.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
  });

  button.addEventListener('mouseleave', () => {
    button.style.transform = 'scale(1)';
    button.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
  });

  button.addEventListener('click', () => {
    captureLead();
  });

  document.body.appendChild(button);
}

// Capture lead from current page
async function captureLead() {
  let leadData = {};

  // Determine page type and scrape accordingly
  if (window.location.hostname.includes('linkedin.com')) {
    leadData = scrapeLinkedInProfile();
    leadData.source = 'LinkedIn';
  } else if (window.location.hostname.includes('mail.google.com')) {
    leadData = scrapeGmailEmail();
    leadData.source = 'Gmail';
  } else {
    leadData = scrapeWebpage();
    leadData.source = 'Web';
  }

  // Send to background script
  chrome.runtime.sendMessage({
    action: 'captureLead',
    data: leadData,
  }, (response) => {
    if (response && response.success) {
      showNotification('✅ Lead captured successfully!');
    } else {
      showNotification('❌ Failed to capture lead', 'error');
    }
  });
}

// Show notification
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 24px;
    background: ${type === 'success' ? '#10b981' : '#ef4444'};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    font-weight: 600;
    animation: slideIn 0.3s ease-out;
  `;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createCaptureButton);
} else {
  createCaptureButton();
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'capturePage') {
    captureLead();
    sendResponse({ success: true });
  }
});
