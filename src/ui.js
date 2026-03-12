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
    
    // Create Badge
    const badgeClass = `badge-${item.sentiment.toLowerCase()}`;
    const badgeText = item.sentiment.toUpperCase();
    
    // Status Icon
    let iconHTML = '';
    if (item.sentiment === 'pending') {
      iconHTML = '<i class="ph ph-hourglass-high"></i>';
    } else if (item.sentiment === 'positive') {
      iconHTML = '<i class="ph ph-smiley"></i>';
    } else if (item.sentiment === 'negative') {
      iconHTML = '<i class="ph ph-smiley-sad"></i>';
    } else if (item.sentiment === 'neutral') {
      iconHTML = '<i class="ph ph-smiley-meh"></i>';
    } else if (item.sentiment === 'error') {
      iconHTML = '<i class="ph ph-warning"></i>';
    } else if (item.sentiment === 'analyzing') {
      iconHTML = '<i class="ph ph-spinner-gap spin"></i>';
      tr.querySelector('.badge')?.classList?.replace('badge-pending', 'badge-neutral'); // temporary color trick or use analyze state
    }

    const badgeHTML = `<span class="badge badge-${item.sentiment === 'analyzing' ? 'pending' : item.sentiment.toLowerCase()}">${iconHTML} ${item.sentiment === 'analyzing' ? 'ANALYZING' : badgeText}</span>`;
    
    tr.innerHTML = `
      <td>${item.id}</td>
      <td>${escapeHTML(item.text)}</td>
      <td id="sentiment-cell-${item.id}">${badgeHTML}</td>
    `;
    tbody.appendChild(tr);
  });
}

export function updateRowSentiment(id, sentiment) {
  const cell = document.getElementById(`sentiment-cell-${id}`);
  if (!cell) return;

  const badgeClass = `badge-${sentiment.toLowerCase()}`;
  let iconHTML = '';
  if (sentiment === 'positive') iconHTML = '<i class="ph ph-smiley"></i>';
  else if (sentiment === 'negative') iconHTML = '<i class="ph ph-smiley-sad"></i>';
  else if (sentiment === 'neutral') iconHTML = '<i class="ph ph-smiley-meh"></i>';
  else if (sentiment === 'error') iconHTML = '<i class="ph ph-warning"></i>';
  else if (sentiment === 'analyzing') iconHTML = '<i class="ph ph-spinner-gap spin"></i>';

  cell.innerHTML = `<span class="badge ${sentiment === 'analyzing' ? 'badge-pending' : badgeClass}">${iconHTML} ${sentiment.toUpperCase()}</span>`;
}

export function updateDashboardStats(data) {
  const totals = data.length;
  const positive = data.filter(d => d.sentiment === 'positive').length;
  const negative = data.filter(d => d.sentiment === 'negative').length;
  const neutral = data.filter(d => d.sentiment === 'neutral').length;

  document.getElementById('stat-total').textContent = totals;
  document.getElementById('stat-positive').textContent = positive;
  document.getElementById('stat-negative').textContent = negative;
  document.getElementById('stat-neutral').textContent = neutral;
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
