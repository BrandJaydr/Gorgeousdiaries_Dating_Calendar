import { useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CSVRow {
  [key: string]: string;
}

interface EventFromCSV {
  title: string;
  description: string;
  event_date: string;
  event_time: string | null;
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
  status: 'pending';
  featured: false;
}

interface CSVUploaderProps {
  onImportComplete: () => void;
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

  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const rows: CSVRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row: CSVRow = {};

      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      rows.push(row);
    }

    return rows;
  };

  const mapCSVToEvent = (row: CSVRow): EventFromCSV => {
    return {
      title: row.title || row.event || row.name || row['event name'] || '',
      description: row.description || row.details || row.info || '',
      event_date: row.date || row['event date'] || row['event_date'] || '',
      event_time: row.time || row['event time'] || row['event_time'] || null,
      venue_name: row.venue || row['venue name'] || row.location || null,
      address: row.address || row.street || '',
      city: row.city || '',
      state: row.state || '',
      zip_code: row.zip || row['zip code'] || row.zipcode || null,
      price: row.price || row.admission || row.cost ? parseFloat(row.price || row.admission || row.cost) : null,
      dress_code: row['dress code'] || row.dresscode || row['dress_code'] || null,
      age_limit: row['age limit'] || row['age_limit'] || row.age || null,
      phone_number: row.phone || row['phone number'] || row.contact || null,
      image_url: row.image || row['image url'] || row.photo || null,
      status: 'pending',
      featured: false,
    };
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
        `Import complete: ${successCount} events added${errorCount > 0 ? `, ${errorCount} failed` : ''}`
      );
      setFile(null);
      onImportComplete();
    } catch (err: any) {
      setError(err.message || 'An error occurred during import');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <FileSpreadsheet className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Import Events from CSV</h2>
          <p className="text-gray-600">
            Upload a CSV file containing event data to quickly add multiple events
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">Expected CSV Format:</h3>
          <p className="text-sm text-blue-800 mb-2">
            Your CSV should include the following columns (case-insensitive):
          </p>
          <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
            <li>title, event, or name - Event name</li>
            <li>description or details - Event description</li>
            <li>date or event_date - Event date (YYYY-MM-DD)</li>
            <li>time or event_time - Event time (HH:MM)</li>
            <li>venue or location - Venue name</li>
            <li>address - Street address</li>
            <li>city - City name</li>
            <li>state - State code (e.g., CA, NY)</li>
            <li>zip or zipcode - Zip code</li>
            <li>price or admission - Ticket price</li>
            <li>dress_code - Dress code requirement</li>
            <li>age_limit - Age restrictions</li>
            <li>phone - Contact phone number</li>
            <li>image - Image URL</li>
          </ul>
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
            <p className="text-sm text-green-600">{success}</p>
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
          All imported events will be set to pending status and require admin approval
        </p>
      </div>
    </div>
  );
}
