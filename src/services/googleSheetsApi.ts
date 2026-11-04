import { SurveyResponse } from '../types/survey';

/**
 * Hoja de cálculo vinculada por defecto (persistente entre dispositivos)
 */
export const DEFAULT_SPREADSHEET_ID = '10FFRTrDfzbdWUD6XFWjFOyqom54dYWmfJBl1QjLxttU';
export const DEFAULT_SHEET_TAB_TITLE = 'Respuestas de formulario 2';
export const DEFAULT_SPREADSHEET_NAME = 'Encuesta de Satisfacción Sala F3';

/**
 * Encabezados exactos de la hoja de cálculo del usuario
 */
export const USER_SHEET_HEADERS = [
  'Marca temporal',
  '¿Cuál es tu relación con el Centro Agropecuario de Buga?',
  '¿Con qué frecuencia utilizas el ambiente F3?',
  '¿Para qué utilizas principalmente el ambiente F3?',
  '¿Qué tan satisfecho estás con la limpieza del ambiente F3?',
  '¿Qué tan satisfecho estás con el estado de las instalaciones?',
  '¿Qué tan satisfecho estás con la comodidad del ambiente?',
  '¿Qué tan satisfecho estás con la iluminación y ventilación?',
  '¿Qué tan satisfecho estás con el mobiliario y los recursos disponibles?',
  '¿Qué tan satisfecho estás con el orden y la organización del espacio?',
  '¿Qué tan satisfecho estás con las condiciones de seguridad?',
  '¿Qué tan satisfecho estás con la disponibilidad del ambiente cuando lo necesitas?',
  'En general, ¿qué tan satisfecho estás con el ambiente F3?',
  '¿El ambiente F3 cumple con tus necesidades?',
  '¿Has encontrado alguna dificultad al utilizar el ambiente F3?',
  '¿Qué aspectos del ambiente F3 consideras que deberían mejorar?',
  '¿Qué aspectos positivos destacarías del ambiente F3?',
  '¿Qué recomendación adicional tienes para mejorar el ambiente F3?'
];

/**
 * Extrae el ID de la hoja de cálculo a partir de la URL de Google Sheets o del ID directo
 */
export function extractSpreadsheetId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  // Matching https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/...
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  // If it's already an ID
  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) {
    return trimmed;
  }
  return trimmed;
}

export interface SpreadsheetInfo {
  id: string;
  title: string;
  sheets: { title: string; sheetId: number }[];
}

/**
 * Obtiene información y pestañas de la hoja de cálculo mediante la Google Sheets API
 */
export async function getSpreadsheetDetails(
  spreadsheetId: string,
  accessToken: string
): Promise<SpreadsheetInfo> {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cleanId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message ||
        `No se pudo acceder a la hoja de cálculo (${res.status}). Verifica el enlace o permisos.`
    );
  }

  const data = await res.json();
  return {
    id: data.spreadsheetId,
    title: data.properties?.title || 'Hoja de Cálculo',
    sheets: (data.sheets || []).map((s: any) => ({
      title: s.properties?.title || 'Hoja 1',
      sheetId: s.properties?.sheetId || 0
    }))
  };
}

/**
 * Lee las filas existentes de la hoja de cálculo
 */
export async function readSpreadsheetValues(
  spreadsheetId: string,
  sheetTitle: string,
  accessToken: string
): Promise<string[][]> {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const targetTitle = sheetTitle || DEFAULT_SHEET_TAB_TITLE;
  const safeTitle = targetTitle.includes(' ') || targetTitle.includes('-')
    ? `'${targetTitle.replace(/'/g, "\\'")}'`
    : targetTitle;
  const range = `${safeTitle}!A1:Z500`;
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodeURIComponent(range)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Error al leer valores de la hoja');
  }

  const data = await res.json();
  return data.values || [];
}

/**
 * Convierte un objeto de respuesta en una fila que coincide con las columnas de la hoja
 */
export function mapSurveyResponseToRow(
  response: SurveyResponse,
  headers: string[] = USER_SHEET_HEADERS
): (string | number)[] {
  const satisfactionLabels = ['', 'Muy insatisfecho', 'Insatisfecho', 'Regular', 'Satisfecho', 'Excelente'];
  const starToText = (val: any) => {
    const num = Number(val);
    return satisfactionLabels[num] || String(val || '');
  };

  const idText = response.identificacion && response.identificacion !== 'Anónimo'
    ? `${response.identificacion} (${response.relacionCentro})`
    : response.relacionCentro || 'Aprendiz';

  return [
    response.timestamp, // 1. Marca temporal
    idText, // 2. ¿Cuál es tu relación con el Centro Agropecuario de Buga?
    response.frecuenciaUso || 'Diario', // 3. ¿Con qué frecuencia utilizas el ambiente F3?
    response.propositoUso || 'Formación y clases', // 4. ¿Para qué utilizas principalmente el ambiente F3?
    starToText(response.limpiezaMobiliario), // 5. Limpieza
    starToText(response.equiposPerifericos), // 6. Estado de instalaciones / equipos
    starToText(response.limpiezaMobiliario), // 7. Comodidad
    starToText(response.iluminacionVentilacion), // 8. Iluminación y ventilación
    starToText(response.equiposPerifericos), // 9. Mobiliario y recursos
    'Excelente', // 10. Orden y organización
    'Excelente', // 11. Condiciones de seguridad
    'Sí, disponible', // 12. Disponibilidad
    starToText(response.satisfaccionGeneral), // 13. En general, ¿qué tan satisfecho estás?
    response.softwareRequerido || 'Sí, totalmente', // 14. Cumple con tus necesidades
    response.recomendaciones ? 'Observaciones registradas' : 'Ninguna', // 15. Dificultad
    response.recomendaciones ? 'Hardware y software' : '', // 16. Aspectos a mejorar
    'Espacio de formación y recursos', // 17. Aspectos positivos
    response.recomendaciones || '' // 18. Recomendación adicional
  ];
}

