export interface QuestionOption {
  value: string;
  label: string;
  description?: string;
  icon?: string;
}

export interface QuestionDefinition {
  id: keyof import('../types/survey').SurveyResponse;
  number: number;
  title: string;
  subtitle?: string;
  type: 'select-card' | 'rating-stars' | 'rating-buttons' | 'textarea' | 'text';
  required: boolean;
  options?: QuestionOption[];
  min?: number;
  max?: number;
  minLabel?: string;
  maxLabel?: string;
  placeholder?: string;
}

export const SURVEY_QUESTIONS: QuestionDefinition[] = [
  {
    id: 'relacionCentro',
    number: 1,
    title: '¿Cuál es tu relación con el Centro Agropecuario de Buga?',
    subtitle: 'Selecciona el rol con el que estás vinculado a la institución',
    type: 'select-card',
    required: true,
    options: [
      { value: 'Aprendiz', label: 'Aprendiz (SENA)', description: 'Estudiante en etapa lectiva o práctica' },
      { value: 'Instructor', label: 'Instructor / Docente', description: 'Formador a cargo de ambientes de aprendizaje' },
      { value: 'Funcionario', label: 'Funcionario / Administrativo', description: 'Personal de apoyo o coordinación del Centro' },
      { value: 'Egresado', label: 'Egresado', description: 'Graduado del Centro Agropecuario' },
      { value: 'Visitante', label: 'Visitante / Externo', description: 'Participante en eventos o actividades externas' }
    ]
  },
  {
    id: 'frecuenciaUso',
    number: 2,
    title: '¿Con qué frecuencia utilizas la sala de computación F3?',
    subtitle: 'Indica la regularidad de tus visitas o actividades en este ambiente',
    type: 'select-card',
    required: true,
    options: [
      { value: 'Diario', label: 'Todos los días', description: 'Uso continuo durante la semana' },
      { value: '2-3 veces por semana', label: '2 a 3 veces por semana', description: 'Uso frecuente según horario' },
      { value: 'Semanalmente', label: '1 vez por semana', description: 'Para sesiones específicas' },
      { value: 'Ocasional', label: 'Ocasionalmente / Primera vez', description: 'Uso esporádico o eventual' }
    ]
  },
  {
    id: 'propositoUso',
    number: 3,
    title: '¿Para qué utilizas principalmente la sala F3?',
    subtitle: 'Elige la actividad principal que desarrollas en este ambiente',
    type: 'select-card',
    required: true,
    options: [
      { value: 'Formación y clases', label: 'Formación y clases técnicas', description: 'Sesiones dirigidas con instructor' },
      { value: 'Prácticas y talleres', label: 'Prácticas libres y tareas', description: 'Desarrollo de guías y talleres' },
      { value: 'Investigación y proyectos', label: 'Investigación y proyectos', description: 'Trabajo colaborativo y consulta' },
      { value: 'Evaluaciones', label: 'Evaluaciones y exámenes', description: 'Pruebas de conocimiento o certificación' }
    ]
  },
  {
    id: 'equiposPerifericos',
    number: 4,
    title: '¿Qué tan satisfecho estás con el estado y rendimiento de los equipos de cómputo?',
    subtitle: 'Evalúa la rapidez de las máquinas, pantallas, teclados y ratones',
    type: 'rating-stars',
    required: true,
    min: 1,
    max: 5,
    minLabel: 'Muy deficiente',
    maxLabel: 'Excelente rendimiento'
  },
  {
    id: 'conectividadInternet',
    number: 5,
    title: '¿Cómo calificas la velocidad y estabilidad de la conexión a Internet en la sala F3?',
    subtitle: 'Evalúa la navegación web, descargas y acceso a plataformas institucionales',
    type: 'rating-stars',
    required: true,
    min: 1,
    max: 5,
    minLabel: 'Conexión inestable/lenta',
    maxLabel: 'Rápida y muy estable'
  },
  {
    id: 'softwareRequerido',
    number: 6,
    title: '¿Los computadores cuentan con el software y programas necesarios para tu formación?',
    subtitle: 'Disponibilidad de herramientas técnicas, navegadores, suites de oficina y software especializado',
    type: 'select-card',
    required: true,
    options: [
      { value: 'Sí, totalmente', label: 'Sí, totalmente', description: 'Cuenta con todo el software actualizado' },
      { value: 'La mayoría está disponible', label: 'La mayoría está disponible', description: 'Satisface casi todas las necesidades' },
      { value: 'Faltan algunos programas clave', label: 'Faltan algunos programas clave', description: 'Se requieren instalaciones adicionales' },
      { value: 'No cumple con los requerimientos', label: 'No cumple con los requerimientos', description: 'Software desactualizado o faltante' }
    ]
  },
  {
    id: 'iluminacionVentilacion',
    number: 7,
    title: '¿Cómo evalúas la iluminación, ventilación y temperatura de la sala F3?',
    subtitle: 'Confort térmico (aire acondicionado/ventiladores) y visibilidad en el espacio',
    type: 'rating-stars',
    required: true,
    min: 1,
    max: 5,
    minLabel: 'Ambiente caluroso / oscuro',
    maxLabel: 'Excelente clima y luz'
  },
  {
    id: 'limpiezaMobiliario',
    number: 8,
    title: '¿Qué tan satisfecho estás con el orden, limpieza y comodidad del mobiliario?',
    subtitle: 'Estado y comodidad de sillas, mesas de trabajo, orden y aseo general del ambiente',
    type: 'rating-stars',
    required: true,
    min: 1,
    max: 5,
    minLabel: 'Inadecuado o sucio',
    maxLabel: 'Muy cómodo e impecable'
  },
  {
    id: 'satisfaccionGeneral',
    number: 9,
    title: 'En general, ¿cuál es tu nivel de satisfacción global con la sala de cómputo F3?',
    subtitle: 'Tu calificación global sobre la experiencia en este ambiente del Centro Agropecuario de Buga',
    type: 'rating-buttons',
    required: true,
    min: 1,
    max: 5,
    minLabel: 'Muy insatisfecho',
    maxLabel: 'Totalmente satisfecho'
  },
  {
    id: 'recomendaciones',
    number: 10,
    title: '¿Qué dificultades has encontrado o qué recomendación tienes para mejorar la sala F3?',
    subtitle: 'Tus comentarios ayudan al Centro Agropecuario de Buga a priorizar mejoras en equipos, software o infraestructura',
    type: 'textarea',
    required: false,
    placeholder: 'Escribe aquí cualquier fallo en equipos (número de PC), sugerencia de software a instalar, aire acondicionado, etc...'
  }
];

