/**
 * Parses an uploaded file (CSV or JSON) into a standard array format.
 * Format: [{ id: number, text: string, sentiment: null, error: null }]
 */

export async function parseFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const isXlsx = file.name.toLowerCase().endsWith('.xlsx');

    reader.onload = (e) => {
      try {
        const fileContent = e.target.result;
        let parsedData = [];

        if (file.name.toLowerCase().endsWith('.csv')) {
          parsedData = parseCSV(fileContent);
        } else if (file.name.toLowerCase().endsWith('.json')) {
          parsedData = parseJSON(fileContent);
        } else if (isXlsx) {
          parsedData = parseXLSX(fileContent);
        } else {
          return reject(new Error('Unsupported file format. Please upload CSV, JSON, or XLSX.'));
        }

        // Validate structure and map to internal format
        const validData = parsedData.filter(row => row && (row['Content'] || row.text || row.content || row.message || typeof row === 'string'));

        if (validData.length === 0) {
          return reject(new Error('No valid text data found in the file. Ensure there is a "Tweet Content" or "text" column.'));
        }

        const standardFormat = validData.map((row, index) => {
          // Extract text based on possible keys or structure
          let textValue = '';
          if (typeof row === 'string') {
            textValue = row;
          } else {
            textValue = row['Content'] || row.text || row.message || row.content || Object.values(row)[0];
          }

          let dateStr = null;
          let timeStr = null;
          if (typeof row === 'object') {
            const rawDate = row['Date'] || row.date || null;
            if (rawDate) {
              const parts = String(rawDate).split(' at ');
              dateStr = parts[0] ? parts[0].trim() : null;
              timeStr = parts[1] ? parts[1].trim() : null;
            }
          }

          return {
            id: index + 1,
            text: textValue,
            date: dateStr,
            time: timeStr,
            sentiment: 'pending', // default
            error: null
          };
        });

        resolve(standardFormat);
      } catch (err) {
        reject(new Error(`Failed to parse file: ${err.message}`));
      }
    };

    reader.onerror = () => reject(new Error('Error reading file'));

    if (isXlsx) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  });
}

function parseJSON(content) {
  const data = JSON.parse(content);
  // Support if the JSON is an array of strings, an array of objects, or just a single array inside an object wrapper
  if (Array.isArray(data)) return data;

  // E.g. { "data": [...] }
  for (let key of Object.keys(data)) {
    if (Array.isArray(data[key])) return data[key];
  }

  throw new Error('Invalid JSON structure: Expected an array of text objects.');
}

function parseCSV(content) {
  const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length === 0) return [];

  // Simple basic CSV parser (doesn't handle commas within quotes perfectly, but good for prototype)
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));

  let data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    if (values.length === 0) continue;

    let row = {};
    if (headers.length > 0 && headers.length <= values.length) {
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
    } else {
      // No headers found, just use the first column as text
      row.text = values[0];
    }
    data.push(row);
  }

  return data;
}

function parseXLSX(buffer, isPrice = false) {
  if (typeof XLSX === 'undefined') {
    throw new Error('XLSX library is not loaded.');
  }
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: isPrice });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  // Parse with first row as header to array of JSON objects
  const opts = isPrice ? { defval: "" } : { defval: "", raw: false };
  return XLSX.utils.sheet_to_json(worksheet, opts);
}

export async function parsePriceFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const isXlsx = file.name.toLowerCase().endsWith('.xlsx');

    reader.onload = (e) => {
      try {
        const fileContent = e.target.result;
        let parsedData = [];

        if (file.name.toLowerCase().endsWith('.csv')) {
          parsedData = parseCSV(fileContent);
        } else if (isXlsx) {
          parsedData = parseXLSX(fileContent, true);
        } else {
          return reject(new Error('Unsupported format for price data.'));
        }

        const standardFormat = parsedData.map((row, index) => {
          let dateStr = null;
          let timeStr = null;

          const timestamp = row.timestamp || row.Timestamp || row.TIMESTAMP || row.time || row.Date || '';
          let dateObj = null;

          if (timestamp instanceof Date) {
            dateObj = timestamp;
          } else if (typeof timestamp === 'number') {
            // Excel serial date format
            const dateInMs = (timestamp - 25569) * 86400 * 1000;
            const utcDate = new Date(dateInMs);
            dateObj = new Date(utcDate.getTime() + (utcDate.getTimezoneOffset() * 60000));
          } else if (timestamp) {
            dateObj = new Date(timestamp);
          }

          if (dateObj && !isNaN(dateObj.getTime())) {
            dateStr = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
          }

          const rawPrice = row.price || row.Price || row.PRICE || 0;
          let priceValue = typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice).replace(',', '.'));

          return {
            id: index + 1,
            price: priceValue,
            date: dateStr,
            time: timeStr,
            rawTimestamp: dateObj ? dateObj.toISOString() : timestamp
          };
        }).filter(item => item.date && !isNaN(item.price));

        if (standardFormat.length === 0) {
          return reject(new Error('No valid price data found. Ensure "price" and "timestamp" columns exist.'));
        }

        resolve(standardFormat);
      } catch (err) {
        reject(new Error(`Failed to parse price file: ${err.message}`));
      }
    };

    reader.onerror = () => reject(new Error('Error reading price file'));

    if (isXlsx) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  });
}
