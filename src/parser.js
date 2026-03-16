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
        const validData = parsedData.filter(row => row && (row['Tweet Content'] || row.text || row.content || row.message || typeof row === 'string'));

        if (validData.length === 0) {
          return reject(new Error('No valid text data found in the file. Ensure there is a "Tweet Content" or "text" column.'));
        }

        const standardFormat = validData.map((row, index) => {
          // Extract text based on possible keys or structure
          let textValue = '';
          if (typeof row === 'string') {
            textValue = row;
          } else {
            textValue = row['Tweet Content'] || row.text || row.message || row.content || Object.values(row)[0];
          }

          return {
            id: index + 1,
            text: textValue,
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

function parseXLSX(buffer) {
  if (typeof XLSX === 'undefined') {
    throw new Error('XLSX library is not loaded.');
  }
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  // Parse with first row as header to array of JSON objects
  return XLSX.utils.sheet_to_json(worksheet, { defval: "" });
}
