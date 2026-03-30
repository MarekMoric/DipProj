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

export function updateGlobalSentiment(sentiment, explanation = '') {
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

    let html = `<span class="badge ${sentiment === 'analyzing' ? 'badge-pending' : badgeClass}">${iconHTML} ${text}</span>`;
    if (explanation) {
        html += `<p class="sentiment-explanation mt-2 text-sm text-gray-300 italic">${escapeHTML(explanation)}</p>`;
    }
    container.innerHTML = html;
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

let currentGraphData = [];
export let currentPriceData = [];

function formatDateForInput(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function renderFrequencyGraph(data) {
    let isNewData = false;
    if (data) {
        currentGraphData = data;
        isNewData = true;
    }

    const canvas = document.getElementById('frequencyChart');
    const viewModeSelect = document.getElementById('chart-view-mode');
    const daySelect = document.getElementById('chart-day-select');
    const dailyRangeControls = document.getElementById('daily-range-controls');
    const startDateInput = document.getElementById('chart-start-date');
    const endDateInput = document.getElementById('chart-end-date');
    if (!canvas || !viewModeSelect || !daySelect) return;

    if (!window.chartControlsSetup) {
        viewModeSelect.addEventListener('change', () => { renderFrequencyGraph(); renderPriceGraph(); });
        daySelect.addEventListener('change', () => { renderFrequencyGraph(); renderPriceGraph(); });
        if (startDateInput) startDateInput.addEventListener('change', () => { renderFrequencyGraph(); renderPriceGraph(); });
        if (endDateInput) endDateInput.addEventListener('change', () => { renderFrequencyGraph(); renderPriceGraph(); });
        window.chartControlsSetup = true;
    }

    const isHourly = viewModeSelect.value === 'hourly';
    
    if (dailyRangeControls) {
        dailyRangeControls.style.display = isHourly ? 'none' : 'flex';
    }

    // Extract unique days from both datasets
    const allDates = [...currentGraphData.map(d => d.date), ...currentPriceData.map(d => d.date)].filter(Boolean);
    const uniqueDays = [...new Set(allDates)].sort((a, b) => new Date(a) - new Date(b));

    // Update min/max and initial values for date pickers when new data is loaded
    if (isNewData && uniqueDays.length > 0 && startDateInput && endDateInput) {
        const minDateStr = formatDateForInput(uniqueDays[0]);
        const maxDateStr = formatDateForInput(uniqueDays[uniqueDays.length - 1]);
        
        if (minDateStr) {
            startDateInput.min = minDateStr;
            startDateInput.value = minDateStr;
            endDateInput.min = minDateStr;
        }
        if (maxDateStr) {
            endDateInput.max = maxDateStr;
            endDateInput.value = maxDateStr;
            startDateInput.max = maxDateStr;
        }
    }

    // Populate day select if needed
    if (isHourly) {
        daySelect.classList.remove('hidden');
        if (daySelect.options.length !== uniqueDays.length) {
            const currentSelected = daySelect.value;
            daySelect.innerHTML = uniqueDays.map(d => `<option value="${escapeHTML(d)}">${escapeHTML(d)}</option>`).join('');
            if (uniqueDays.includes(currentSelected)) {
                daySelect.value = currentSelected;
            }
        }
    } else {
        daySelect.classList.add('hidden');
    }

    const targetDay = daySelect.value || uniqueDays[0];

    let filteredGraphData = currentGraphData;
    
    // Apply date range filter for the daily view
    if (!isHourly && startDateInput && endDateInput) {
        const start = startDateInput.value ? new Date(startDateInput.value) : null;
        const end = endDateInput.value ? new Date(endDateInput.value) : null;
        
        if (start || end) {
            filteredGraphData = currentGraphData.filter(item => {
                if (!item.date) return false;
                const itemDate = new Date(item.date);
                if (start && itemDate < start) return false;
                if (end) {
                    // end date is inclusive for the day
                    const endInclusive = new Date(end);
                    endInclusive.setHours(23, 59, 59, 999);
                    if (itemDate > endInclusive) return false;
                }
                return true;
            });
        }
    }

    // Filter displayed grid
    if (isHourly) {
        const dayData = currentGraphData.filter(item => item.date === targetDay);
        renderDataGrid(dayData);
    } else {
        renderDataGrid(filteredGraphData);
    }

    // Group data
    const countsMap = {};
    if (isHourly) {
        currentGraphData.forEach(item => {
            if (item.date === targetDay && item.time) {
                // time format: "12:55 PM" -> extract hour e.g. "12 PM"
                const timeParts = item.time.split(' ');
                if (timeParts.length === 2) {
                    const hm = timeParts[0].split(':');
                    // Format like "12 PM" or "01 PM"
                    let hourNum = hm[0];
                    let hourStr = `${hourNum} ${timeParts[1]}`;
                    countsMap[hourStr] = (countsMap[hourStr] || 0) + 1;
                }
            }
        });
    } else {
        filteredGraphData.forEach(item => {
            if (item.date) {
                countsMap[item.date] = (countsMap[item.date] || 0) + 1;
            }
        });
    }

    let sortedLabels = [];
    if (isHourly) {
        const parseHourTo24 = (label) => {
            const parts = label.split(' ');
            let h = parseInt(parts[0], 10);
            const ampm = parts[1];
            if (ampm === 'PM' && h < 12) h += 12;
            if (ampm === 'AM' && h === 12) h = 0;
            return h;
        };
        sortedLabels = Object.keys(countsMap).sort((a, b) => parseHourTo24(a) - parseHourTo24(b));
    } else {
        sortedLabels = Object.keys(countsMap).sort((a, b) => new Date(a) - new Date(b));
    }

    const counts = sortedLabels.map(label => countsMap[label]);

    if (window.frequencyChartInstance) {
        window.frequencyChartInstance.destroy();
    }

    if (sortedLabels.length === 0) return;

    const ctx = canvas.getContext('2d');
    window.frequencyChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedLabels,
            datasets: [{
                label: 'Tweet Volume',
                data: counts,
                borderColor: '#ec4899',
                backgroundColor: 'rgba(236, 72, 153, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#ec4899',
                pointBorderColor: '#fff',
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(15, 17, 26, 0.9)',
                    titleColor: '#f8fafc',
                    bodyColor: '#e2e8f0',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    ticks: { color: '#94a3b8' },
                    grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false }
                },
                y: {
                    beginAtZero: true,
                    ticks: { color: '#94a3b8', stepSize: 1, precision: 0 },
                    grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false }
                }
            },
            interaction: { mode: 'nearest', axis: 'x', intersect: false }
        }
    });
}

