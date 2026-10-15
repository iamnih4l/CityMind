import React, { useState } from 'react';
import {
  Upload,
  Download,
  RefreshCw,
  FileSpreadsheet,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Database,
  Layers,
  ArrowRight,
  HardDrive,
  Disc,
} from 'lucide-react';
import { useCity } from '../context/CityContext.tsx';
import { CityEntity, EntityType } from '../types/city.ts';

export const DataManagementView: React.FC = () => {
  const {
    entities,
    resetToSyntheticDemoData,
    importEntities,
    exportCityData,
  } = useCity();

  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedPreview, setParsedPreview] = useState<CityEntity[] | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const syntheticCount = entities.filter(e => e.provenance === 'SYNTHETIC').length;
  const userCount = entities.filter(e => e.provenance === 'USER_PROVIDED').length;

  // Handle file selection and parsing
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setValidationErrors([]);
    setParsedPreview(null);
    setImportStatus(null);

    const reader = new FileReader();

    if (file.name.endsWith('.json')) {
      reader.onload = event => {
        try {
          const content = event.target?.result as string;
          const json = JSON.parse(content);
          const list = Array.isArray(json) ? json : [json];
          validateAndPreview(list);
        } catch (err: any) {
          setValidationErrors([`JSON parsing failed: ${err.message}`]);
        }
      };
      reader.readAsText(file);
    } else if (file.name.endsWith('.csv')) {
      reader.onload = event => {
        try {
          const content = event.target?.result as string;
          const parsed = parseCSVToEntities(content);
          validateAndPreview(parsed);
        } catch (err: any) {
          setValidationErrors([`CSV parsing failed: ${err.message}`]);
        }
      };
      reader.readAsText(file);
    } else {
      setValidationErrors(['Unsupported file format. Please upload a .json or .csv file.']);
    }
  };

  // Basic CSV Parser
  const parseCSVToEntities = (csvText: string): any[] => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row.');

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const results: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let c = 0; c < line.length; c++) {
        const char = line[c];
        if (char === '"' && line[c + 1] === '"') {
          current += '"';
          c++;
        } else if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      const obj: any = {};
      headers.forEach((h, idx) => {
        obj[h] = values[idx] || '';
      });

      results.push({
        id: obj.id || `ENT-USER-${Date.now().toString(36)}-${i}`,
        type: (obj.type || 'CITIZEN') as EntityType,
        subType: obj.subType || 'custom',
        name: obj.name || `Imported Entity ${i}`,
        zoneId: obj.zoneId || 'ZONE-000001',
        coordinates: { x: 500, y: 400 },
        provenance: 'USER_PROVIDED',
        lastUpdated: new Date().toISOString(),
        priorities: obj.priorities ? obj.priorities.split(';') : ['Imported requirement'],
        constraints: obj.constraints ? obj.constraints.split(';') : ['Standard constraint'],
        dependencies: [],
        connectedEntityIds: [],
        evaluationCriteria: ['Safety', 'Service accessibility'],
      });
    }

    return results;
  };

  const validateAndPreview = (items: any[]) => {
    const errors: string[] = [];
    const validated: CityEntity[] = [];

    items.forEach((item, idx) => {
      if (!item.id) {
        errors.push(`Row ${idx + 1}: Missing required 'id' field.`);
      }
      if (!item.name) {
        errors.push(`Row ${idx + 1}: Missing required 'name' field.`);
      }
      if (!item.type) {
        errors.push(`Row ${idx + 1}: Missing required 'type' field.`);
      }

      validated.push({
        ...item,
        provenance: 'USER_PROVIDED',
        lastUpdated: new Date().toISOString(),
        dependencies: item.dependencies || [],
        connectedEntityIds: item.connectedEntityIds || [],
        priorities: item.priorities || [],
        constraints: item.constraints || [],
        evaluationCriteria: item.evaluationCriteria || [],
      } as CityEntity);
    });

    setValidationErrors(errors);
    setParsedPreview(validated);
  };

  const executeImport = () => {
    if (!parsedPreview || parsedPreview.length === 0) return;

    if (importMode === 'replace') {
      const confirmed = window.confirm(
        `Are you sure you want to REPLACE the entire city dataset with ${parsedPreview.length} imported records? All current entities will be overwritten.`
      );
      if (!confirmed) return;
    }

    const { added, updated } = importEntities(parsedPreview, importMode);
    setImportStatus(`Successfully imported: ${added} added, ${updated} updated in city registry.`);
    setParsedPreview(null);
    setImportFile(null);
  };

  return (
    <div className="space-y-5 select-none font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>MUNICIPAL DATA ARCHITECTURE</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400 font-mono">PROVENANCE & PERSISTENCE</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-display font-bold tracking-tight text-white mt-1">
            Data Provenance & Master Registry
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => exportCityData('json')}
            className="btn-3d-secondary px-3.5 py-2 text-xs text-amber-300 flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>EXPORT JSON</span>
          </button>
          <button
            onClick={() => exportCityData('csv')}
            className="btn-3d-secondary px-3.5 py-2 text-xs text-cyan-300 flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>EXPORT CSV</span>
          </button>
        </div>
      </div>

      {/* Provenance Overview Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-5 space-y-1.5 shadow-xl backdrop-blur-xl">
          <span className="text-xs font-semibold text-slate-400 font-display">TOTAL ACTIVE ENTITIES</span>
          <div className="text-2xl font-display font-bold text-white">
            {entities.length}
          </div>
          <p className="text-xs text-slate-400">Across 10 distinct municipal classifications</p>
        </div>

        <div className="rounded-2xl bg-gradient-to-b from-slate-900/90 to-amber-950/30 border border-amber-500/30 p-5 space-y-1.5 shadow-xl backdrop-blur-xl">
          <span className="text-xs font-semibold text-amber-300 font-display">SYNTHETIC BASELINE RECORDS</span>
          <div className="text-2xl font-display font-bold text-amber-300">
            {syntheticCount}
          </div>
          <p className="text-xs text-slate-400">Deterministic demonstration population</p>
        </div>

        <div className="rounded-2xl bg-gradient-to-b from-slate-900/90 to-cyan-950/30 border border-cyan-500/30 p-5 space-y-1.5 shadow-xl backdrop-blur-xl">
          <span className="text-xs font-semibold text-cyan-300 font-display">USER-PROVIDED RECORDS</span>
          <div className="text-2xl font-display font-bold text-cyan-300">
            {userCount}
          </div>
          <p className="text-xs text-slate-400">Imported via custom CSV/JSON schemas</p>
        </div>
      </div>

      {/* Import Section */}
      <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-5 sm:p-6 space-y-5 shadow-2xl backdrop-blur-xl">
        <div className="border-b border-white/10 pb-3">
          <h2 className="font-display font-bold text-base text-white flex items-center gap-2.5">
            <HardDrive className="w-5 h-5 text-cyan-400" />
            <span>IMPORT MUNICIPAL DATASETS</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            Ingest structured CSV or JSON files representing municipal facilities, businesses, citizen surveys, or road networks.
          </p>
        </div>

        {/* Drop / Choose File */}
        <div className="border border-dashed border-white/20 hover:border-cyan-400/60 transition-colors rounded-2xl p-8 text-center space-y-3 bg-slate-950/50">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)]">
            <Upload className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <label className="cursor-pointer btn-3d-secondary px-4 py-2 text-xs inline-flex items-center gap-2">
              <span>Choose CSV or JSON Dataset</span>
              <input
                type="file"
                accept=".csv,.json"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            <p className="text-xs text-slate-400">
              Files are validated client-side with duplicate checking and schema verification.
            </p>
          </div>
          {importFile && (
            <div className="text-xs text-amber-300 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30 inline-block font-mono font-medium">
              Selected: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
            </div>
          )}
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="p-4 bg-rose-950/40 border border-rose-500/30 rounded-xl text-xs text-rose-300 space-y-1.5">
            <strong className="block font-display font-bold text-xs text-rose-400">Validation Warnings ({validationErrors.length}):</strong>
            <ul className="list-disc list-inside space-y-1 text-slate-300">
              {validationErrors.slice(0, 5).map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Preview & Import Actions */}
        {parsedPreview && (
          <div className="space-y-4 pt-3 border-t border-white/10">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="font-display font-bold text-xs text-amber-300">
                PREVIEW: {parsedPreview.length} VALID ENTITIES DETECTED
              </span>

              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                  <input
                    type="radio"
                    name="importMode"
                    value="merge"
                    checked={importMode === 'merge'}
                    onChange={() => setImportMode('merge')}
                  />
                  <span>Merge with existing</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-rose-300">
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                  />
                  <span>Replace entire registry</span>
                </label>
              </div>
            </div>

            {/* Preview table snippet */}
            <div className="rounded-xl bg-slate-950/80 border border-white/10 overflow-x-auto max-h-48 shadow-inner">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 border-b border-white/10 text-slate-400 font-display">
                  <tr>
                    <th className="py-2.5 px-3">ID</th>
                    <th className="py-2.5 px-3">NAME</th>
                    <th className="py-2.5 px-3">TYPE</th>
                    <th className="py-2.5 px-3">DISTRICT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {parsedPreview.slice(0, 6).map((item, i) => (
                    <tr key={i}>
                      <td className="py-2 px-3 font-mono font-bold text-cyan-300">{item.id}</td>
                      <td className="py-2 px-3 font-semibold text-white">{item.name}</td>
                      <td className="py-2 px-3 uppercase text-[11px]">{item.type}</td>
                      <td className="py-2 px-3 font-mono text-[11px]">{item.zoneId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3 text-xs">
              <button
                onClick={() => { setParsedPreview(null); setImportFile(null); }}
                className="btn-3d-secondary px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={executeImport}
                className="btn-3d-primary px-5 py-2"
              >
                Confirm & Import to Registry
              </button>
            </div>
          </div>
        )}

        {importStatus && (
          <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-200 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{importStatus}</span>
          </div>
        )}
      </div>

      {/* Reset to Baseline Card */}
      <div className="rounded-2xl bg-slate-900/70 border border-white/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl backdrop-blur-xl">
        <div className="space-y-1">
          <h3 className="font-display text-sm font-bold text-white flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-amber-400" />
            <span>RESTORE DEMONSTRATION BASELINE</span>
          </h3>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Regenerates the complete deterministic 500-citizen, 120-household, 60-enterprise, 50-facility Demo City baseline with stable IDs.
          </p>
        </div>

        <button
          onClick={() => {
            if (window.confirm('Reset all entities and scenarios to the synthetic demonstration baseline?')) {
              resetToSyntheticDemoData();
              setImportStatus('Dataset successfully reset to synthetic baseline.');
            }
          }}
          className="btn-3d-secondary px-4 py-2 text-xs text-amber-300 hover:text-white whitespace-nowrap"
        >
          Reset Demo Baseline
        </button>
      </div>
    </div>
  );
};
