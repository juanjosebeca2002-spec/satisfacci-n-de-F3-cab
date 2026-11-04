import React, { useState } from 'react';
import { generateStandaloneHtml } from '../services/googleSheetsService';
import { Check, Copy, Download, FileCode, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  webhookUrl: string;
}

export const HtmlDownloadModal: React.FC<Props> = ({ isOpen, onClose, webhookUrl }) => {
  const [copied, setCopied] = useState(false);
  const htmlContent = generateStandaloneHtml(webhookUrl);

  if (!isOpen) return null;

  const handleDownload = () => {
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formulario_satisfaccion_sala_f3.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(htmlContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 text-blue-600">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Archivo HTML Autónomo del Formulario</h3>
              <p className="text-xs text-slate-500">
                Descarga el archivo <code>.html</code> listo para usar en cualquier navegador, intranet o servidor
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-emerald-900">Formulario 100% Autónomo en HTML5 + CSS + JS</h4>
              <p className="text-xs text-emerald-700 mt-1 max-w-xl">
                Este archivo contiene el formulario completo con las 10 preguntas optimizadas para la Sala F3 del Centro Agropecuario de Buga. Funciona sin dependencias externas y envía directamente las respuestas a tu Hoja de cálculo de Google.
              </p>
              {webhookUrl ? (
                <p className="text-[11px] text-emerald-800 mt-2 font-mono bg-white/70 px-2 py-1 rounded inline-block">
                  Conectado al Webhook: {webhookUrl.slice(0, 45)}...
                </p>
              ) : (
                <p className="text-[11px] text-amber-800 mt-2 bg-amber-100 px-2 py-1 rounded inline-block">
                  Nota: Aún no has configurado una URL de Google Sheets; las respuestas se guardarán localmente en el navegador.
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all hover:shadow"
              >
                <Download className="w-4 h-4" />
                Descargar .HTML
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Código fuente completo (HTML + CSS embebido + JS)
              </span>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? '¡Código Copiado!' : 'Copiar todo el código'}
              </button>
            </div>

            <div className="bg-slate-900 rounded-xl p-4 overflow-hidden text-slate-300 font-mono text-[11px] max-h-96 overflow-y-auto">
              <pre>{htmlContent}</pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl">
          <span className="text-xs text-slate-500">
            Puedes abrir el archivo descargado directamente con doble clic en Chrome, Edge o Firefox.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
