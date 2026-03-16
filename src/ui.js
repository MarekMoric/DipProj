// UI Utility functions for Manipulating DOM State

export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'ph-info';
  if (type === 'success') icon = 'ph-check-circle';
  if (type === 'error') icon = 'ph-warning-circle';

  toast.innerHTML = `<i class="ph ${icon}"></i> <span>${message}</span>`;
  container.appendChild(toast);

  // Auto-remove after 4s
  setTimeout(() => {
    toast.classList.add('hiding');
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, 4000);
}

export function renderDataGrid(data) {
  const tbody = document.getElementById('data-table-body');
  if (!tbody) return;

  tbody.innerHTML = '';
  
  data.forEach(item => {
    const tr = document.createElement('tr');
    tr.id = `row-${item.id}`;
    
    tr.innerHTML = `
      <td>${item.id}</td>
      <td>${escapeHTML(item.text)}</td>
    `;
    tbody.appendChild(tr);
  });
}

export function updateGlobalSentiment(sentiment) {
  const container = document.getElementById('stat-global-sentiment');
  if (!container) return;

  const badgeClass = `badge-${sentiment.toLowerCase()}`;
  let iconHTML = '<i class="ph ph-minus"></i>';
  let text = 'PENDING';
  
  if (sentiment === 'positive') { iconHTML = '<i class="ph ph-smiley"></i>'; text = 'POSITIVE'; }
  else if (sentiment === 'negative') { iconHTML = '<i class="ph ph-smiley-sad"></i>'; text = 'NEGATIVE'; }
  else if (sentiment === 'neutral') { iconHTML = '<i class="ph ph-smiley-meh"></i>'; text = 'NEUTRAL'; }
  else if (sentiment === 'error') { iconHTML = '<i class="ph ph-warning"></i>'; text = 'ERROR'; }
  else if (sentiment === 'analyzing') { iconHTML = '<i class="ph ph-spinner-gap spin"></i>'; text = 'ANALYZING'; }

  container.innerHTML = `<span class="badge ${sentiment === 'analyzing' ? 'badge-pending' : badgeClass}">${iconHTML} ${text}</span>`;
}

export function updateDashboardStats(data) {
  const totals = data.length;
  document.getElementById('stat-total').textContent = totals;
}

export function toggleSettings(show) {
  const panel = document.getElementById('settings-panel');
  if (show === undefined) {
    panel.classList.toggle('hidden');
  } else {
    show ? panel.classList.remove('hidden') : panel.classList.add('hidden');
  }
}

export function showDashboard(show = true) {
  const dashboard = document.getElementById('dashboard-section');
  const upload = document.getElementById('upload-section');
  
  if (show) {
    dashboard.classList.remove('hidden');
    upload.classList.add('hidden');
  } else {
    dashboard.classList.add('hidden');
    upload.classList.remove('hidden');
  }
}

// Basic HTML sanitizer for table rendering
function escapeHTML(str) {
  const div = document.createElement('div');
  div.innerText = str;
  return div.innerHTML;
}
