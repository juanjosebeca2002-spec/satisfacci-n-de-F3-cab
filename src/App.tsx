import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { SurveyForm } from './components/SurveyForm';
import { ResponsesDashboard } from './components/ResponsesDashboard';
import { DirectGoogleSheetsModal } from './components/DirectGoogleSheetsModal';
import { GoogleSheetsSetupModal } from './components/GoogleSheetsSetupModal';
import { HtmlDownloadModal } from './components/HtmlDownloadModal';
import { SurveyResponse } from './types/survey';
import { INITIAL_RESPONSES } from './data/surveyQuestions';
import { initAuth } from './services/googleAuth';
import {
  BarChart3,
  CheckCircle2,
  Code,
  Download,
  FileSpreadsheet,
  HelpCircle,
  Laptop,
  Layers,
  Settings,
  Sparkles
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'form' | 'dashboard'>('form');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [connectedSpreadsheetId, setConnectedSpreadsheetId] = useState<string>('');
  const [connectedSheetTitle, setConnectedSheetTitle] = useState<string>('');
  const [spreadsheetName, setSpreadsheetName] = useState<string>('');

  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [isDirectSheetsModalOpen, setIsDirectSheetsModalOpen] = useState(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [isHtmlModalOpen, setIsHtmlModalOpen] = useState(false);
  const [bannerAlert, setBannerAlert] = useState<string | null>(null);

  // Initialize data and Auth state on mount
  useEffect(() => {
    // Listen for Google Auth changes
    const unsubscribe = initAuth(
      (user) => setCurrentUser(user),
      () => setCurrentUser(null)
    );

    // Load direct Google Sheets connection
    const savedSheetId = localStorage.getItem('f3_spreadsheet_id') || '';
    const savedSheetTab = localStorage.getItem('f3_sheet_tab_title') || '';
    const savedSheetName = localStorage.getItem('f3_spreadsheet_name') || '';
    if (savedSheetId) {
      setConnectedSpreadsheetId(savedSheetId);
      setConnectedSheetTitle(savedSheetTab);
      setSpreadsheetName(savedSheetName);
    }

    // Load webhook URL (if any)
    const savedUrl = localStorage.getItem('f3_sheets_webhook_url');
    if (savedUrl) {
      setWebhookUrl(savedUrl);
    }

    // Load saved responses if any, otherwise start at 0 (empty)
    const savedResponses = localStorage.getItem('f3_survey_responses');
    if (savedResponses) {
      try {
        const parsed = JSON.parse(savedResponses);
        if (Array.isArray(parsed)) {
          setResponses(parsed);
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }
    // Starts with 0 responses
    setResponses([]);

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const handleSaveDirectSpreadsheet = (id: string, sheetTitle: string, name: string) => {
    setConnectedSpreadsheetId(id);
    setConnectedSheetTitle(sheetTitle);
    setSpreadsheetName(name);
    localStorage.setItem('f3_spreadsheet_id', id);
    localStorage.setItem('f3_sheet_tab_title', sheetTitle);
    localStorage.setItem('f3_spreadsheet_name', name);
    setBannerAlert(
      `¡Hoja de cálculo vinculada con éxito! Las respuestas se guardarán directamente en "${name}" sin usar scripts.`
    );
    setTimeout(() => setBannerAlert(null), 6000);
  };

  const handleSaveWebhookUrl = (url: string) => {
    setWebhookUrl(url);
    localStorage.setItem('f3_sheets_webhook_url', url);
    setBannerAlert(
      url
        ? '¡URL de Google Sheets configurada con éxito!'
        : 'Se ha eliminado la URL.'
    );
    setTimeout(() => setBannerAlert(null), 5000);
  };

  const handleResponseSubmitted = (newResponse: SurveyResponse) => {
    setResponses((prev) => {
      const updated = [newResponse, ...prev];
      localStorage.setItem('f3_survey_responses', JSON.stringify(updated));
      return updated;
    });
  };

  const handleClearResponses = () => {
    setResponses([]);
    localStorage.setItem('f3_survey_responses', JSON.stringify([]));
  };

  const handleImportCsv = (csvText: string) => {
    try {
      const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length <= 1) {
        alert('El archivo CSV no contiene registros.');
        return;
      }

      const parseCsvLine = (line: string) => {
        const result: string[] = [];
        let cur = '';
        let insideQuote = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            insideQuote = !insideQuote;
          } else if (char === ',' && !insideQuote) {
            result.push(cur.trim());
            cur = '';
          } else {
            cur += char;
          }
        }
        result.push(cur.trim());
        return result;
      };

      const newRows: SurveyResponse[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCsvLine(lines[i]);
        if (cols.length >= 2) {
          newRows.push({
            id: 'imported-' + Date.now() + '-' + i,
            timestamp: cols[0] || new Date().toLocaleString('es-CO'),
            identificacion: cols[1] || 'Importado',
            relacionCentro: cols[2] || 'Aprendiz',
            frecuenciaUso: cols[3] || 'Diario',
            propositoUso: cols[4] || 'Formación y clases',
            equiposPerifericos: Number(cols[5]) || 4,
            conectividadInternet: Number(cols[6]) || 4,
            softwareRequerido: cols[7] || 'Sí, totalmente',
            iluminacionVentilacion: Number(cols[8]) || 4,
            limpiezaMobiliario: Number(cols[9]) || 4,
            satisfaccionGeneral: Number(cols[10]) || 4,
            recomendaciones: cols[11] || '',
            syncedToGoogleSheets: true
          });
        }
      }

      setResponses((prev) => {
        const combined = [...newRows, ...prev];
        localStorage.setItem('f3_survey_responses', JSON.stringify(combined));
        return combined;
      });

      setBannerAlert(`Se importaron ${newRows.length} respuestas con éxito.`);
      setTimeout(() => setBannerAlert(null), 4000);
    } catch (err: any) {
      alert('Error al leer el archivo CSV: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans">
      
      {/* Institutional Top Navbar */}
      <header className="sticky top-0 z-30 bg-[#00324D] text-white shadow-md border-b-4 border-emerald-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center font-black text-white text-lg shadow-sm">
              <Laptop className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">SENA CAB</span>
                <span className="text-[10px] bg-emerald-600/80 font-bold px-1.5 py-0.5 rounded text-white uppercase tracking-wider">
                  Sala F3
                </span>
              </div>
              <p className="text-[11px] text-slate-300 hidden sm:block">
                Centro Agropecuario de Buga &bull; Encuesta de Satisfacción
              </p>
            </div>
          </div>

          {/* Navigation & Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Tab switch */}
            <div className="bg-white/10 p-1 rounded-xl flex items-center text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  activeTab === 'form'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-slate-200 hover:text-white hover:bg-white/5'
                }`}
              >
                📋 Formulario
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-slate-200 hover:text-white hover:bg-white/5'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Respuestas</span>
                <span className="ml-1 px-1.5 py-0.2 bg-white/20 rounded-full text-[10px]">
                  {responses.length}
                </span>
              </button>
            </div>

            {/* Direct Google Sheets Connection Button (No Scripts!) */}
            <button
              onClick={() => setIsDirectSheetsModalOpen(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                connectedSpreadsheetId
                  ? 'bg-emerald-600 border-emerald-400 text-white shadow-xs hover:bg-emerald-700'
                  : 'bg-emerald-500/20 border-emerald-400 text-emerald-200 hover:bg-emerald-500/30'
              }`}
              title="Vincular con tu Hoja de cálculo de Google directamente sin usar Google Apps Script"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span className="hidden sm:inline">
                {connectedSpreadsheetId
                  ? 'Google Sheets Conectado (Directo)'
                  : 'Vincular Google Sheets (Sin Script)'}
              </span>
            </button>

            {/* Standalone HTML Modal */}
            <button
              onClick={() => setIsHtmlModalOpen(true)}
              className="p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white transition-all"
              title="Descargar o ver archivo HTML del formulario"
            >
              <Code className="w-4 h-4" />
              <span className="hidden lg:inline">Descargar HTML</span>
            </button>

          </div>

        </div>
      </header>

      {/* Notification Banner */}
      {bannerAlert && (
        <div className="bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 text-center flex items-center justify-center gap-2 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{bannerAlert}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 sm:py-8">
        {activeTab === 'form' ? (
          <SurveyForm
            webhookUrl={webhookUrl}
            connectedSpreadsheetId={connectedSpreadsheetId}
            connectedSheetTitle={connectedSheetTitle}
            spreadsheetName={spreadsheetName}
            currentUser={currentUser}
            onOpenDirectSheets={() => setIsDirectSheetsModalOpen(true)}
            onResponseSubmitted={handleResponseSubmitted}
          />
        ) : (
          <ResponsesDashboard
            responses={responses}
            webhookUrl={webhookUrl}
            connectedSpreadsheetId={connectedSpreadsheetId}
            connectedSheetTitle={connectedSheetTitle}
            onOpenDirectSheets={() => setIsDirectSheetsModalOpen(true)}
            onClearResponses={handleClearResponses}
            onImportCsv={handleImportCsv}
            onUpdateResponses={setResponses}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-emerald-600">SENA</span>
            <span>&bull;</span>
            <span>Centro Agropecuario de Buga</span>
            <span>&bull;</span>
            <span className="font-semibold text-slate-700">Sala de Computación F3</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400 text-[11px]">
            <button
              onClick={() => setIsDirectSheetsModalOpen(true)}
              className="hover:text-emerald-700 underline font-semibold text-emerald-800"
            >
              Vincular Hoja de cálculo (Sin Scripts)
            </button>
            <button
              onClick={() => setIsSheetsModalOpen(true)}
              className="hover:text-emerald-700 underline"
            >
              Opciones de Webhook
            </button>
            <button
              onClick={() => setIsHtmlModalOpen(true)}
              className="hover:text-emerald-700 underline"
            >
              Exportar código HTML
            </button>
          </div>
        </div>
      </footer>

      {/* DIRECT Google Sheets Modal (No Google Apps Script required!) */}
      <DirectGoogleSheetsModal
        isOpen={isDirectSheetsModalOpen}
        onClose={() => setIsDirectSheetsModalOpen(false)}
        currentUser={currentUser}
        onUserChanged={setCurrentUser}
        connectedSpreadsheetId={connectedSpreadsheetId}
        connectedSheetTitle={connectedSheetTitle}
        onSaveSpreadsheet={handleSaveDirectSpreadsheet}
      />

      {/* Legacy/Optional Apps Script Modal */}
      <GoogleSheetsSetupModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        webhookUrl={webhookUrl}
        onSaveUrl={handleSaveWebhookUrl}
      />

      {/* HTML Code / Download Modal */}
      <HtmlDownloadModal
        isOpen={isHtmlModalOpen}
        onClose={() => setIsHtmlModalOpen(false)}
        webhookUrl={webhookUrl}
      />

    </div>
  );
}