export function renderPriceGraph(data) {
    if (data) {
        currentPriceData = data;
        
        // Populate the dropdown with unique days when new data arrives
        const priceDaySelect = document.getElementById('price-day-select');
        if (priceDaySelect) {
            const uniquePriceDays = [...new Set(currentPriceData.map(d => d.date).filter(Boolean))].sort((a, b) => new Date(a) - new Date(b));
            
            // Keep the selected value if it still exists
            const currentValue = priceDaySelect.value;
            
            priceDaySelect.innerHTML = '<option value="all">All Days</option>';
            uniquePriceDays.forEach(day => {
                const option = document.createElement('option');
                option.value = day;
                option.innerText = day;
                priceDaySelect.appendChild(option);
            });
            
            if (uniquePriceDays.includes(currentValue)) {
                priceDaySelect.value = currentValue;
            }
            
            if (!window.priceChartControlsSetup) {
                priceDaySelect.addEventListener('change', () => renderPriceGraph());
                window.priceChartControlsSetup = true;
            }
        }
    }
    
    if (!currentPriceData || currentPriceData.length === 0) return;

    const canvas = document.getElementById('priceChart');
    if (!canvas) return;

    const priceDaySelect = document.getElementById('price-day-select');
    const selectedDay = priceDaySelect ? priceDaySelect.value : 'all';

    let displayData = currentPriceData;
    if (selectedDay !== 'all') {
        displayData = currentPriceData.filter(item => item.date === selectedDay);
    }

    // Sort chronologically based on rawTimestamp
    const sortedData = [...displayData].sort((a, b) => new Date(a.rawTimestamp) - new Date(b.rawTimestamp));

    // Map labels to a nice local string
    const labels = sortedData.map(item => {
        const d = new Date(item.rawTimestamp);
        return isNaN(d.getTime()) ? item.rawTimestamp : d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });
    
    const priceValues = sortedData.map(item => item.price);

    if (window.priceChartInstance) {
        window.priceChartInstance.destroy();
    }

    if (labels.length === 0) return;

    const ctx = canvas.getContext('2d');
    window.priceChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Price',
                data: priceValues,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.1,
                pointBackgroundColor: '#10b981',
                pointBorderColor: '#fff',
                pointRadius: 2,
                pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(15, 17, 26, 0.9)',
                    titleColor: '#f8fafc',
                    bodyColor: '#e2e8f0',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return 'Price: $' + context.parsed.y.toFixed(2);
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#94a3b8', maxTicksLimit: 10 },
                    grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false }
                },
                y: {
                    ticks: { color: '#94a3b8' },
                    grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false }
                }
            },
            interaction: { mode: 'nearest', axis: 'x', intersect: false }
        }
    });
}

export function toggleCorrelationButton(enable) {
    const btn = document.getElementById('btn-correlate');
    if (btn) {
        btn.disabled = !enable;
    }
}

export function displayCorrelationResult(result, isLoading = false, isError = false) {
    const container = document.getElementById('correlation-result-container');
    const content = document.getElementById('correlation-content');
    if (!container || !content) return;
    
    container.classList.remove('hidden');
    
    if (isLoading) {
        content.innerHTML = '<i class="ph ph-spinner-gap spin"></i> Analyzing tweet-to-price connection...';
        content.style.color = 'var(--text-muted)';
    } else if (isError) {
        content.innerHTML = `<i class="ph ph-warning-circle"></i> ${escapeHTML(result)}`;
        content.style.color = '#ef4444'; // red-500
    } else {
        // Plain text result
        content.textContent = result;
        content.style.color = '#f8fafc'; // slate-50
    }
}
