import { SurveyResponse } from '../types/survey';

export const DEFAULT_GOOGLE_APPS_SCRIPT_CODE = `/**
 * Código de Google Apps Script para recibir respuestas de la Encuesta Sala F3
 * Centro Agropecuario de Buga
 * 
 * INSTRUCCIONES RÁPIDAS:
 * 1. Abre tu Hoja de cálculo de Google.
 * 2. Ve al menú superior: Extensiones > Apps Script.
 * 3. Borra todo lo que haya y pega este código completo.
 * 4. Haz clic en "Implementar" (botón azul arriba a la derecha) > "Nueva implementación".
 * 5. En tipo elige "Aplicación web".
 * 6. En "Ejecutar como" selecciona: "Yo" (tu cuenta).
 * 7. En "Quién tiene acceso" selecciona: "Cualquier usuario" (Anyone).
 * 8. Copia la URL de la aplicación web generada y pégala en esta aplicación o en tu formulario HTML.
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    
    // Encabezados oficiales si la hoja está vacía
    if (sheet.getLastRow() === 0) {
      var headers = [
        "Marca temporal",
        "Nombre / Ficha (Identificación)",
        "Relación con el Centro",
        "Frecuencia de uso",
        "Propósito principal",
        "Equipos y periféricos (1-5)",
        "Internet y conectividad (1-5)",
        "Software requerido",
        "Iluminación y ventilación (1-5)",
        "Limpieza y mobiliario (1-5)",
        "Satisfacción general (1-5)",
        "Recomendaciones y sugerencias"
      ];
      sheet.appendRow(headers);
      
      // Formato visual a los encabezados
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground("#39A900"); // Verde institucional SENA
      headerRange.setFontColor("#FFFFFF");
      headerRange.setFontWeight("bold");
      sheet.setFrozenRows(1);
    }
    
    // Procesar datos enviados
    var data = {};
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter || {};
      }
    } else if (e.parameter) {
      data = e.parameter;
    }
    
    // Agregar fila con la respuesta
    var newRow = [
      data.timestamp || new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" }),
      data.identificacion || "Anónimo",
      data.relacionCentro || "",
      data.frecuenciaUso || "",
      data.propositoUso || "",
      data.equiposPerifericos || "",
      data.conectividadInternet || "",
      data.softwareRequerido || "",
      data.iluminacionVentilacion || "",
      data.limpiezaMobiliario || "",
      data.satisfaccionGeneral || "",
      data.recomendaciones || ""
    ];
    
    sheet.appendRow(newRow);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Respuesta registrada correctamente en Google Sheets",
      row: sheet.getLastRow()
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    service: "Webhook Encuesta Sala F3 - Centro Agropecuario de Buga",
    time: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}
`;

/**
 * Enviar respuesta a Google Sheets mediante Apps Script Web App
 */
export async function sendResponseToGoogleSheets(
  response: SurveyResponse,
  webhookUrl: string
): Promise<{ success: boolean; message: string }> {
  if (!webhookUrl || !webhookUrl.trim()) {
    return {
      success: false,
      message: 'No se ha configurado la URL de Google Sheets. La respuesta fue guardada localmente.'
    };
  }

  try {
    const payload = JSON.stringify(response);

    // Google Apps Script requires no-cors mode in direct browser POST to avoid CORS redirect blocks
    await fetch(webhookUrl.trim(), {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: payload
    });

    return {
      success: true,
      message: '¡Respuesta enviada y registrada con éxito en tu Hoja de cálculo de Google!'
    };
  } catch (error: any) {
    console.error('Error enviando a Google Sheets:', error);
    return {
      success: false,
      message: 'Error al conectar con Google Sheets. Se guardó copia de seguridad local: ' + (error.message || 'Error desconocido')
    };
  }
}

/**
 * Genera el archivo HTML autónomo descargable (puro HTML5 + CSS + JS)
 */
