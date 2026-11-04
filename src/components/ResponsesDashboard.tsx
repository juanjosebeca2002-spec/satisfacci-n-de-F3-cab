import React, { useState } from 'react';
import { SurveyResponse } from '../types/survey';
import { exportResponsesToCsv, exportResponsesToTsv, sendResponseToGoogleSheets } from '../services/googleSheetsService';
import { appendRowToGoogleSheet, mapSurveyResponseToRow, USER_SHEET_HEADERS } from '../services/googleSheetsApi';
import { getAccessToken } from '../services/googleAuth';
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  FileSpreadsheet,
  Filter,
  RefreshCw,
  Search,
  Sparkles,
  Star,
  Trash2,
  Upload,
  UserCheck
} from 'lucide-react';

interface Props {
  responses: SurveyResponse[];
  webhookUrl: string;
  connectedSpreadsheetId?: string;
  connectedSheetTitle?: string;
  onOpenDirectSheets?: () => void;
  onClearResponses: () => void;
  onImportCsv: (csvContent: string) => void;
  onUpdateResponses: (responses: SurveyResponse[]) => void;
}

export const ResponsesDashboard: React.FC<Props> = ({
  responses,
  webhookUrl,
  connectedSpreadsheetId,
  connectedSheetTitle,
  onOpenDirectSheets,
  onClearResponses,
  onImportCsv,
  onUpdateResponses
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [copiedTsv, setCopiedTsv] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Metrics calculations
  const total = responses.length;
  const avgSatisfaction = total > 0
    ? (responses.reduce((acc, r) => acc + Number(r.satisfaccionGeneral || 0), 0) / total).toFixed(1)
    : '0';

  const avgEquipos = total > 0
    ? (responses.reduce((acc, r) => acc + Number(r.equiposPerifericos || 0), 0) / total).toFixed(1)
    : '0';

  const avgInternet = total > 0
    ? (responses.reduce((acc, r) => acc + Number(r.conectividadInternet || 0), 0) / total).toFixed(1)
    : '0';

  const avgClima = total > 0
    ? (responses.reduce((acc, r) => acc + Number(r.iluminacionVentilacion || 0), 0) / total).toFixed(1)
    : '0';

  const highSatisfactionPercentage = total > 0
    ? Math.round((responses.filter((r) => Number(r.satisfaccionGeneral) >= 4).length / total) * 100)
    : 0;

  // Filtered responses
  const filteredResponses = responses.filter((r) => {
    const matchesRole = roleFilter === 'ALL' || r.relacionCentro === roleFilter;
    const matchesSearch =
      searchTerm === '' ||
      (r.identificacion || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.recomendaciones || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.propositoUso || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const handleDownloadCsv = () => {
    const csv = exportResponsesToCsv(responses);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `respuestas_sala_f3_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyTsv = async () => {
    const tsv = exportResponsesToTsv(responses);
    try {
      await navigator.clipboard.writeText(tsv);
      setCopiedTsv(true);
      setTimeout(() => setCopiedTsv(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSyncAllToGoogleSheets = async () => {
    // 1. Direct Google Sheets API (no scripts)
    if (connectedSpreadsheetId) {
      const token = await getAccessToken();
      if (!token) {
        if (onOpenDirectSheets) onOpenDirectSheets();
        alert('Por favor inicia sesión con Google para sincronizar directamente con tu Hoja de cálculo.');
        return;
      }

      setIsSyncing(true);
      setSyncStatus('Enviando respuestas directamente a Google Sheets...');
      let sentCount = 0;
      let errorCount = 0;

      for (const r of responses) {
        try {
          const rowValues = mapSurveyResponseToRow(r, USER_SHEET_HEADERS);
          await appendRowToGoogleSheet(
            connectedSpreadsheetId,
            connectedSheetTitle || 'Respuestas de la Encuesta',
            rowValues,
            token
          );
          sentCount++;
        } catch (e) {
          console.error(e);
          errorCount++;
        }
      }

      const updated = responses.map((r) => ({ ...r, syncedToGoogleSheets: true }));
      onUpdateResponses(updated);
      setIsSyncing(false);
      setSyncStatus(`¡${sentCount} respuestas registradas directamente en tu Hoja de cálculo de Google (sin scripts)!`);
      setTimeout(() => setSyncStatus(null), 5000);
      return;
    }

    // 2. Webhook fallback
    if (webhookUrl) {
      setIsSyncing(true);
      setSyncStatus('Enviando respuestas...');
      let sentCount = 0;
      for (const r of responses) {
        await sendResponseToGoogleSheets(r, webhookUrl);
        sentCount++;
      }
      const updated = responses.map((r) => ({ ...r, syncedToGoogleSheets: true }));
      onUpdateResponses(updated);
      setIsSyncing(false);
      setSyncStatus(`¡${sentCount} respuestas enviadas exitosamente a tu Hoja de cálculo de Google!`);
      setTimeout(() => setSyncStatus(null), 4000);
      return;
    }

    if (onOpenDirectSheets) {
      onOpenDirectSheets();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onImportCsv(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">

      {/* Top Banner with Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Respuestas Totales</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-800">{total}</span>
            <span className="text-xs text-emerald-700 font-semibold">{highSatisfactionPercentage}% positivas (4-5★)</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Satisfacción Global</span>
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-800">{avgSatisfaction}</span>
            <span className="text-xs text-slate-400">/ 5.0</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Equipos y Computadores</span>
            <BarChart3 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-800">{avgEquipos}</span>
            <span className="text-xs text-slate-400">/ 5.0</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Internet y Conectividad</span>
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-800">{avgInternet}</span>
            <span className="text-xs text-slate-400">/ 5.0</span>
          </div>
        </div>

      </div>

      {/* Sync Status Banner */}
      {syncStatus && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{syncStatus}</span>
        </div>
      )}

      {/* Action Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search and filter */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, ficha o comentario..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-hidden"
          >
            <option value="ALL">Todos los roles</option>
            <option value="Aprendiz">Solo Aprendices</option>
            <option value="Instructor">Solo Instructores</option>
            <option value="Funcionario">Funcionarios</option>
            <option value="Egresado">Egresados</option>
            <option value="Visitante">Visitantes</option>
          </select>
        </div>

        {/* Export / Sync Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          
          <button
            onClick={handleCopyTsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            title="Copia los datos en formato tabla para pegarlos directo con Ctrl+V en Google Sheets"
          >
            <Copy className="w-3.5 h-3.5 text-slate-600" />
            {copiedTsv ? '¡Copiado para Sheets!' : 'Copiar para Google Sheets'}
          </button>

          <button
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            Descargar CSV
          </button>

          {(connectedSpreadsheetId || webhookUrl) ? (
            <button
              onClick={handleSyncAllToGoogleSheets}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Sincronizando...' : 'Enviar a Google Sheets'}
            </button>
          ) : (
            <button
              onClick={onOpenDirectSheets}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              Vincular Google Sheets
            </button>
          )}

          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
            <Upload className="w-3.5 h-3.5" />
            Importar CSV
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>

          {responses.length > 0 && (
            <button
              onClick={() => {
                if (confirm('¿Estás seguro de que deseas limpiar el registro local de respuestas?')) {
                  onClearResponses();
                }
              }}
              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
              title="Borrar respuestas registradas"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

        </div>

      </div>

      {/* Responses Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Registro de Respuestas ({filteredResponses.length})
          </span>
          <span className="text-xs text-slate-500">
            Ambiente F3 &bull; Centro Agropecuario de Buga
          </span>
        </div>

        {filteredResponses.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Filter className="w-6 h-6 opacity-60" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">El registro está en cero (0 respuestas)</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Las preguntas del formulario inician totalmente en blanco para que los usuarios y aprendices las respondan por primera vez.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/75 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Fecha / Hora</th>
                  <th className="py-3 px-4">Identificación</th>
                  <th className="py-3 px-4">Rol</th>
                  <th className="py-3 px-4">Frecuencia</th>
                  <th className="py-3 px-4 text-center">Equipos</th>
                  <th className="py-3 px-4 text-center">Internet</th>
                  <th className="py-3 px-4 text-center">Global</th>
                  <th className="py-3 px-4">Recomendaciones y comentarios</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredResponses.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {r.timestamp}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                      {r.identificacion || <span className="text-slate-400 font-normal italic">Anónimo</span>}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {r.relacionCentro}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {r.frecuenciaUso}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-700">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-blue-50 text-blue-700">
                        {r.equiposPerifericos}★
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-700">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-indigo-50 text-indigo-700">
                        {r.conectividadInternet}★
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-700">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md ${
                        Number(r.satisfaccionGeneral) >= 4
                          ? 'bg-emerald-100 text-emerald-800'
                          : Number(r.satisfaccionGeneral) === 3
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {r.satisfaccionGeneral}★
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs">
                      {r.recomendaciones ? (
                        <p className="line-clamp-2 text-xs" title={r.recomendaciones}>
                          {r.recomendaciones}
                        </p>
                      ) : (
                        <span className="text-slate-300 italic">Sin comentarios</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
};
