import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { User } from 'firebase/auth';
import { SURVEY_QUESTIONS } from '../data/surveyQuestions';
import { SurveyResponse } from '../types/survey';
import { sendResponseToGoogleSheets } from '../services/googleSheetsService';
import { appendRowToGoogleSheet, mapSurveyResponseToRow, USER_SHEET_HEADERS, DEFAULT_SHEET_TAB_TITLE } from '../services/googleSheetsApi';
import { getAccessToken, googleSignIn } from '../services/googleAuth';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileSpreadsheet,
  Layers,
  ListOrdered,
  Send,
  Sparkles,
  Star
} from 'lucide-react';

interface Props {
  webhookUrl: string;
  connectedSpreadsheetId?: string;
  connectedSheetTitle?: string;
  spreadsheetName?: string;
  currentUser?: User | null;
  onOpenDirectSheets: () => void;
  onResponseSubmitted: (response: SurveyResponse) => void;
}

// Formulario en cero: todas las preguntas inician sin responder
export const INITIAL_BLANK_FORM: Record<string, any> = {
  identificacion: '',
  relacionCentro: '',
  frecuenciaUso: '',
  propositoUso: '',
  equiposPerifericos: 0,
  conectividadInternet: 0,
  softwareRequerido: '',
  iluminacionVentilacion: 0,
  limpiezaMobiliario: 0,
  satisfaccionGeneral: 0,
  recomendaciones: ''
};

