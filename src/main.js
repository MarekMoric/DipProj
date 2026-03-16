import { parseFile } from './parser.js';
import { showToast, renderDataGrid, updateGlobalSentiment, updateDashboardStats, toggleSettings, showDashboard } from './ui.js';
import { evaluateAggregatedSentiment } from './llm.js';

// Application State
let appData = [];
let filteredData = [];
let isAnalyzing = false;

document.addEventListener('DOMContentLoaded', () => {
  // Try to load API key from localStorage
  const savedKey = localStorage.getItem('sentiment_api_key');
  if (savedKey) {
    document.getElementById('api-key').value = savedKey;
  }

  setupEventListeners();
});

function setupEventListeners() {
  // Settings UI
  document.getElementById('btn-settings').addEventListener('click', () => toggleSettings(true));
  document.getElementById('btn-close-settings').addEventListener('click', () => toggleSettings(false));
  
  document.getElementById('btn-save-settings').addEventListener('click', () => {
    const key = document.getElementById('api-key').value.trim();
    if (key) {
      localStorage.setItem('sentiment_api_key', key);
      showToast('Settings saved successfully', 'success');
      toggleSettings(false);
    } else {
      localStorage.removeItem('sentiment_api_key');
      showToast('API key removed', 'info');
      toggleSettings(false);
    }
  });

  // Drag and Drop
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-upload');

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
  });

  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
  });

  dropZone.addEventListener('drop', handleDrop, false);
  fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

  // Analysis Button
  document.getElementById('btn-analyze').addEventListener('click', handleAnalyze);

  // Export Button
  document.getElementById('btn-export').addEventListener('click', handleExport);

  // Filter Input
  document.getElementById('filter-input').addEventListener('input', handleFilter);
}

function handleFilter(e) {
  const keyword = e.target.value.toLowerCase();
  filteredData = keyword ? appData.filter(item => item.text.toLowerCase().includes(keyword)) : [...appData];
  
  renderDataGrid(filteredData);
  updateDashboardStats(filteredData);
}

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

function handleDrop(e) {
  const dt = e.dataTransfer;
  const files = dt.files;
  handleFiles(files);
}

async function handleFiles(files) {
  if (files.length === 0) return;
  
  const file = files[0];
  showToast(`Parsing ${file.name}...`, 'info');

  try {
    const data = await parseFile(file);
    appData = data;
    
    const keyword = document.getElementById('filter-input').value.toLowerCase();
    filteredData = keyword ? appData.filter(item => item.text.toLowerCase().includes(keyword)) : [...appData];

    showToast(`Successfully loaded ${appData.length} records.`, 'success');
    
    // Switch UI view
    showDashboard(true);
    renderDataGrid(filteredData);
    updateDashboardStats(filteredData);
    updateGlobalSentiment('pending');
    
    // Reset export button state
    document.getElementById('btn-export').disabled = true;

    // Reset API config warning if needed
    const savedKey = localStorage.getItem('sentiment_api_key');
    if (!savedKey) {
      showToast('Remember to configure your Gemini API Key before analyzing!', 'error');
      setTimeout(() => toggleSettings(true), 2000);
    }

  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleAnalyze() {
  const dataToAnalyze = filteredData;
  if (dataToAnalyze.length === 0) {
    showToast('No data to analyze.', 'error');
    return;
  }

  const apiKey = localStorage.getItem('sentiment_api_key');
  if (!apiKey) {
    showToast('Missing Gemini API Key. Open settings to configure it.', 'error');
    toggleSettings(true);
    return;
  }

  if (isAnalyzing) return;

  const analyzeBtn = document.getElementById('btn-analyze');
  isAnalyzing = true;
  analyzeBtn.disabled = true;
  analyzeBtn.innerHTML = '<i class="ph ph-spinner-gap spin"></i> Analyzing...';

  showToast('Aggregated analysis started...', 'info');

  try {
    updateGlobalSentiment('analyzing');

    const texts = dataToAnalyze.map(item => item.text);
    const overallSentiment = await evaluateAggregatedSentiment(texts, apiKey);
    
    updateGlobalSentiment(overallSentiment);

    if (overallSentiment === 'error') {
      showToast('Analysis encountered an error.', 'error');
    } else {
      showToast(`Analysis complete! Overall sentiment: ${overallSentiment.toUpperCase()}`, 'success');
      document.getElementById('btn-export').disabled = false; // Enable export
    }

  } catch (err) {
    showToast(`Analysis error: ${err.message}`, 'error');
  } finally {
    isAnalyzing = false;
    analyzeBtn.disabled = false;
    analyzeBtn.innerHTML = '<i class="ph ph-magic-wand"></i> Analyze Sentiment';
  }
}

function handleExport() {
  const dataToExport = filteredData;
  if (dataToExport.length === 0) return;

  // Simple CSV generation (Removed Sentiment column per request)
  const headers = ['ID', 'Text'];
  const rows = dataToExport.map(item => [
    item.id,
    `"${item.text.replace(/"/g, '""')}"` // escape quotes for CSV
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'sentiment_results.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
