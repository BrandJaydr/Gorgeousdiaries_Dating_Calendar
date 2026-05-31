import { useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CSVRow {
  [key: string]: string;
}

interface EventFromCSV {
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  end_date: string | null;
  venue_name: string | null;
  address: string;
  city: string;
  state: string;
  zip_code: string | null;
  price: number | null;
  dress_code: string | null;
  age_limit: string | null;
  phone_number: string | null;
  image_url: string | null;
  organizer_name: string | null;
  website: string | null;
  ticket_url: string | null;
  source_url: string | null;
  notes: string | null;
  status: 'pending';
  featured: false;
}

interface CSVUploaderProps {
  onImportComplete: () => void;
}

// RFC 4180-compliant CSV tokenizer. Handles quoted fields containing commas,
// newlines, and escaped double-quotes ("").
function tokenizeCSV(text: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  const src = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  while (i < src.length) {
    const ch = src[i];

    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        field += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ',') {
        row.push(field);
        field = '';
        i++;
      } else if (ch === '\n') {
        row.push(field);
        field = '';
        result.push(row);
        row = [];
        i++;
      } else {
        field += ch;
        i++;
      }
    }
  }

  row.push(field);
  if (row.some(v => v !== '')) {
    result.push(row);
  }

  return result;
}

function parseCSV(text: string): CSVRow[] {
  const lines = tokenizeCSV(text);
  if (lines.length < 2) return [];

  const headers = lines[0].map(h => h.trim().toLowerCase());
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i];
    if (values.length === 0 || (values.length === 1 && values[0] === '')) continue;
    const row: CSVRow = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? '';
    });
    rows.push(row);
  }

  return rows;
}

function col(row: CSVRow, ...keys: string[]): string {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== '') return row[key];
  }
  return '';
}

function mapCSVToEvent(row: CSVRow): EventFromCSV {
  const priceRaw = col(row, 'price', 'admission', 'cost', 'ticket_price');
  const priceStripped = priceRaw.replace(/[^0-9.]/g, '');
  const priceNum = priceStripped ? parseFloat(priceStripped) : null;

  return {
    title: col(row, 'title', 'event', 'name', 'event name', 'event_name'),
    description: col(row, 'description', 'details', 'info', 'summary') || null,
    event_date: col(row, 'date', 'event_date', 'event date', 'start_date', 'start date'),
    event_time: col(row, 'time', 'event_time', 'event time', 'start_time') || null,
    end_date: col(row, 'end_date', 'end date', 'end') || null,
    venue_name: col(row, 'venue', 'venue_name', 'venue name', 'location') || null,
    address: col(row, 'address', 'street', 'street_address'),
    city: col(row, 'city'),
    state: col(row, 'state'),
    zip_code: col(row, 'zip', 'zip_code', 'zip code', 'zipcode', 'postal_code') || null,
    price: priceNum !== null && !isNaN(priceNum) ? priceNum : null,
    dress_code: col(row, 'dress_code', 'dress code', 'dresscode', 'attire') || null,
    age_limit: col(row, 'age_limit', 'age limit', 'age', 'age_restriction') || null,
    phone_number: col(row, 'phone', 'phone_number', 'phone number', 'contact', 'tel') || null,
    image_url: col(row, 'image', 'image_url', 'image url', 'photo', 'photo_url', 'img') || null,
    organizer_name: col(row, 'organizer', 'organizer_name', 'organizer name', 'host', 'promoter') || null,
    website: col(row, 'website', 'url', 'event_url', 'event url', 'web') || null,
    ticket_url: col(row, 'ticket_url', 'ticket url', 'tickets', 'buy_tickets', 'ticketlink') || null,
    source_url: col(row, 'source_url', 'source url', 'source', 'scraped_from') || null,
    notes: col(row, 'notes', 'note', 'internal_notes', 'comments') || null,
    status: 'pending',
    featured: false,
  };
}

