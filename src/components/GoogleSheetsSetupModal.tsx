import React, { useState } from 'react';
import { DEFAULT_GOOGLE_APPS_SCRIPT_CODE } from '../services/googleSheetsService';
import { Check, Copy, ExternalLink, HelpCircle, Key, RefreshCw, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  webhookUrl: string;
  onSaveUrl: (url: string) => void;
}

export const GoogleSheetsSetupModal: React.FC<Props> = ({
  isOpen,
  onClose,
  webhookUrl,
  onSaveUrl,
}) => {
  const [urlInput, setUrlInput] = useState(webhookUrl);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(DEFAULT_GOOGLE_APPS_SCRIPT_CODE);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = () => {
    onSaveUrl(urlInput.trim());
    onClose();
  };

  const handleTest = async () => {
    if (!urlInput.trim()) {
      setTestResult({ success: false, message: 'Ingresa primero la URL de tu Google Apps Script.' });
      return;
    }
    setIsTesting(true);
    setTestResult(null);

    try {
      const sample = {
        timestamp: new Date().toLocaleString('es-CO'),
        identificacion: 'Prueba de Conexión Automática',
        relacionCentro: 'Sistema',
        frecuenciaUso: 'Prueba',
        propositoUso: 'Verificación de Webhook',
        equiposPerifericos: 5,
        conectividadInternet: 5,
        softwareRequerido: 'Sí, totalmente',
        iluminacionVentilacion: 5,
        limpiezaMobiliario: 5,
        satisfaccionGeneral: 5,
        recomendaciones: 'Fila de prueba generada desde la aplicación web de la Sala F3.'
      };

      await fetch(urlInput.trim(), {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(sample)
      });

      setTestResult({
        success: true,
        message: '¡Prueba enviada! Revisa tu Hoja de cálculo de Google, deberías ver una nueva fila con la prueba.'
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: 'Error al conectar: ' + (err.message || 'Verifica la URL')
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="8" y1="13" x2="16" y2="13"></line>
                <line x1="8" y1="17" x2="16" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Conectar con Hoja de Cálculo de Google</h3>
              <p className="text-xs text-slate-500">Configura la recepción automática de respuestas en tu Google Sheet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">

          {/* URL Input Box */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <label className="block text-sm font-bold text-slate-800 mb-1">
              URL de tu Aplicación Web de Google (Apps Script Web App URL)
            </label>
            <p className="text-xs text-slate-500 mb-3">
              Pega aquí la URL que te genera Google Apps Script al implementar tu hoja.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                className="flex-1 px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono text-xs"
              />
              <button
                type="button"
                onClick={handleTest}
                disabled={isTesting}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                {isTesting ? 'Probando...' : 'Probar conexión'}
              </button>
            </div>

            {testResult && (
              <div
                className={`mt-3 p-3 text-xs rounded-lg flex items-start gap-2 ${
                  testResult.success
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
              >
                <span className="font-bold">{testResult.success ? '✓' : 'ℹ'}</span>
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* Step-by-Step Instructions */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
              <span>Paso a paso para crear tu Hoja en Google</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                Toma solo 1 minuto
              </span>
            </h4>

            <ol className="space-y-4 text-sm text-slate-600">
              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <p className="font-semibold text-slate-800">Crea una nueva Hoja de cálculo de Google</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Entra a{' '}
                    <a
                      href="https://sheets.new"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 underline font-medium inline-flex items-center gap-0.5"
                    >
                      sheets.new <ExternalLink className="w-3 h-3" />
                    </a>{' '}
                    y nómbrala como quieras (ej. <em>"Encuesta Satisfacción Sala F3 - Buga"</em>).
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold shrink-0 mt-0.5">
                  2
                </span>
                <div className="w-full">
                  <p className="font-semibold text-slate-800">Abre Apps Script y pega el código receptor</p>
                  <p className="text-xs text-slate-500 mt-0.5 mb-2">
                    En el menú de Google Sheets, ve a <strong>Extensiones &gt; Apps Script</strong>. Borra el código existente y pega el siguiente:
                  </p>

                  <div className="relative bg-slate-900 rounded-xl p-4 overflow-hidden text-slate-200 text-xs font-mono">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                      <span className="text-slate-400 text-[11px]">Código Apps Script (doPost)</span>
                      <button
                        onClick={handleCopyCode}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedCode ? '¡Copiado!' : 'Copiar código'}
                      </button>
                    </div>
                    <pre className="max-h-48 overflow-y-auto text-[11px] leading-relaxed text-slate-300">
                      {DEFAULT_GOOGLE_APPS_SCRIPT_CODE}
                    </pre>
                  </div>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <p className="font-semibold text-slate-800">Implementar como Aplicación Web</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Arriba a la derecha en Apps Script haz clic en <strong>Implementar &gt; Nueva implementación</strong>.
                    <br />
                    - Tipo: <strong>Aplicación web</strong>
                    <br />
                    - Ejecutar como: <strong>Yo (tu cuenta)</strong>
                    <br />
                    - Quién tiene acceso: <strong>Cualquier usuario</strong> (esto permite que los aprendices envíen la encuesta sin necesidad de iniciar sesión de Google).
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold shrink-0 mt-0.5">
                  4
                </span>
                <div>
                  <p className="font-semibold text-slate-800">Copia la URL de la aplicación web y guárdala aquí</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Google te dará una URL que termina en <code>/exec</code>. Pégala en el campo de arriba y presiona <strong>Guardar Conexión</strong>. ¡Listo!
                  </p>
                </div>
              </li>
            </ol>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors"
          >
            Guardar Conexión
          </button>
        </div>

      </div>
    </div>
  );
};