export const INITIAL_RESPONSES = [
  {
    id: 'resp-init-1',
    timestamp: '27/10/2026, 9:04:00 p. m.',
    identificacion: 'Juan José Betancourt (Ficha 3411073)',
    relacionCentro: 'Aprendiz',
    frecuenciaUso: 'Diario',
    propositoUso: 'Formación y clases',
    equiposPerifericos: 4,
    conectividadInternet: 4,
    softwareRequerido: 'Sí, totalmente',
    iluminacionVentilacion: 5,
    limpiezaMobiliario: 4,
    satisfaccionGeneral: 5,
    recomendaciones: 'Mejorar la estabilidad del aire acondicionado en las tardes y verificar el mouse de los equipos del lateral derecho.',
    syncedToGoogleSheets: true
  },
  {
    id: 'resp-init-2',
    timestamp: '28/10/2026, 11:20:15 a. m.',
    identificacion: 'Carolina Morales (Instructora)',
    relacionCentro: 'Instructor',
    frecuenciaUso: '2-3 veces por semana',
    propositoUso: 'Formación y clases',
    equiposPerifericos: 5,
    conectividadInternet: 4,
    softwareRequerido: 'La mayoría está disponible',
    iluminacionVentilacion: 4,
    limpiezaMobiliario: 5,
    satisfaccionGeneral: 4,
    recomendaciones: 'Instalar Visual Studio Code y actualizar la versión de Python en los computadores 12 al 18.',
    syncedToGoogleSheets: true
  },
  {
    id: 'resp-init-3',
    timestamp: '29/10/2026, 3:45:22 p. m.',
    identificacion: 'David Fernando Gómez (Aprendiz ADSO)',
    relacionCentro: 'Aprendiz',
    frecuenciaUso: 'Diario',
    propositoUso: 'Prácticas y talleres',
    equiposPerifericos: 4,
    conectividadInternet: 5,
    softwareRequerido: 'Sí, totalmente',
    iluminacionVentilacion: 4,
    limpiezaMobiliario: 4,
    satisfaccionGeneral: 5,
    recomendaciones: 'Excelente ambiente de computación, muy buena velocidad de internet para clonar repositorios.',
    syncedToGoogleSheets: true
  }
];