export const SurveyForm: React.FC<Props> = ({
  webhookUrl,
  connectedSpreadsheetId,
  connectedSheetTitle,
  spreadsheetName,
  currentUser,
  onOpenDirectSheets,
  onResponseSubmitted
}) => {
  // Form view mode: 'step' (wizard) or 'full' (all questions)
  const [viewMode, setViewMode] = useState<'full' | 'step'>('full');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Form values (inicializa totalmente en cero)
  const [formData, setFormData] = useState<Record<string, any>>(INITIAL_BLANK_FORM);

  const [hoverRating, setHoverRating] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedResponse, setSubmittedResponse] = useState<SurveyResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sheetFeedback, setSheetFeedback] = useState<string | null>(null);

  const totalQuestions = SURVEY_QUESTIONS.length; // 10 questions

  const handleFieldChange = (fieldId: string, value: any) => {
    setErrorMessage(null);
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  const isQuestionAnswered = (q: (typeof SURVEY_QUESTIONS)[0]) => {
    const val = formData[q.id];
    if (val === undefined || val === null || val === '') return false;
    if (q.type === 'rating-stars' || q.type === 'rating-buttons') {
      return Number(val) > 0;
    }
    return true;
  };

  const handleNextStep = () => {
    const currentQ = SURVEY_QUESTIONS[currentStepIndex];
    if (currentQ.required && !isQuestionAnswered(currentQ)) {
      setErrorMessage(`Por favor responde la pregunta ${currentQ.number} antes de continuar.`);
      return;
    }
    setErrorMessage(null);
    if (currentStepIndex < totalQuestions - 1) {
      setCurrentStepIndex((prev) => prev + 1);
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    setErrorMessage(null);
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    // Validate all required questions
    for (const q of SURVEY_QUESTIONS) {
      if (q.required && !isQuestionAnswered(q)) {
        setErrorMessage(`Por favor responde la pregunta ${q.number}: "${q.title}"`);
        if (viewMode === 'step') {
          setCurrentStepIndex(q.number - 1);
        }
        window.scrollTo({ top: 120, behavior: 'smooth' });
        return;
      }
    }

    setIsSubmitting(true);

    const newResponse: SurveyResponse = {
      id: 'resp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toLocaleString('es-CO', {
        timeZone: 'America/Bogota',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      identificacion: formData.identificacion ? formData.identificacion.trim() : 'Anónimo',
      relacionCentro: formData.relacionCentro,
      frecuenciaUso: formData.frecuenciaUso,
      propositoUso: formData.propositoUso,
      equiposPerifericos: Number(formData.equiposPerifericos),
      conectividadInternet: Number(formData.conectividadInternet),
      softwareRequerido: formData.softwareRequerido,
      iluminacionVentilacion: Number(formData.iluminacionVentilacion),
      limpiezaMobiliario: Number(formData.limpiezaMobiliario),
      satisfaccionGeneral: Number(formData.satisfaccionGeneral),
      recomendaciones: formData.recomendaciones ? formData.recomendaciones.trim() : '',
      syncedToGoogleSheets: false
    };

    // 1. Send directly to Google Sheets via Google Sheets API (no Apps Script!)
    let directSynced = false;
    if (connectedSpreadsheetId) {
      try {
        let token = await getAccessToken();
        if (!token) {
          // Si no hay sesión activa de Google, solicitar inicio de sesión para que el envío no falle
          try {
            const authResult = await googleSignIn();
            token = authResult?.accessToken || null;
          } catch (authErr) {
            console.warn('Inicio de sesión Google no completado:', authErr);
          }
        }

        if (token) {
          const targetTab = connectedSheetTitle || DEFAULT_SHEET_TAB_TITLE;
          const rowValues = mapSurveyResponseToRow(newResponse, USER_SHEET_HEADERS);
          await appendRowToGoogleSheet(
            connectedSpreadsheetId,
            targetTab,
            rowValues,
            token
          );
          directSynced = true;
          newResponse.syncedToGoogleSheets = true;
          setSheetFeedback(`¡Datos actualizados y enviados exitosamente a tu Hoja de cálculo de Google (pestaña "${targetTab}")!`);
        } else {
          setSheetFeedback('Nota: Guardado localmente. Inicia sesión con Google para sincronizar automáticamente a tu hoja de cálculo.');
        }
      } catch (err: any) {
        console.error('Error escribiendo en Google Sheets:', err);
        setSheetFeedback(`Guardado localmente. Error al escribir en Google Sheets: ${err.message || 'Error de permisos'}`);
      }
    }

    // 2. Fallback to Webhook if configured and direct API wasn't used
    if (!directSynced && webhookUrl) {
      const syncResult = await sendResponseToGoogleSheets(newResponse, webhookUrl);
      newResponse.syncedToGoogleSheets = syncResult.success;
      setSheetFeedback(syncResult.message);
    } else if (!directSynced && !connectedSpreadsheetId) {
      setSheetFeedback('Respuesta registrada en la base de datos local del navegador.');
    }

    onResponseSubmitted(newResponse);

    // Celebrate with confetti!
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err) {
      // ignore
    }

    setIsSubmitting(false);
    setSubmittedResponse(newResponse);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetForm = () => {
    setSubmittedResponse(null);
    setCurrentStepIndex(0);
    setSheetFeedback(null);
    setFormData(INITIAL_BLANK_FORM);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // SUCCESS CONFIRMATION SCREEN
  if (submittedResponse) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/90 shadow-xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-12 h-12 stroke-[2.2]" />
        </div>

        <div>
          <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full uppercase tracking-wider mb-2">
            Registro Completado
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
            ¡Muchas gracias por tu opinión!
          </h2>
          <p className="text-slate-600 text-sm mt-2 max-w-lg mx-auto">
            Tus respuestas sobre la <strong>Sala de Computación F3</strong> han sido recibidas. Tu retroalimentación permite priorizar mantenimientos, velocidad de internet y actualización de software en el Centro Agropecuario de Buga.
          </p>
        </div>

        {/* Feedback info card */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left text-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 pb-2 border-b border-slate-200">
            <span>Identificación: <strong>{submittedResponse.identificacion}</strong></span>
            <span>Fecha: <strong>{submittedResponse.timestamp}</strong></span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-slate-700 pt-1">
            <div>Rol: <strong className="text-slate-900">{submittedResponse.relacionCentro}</strong></div>
            <div>Calificación global: <strong className="text-emerald-700">{submittedResponse.satisfaccionGeneral} de 5 estrellas ★</strong></div>
            <div>Equipos: <strong className="text-slate-900">{submittedResponse.equiposPerifericos} ★</strong></div>
            <div>Internet: <strong className="text-slate-900">{submittedResponse.conectividadInternet} ★</strong></div>
          </div>

          {sheetFeedback && (
            <div className="pt-2 text-[11px] text-emerald-700 font-medium flex items-center gap-1.5 border-t border-slate-200">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{sheetFeedback}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <button
            onClick={handleResetForm}
            className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-all hover:shadow-lg"
          >
            Enviar otra respuesta
          </button>
        </div>

      </div>
    );
  }

  // QUESTION COMPONENT RENDERER
  const renderQuestionInput = (q: (typeof SURVEY_QUESTIONS)[0]) => {
    const val = formData[q.id];

    switch (q.type) {
      case 'select-card':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {q.options?.map((opt) => {
              const isSelected = Boolean(val) && val === opt.value;
              return (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => handleFieldChange(q.id, opt.value)}
                  className={`text-left p-3.5 rounded-xl border-2 transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/70 shadow-xs'
                      : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50/80 bg-white'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      isSelected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <div>
                    <div className={`text-xs font-bold ${isSelected ? 'text-emerald-950' : 'text-slate-800'}`}>
                      {opt.label}
                    </div>
                    {opt.description && (
                      <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        {opt.description}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        );

      case 'rating-stars': {
        const currentRating = Number(val || 0);
        const hovered = hoverRating[q.id] || 0;
        const activeStar = hovered || currentRating;
        const starLabels = ['', 'Muy deficiente', 'Deficiente', 'Aceptable / Regular', 'Bueno', 'Excelente'];

        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((starNum) => (
                <button
                  type="button"
                  key={starNum}
                  onClick={() => handleFieldChange(q.id, starNum)}
                  onMouseEnter={() => setHoverRating((prev) => ({ ...prev, [q.id]: starNum }))}
                  onMouseLeave={() => setHoverRating((prev) => ({ ...prev, [q.id]: 0 }))}
                  className="p-1 text-slate-300 hover:scale-115 transition-transform"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      starNum <= activeStar
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-200 fill-slate-100'
                    }`}
                  />
                </button>
              ))}
              <span className={`ml-3 text-xs font-bold px-2.5 py-1 rounded-lg ${
                activeStar > 0
                  ? 'text-slate-800 bg-amber-50 border border-amber-200'
                  : 'text-slate-400 bg-slate-100'
              }`}>
                {activeStar > 0 ? `${activeStar}★ - ${starLabels[activeStar]}` : 'Sin responder (toca 1 a 5 estrellas)'}
              </span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-medium px-1">
              <span>{q.minLabel || '1 = Mínimo'}</span>
              <span>{q.maxLabel || '5 = Máximo'}</span>
            </div>
          </div>
        );
      }

      case 'rating-buttons': {
        return (
          <div className="space-y-2">
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((num) => {
                const isSelected = Boolean(val) && Number(val) === num;
                return (
                  <button
                    type="button"
                    key={num}
                    onClick={() => handleFieldChange(q.id, num)}
                    className={`py-3 rounded-xl border-2 font-bold text-sm transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'border-slate-200 hover:border-emerald-400 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 font-medium px-1">
              <span>1 - {q.minLabel || 'Muy insatisfecho'}</span>
              <span>5 - {q.maxLabel || 'Totalmente satisfecho'}</span>
            </div>
          </div>
        );
      }

      case 'textarea':
        return (
          <textarea
            value={val || ''}
            onChange={(e) => handleFieldChange(q.id, e.target.value)}
            placeholder={q.placeholder || 'Escribe tus observaciones o sugerencias...'}
            rows={4}
            className="w-full px-4 py-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-800 placeholder:text-slate-400"
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Top Card: Institutional Title & Context */}
      <div className="relative bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-md border-t-6 border-t-emerald-600">
        
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 text-[11px] font-extrabold uppercase tracking-wider rounded-full border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            Centro Agropecuario de Buga &bull; SENA
          </span>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs">
              <button
                type="button"
                onClick={() => setViewMode('full')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  viewMode === 'full' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Vista Completa
              </button>
              <button
                type="button"
                onClick={() => setViewMode('step')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  viewMode === 'step' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <ListOrdered className="w-3.5 h-3.5" />
                Paso a Paso
              </button>
            </div>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#00324D] tracking-tight">
          Encuesta de Satisfacción - Sala de Computación F3
        </h1>
        <p className="text-slate-600 text-xs sm:text-sm mt-2 leading-relaxed">
          Esta encuesta consta de <strong>máximo 10 preguntas</strong> para evaluar el estado de los equipos de cómputo, conectividad a Internet, climatización y software del ambiente F3 en el Centro Agropecuario de Buga.
        </p>

        {/* Google Sheets Connection Pill */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200 animate-pulse" />
            <div className="text-slate-700">
              <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Hoja por defecto: <code className="bg-emerald-50 px-1.5 py-0.5 rounded text-emerald-800 font-mono text-[11px]">{connectedSheetTitle || 'Respuestas de formulario 2'}</code>
              </span>
              <span className="text-[11px] text-slate-500 block">
                ID: {connectedSpreadsheetId}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`https://docs.google.com/spreadsheets/d/${connectedSpreadsheetId}/edit`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:text-emerald-700 font-semibold bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <span>Abrir Google Sheet</span>
              <span className="text-xs">↗</span>
            </a>

            <button
              type="button"
              onClick={onOpenDirectSheets}
              className="text-emerald-700 hover:text-emerald-800 font-bold underline underline-offset-2 flex items-center gap-1 text-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{currentUser ? 'Cuenta Conectada' : 'Iniciar sesión Google'}</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

      </div>

      {/* Optional Identification Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <label className="block text-xs font-bold text-slate-800 mb-1">
          Nombre o Número de Ficha / Cédula <span className="text-slate-400 font-normal">(Opcional)</span>
        </label>
        <p className="text-[11px] text-slate-500 mb-2">
          Puedes responder de forma anónima o escribir tu nombre/ficha si deseas seguimiento específico.
        </p>
        <input
          type="text"
          value={formData.identificacion}
          onChange={(e) => handleFieldChange('identificacion', e.target.value)}
          placeholder="Ej: Juan José Betancourt - Ficha 3411073 (o déjalo en blanco para anónimo)"
          className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-800"
        />
      </div>

      {/* Error alert if any */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* MODE 1: STEP-BY-STEP WIZARD */}
      {viewMode === 'step' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-6">
          
          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-2">
              <span className="text-emerald-700">Pregunta {currentStepIndex + 1} de {totalQuestions}</span>
              <span className="text-slate-400">{Math.round(((currentStepIndex + 1) / totalQuestions) * 100)}% completado</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
                style={{ width: `${((currentStepIndex + 1) / totalQuestions) * 100}%` }}
              />
            </div>
          </div>

          {/* Current Question */}
          {(() => {
            const q = SURVEY_QUESTIONS[currentStepIndex];
            return (
              <div className="space-y-4">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-extrabold text-xs mb-2">
                    Pregunta {q.number}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-slate-800">
                    {q.title} {q.required && <span className="text-rose-500">*</span>}
                  </h3>
                  {q.subtitle && (
                    <p className="text-xs text-slate-500 mt-1">{q.subtitle}</p>
                  )}
                </div>

                <div className="pt-2">
                  {renderQuestionInput(q)}
                </div>
              </div>
            );
          })()}

          {/* Step Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handlePrevStep}
              disabled={currentStepIndex === 0}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
                currentStepIndex === 0
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-slate-700 bg-slate-100 hover:bg-slate-200'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Anterior
            </button>

            {currentStepIndex < totalQuestions - 1 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                Siguiente
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-md transition-colors"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Enviando a Google Sheets...' : 'Finalizar y Enviar'}
              </button>
            )}
          </div>

        </div>
      )}

      {/* MODE 2: FULL CONTINUOUS FORM (ALL 10 QUESTIONS) */}
      {viewMode === 'full' && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {SURVEY_QUESTIONS.map((q) => (
            <div
              key={q.number}
              className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs hover:border-slate-300 transition-colors"
            >
              <div className="mb-3">
                <div className="flex items-start gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-extrabold shrink-0 mt-0.5">
                    {q.number}
                  </span>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-800">
                      {q.title} {q.required && <span className="text-rose-500">*</span>}
                    </h3>
                    {q.subtitle && (
                      <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">{q.subtitle}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-1">
                {renderQuestionInput(q)}
              </div>
            </div>
          ))}

          {/* Submit & Reset Buttons */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-extrabold text-base rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-5 h-5" />
              <span>{isSubmitting ? 'Enviando a Google Sheets...' : 'Enviar Respuestas de la Encuesta'}</span>
            </button>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>Se enviará directamente a tu Hoja de cálculo de Google.</span>
              <button
                type="button"
                onClick={handleResetForm}
                className="text-slate-400 hover:text-rose-600 underline transition-colors"
              >
                Limpiar y dejar en cero
              </button>
            </div>
          </div>
        </form>
      )}

    </div>
  );
};