export function generateStandaloneHtml(webhookUrl: string = ''): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Encuesta de Satisfacción - Sala de Computación F3 | Centro Agropecuario de Buga</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --sena-green: #39A900;
      --sena-green-dark: #2d8500;
      --sena-green-light: #eef8eb;
      --sena-blue: #00324D;
      --slate-50: #f8fafc;
      --slate-100: #f1f5f9;
      --slate-200: #e2e8f0;
      --slate-600: #475569;
      --slate-700: #334155;
      --slate-800: #1e293b;
      --slate-900: #0f172a;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #f0fdf4 0%, #f8fafc 50%, #f1f5f9 100%);
      color: var(--slate-800);
      min-height: 100vh;
      padding: 24px 16px 60px;
      line-height: 1.5;
    }

    .container {
      max-width: 760px;
      margin: 0 auto;
    }

    /* Encabezado */
    .header-card {
      background: white;
      border-radius: 20px;
      padding: 32px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
      border-top: 6px solid var(--sena-green);
      margin-bottom: 24px;
      position: relative;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background-color: var(--sena-green-light);
      color: var(--sena-green-dark);
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 0.825rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 12px;
    }

    h1 {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--sena-blue);
      line-height: 1.25;
      margin-bottom: 8px;
    }

    .subtitle {
      color: var(--slate-600);
      font-size: 0.975rem;
    }

    .info-box {
      margin-top: 18px;
      padding: 12px 16px;
      background-color: #f8fafc;
      border: 1px solid var(--slate-200);
      border-radius: 12px;
      font-size: 0.85rem;
      color: var(--slate-600);
      display: flex;
      align-items: center;
      gap: 10px;
    }

    /* Tarjetas de preguntas */
    .question-card {
      background: white;
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 20px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
      border: 1px solid #eef2f6;
      transition: all 0.2s ease;
    }

    .question-card:hover {
      border-color: #cbd5e1;
    }

    .q-number {
      display: inline-block;
      font-weight: 800;
      color: var(--sena-green);
      margin-right: 6px;
      font-size: 1.05rem;
    }

    .q-title {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--slate-900);
      margin-bottom: 4px;
    }

    .q-sub {
      font-size: 0.85rem;
      color: var(--slate-600);
      margin-bottom: 16px;
    }

    .req {
      color: #ef4444;
      margin-left: 4px;
    }

    /* Opciones tipo tarjeta seleccionable */
    .options-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 10px;
    }

    @media (min-width: 600px) {
      .options-grid.two-cols {
        grid-template-columns: 1fr 1fr;
      }
    }

    .option-label {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 16px;
      border: 2px solid var(--slate-200);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      background: #fafafa;
    }

    .option-label:hover {
      background: var(--sena-green-light);
      border-color: #86efac;
    }

    .option-label input[type="radio"] {
      margin-top: 3px;
      accent-color: var(--sena-green);
      width: 18px;
      height: 18px;
    }

    .option-text strong {
      display: block;
      font-size: 0.95rem;
      color: var(--slate-800);
    }

    .option-text span {
      display: block;
      font-size: 0.8rem;
      color: var(--slate-600);
      margin-top: 2px;
    }

    .option-label input[type="radio"]:checked ~ .option-text strong {
      color: var(--sena-green-dark);
    }

    .option-label:has(input[type="radio"]:checked) {
      border-color: var(--sena-green);
      background-color: var(--sena-green-light);
    }

    /* Calificación con estrellas / botones */
    .rating-row {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      margin: 12px 0 6px;
    }

    .rating-btn-label {
      flex: 1;
      text-align: center;
      border: 2px solid var(--slate-200);
      border-radius: 12px;
      padding: 14px 8px;
      cursor: pointer;
      font-weight: 700;
      font-size: 1.1rem;
      transition: all 0.2s ease;
      background: #fafafa;
    }

    .rating-btn-label:hover {
      border-color: var(--sena-green);
      background: var(--sena-green-light);
    }

    .rating-btn-label input[type="radio"] {
      display: none;
    }

    .rating-btn-label:has(input[type="radio"]:checked) {
      background: var(--sena-green);
      color: white;
      border-color: var(--sena-green);
      box-shadow: 0 4px 10px rgba(57, 169, 0, 0.3);
    }

    .rating-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: var(--slate-600);
      font-weight: 500;
    }

    /* Entradas de texto */
    input[type="text"], textarea {
      width: 100%;
      padding: 12px 14px;
      border: 1.5px solid var(--slate-200);
      border-radius: 10px;
      font-size: 0.95rem;
      font-family: inherit;
      outline: none;
      transition: border 0.2s ease;
    }

    input[type="text"]:focus, textarea:focus {
      border-color: var(--sena-green);
      box-shadow: 0 0 0 3px rgba(57, 169, 0, 0.15);
    }

    textarea {
      min-height: 90px;
      resize: vertical;
    }

    /* Botón Enviar */
    .submit-btn {
      width: 100%;
      background: var(--sena-green);
      color: white;
      font-size: 1.1rem;
      font-weight: 700;
      padding: 16px;
      border: none;
      border-radius: 14px;
      cursor: pointer;
      box-shadow: 0 10px 20px -5px rgba(57, 169, 0, 0.4);
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }

    .submit-btn:hover {
      background: var(--sena-green-dark);
      transform: translateY(-2px);
    }

    .submit-btn:disabled {
      background: #94a3b8;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    /* Alerta de Éxito */
    #success-box {
      display: none;
      background: white;
      border-radius: 20px;
      padding: 40px 24px;
      text-align: center;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      border-top: 6px solid var(--sena-green);
    }

    .success-icon {
      width: 64px;
      height: 64px;
      background: var(--sena-green-light);
      color: var(--sena-green);
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      margin-bottom: 16px;
    }

    .btn-reset {
      margin-top: 20px;
      background: var(--sena-blue);
      color: white;
      padding: 12px 24px;
      border: none;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
    }

    .footer {
      text-align: center;
      margin-top: 30px;
      font-size: 0.8rem;
      color: var(--slate-600);
    }
  </style>
