import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  googleSignIn,
  logout,
  getAccessToken,
  initAuth
} from '../services/googleAuth';
import {
  extractSpreadsheetId,
  getSpreadsheetDetails,
  createNewSpreadsheetInDrive,
  USER_SHEET_HEADERS,
  DEFAULT_SPREADSHEET_ID,
  DEFAULT_SHEET_TAB_TITLE,
  DEFAULT_SPREADSHEET_NAME,
  SpreadsheetInfo
} from '../services/googleSheetsApi';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ExternalLink,
  FileSpreadsheet,
  Link2,
  LogOut,
  PlusCircle,
  RefreshCw,
  Sparkles,
  X
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onUserChanged: (user: User | null) => void;
  connectedSpreadsheetId: string;
  connectedSheetTitle: string;
  onSaveSpreadsheet: (id: string, sheetTitle: string, spreadsheetName: string) => void;
}

export const DirectGoogleSheetsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChanged,
  connectedSpreadsheetId,
  connectedSheetTitle,
  onSaveSpreadsheet
}) => {
  const [sheetUrlInput, setSheetUrlInput] = useState(connectedSpreadsheetId || DEFAULT_SPREADSHEET_ID);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [sheetInfo, setSheetInfo] = useState<SpreadsheetInfo | null>(null);
  const [selectedSheetTab, setSelectedSheetTab] = useState(connectedSheetTitle || DEFAULT_SHEET_TAB_TITLE);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setSheetUrlInput(connectedSpreadsheetId || DEFAULT_SPREADSHEET_ID);
    setSelectedSheetTab(connectedSheetTitle || DEFAULT_SHEET_TAB_TITLE);
  }, [connectedSpreadsheetId, connectedSheetTitle]);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setStatusMessage(null);
    try {
      const res = await googleSignIn();
      if (res?.user) {
        onUserChanged(res.user);
        setStatusMessage({
          type: 'success',
          text: `Sesión iniciada como ${res.user.displayName || res.user.email}`
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: 'Error al iniciar sesión con Google: ' + (err.message || 'Inténtalo de nuevo')
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    onUserChanged(null);
    setSheetInfo(null);
    setStatusMessage({ type: 'success', text: 'Sesión cerrada.' });
  };

  const handleVerifyAndLink = async () => {
    const rawId = extractSpreadsheetId(sheetUrlInput);
    if (!rawId) {
      setStatusMessage({ type: 'error', text: 'Por favor ingresa el enlace o ID de tu Hoja de cálculo de Google.' });
      return;
    }

    const token = await getAccessToken();
    if (!token) {
      setStatusMessage({ type: 'error', text: 'Por favor inicia sesión con tu cuenta de Google primero.' });
      return;
    }

    setIsVerifying(true);
    setStatusMessage(null);

    try {
      const details = await getSpreadsheetDetails(rawId, token);
      setSheetInfo(details);
      const defaultTab = details.sheets[0]?.title || 'Hoja 1';
      setSelectedSheetTab(defaultTab);
      onSaveSpreadsheet(details.id, defaultTab, details.title);

      setStatusMessage({
        type: 'success',
        text: `¡Hoja vinculada exitosamente! Título: "${details.title}" (${details.sheets.length} pestañas encontradas).`
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: 'No se pudo conectar: ' + (err.message || 'Verifica los permisos de la hoja')
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCreateNewSheet = async () => {
    const token = await getAccessToken();
    if (!token) {
      setStatusMessage({ type: 'error', text: 'Debes iniciar sesión con Google para crear la hoja en tu cuenta.' });
      return;
    }

    setIsCreatingNew(true);
    setStatusMessage(null);

    try {
      const result = await createNewSpreadsheetInDrive(
        'Encuesta Satisfacción Sala F3 - Centro Agropecuario Buga',
        USER_SHEET_HEADERS,
        token
      );

      setSheetUrlInput(result.spreadsheetId);
      setSelectedSheetTab(result.sheetTitle);
      onSaveSpreadsheet(
        result.spreadsheetId,
        result.sheetTitle,
        'Encuesta Satisfacción Sala F3 - Centro Agropecuario Buga'
      );

      setSheetInfo({
        id: result.spreadsheetId,
        title: 'Encuesta Satisfacción Sala F3 - Centro Agropecuario Buga',
        sheets: [{ title: result.sheetTitle, sheetId: 0 }]
      });

      setStatusMessage({
        type: 'success',
        text: `¡Nueva hoja de cálculo creada con éxito en tu Google Drive! Las respuestas se guardarán directamente en ella.`
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: 'Error creando la hoja: ' + (err.message || 'Verifica los permisos')
      });
    } finally {
      setIsCreatingNew(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Vincular con Google Sheets Directo</h3>
              <p className="text-xs text-slate-500">Sin Apps Script &bull; Mediante la API oficial de Google Sheets</p>
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

          {/* Step 1: Google Account Authentication */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Paso 1: Conectar tu Cuenta de Google
              </span>
              {currentUser && (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Conectado
                </span>
              )}
            </div>

            {!currentUser ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  Para guardar las respuestas directamente en tu Hoja de cálculo de Google sin usar ningún script, inicia sesión con tu cuenta de Google:
                </p>

                {/* Official Material Google Sign-In Button */}
                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={isSigningIn}
                  className="w-full flex items-center justify-center gap-3 px-5 py-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm border border-slate-300 rounded-xl shadow-xs transition-all hover:shadow cursor-pointer"
                >
                  <svg className="w-5 h-5" viewBox="0 0 48 48">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                  <span>{isSigningIn ? 'Iniciando sesión con Google...' : 'Iniciar sesión con Google'}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl">
                <div className="flex items-center gap-3">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt="Avatar"
                      className="w-9 h-9 rounded-full ring-2 ring-emerald-500"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                      {currentUser.displayName?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      {currentUser.displayName || 'Usuario de Google'}
                    </p>
                    <p className="text-[11px] text-slate-500">{currentUser.email}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Cambiar cuenta
                </button>
              </div>
            )}
          </div>

          {/* Step 2: Select or Link Spreadsheet */}
          <div className={`p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 ${!currentUser ? 'opacity-50 pointer-events-none' : ''}`}>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Paso 2: Seleccionar tu Hoja de cálculo
            </span>

            {/* Option A: Link existing sheet */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Pega el enlace o ID de tu Hoja de cálculo de Google:
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={sheetUrlInput}
                  onChange={(e) => setSheetUrlInput(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs.../edit"
                  className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                />
                <button
                  type="button"
                  onClick={handleVerifyAndLink}
                  disabled={isVerifying || !sheetUrlInput}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0 disabled:bg-slate-300"
                >
                  <Link2 className="w-4 h-4" />
                  {isVerifying ? 'Verificando...' : 'Vincular Hoja'}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Asegúrate de que la hoja pertenezca a tu cuenta o esté compartida con permisos de edición.
              </p>
            </div>

            {/* Option B: Create new sheet button */}
            <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-600">
                ¿Prefieres crear una nueva hoja con los encabezados oficiales?
              </span>
              <button
                type="button"
                onClick={handleCreateNewSheet}
                disabled={isCreatingNew}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold border border-slate-300 rounded-xl transition-colors shrink-0"
              >
                <PlusCircle className="w-4 h-4 text-emerald-600" />
                {isCreatingNew ? 'Creando en Drive...' : 'Crear nueva Hoja en mi Drive'}
              </button>
            </div>

            {/* Active Connected Info */}
            {connectedSpreadsheetId && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Hoja de cálculo activa vinculada
                  </span>
                  <a
                    href={`https://docs.google.com/spreadsheets/d/${connectedSpreadsheetId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 hover:text-emerald-900 font-bold underline flex items-center gap-1"
                  >
                    Abrir en Google Sheets <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-[11px] text-emerald-800 font-mono">
                  ID: {connectedSpreadsheetId}
                </p>
                <p className="text-[11px] text-emerald-700">
                  Pestaña destino: <strong>{connectedSheetTitle || 'Respuestas de la Encuesta'}</strong>
                </p>
              </div>
            )}
          </div>

          {/* Status feedback */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl text-xs font-medium flex items-start gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100 rounded-b-3xl">
          <span className="text-xs text-slate-500">
            Cada respuesta enviada en el formulario se agregará como una fila en tu hoja automáticamente.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors"
          >
            Listo
          </button>
        </div>

      </div>
    </div>
  );
};