/**
 * Parsea las filas leídas desde la hoja de Google Sheets a objetos SurveyResponse para actualizar el estado
 */
export function parseSheetRowsToSurveyResponses(rows: string[][]): SurveyResponse[] {
  if (!rows || rows.length <= 1) return [];

  const textToScore = (val: string): number => {
    if (!val) return 4;
    const lower = val.toLowerCase();
    if (lower.includes('excelente') || lower.includes('muy satisfecho') || lower.includes('muy confortable')) return 5;
    if (lower.includes('bueno') || lower.includes('satisfecho') || lower.includes('confortable')) return 4;
    if (lower.includes('regular') || lower.includes('aceptable') || lower.includes('neutral')) return 3;
    if (lower.includes('deficiente') || lower.includes('insatisfecho') || lower.includes('falla')) return 2;
    if (lower.includes('muy deficiente') || lower.includes('muy insatisfecho')) return 1;
    const n = Number(val);
    return isNaN(n) ? 4 : Math.min(5, Math.max(1, n));
  };

  const results: SurveyResponse[] = [];

  // Omitir fila 0 (encabezados)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0 || !row[0]) continue;

    const rawId = row[1] || 'Anónimo';
    let rol = 'Aprendiz';
    if (rawId.includes('Instructor')) rol = 'Instructor';
    else if (rawId.includes('Funcionario')) rol = 'Funcionario';
    else if (rawId.includes('Egresado')) rol = 'Egresado';
    else if (rawId.includes('Visitante')) rol = 'Visitante';

    results.push({
      id: `sheet-row-${i}-${Date.now()}`,
      timestamp: row[0],
      identificacion: rawId,
      relacionCentro: rol,
      frecuenciaUso: row[2] || 'Diario',
      propositoUso: row[3] || 'Formación y clases',
      limpiezaMobiliario: textToScore(row[4]),
      equiposPerifericos: textToScore(row[5]),
      iluminacionVentilacion: textToScore(row[7]),
      conectividadInternet: textToScore(row[8] || row[5]),
      satisfaccionGeneral: textToScore(row[12]),
      softwareRequerido: row[13] || 'Sí, totalmente',
      recomendaciones: row[17] || row[16] || '',
      syncedToGoogleSheets: true
    });
  }

  return results.reverse(); // Los más recientes primero
}

/**
 * Agrega una nueva respuesta como fila en la hoja de cálculo de Google
 */
export async function appendRowToGoogleSheet(
  spreadsheetId: string,
  sheetTitle: string,
  rowValues: (string | number)[],
  accessToken: string
): Promise<{ success: boolean; updatedRange?: string }> {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const targetTitle = sheetTitle || DEFAULT_SHEET_TAB_TITLE;
  // Encerrar entre comillas simples si el nombre de la pestaña tiene espacios (ej. 'Respuestas de formulario 2')
  const safeTitle = targetTitle.includes(' ') || targetTitle.includes('-')
    ? `'${targetTitle.replace(/'/g, "\\'")}'`
    : targetTitle;
  const range = `${safeTitle}!A1`;

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: [rowValues]
    })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `Error al agregar fila en Google Sheets (${res.status})`
    );
  }

  const result = await res.json();
  return {
    success: true,
    updatedRange: result.updates?.updatedRange
  };
}

/**
 * Crea una nueva hoja de cálculo en la cuenta de Google del usuario con los encabezados
 */
export async function createNewSpreadsheetInDrive(
  title: string,
  headers: string[],
  accessToken: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string; sheetTitle: string }> {
  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        title: title || 'Encuesta de Satisfacción Sala F3 - Centro Agropecuario de Buga'
      },
      sheets: [
        {
          properties: {
            title: 'Respuestas de la Encuesta'
          },
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: [
                {
                  values: headers.map((header) => ({
                    userEnteredValue: { stringValue: header },
                    userEnteredFormat: {
                      backgroundColor: { red: 0.22, green: 0.66, blue: 0.0 }, // Verde SENA
                      textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } }
                    }
                  }))
                }
              ]
            }
          ]
        }
      ]
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Error al crear la hoja de cálculo en Google');
  }

  const data = await res.json();
  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl,
    sheetTitle: data.sheets?.[0]?.properties?.title || 'Respuestas de la Encuesta'
  };
}
