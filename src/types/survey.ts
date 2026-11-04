export interface SurveyResponse {
  id: string;
  timestamp: string;
  identificacion: string; // Nombre o Ficha (opcional)
  relacionCentro: string; // ¿Cuál es tu relación con el Centro Agropecuario de Buga?
  frecuenciaUso: string; // ¿Con qué frecuencia utilizas la sala F3?
  propositoUso: string; // ¿Para qué utilizas principalmente la sala F3?
  equiposPerifericos: number | string; // Rendimiento de equipos y periféricos (1-5)
  conectividadInternet: number | string; // Velocidad y estabilidad de internet (1-5)
  softwareRequerido: string; // Disponibilidad de software para formación
  iluminacionVentilacion: number | string; // Iluminación y ventilación/clima (1-5)
  limpiezaMobiliario: number | string; // Limpieza y comodidad de sillas/mesas (1-5)
  satisfaccionGeneral: number; // Satisfacción global (1-5)
  recomendaciones: string; // Dificultades y sugerencias de mejora
  syncedToGoogleSheets?: boolean;
}

export interface SurveyConfig {
  googleSheetsWebhookUrl: string;
  spreadsheetName: string;
  autoSync: boolean;
}