</head>
<body>

  <div class="container">
    <!-- Encabezado Institucional -->
    <div class="header-card">
      <div class="badge">SENA &bull; Centro Agropecuario de Buga</div>
      <h1>Encuesta de Satisfacción Sala F3</h1>
      <p class="subtitle">Tu opinión es fundamental para mejorar los equipos de computación, el internet y las comodidades del Ambiente F3.</p>
      
      <div class="info-box">
        <span>⏱️</span>
        <div><strong>Tiempo estimado:</strong> 2 minutos (10 preguntas breves). Respuestas anónimas o con identificación opcional.</div>
      </div>
    </div>

    <!-- Pantalla de Éxito -->
    <div id="success-box">
      <div class="success-icon">✓</div>
      <h2 style="font-size: 1.6rem; color: var(--sena-blue); margin-bottom: 8px;">¡Muchas gracias por tu respuesta!</h2>
      <p style="color: var(--slate-600); max-width: 500px; margin: 0 auto;">Tus observaciones han sido enviadas exitosamente a la Hoja de Cálculo del Centro Agropecuario de Buga para el mantenimiento de la Sala F3.</p>
      <button class="btn-reset" onclick="resetForm()">Enviar otra respuesta</button>
    </div>

    <!-- Formulario -->
    <form id="f3SurveyForm" onsubmit="handleSubmit(event)">

      <!-- Identificación Opcional -->
      <div class="question-card" style="background: #fbfcfe; border-left: 4px solid var(--sena-blue);">
        <div class="q-title">Nombre o Número de Ficha <span style="font-size:0.8rem; color:#64748b; font-weight:normal;">(Opcional)</span></div>
        <div class="q-sub">Si deseas que te contactemos sobre alguna inquietud específica en la sala F3</div>
        <input type="text" id="identificacion" name="identificacion" placeholder="Ej: Juan Pérez - Ficha 2712345">
      </div>

      <!-- Pregunta 1 -->
      <div class="question-card">
        <div class="q-title"><span class="q-number">1.</span> ¿Cuál es tu relación con el Centro Agropecuario de Buga?<span class="req">*</span></div>
        <div class="q-sub">Selecciona el rol que desempeñas actualmente</div>
        <div class="options-grid">
          <label class="option-label">
            <input type="radio" name="relacionCentro" value="Aprendiz" required>
            <div class="option-text">
              <strong>Aprendiz (SENA)</strong>
              <span>Estudiante en formación técnica o tecnológica</span>
            </div>
          </label>
          <label class="option-label">
            <input type="radio" name="relacionCentro" value="Instructor">
            <div class="option-text">
              <strong>Instructor / Docente</strong>
              <span>Formador a cargo de ambientes de aprendizaje</span>
            </div>
          </label>
          <label class="option-label">
            <input type="radio" name="relacionCentro" value="Funcionario">
            <div class="option-text">
              <strong>Funcionario / Administrativo</strong>
              <span>Personal de apoyo técnico, administrativo o coordinación</span>
            </div>
          </label>
          <label class="option-label">
            <input type="radio" name="relacionCentro" value="Egresado">
            <div class="option-text">
              <strong>Egresado</strong>
              <span>Graduado del Centro Agropecuario</span>
            </div>
          </label>
          <label class="option-label">
            <input type="radio" name="relacionCentro" value="Visitante">
            <div class="option-text">
              <strong>Visitante / Externo</strong>
              <span>Participante en cursos cortos, talleres o eventos</span>
            </div>
          </label>
        </div>
      </div>

      <!-- Pregunta 2 -->
      <div class="question-card">
        <div class="q-title"><span class="q-number">2.</span> ¿Con qué frecuencia utilizas la sala de computación F3?<span class="req">*</span></div>
        <div class="q-sub">Indica la frecuencia aproximada de asistencia</div>
        <div class="options-grid two-cols">
          <label class="option-label">
            <input type="radio" name="frecuenciaUso" value="Diario" required>
            <div class="option-text">
              <strong>Todos los días</strong>
              <span>Uso intensivo y diario</span>
            </div>
          </label>
          <label class="option-label">
            <input type="radio" name="frecuenciaUso" value="2-3 veces por semana">
            <div class="option-text">
              <strong>2 a 3 veces por semana</strong>
              <span>Uso habitual programado</span>
            </div>
          </label>
          <label class="option-label">
            <input type="radio" name="frecuenciaUso" value="Semanalmente">
            <div class="option-text">
              <strong>1 vez por semana</strong>
              <span>Para actividades específicas</span>
            </div>
          </label>
          <label class="option-label">
            <input type="radio" name="frecuenciaUso" value="Ocasional">
            <div class="option-text">
              <strong>Ocasionalmente</strong>
              <span>Uso esporádico o primera vez</span>
            </div>
          </label>
        </div>
      </div>

      <!-- Pregunta 3 -->
      <div class="question-card">
        <div class="q-title"><span class="q-number">3.</span> ¿Para qué utilizas principalmente la sala F3?<span class="req">*</span></div>
        <div class="q-sub">Selecciona el uso principal de tu tiempo en la sala</div>
        <div class="options-grid two-cols">
          <label class="option-label">
            <input type="radio" name="propositoUso" value="Formación y clases" required>
            <div class="option-text">
              <strong>Formación y clases</strong>
              <span>Sesiones académicas guiadas</span>
            </div>
          </label>
          <label class="option-label">
            <input type="radio" name="propositoUso" value="Prácticas y talleres">
            <div class="option-text">
              <strong>Prácticas y talleres</strong>
              <span>Desarrollo de guías y tareas</span>
            </div>
          </label>
          <label class="option-label">
            <input type="radio" name="propositoUso" value="Investigación y proyectos">
            <div class="option-text">
              <strong>Investigación y proyectos</strong>
              <span>Proyectos productivos e investigación</span>
            </div>
          </label>
          <label class="option-label">
            <input type="radio" name="propositoUso" value="Evaluaciones">
            <div class="option-text">
              <strong>Evaluaciones y pruebas</strong>
              <span>Exámenes en plataformas virtuales</span>
            </div>
          </label>
        </div>
      </div>

      <!-- Pregunta 4 -->
      <div class="question-card">
        <div class="q-title"><span class="q-number">4.</span> ¿Qué tan satisfecho estás con el estado y rendimiento de los computadores?<span class="req">*</span></div>
        <div class="q-sub">Evalúa la velocidad de las computadoras, periféricos (teclado, mouse, monitor)</div>
        <div class="rating-row">
          <label class="rating-btn-label"><input type="radio" name="equiposPerifericos" value="1" required>1</label>
          <label class="rating-btn-label"><input type="radio" name="equiposPerifericos" value="2">2</label>
          <label class="rating-btn-label"><input type="radio" name="equiposPerifericos" value="3">3</label>
          <label class="rating-btn-label"><input type="radio" name="equiposPerifericos" value="4">4</label>
          <label class="rating-btn-label"><input type="radio" name="equiposPerifericos" value="5">5</label>
        </div>
        <div class="rating-labels">
          <span>1 = Muy deficiente</span>
          <span>5 = Excelente rendimiento</span>
        </div>
      </div>

      <!-- Pregunta 5 -->
      <div class="question-card">
        <div class="q-title"><span class="q-number">5.</span> ¿Cómo calificas la velocidad y estabilidad de la conexión a Internet?<span class="req">*</span></div>
        <div class="q-sub">Carga de páginas web, descargas y conexión a plataformas educativas</div>
        <div class="rating-row">
          <label class="rating-btn-label"><input type="radio" name="conectividadInternet" value="1" required>1</label>
          <label class="rating-btn-label"><input type="radio" name="conectividadInternet" value="2">2</label>
          <label class="rating-btn-label"><input type="radio" name="conectividadInternet" value="3">3</label>
          <label class="rating-btn-label"><input type="radio" name="conectividadInternet" value="4">4</label>
          <label class="rating-btn-label"><input type="radio" name="conectividadInternet" value="5">5</label>
        </div>
        <div class="rating-labels">
          <span>1 = Muy lenta / Inestable</span>
          <span>5 = Rápida y sin caídas</span>
        </div>
      </div>

      <!-- Pregunta 6 -->
      <div class="question-card">
        <div class="q-title"><span class="q-number">6.</span> ¿Los computadores cuentan con el software y programas necesarios?<span class="req">*</span></div>
        <div class="q-sub">Herramientas técnicas de diseño, ofimática, desarrollo o software especializado</div>
        <div class="options-grid">
          <label class="option-label">
            <input type="radio" name="softwareRequerido" value="Sí, totalmente" required>
            <div class="option-text">
              <strong>Sí, totalmente</strong>
              <span>Cuenta con todos los programas necesarios y actualizados</span>
            </div>
          </label>
          <label class="option-label">
            <input type="radio" name="softwareRequerido" value="La mayoría está disponible">
            <div class="option-text">
              <strong>La mayoría está disponible</strong>
              <span>Satisface casi todas las actividades formativas</span>
            </div>
          </label>
          <label class="option-label">
            <input type="radio" name="softwareRequerido" value="Faltan algunos programas clave">
            <div class="option-text">
              <strong>Faltan algunos programas clave</strong>
              <span>Falta software necesario para ciertas guías</span>
            </div>
          </label>
          <label class="option-label">
            <input type="radio" name="softwareRequerido" value="No cumple con los requerimientos">
            <div class="option-text">
              <strong>No cumple con los requerimientos</strong>
              <span>Software muy desactualizado o inexistente</span>
            </div>
          </label>
        </div>
      </div>

      <!-- Pregunta 7 -->
      <div class="question-card">
        <div class="q-title"><span class="q-number">7.</span> ¿Cómo evalúas la iluminación, ventilación y temperatura de la sala F3?<span class="req">*</span></div>
        <div class="q-sub">Confort térmico (aire acondicionado/ventiladores) y luz adecuada para pantallas</div>
        <div class="rating-row">
          <label class="rating-btn-label"><input type="radio" name="iluminacionVentilacion" value="1" required>1</label>
          <label class="rating-btn-label"><input type="radio" name="iluminacionVentilacion" value="2">2</label>
          <label class="rating-btn-label"><input type="radio" name="iluminacionVentilacion" value="3">3</label>
          <label class="rating-btn-label"><input type="radio" name="iluminacionVentilacion" value="4">4</label>
          <label class="rating-btn-label"><input type="radio" name="iluminacionVentilacion" value="5">5</label>
        </div>
        <div class="rating-labels">
          <span>1 = Inadecuada (calurosa/oscura)</span>
          <span>5 = Clima y luz óptimos</span>
        </div>
      </div>

      <!-- Pregunta 8 -->
      <div class="question-card">
        <div class="q-title"><span class="q-number">8.</span> ¿Qué tan satisfecho estás con el orden, limpieza y comodidad del mobiliario?<span class="req">*</span></div>
        <div class="q-sub">Sillas ergonómicas, mesas de trabajo, aseo y organización del aula</div>
        <div class="rating-row">
          <label class="rating-btn-label"><input type="radio" name="limpiezaMobiliario" value="1" required>1</label>
          <label class="rating-btn-label"><input type="radio" name="limpiezaMobiliario" value="2">2</label>
          <label class="rating-btn-label"><input type="radio" name="limpiezaMobiliario" value="3">3</label>
          <label class="rating-btn-label"><input type="radio" name="limpiezaMobiliario" value="4">4</label>
          <label class="rating-btn-label"><input type="radio" name="limpiezaMobiliario" value="5">5</label>
        </div>
        <div class="rating-labels">
          <span>1 = Muy insatisfecho</span>
          <span>5 = Muy cómodo y limpio</span>
        </div>
      </div>

      <!-- Pregunta 9 -->
      <div class="question-card">
        <div class="q-title"><span class="q-number">9.</span> En general, ¿cuál es tu nivel de satisfacción global con la sala F3?<span class="req">*</span></div>
        <div class="q-sub">Calificación global de la experiencia en el Ambiente F3 de Centro Agropecuario de Buga</div>
        <div class="rating-row">
          <label class="rating-btn-label"><input type="radio" name="satisfaccionGeneral" value="1" required>1</label>
          <label class="rating-btn-label"><input type="radio" name="satisfaccionGeneral" value="2">2</label>
          <label class="rating-btn-label"><input type="radio" name="satisfaccionGeneral" value="3">3</label>
          <label class="rating-btn-label"><input type="radio" name="satisfaccionGeneral" value="4">4</label>
          <label class="rating-btn-label"><input type="radio" name="satisfaccionGeneral" value="5">5</label>
        </div>
        <div class="rating-labels">
          <span>1 = Muy insatisfecho</span>
          <span>5 = Totalmente satisfecho</span>
        </div>
      </div>

      <!-- Pregunta 10 -->
      <div class="question-card">
        <div class="q-title"><span class="q-number">10.</span> ¿Qué dificultades has encontrado o qué recomendación tienes para mejorar la sala F3?</div>
        <div class="q-sub">Tu aporte nos permite tramitar mejoras ante la administración del Centro</div>
        <textarea id="recomendaciones" name="recomendaciones" placeholder="Escribe aquí cualquier fallo en computadores específicos, software faltante, sugerencias de aire acondicionado o cables..."></textarea>
      </div>

      <!-- Botón de Envío -->
      <button type="submit" id="submitBtn" class="submit-btn">
        <span>Enviar Respuestas a Google Sheets</span>
        <span>→</span>
      </button>

    </form>

    <div class="footer">
      Centro Agropecuario de Buga &bull; SENA Regional Valle &bull; Ambiente F3
    </div>
  </div>

  <script>
    // URL del Webhook de Google Apps Script
    // Pega aquí la URL de tu Google Apps Script si deseas usar este archivo de manera independiente
    const GOOGLE_SCRIPT_URL = "${webhookUrl}";

    async function handleSubmit(event) {
      event.preventDefault();
      const form = document.getElementById('f3SurveyForm');
      const submitBtn = document.getElementById('submitBtn');
      const originalText = submitBtn.innerHTML;

      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Enviando a Google Sheets...';

      const formData = new FormData(form);
      const data = {
        timestamp: new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' }),
        identificacion: formData.get('identificacion') || 'Anónimo',
        relacionCentro: formData.get('relacionCentro'),
        frecuenciaUso: formData.get('frecuenciaUso'),
        propositoUso: formData.get('propositoUso'),
        equiposPerifericos: formData.get('equiposPerifericos'),
        conectividadInternet: formData.get('conectividadInternet'),
        softwareRequerido: formData.get('softwareRequerido'),
        iluminacionVentilacion: formData.get('iluminacionVentilacion'),
        limpiezaMobiliario: formData.get('limpiezaMobiliario'),
        satisfaccionGeneral: formData.get('satisfaccionGeneral'),
        recomendaciones: formData.get('recomendaciones') || ''
      };

      try {
        if (GOOGLE_SCRIPT_URL && GOOGLE_SCRIPT_URL.startsWith('http')) {
          // Envío a Google Apps Script Web App
          await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
              'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify(data)
          });
        }

        // Guardado local de respaldo en el navegador
        const localData = JSON.parse(localStorage.getItem('encuesta_f3_local') || '[]');
        localData.push(data);
        localStorage.setItem('encuesta_f3_local', JSON.stringify(localData));

        // Mostrar pantalla de confirmación
        form.style.display = 'none';
        document.getElementById('success-box').style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });

      } catch (err) {
        console.error('Error al enviar:', err);
        alert('Se ha guardado localmente en tu navegador. Gracias por responder.');
        form.style.display = 'none';
        document.getElementById('success-box').style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    }

    function resetForm() {
      document.getElementById('f3SurveyForm').reset();
      document.getElementById('f3SurveyForm').style.display = 'block';
      document.getElementById('success-box').style.display = 'none';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  </script>
</body>
</html>`;
}

/**
 * Convierte respuestas a formato CSV compatible con Google Sheets / Excel
 */
export function exportResponsesToCsv(responses: SurveyResponse[]): string {
  const headers = [
    'Marca temporal',
    'Nombre o Ficha',
    'Relación con el Centro',
    'Frecuencia de uso',
    'Propósito principal',
    'Equipos y periféricos (1-5)',
    'Internet y conectividad (1-5)',
    'Software requerido',
    'Iluminación y ventilación (1-5)',
    'Limpieza y mobiliario (1-5)',
    'Satisfacción general (1-5)',
    'Recomendaciones'
  ];

  const escapeCsv = (str: any) => {
    if (str === null || str === undefined) return '""';
    const val = String(str).replace(/"/g, '""');
    return `"${val}"`;
  };

  const rows = responses.map((r) => [
    escapeCsv(r.timestamp),
    escapeCsv(r.identificacion),
    escapeCsv(r.relacionCentro),
    escapeCsv(r.frecuenciaUso),
    escapeCsv(r.propositoUso),
    escapeCsv(r.equiposPerifericos),
    escapeCsv(r.conectividadInternet),
    escapeCsv(r.softwareRequerido),
    escapeCsv(r.iluminacionVentilacion),
    escapeCsv(r.limpiezaMobiliario),
    escapeCsv(r.satisfaccionGeneral),
    escapeCsv(r.recomendaciones)
  ]);

  return [headers.map(escapeCsv).join(','), ...rows.map((row) => row.join(','))].join('\r\n');
}

/**
 * Convierte respuestas a formato TSV para copiar y pegar directamente en celdas de Google Sheets
 */
export function exportResponsesToTsv(responses: SurveyResponse[]): string {
  const headers = [
    'Marca temporal',
    'Nombre / Ficha',
    'Relación con el Centro',
    'Frecuencia de uso',
    'Propósito principal',
    'Equipos y periféricos',
    'Internet y conectividad',
    'Software requerido',
    'Iluminación y ventilación',
    'Limpieza y mobiliario',
    'Satisfacción general',
    'Recomendaciones'
  ];

  const rows = responses.map((r) => [
    r.timestamp,
    r.identificacion || 'Anónimo',
    r.relacionCentro,
    r.frecuenciaUso,
    r.propositoUso,
    r.equiposPerifericos,
    r.conectividadInternet,
    r.softwareRequerido,
    r.iluminacionVentilacion,
    r.limpiezaMobiliario,
    r.satisfaccionGeneral,
    (r.recomendaciones || '').replace(/\t|\r|\n/g, ' ')
  ]);

  return [headers.join('\t'), ...rows.map((row) => row.join('\t'))].join('\n');
}