function downloadTemplate() {
  const headers = [
    'title', 'description', 'date', 'time', 'end_date', 'venue', 'address',
    'city', 'state', 'zip', 'price', 'dress_code', 'age_limit', 'phone',
    'image', 'organizer', 'website', 'ticket_url', 'source_url', 'notes',
  ];
  const example = [
    'Summer Jazz Festival',
    '"Jazz, Blues, and Soul night under the stars"',
    '2026-07-15',
    '19:00',
    '2026-07-15',
    'Centennial Park Amphitheater',
    '123 Park Ave',
    'Nashville',
    'TN',
    '37201',
    '25',
    'Smart Casual',
    '21+',
    '615-555-0100',
    'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg',
    'Live Nation',
    'https://jazzfest.example.com',
    'https://tickets.example.com/jazz',
    '',
    '',
  ];
  const csv = [headers.join(','), example.join(',')].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'events_template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export function CSVUploader({ onImportComplete }: CSVUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please select a CSV file');
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const text = await file.text();
      const rows = parseCSV(text);

      if (rows.length === 0) {
        throw new Error('No valid data found in CSV file');
      }

      let successCount = 0;
      let errorCount = 0;

      for (const row of rows) {
        try {
          const eventData = mapCSVToEvent(row);

          if (!eventData.title || !eventData.event_date || !eventData.city || !eventData.state) {
            errorCount++;
            continue;
          }

          const { error: insertError } = await supabase
            .from('events')
            .insert(eventData);

          if (insertError) {
            errorCount++;
            console.error('Error inserting event:', insertError);
          } else {
            successCount++;
          }
        } catch (err) {
          errorCount++;
          console.error('Error processing row:', err);
        }
      }

      setSuccess(
        `Import complete: ${successCount} event${successCount !== 1 ? 's' : ''} added${errorCount > 0 ? `, ${errorCount} skipped (missing required fields)` : ''}`
      );
      setFile(null);
      onImportComplete();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred during import');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <FileSpreadsheet className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Import Events from CSV</h2>
          <p className="text-gray-600">
            Upload a CSV file to bulk-import events. All records are set to pending and require admin approval.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-blue-900">CSV Column Reference</h3>
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-1.5 text-xs text-blue-700 hover:text-blue-900 font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download template
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <div>
              <p className="font-medium text-blue-800 mb-1.5">Required</p>
              <ul className="text-blue-700 space-y-0.5 list-disc list-inside">
                <li>title — event name</li>
                <li>date — YYYY-MM-DD format</li>
                <li>city — city name</li>
                <li>state — state code (e.g. CA, TX)</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-blue-800 mb-1.5">Core Fields</p>
              <ul className="text-blue-700 space-y-0.5 list-disc list-inside">
                <li>description, time, end_date</li>
                <li>venue, address, zip</li>
                <li>price, dress_code, age_limit</li>
                <li>phone, image</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-blue-800 mb-1.5">Intelligence Fields</p>
              <ul className="text-blue-700 space-y-0.5 list-disc list-inside">
                <li>organizer — host / promoter name</li>
                <li>website — event info URL</li>
                <li>ticket_url — purchase link</li>
                <li>source_url — where data came from</li>
                <li>notes — internal admin notes</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-blue-800 mb-1.5">Parser Notes</p>
              <ul className="text-blue-700 space-y-0.5 list-disc list-inside">
                <li>Column names are case-insensitive</li>
                <li>Quoted fields with commas are supported</li>
                <li>Unknown columns are safely ignored</li>
                <li>Rows missing required fields are skipped</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6 hover:border-blue-500 transition-colors">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            id="csv-upload"
          />
          <label htmlFor="csv-upload" className="cursor-pointer">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-700 font-medium mb-1">
              {file ? file.name : 'Click to upload CSV file'}
            </p>
            <p className="text-sm text-gray-500">or drag and drop</p>
          </label>
        </div>

        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-6">
            <p className="text-sm text-green-700 font-medium">{success}</p>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload className="w-5 h-5" />
          {loading ? 'Importing...' : 'Import Events'}
        </button>

        <p className="text-xs text-gray-500 text-center mt-4">
          All imported events are set to pending and require admin approval before going live
        </p>
      </div>
    </div>
  );
}
