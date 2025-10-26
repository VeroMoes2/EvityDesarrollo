import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import type { QuestionnaireResult } from "@shared/schema";
import { 
  ClipboardCheck, 
  ArrowLeft, 
  ArrowRight, 
  Save, 
  CheckCircle2,
  Pause,
  Calculator,
  RotateCcw,
  Calendar
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface QuestionOption {
  text: string;
  points: number;
}

interface Question {
  id: string;
  section: string;
  question: string;
  type: "select" | "weight-height";
  options?: QuestionOption[];
  required: boolean;
}

const QUESTIONS: Question[] = [
  // Sección 1: Actividad física y sedentarismo (3 preguntas)
  {
    id: "1",
    section: "Actividad física y sedentarismo",
    question: "¿Cuántos días por semana realiza actividad física moderada o vigorosa (correr, nadar, caminar rápido, baile)?",
    type: "select",
    options: [
      { text: "5-7 días/semana", points: 5 },
      { text: "3-4 días/semana", points: 4 },
      { text: "1-2 días/semana", points: 3 },
      { text: "<1 día/semana", points: 2 },
      { text: "Nada o totalmente sedentario", points: 1 },
    ],
    required: true,
  },
  {
    id: "2",
    section: "Actividad física y sedentarismo",
    question: "¿Cuántos minutos dedica en promedio a cada sesión?",
    type: "select",
    options: [
      { text: "≥ 60 min/sesión", points: 5 },
      { text: "30–59 min/sesión", points: 4 },
      { text: "15–29 min/sesión", points: 3 },
      { text: "< 15 min/sesión", points: 2 },
      { text: "Sin sesiones estructuradas", points: 1 },
    ],
    required: true,
  },
  {
    id: "3",
    section: "Actividad física y sedentarismo",
    question: "¿Cuántas horas al día pasa sentado/a o inactivo/a?",
    type: "select",
    options: [
      { text: "< 4 horas/día", points: 5 },
      { text: "4–6 horas/día", points: 4 },
      { text: "6–8 horas/día", points: 3 },
      { text: "> 8 horas/día sin pausas activas", points: 2 },
      { text: "> 10 horas/día sedentario", points: 1 },
    ],
    required: true,
  },
  // Sección 2: Dieta y nutrición (3 preguntas)
  {
    id: "4",
    section: "Dieta y nutrición",
    question: "¿Cuántas porciones de frutas y verduras consume al día?",
    type: "select",
    options: [
      { text: "≥ 5 porciones al día", points: 5 },
      { text: "3–4 porciones al día", points: 4 },
      { text: "2 porciones al día", points: 3 },
      { text: "1 porción al día", points: 2 },
      { text: "Rara vez o nunca come frutas/verduras", points: 1 },
    ],
    required: true,
  },
  {
    id: "5",
    section: "Dieta y nutrición",
    question: "¿Con qué frecuencia come alimentos ultraprocesados o bebe refrescos/azucaradas?",
    type: "select",
    options: [
      { text: "Casi nunca o < 1 vez por semana", points: 5 },
      { text: "1-2 veces por semana", points: 4 },
      { text: "3-4 veces por semana", points: 3 },
      { text: "≥ 1 vez al día", points: 2 },
      { text: "Varias veces al día (refrescos o comida rápida frecuente)", points: 1 },
    ],
    required: true,
  },
  {
    id: "6",
    section: "Dieta y nutrición",
    question: "¿Qué tipo de grasa utiliza habitualmente para cocinar (aceite de oliva, vegetal, mantequilla, manteca)?",
    type: "select",
    options: [
      { text: "Aceite de oliva extra virgen o aguacate como grasa principal", points: 5 },
      { text: "Aceites vegetales no refinados (canola, maíz, girasol) sin manteca o margarina", points: 4 },
      { text: "Mezcla entre aceites vegetales y mantequilla", points: 3 },
      { text: "Mantequilla, margarina o crema diariamente", points: 2 },
      { text: "Manteca o grasas animales como grasa principal", points: 1 },
    ],
    required: true,
  },
  // Sección 3: Peso e índice de masa corporal (2 preguntas)
  {
    id: "7",
    section: "Peso e índice de masa corporal",
    question: "¿Cuál es su peso y estatura actual?",
    type: "weight-height",
    required: true,
  },
  {
    id: "8",
    section: "Peso e índice de masa corporal",
    question: "¿Ha tenido cambios significativos de peso en el último año?",
    type: "select",
    options: [
      { text: "No, peso estable (±2 kg)", points: 5 },
      { text: "Cambio leve (±3–5 kg)", points: 4 },
      { text: "Cambio moderado (±6–10 kg)", points: 3 },
      { text: "Cambio importante (>10 kg)", points: 2 },
      { text: "Fluctuaciones recurrentes o pérdida no intencionada", points: 1 },
    ],
    required: true,
  },
  // Sección 4: Tabaquismo (3 preguntas)
  {
    id: "9",
    section: "Tabaquismo",
    question: "¿Ha fumado alguna vez (cigarrillos, vapeo u otros)?",
    type: "select",
    options: [
      { text: "Nunca ha fumado", points: 5 },
      { text: "Exfumador ocasional (≤1 cajetilla/mes)", points: 4 },
      { text: "Exfumador moderado (<10 años o <5 paquetes-año)", points: 3 },
      { text: "Fumador activo leve (5–15 paquetes-año)", points: 2 },
      { text: "Fumador activo crónico (>15 paquetes-año o diario)", points: 1 },
    ],
    required: true,
  },
  {
    id: "10",
    section: "Tabaquismo",
    question: "¿Cuántos cigarrillos por día y durante cuántos años?",
    type: "select",
    options: [
      { text: "Nunca fumó", points: 5 },
      { text: "≤1 cigarro/día, <5 años", points: 4 },
      { text: "5–10 cig/día o <10 años", points: 3 },
      { text: "10–20 cig/día, 10–20 años", points: 2 },
      { text: "≥20 cig/día o >20 años", points: 1 },
    ],
    required: true,
  },
  {
    id: "11",
    section: "Tabaquismo",
    question: "¿Hace cuánto tiempo dejó de fumar (si aplica)?",
    type: "select",
    options: [
      { text: "Nunca fumó", points: 5 },
      { text: "Dejó hace >10 años", points: 4 },
      { text: "Dejó hace 5–10 años", points: 3 },
      { text: "Dejó hace <5 años", points: 2 },
      { text: "Aún fuma", points: 1 },
    ],
    required: true,
  },
  // Sección 5: Alcohol (3 preguntas)
  {
    id: "12",
    section: "Alcohol",
    question: "¿Cuántas bebidas alcohólicas consume por semana?",
    type: "select",
    options: [
      { text: "Ninguna o ≤1 bebida", points: 5 },
      { text: "2–4 bebidas", points: 4 },
      { text: "5–7 bebidas", points: 3 },
      { text: "8–14 bebidas", points: 2 },
      { text: "≥15 bebidas", points: 1 },
    ],
    required: true,
  },
  {
    id: "13",
    section: "Alcohol",
    question: "¿Suele tomar más de 4 bebidas en una sola ocasión?",
    type: "select",
    options: [
      { text: "Nunca", points: 5 },
      { text: "Muy rara vez (1–2 veces/año)", points: 4 },
      { text: "Ocasional (mensual)", points: 3 },
      { text: "Frecuente (semanal)", points: 2 },
      { text: "Muy frecuente (varias veces/semana)", points: 1 },
    ],
    required: true,
  },
  {
    id: "14",
    section: "Alcohol",
    question: "¿Tiene días sin alcohol cada semana?",
    type: "select",
    options: [
      { text: "Sí, 6–7 días sin alcohol", points: 5 },
      { text: "4–5 días sin alcohol", points: 4 },
      { text: "2–3 días sin alcohol", points: 3 },
      { text: "1 día sin alcohol", points: 2 },
      { text: "Bebe todos los días", points: 1 },
    ],
    required: true,
  },
  // Sección 6: Sueño y descanso (3 preguntas)
  {
    id: "15",
    section: "Sueño y descanso",
    question: "¿Cuántas horas duerme por noche en promedio?",
    type: "select",
    options: [
      { text: "7–8 horas", points: 5 },
      { text: "6–7 horas", points: 4 },
      { text: "<6 horas o >9 horas", points: 3 },
      { text: "Sueño fragmentado o <5 horas", points: 2 },
      { text: "Insomnio crónico o muy irregular", points: 1 },
    ],
    required: true,
  },
  {
    id: "16",
    section: "Sueño y descanso",
    question: "¿Tiene dificultad para conciliar o mantener el sueño?",
    type: "select",
    options: [
      { text: "Nunca", points: 5 },
      { text: "Ocasionalmente", points: 4 },
      { text: "Algunas veces/semana", points: 3 },
      { text: "Casi todas las noches", points: 2 },
      { text: "Insomnio diagnosticado o uso crónico de hipnóticos", points: 1 },
    ],
    required: true,
  },
  {
    id: "17",
    section: "Sueño y descanso",
    question: "¿Siente cansancio o somnolencia durante el día?",
    type: "select",
    options: [
      { text: "Nunca", points: 5 },
      { text: "Rara vez", points: 4 },
      { text: "Ocasionalmente", points: 3 },
      { text: "Frecuente", points: 2 },
      { text: "Somnolencia diaria o apnea diagnosticada", points: 1 },
    ],
    required: true,
  },
  // Sección 7: Salud mental (3 preguntas)
  {
    id: "18",
    section: "Salud mental",
    question: "En las últimas dos semanas, ¿con qué frecuencia se ha sentido triste o sin interés en las cosas?",
    type: "select",
    options: [
      { text: "Nunca", points: 5 },
      { text: "Varios días", points: 4 },
      { text: "Más de la mitad de los días", points: 3 },
      { text: "Casi todos los días", points: 2 },
      { text: "Todos los días, con interferencia funcional", points: 1 },
    ],
    required: true,
  },
  {
    id: "19",
    section: "Salud mental",
    question: "¿Ha sentido ansiedad o preocupación constante que interfiera con su vida diaria?",
    type: "select",
    options: [
      { text: "Nunca", points: 5 },
      { text: "Rara vez", points: 4 },
      { text: "Ocasionalmente", points: 3 },
      { text: "Frecuente", points: 2 },
      { text: "Constante o diagnosticada", points: 1 },
    ],
    required: true,
  },
  {
    id: "20",
    section: "Salud mental",
    question: "¿Ha tenido pensamientos negativos o autocríticos recurrentes?",
    type: "select",
    options: [
      { text: "Nunca", points: 5 },
      { text: "Rara vez", points: 4 },
      { text: "Ocasionalmente", points: 3 },
      { text: "Frecuente", points: 2 },
      { text: "Pensamientos autodestructivos", points: 1 },
    ],
    required: true,
  },
  // Sección 8: Enfermedades crónicas (3 preguntas)
  {
    id: "21",
    section: "Enfermedades crónicas",
    question: "¿Le han diagnosticado diabetes, hipertensión, cardiopatía, cáncer, renal o pulmonar?",
    type: "select",
    options: [
      { text: "Nunca", points: 5 },
      { text: "Una leve o controlada", points: 4 },
      { text: "1–2 moderadas", points: 3 },
      { text: "1 severa o complicada", points: 2 },
      { text: "≥2 enfermedades crónicas graves", points: 1 },
    ],
    required: true,
  },
  {
    id: "22",
    section: "Enfermedades crónicas",
    question: "¿Toma medicamentos de forma continua?",
    type: "select",
    options: [
      { text: "Ninguno", points: 5 },
      { text: "1 medicamento preventivo", points: 4 },
      { text: "2–3 medicamentos", points: 3 },
      { text: "≥4 medicamentos", points: 2 },
      { text: "Polifarmacia o tratamiento complejo", points: 1 },
    ],
    required: true,
  },
  {
    id: "23",
    section: "Enfermedades crónicas",
    question: "¿Sus enfermedades afectan su capacidad para mantener actividad física o vida diaria?",
    type: "select",
    options: [
      { text: "No", points: 5 },
      { text: "Leve impacto", points: 4 },
      { text: "Limitación moderada", points: 3 },
      { text: "Limitación frecuente", points: 2 },
      { text: "Dependencia o incapacidad", points: 1 },
    ],
    required: true,
  },
  // Sección 9: Apoyo social y propósito (3 preguntas)
  {
    id: "24",
    section: "Apoyo social y propósito",
    question: "¿Con qué frecuencia convive con amigos o familiares?",
    type: "select",
    options: [
      { text: "≥ 3 veces/semana", points: 5 },
      { text: "1–2 veces/semana", points: 4 },
      { text: "2–3 veces/mes", points: 3 },
      { text: "1 vez/mes o menos", points: 2 },
      { text: "Casi nunca", points: 1 },
    ],
    required: true,
  },
  {
    id: "25",
    section: "Apoyo social y propósito",
    question: "¿Participa en actividades sociales, religiosas o de voluntariado?",
    type: "select",
    options: [
      { text: "Frecuentemente", points: 5 },
      { text: "Ocasionalmente", points: 4 },
      { text: "Esporádicamente", points: 3 },
      { text: "Rara vez", points: 2 },
      { text: "Nunca", points: 1 },
    ],
    required: true,
  },
  {
    id: "26",
    section: "Apoyo social y propósito",
    question: "¿Siente que su vida tiene propósito y metas significativas?",
    type: "select",
    options: [
      { text: "Siempre", points: 5 },
      { text: "Casi siempre", points: 4 },
      { text: "A veces", points: 3 },
      { text: "Rara vez", points: 2 },
      { text: "Nunca", points: 1 },
    ],
    required: true,
  },
  // Sección 10: Cognición y funcionalidad (3 preguntas)
  {
    id: "27",
    section: "Cognición y funcionalidad",
    question: "¿Ha notado olvidos frecuentes o lentitud mental reciente?",
    type: "select",
    options: [
      { text: "Nunca", points: 5 },
      { text: "Ocasional", points: 4 },
      { text: "A veces afecta tareas", points: 3 },
      { text: "Frecuente", points: 2 },
      { text: "Grave o con diagnóstico", points: 1 },
    ],
    required: true,
  },
  {
    id: "28",
    section: "Cognición y funcionalidad",
    question: "¿Puede realizar sus actividades diarias (aseo, comidas, finanzas) sin ayuda?",
    type: "select",
    options: [
      { text: "Completamente independiente", points: 5 },
      { text: "Leves apoyos ocasionales", points: 4 },
      { text: "Requiere ayuda parcial", points: 3 },
      { text: "Dependencia moderada", points: 2 },
      { text: "Dependencia total", points: 1 },
    ],
    required: true,
  },
  {
    id: "29",
    section: "Cognición y funcionalidad",
    question: "¿Se orienta bien en lugares conocidos y mantiene buena comunicación?",
    type: "select",
    options: [
      { text: "Siempre", points: 5 },
      { text: "Ocasional desorientación", points: 4 },
      { text: "A veces pierde el hilo de la conversación", points: 3 },
      { text: "Frecuente confusión o lentitud", points: 2 },
      { text: "Desorientación o dificultad marcada", points: 1 },
    ],
    required: true,
  },
];

function calculateBMI(weight: number, height: number): number {
  return weight / (height * height);
}

function getBMIPoints(bmi: number): number {
  if (bmi >= 18.5 && bmi <= 24.9) return 5;
  if (bmi >= 25 && bmi <= 26.9) return 4;
  if (bmi >= 27 && bmi <= 29.9) return 3;
  if (bmi >= 30 && bmi <= 34.9) return 2;
  return 1;
}

function getHealthStatus(totalPoints: number): string {
  // Nueva escala: 10-50 puntos totales (10 secciones × promedio 1-5 puntos cada una)
  if (totalPoints >= 40) { // ≥ 80% (promedio 4.0+)
    return "Buena longevidad y esperanza de vida: riesgo bajo de mortalidad prematura";
  } else if (totalPoints >= 32) { // 64-79% (promedio 3.2-3.9)
    return "bueno";
  } else if (totalPoints >= 22) { // 44-63% (promedio 2.2-3.1)
    return "regular";
  } else { // < 44% (promedio < 2.2)
    return "necesita atención";
  }
}

function calculateLongevityPoints(totalPoints: number): number {
  // Convertir escala de 10-50 a 0-100
  // Fórmula: ((totalPoints - 10) / 40) × 100
  const normalized = ((totalPoints - 10) / 40) * 100;
  return Math.round(Math.max(0, Math.min(100, normalized)));
}

// Función para calcular promedios por sección
function calculateSectionAverages(answers: Record<string, any>): Record<string, number> {
  const sectionAverages: Record<string, number> = {};
  
  // Agrupar preguntas por sección
  const sections = Array.from(new Set(QUESTIONS.map(q => q.section)));
  
  for (const section of sections) {
    const sectionQuestions = QUESTIONS.filter(q => q.section === section);
    let sectionPoints = 0;
    let sectionCount = 0;
    
    for (const question of sectionQuestions) {
      if (question.type === "weight-height") {
        const weight = parseFloat(answers[`${question.id}_weight`] || "0");
        const height = parseFloat(answers[`${question.id}_height`] || "0") / 100;
        
        if (!isNaN(weight) && !isNaN(height) && height > 0) {
          const bmi = calculateBMI(weight, height);
          const bmiPoints = getBMIPoints(bmi);
          sectionPoints += bmiPoints;
          sectionCount++;
        }
      } else {
        const answer = answers[question.id];
        if (answer) {
          const option = question.options?.find(opt => opt.text === answer);
          if (option) {
            sectionPoints += option.points;
            sectionCount++;
          }
        }
      }
    }
    
    if (sectionCount > 0) {
      sectionAverages[section] = sectionPoints / sectionCount;
    }
  }
  
  return sectionAverages;
}

// Interpretaciones por sección basadas en promedios
const SECTION_INTERPRETATIONS: Record<string, Record<string, string>> = {
  "Dieta y nutrición": {
    "1-2": `Tu alimentación actual parece estar muy cargada de azúcares simples, grasas animales y alimentos procesados, y es baja en fibra y nutrientes esenciales. Este tipo de dieta puede aumentar el riesgo de diabetes, enfermedades del corazón, obesidad y otros problemas que conocemos como "enfermedades de la civilización".

Mi recomendación es empezar poco a poco: da prioridad a alimentos reales y naturales, basándote en la Pirámide de la Alimentación Saludable. Incluye más frutas, verduras, leguminosas, pescado, frutos secos y aceite de oliva.

Recuerda, cada cambio cuenta, no tienes que hacerlo todo de golpe, lo importante es avanzar un paso a la vez hacia una alimentación más consciente.`,
    
    "2-4": `Vas por buen camino. Conforme avanzamos en la vida, nuestro cuerpo necesita menos calorías, pero más nutrientes de calidad. Por eso, te recomiendo fortalecer tus elecciones alimentarias con alimentos ricos en fibra y micronutrientes: panes y cereales integrales, frijoles, nueces, semillas sin sal, verduras coloridas y frutas frescas.

Además, sigue cuidando tu estilo de vida con actividad física regular, descanso reparador y manejo del estrés. Estos hábitos son grandes aliados para prevenir enfermedades metabólicas y cardiovasculares.

Estás en una buena etapa: solo afina los detalles para que tu bienestar siga mejorando.`,
    
    "5": `¡Excelente trabajo! Estás manteniendo una dieta equilibrada, variada y consciente, enfocada en cubrir tus necesidades energéticas sin excederte. Eso te permite mantener un peso saludable y una buena vitalidad.

Sigue priorizando frutas, verduras, pescado, leguminosas, frutos secos y aceite de oliva como base de tu alimentación.

Tu equilibrio entre lo que comes y lo que gastas en energía diaria es un ejemplo de autocuidado funcional.

Vas por un camino excelente, continúa así y escucha siempre las señales de tu cuerpo.`
  },
  
  "Actividad física y sedentarismo": {
    "1-2": `Sabemos que la actividad física es clave para un envejecimiento saludable. Cuando el cuerpo no se mueve lo suficiente, aumenta el riesgo de enfermedades crónicas, sobrepeso, obesidad y problemas metabólicos. Además, se ha demostrado que el sedentarismo, es decir, pasar muchas horas sentado, frente a pantallas o sin movimiento es un factor de riesgo independiente, distinto a la falta de ejercicio, que también afecta tu salud y longevidad.

Mi recomendación es comenzar con pequeños pasos sostenibles. Intenta moverte más a lo largo del día: camina al menos 10 minutos después de cada comida, estírate cada hora si trabajas sentado y busca cualquier oportunidad para mantenerte activo.

El objetivo mínimo es alcanzar 150 a 300 minutos semanales de actividad aeróbica moderada (por ejemplo, caminar a paso rápido o andar en bicicleta), o bien 75 a 150 minutos de actividad vigorosa (como correr o nadar). Además, dos o más días por semana incluye ejercicios de fuerza: trabajar tus músculos mejora el metabolismo, fortalece huesos y protege tus articulaciones.

Recuerda: el movimiento es medicina. No se trata de hacerlo perfecto, sino de empezar a moverte con constancia.`,
    
    "3-4": `¡Vas por un excelente camino! Ya has integrado actividad física en tu rutina, y eso se nota. Ahora el siguiente paso es mantener la constancia y aumentar progresivamente la intensidad o la duración. Los adultos pueden obtener beneficios adicionales si superan los 300 minutos semanales de actividad aeróbica moderada o 150 minutos de intensidad vigorosa, o bien una combinación de ambas.

Numerosos estudios confirman que quienes se mantienen activos tienen menor riesgo de mortalidad por cualquier causa, enfermedades cardiovasculares y metabólicas.

Un punto importante: actividad física y sedentarismo no son lo mismo. Puedes hacer ejercicio una hora al día, pero si pasas el resto del tiempo sentado, el cuerpo lo resiente. Intenta reducir el tiempo frente a pantallas, televisión o en el escritorio, y compénsalo con breves pausas activas o caminatas.

Combinar movimiento regular y menos tiempo sedentario te ayudará a mantener una vida más vital, plena y saludable.`,
    
    "5": `¡Muy buen trabajo! Tus niveles de actividad física son un reflejo de disciplina y autocuidado. Está ampliamente comprobado que toda forma de movimiento, sin importar la intensidad reduce el riesgo de mortalidad, enfermedades cardiovasculares, hipertensión, diabetes tipo 2 y ciertos tipos de cáncer.

Además, mantenerse activo mejora la salud mental, la función cognitiva y la calidad del sueño, y ayuda a controlar el peso corporal y prevenir el aumento de grasa con los años.

Sigue fortaleciendo tu rutina con variedad: combina ejercicio aeróbico, fuerza muscular y actividades de flexibilidad o movilidad.

Y aunque ya llevas un excelente nivel, mantente atento al sedentarismo fuera del entrenamiento. Evita pasar largos periodos sentado o con pantallas, ya que incluso en personas activas, el exceso de sedentarismo puede contrarrestar algunos beneficios.

Estás haciendo un trabajo extraordinario. Tu cuerpo y tu mente te lo están agradeciendo cada día.`
  }
};

// Función para generar interpretaciones basadas en promedios
function generateSectionInterpretations(sectionAverages: Record<string, number>): Record<string, string> {
  const interpretations: Record<string, string> = {};
  
  for (const [section, average] of Object.entries(sectionAverages)) {
    const sectionInterpretation = SECTION_INTERPRETATIONS[section];
    
    if (sectionInterpretation) {
      // Determinar qué rango aplica
      if (average >= 1 && average < 2) {
        interpretations[section] = sectionInterpretation["1-2"];
      } else if (average >= 2 && average < 5) {
        // Para Actividad física, el rango es 3-4 en lugar de 2-4
        if (section === "Actividad física y sedentarismo" && average >= 3) {
          interpretations[section] = sectionInterpretation["3-4"];
        } else if (section === "Dieta y nutrición") {
          interpretations[section] = sectionInterpretation["2-4"];
        }
      } else if (average === 5) {
        interpretations[section] = sectionInterpretation["5"];
      }
    }
  }
  
  return interpretations;
}

export default function Cuestionario() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);

  // Verificar si ya existe un resultado completado
  const { data: latestResultData, isLoading: isLoadingLatestResult } = useQuery({
    queryKey: ["/api/questionnaire-results/latest"],
    enabled: isAuthenticated,
  });

  const { data: questionnaireData, isLoading: isLoadingQuestionnaire } = useQuery({
    queryKey: ["/api/questionnaire"],
    enabled: isAuthenticated && showQuestionnaire,
  });

  useEffect(() => {
    if (questionnaireData && typeof questionnaireData === 'object' && 'exists' in questionnaireData && questionnaireData.exists && 'questionnaire' in questionnaireData && questionnaireData.questionnaire) {
      const savedAnswers = (questionnaireData.questionnaire as any).answers || {};
      setAnswers(savedAnswers);
      
      const savedQuestion = (questionnaireData.questionnaire as any).currentQuestion;
      if (savedQuestion) {
        const questionIndex = QUESTIONS.findIndex(q => q.id === savedQuestion);
        if (questionIndex !== -1) {
          setCurrentQuestionIndex(questionIndex);
        }
      }
    }
  }, [questionnaireData]);

  const saveProgressMutation = useMutation({
    mutationFn: async (data: { answers: Record<string, any>; currentQuestion: string; isCompleted?: string; longevityPoints?: string; healthStatus?: string; sectionInterpretations?: Record<string, string> }) => {
      // Si está completado, asegurar que se calculen las interpretaciones
      if (data.isCompleted === "true" && !data.sectionInterpretations) {
        const sectionAverages = calculateSectionAverages(data.answers);
        data.sectionInterpretations = generateSectionInterpretations(sectionAverages);
      }
      return await apiRequest("POST", "/api/questionnaire", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questionnaire"] });
    },
  });

  const updateProgressMutation = useMutation({
    mutationFn: async (data: { answers: Record<string, any>; currentQuestion: string; isCompleted?: string; longevityPoints?: string; healthStatus?: string; sectionInterpretations?: Record<string, string> }) => {
      // Si está completado, asegurar que se calculen las interpretaciones
      if (data.isCompleted === "true" && !data.sectionInterpretations) {
        const sectionAverages = calculateSectionAverages(data.answers);
        data.sectionInterpretations = generateSectionInterpretations(sectionAverages);
      }
      return await apiRequest("PUT", "/api/questionnaire", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questionnaire"] });
    },
  });

  const handleSaveProgress = async (showToast = true) => {
    setIsSaving(true);
    try {
      const currentQuestion = QUESTIONS[currentQuestionIndex];
      const data = {
        answers,
        currentQuestion: currentQuestion.id,
        isCompleted: "false",
      };

      if (questionnaireData && typeof questionnaireData === 'object' && 'exists' in questionnaireData && questionnaireData.exists) {
        await updateProgressMutation.mutateAsync(data);
      } else {
        await saveProgressMutation.mutateAsync(data);
      }

      if (showToast) {
        toast({
          title: "Progreso guardado",
          description: "Tus respuestas han sido guardadas correctamente.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el progreso.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePauseAndExit = async () => {
    await handleSaveProgress(false);
    toast({
      title: "Cuestionario pausado",
      description: "Puedes continuar más tarde desde donde lo dejaste.",
    });
    navigate("/perfil");
  };

  const handleNext = async () => {
    const currentQuestion = QUESTIONS[currentQuestionIndex];
    
    if (currentQuestion.required) {
      if (currentQuestion.type === "weight-height") {
        const weight = answers[`${currentQuestion.id}_weight`];
        const height = answers[`${currentQuestion.id}_height`];
        if (!weight || !height || weight.trim() === "" || height.trim() === "") {
          toast({
            title: "Campo requerido",
            description: "Por favor ingresa tu peso y estatura.",
            variant: "destructive",
          });
          return;
        }
      } else {
        const currentAnswer = answers[currentQuestion.id];
        if (!currentAnswer || currentAnswer.trim() === "") {
          toast({
            title: "Campo requerido",
            description: "Por favor responde esta pregunta antes de continuar.",
            variant: "destructive",
          });
          return;
        }
      }
    }

    if (currentQuestionIndex < QUESTIONS.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      const previousIndex = currentQuestionIndex;
      setCurrentQuestionIndex(nextIndex);
      
      setIsSaving(true);
      try {
        const nextQuestion = QUESTIONS[nextIndex];
        const data = {
          answers,
          currentQuestion: nextQuestion.id,
          isCompleted: "false",
        };

        if (questionnaireData && typeof questionnaireData === 'object' && 'exists' in questionnaireData && questionnaireData.exists) {
          await updateProgressMutation.mutateAsync(data);
        } else {
          await saveProgressMutation.mutateAsync(data);
        }
      } catch (error) {
        setCurrentQuestionIndex(previousIndex);
        toast({
          title: "Error",
          description: "No se pudo guardar el progreso.",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handlePrevious = async () => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      const previousIndex = currentQuestionIndex;
      setCurrentQuestionIndex(prevIndex);
      
      setIsSaving(true);
      try {
        const prevQuestion = QUESTIONS[prevIndex];
        const data = {
          answers,
          currentQuestion: prevQuestion.id,
          isCompleted: "false",
        };

        if (questionnaireData && typeof questionnaireData === 'object' && 'exists' in questionnaireData && questionnaireData.exists) {
          await updateProgressMutation.mutateAsync(data);
        } else {
          await saveProgressMutation.mutateAsync(data);
        }
      } catch (error) {
        setCurrentQuestionIndex(previousIndex);
        toast({
          title: "Error",
          description: "No se pudo guardar el progreso.",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    }
  };

  const calculateTotalPoints = (): { totalPoints: number; longevityPoints: number; healthStatus: string } => {
    const sections = [
      { start: 1, end: 3, name: "Actividad física" },
      { start: 4, end: 6, name: "Dieta" },
      { start: 7, end: 8, name: "Peso/IMC" },
      { start: 9, end: 11, name: "Tabaquismo" },
      { start: 12, end: 14, name: "Alcohol" },
      { start: 15, end: 17, name: "Sueño" },
      { start: 18, end: 20, name: "Salud mental" },
      { start: 21, end: 23, name: "Enfermedades crónicas" },
      { start: 24, end: 26, name: "Apoyo social" },
      { start: 27, end: 29, name: "Cognición" },
    ];

    let totalPoints = 0;

    for (const section of sections) {
      let sectionPoints = 0;
      let sectionCount = 0;

      for (let i = section.start; i <= section.end; i++) {
        const questionId = i.toString();
        
        if (questionId === "7") {
          const weight = parseFloat(answers["7_weight"]);
          const height = parseFloat(answers["7_height"]) / 100;
          if (!isNaN(weight) && !isNaN(height) && height > 0) {
            const bmi = calculateBMI(weight, height);
            const bmiPoints = getBMIPoints(bmi);
            sectionPoints += bmiPoints;
            sectionCount++;
          }
        } else {
          const answer = answers[questionId];
          if (answer) {
            const question = QUESTIONS.find(q => q.id === questionId);
            const option = question?.options?.find(opt => opt.text === answer);
            if (option) {
              sectionPoints += option.points;
              sectionCount++;
            }
          }
        }
      }

      if (sectionCount > 0) {
        totalPoints += sectionPoints / sectionCount;
      }
    }

    const longevityPoints = calculateLongevityPoints(totalPoints);
    const healthStatus = getHealthStatus(totalPoints);
    
    return { totalPoints, longevityPoints, healthStatus };
  };

  const handleComplete = async () => {
    for (const question of QUESTIONS) {
      if (question.required) {
        if (question.type === "weight-height") {
          const weight = answers[`${question.id}_weight`];
          const height = answers[`${question.id}_height`];
          if (!weight || !height || weight.trim() === "" || height.trim() === "") {
            toast({
              title: "Cuestionario incompleto",
              description: `Por favor completa la pregunta ${question.id}: ${question.question}`,
              variant: "destructive",
            });
            return;
          }
        } else {
          const answer = answers[question.id];
          if (!answer || answer.trim() === "") {
            toast({
              title: "Cuestionario incompleto",
              description: `Por favor completa la pregunta ${question.id}: ${question.question}`,
              variant: "destructive",
            });
            return;
          }
        }
      }
    }

    setIsSaving(true);
    try {
      const { totalPoints, longevityPoints, healthStatus } = calculateTotalPoints();
      
      // Calcular interpretaciones por sección
      const sectionAverages = calculateSectionAverages(answers);
      const sectionInterpretations = generateSectionInterpretations(sectionAverages);
      
      const data = {
        answers,
        currentQuestion: QUESTIONS[QUESTIONS.length - 1].id,
        isCompleted: "true",
        longevityPoints: longevityPoints.toString(),
        healthStatus,
        sectionInterpretations,
      };

      if (questionnaireData && typeof questionnaireData === 'object' && 'exists' in questionnaireData && questionnaireData.exists) {
        await updateProgressMutation.mutateAsync(data);
      } else {
        await saveProgressMutation.mutateAsync(data);
      }

      toast({
        title: "¡Cuestionario completado!",
        description: `Has obtenido ${longevityPoints} puntos de longevidad.`,
      });

      // Invalidar la query del resultado más reciente
      queryClient.invalidateQueries({ queryKey: ["/api/questionnaire-results/latest"] });

      setTimeout(() => {
        navigate("/cuestionario-resultados");
      }, 1500);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo completar el cuestionario.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Función para reiniciar el cuestionario
  const handleStartNewQuestionnaire = () => {
    setShowQuestionnaire(true);
    setAnswers({});
    setCurrentQuestionIndex(0);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Acceso restringido</CardTitle>
            <CardDescription>
              Debes iniciar sesión para acceder al cuestionario de longevidad.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/login")} className="w-full" data-testid="button-login">
              Iniciar sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoadingLatestResult || (showQuestionnaire && isLoadingQuestionnaire)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando cuestionario...</p>
        </div>
      </div>
    );
  }

  // Si ya existe un resultado y no estamos mostrando el cuestionario, mostrar el resumen
  const latestResult = (latestResultData && typeof latestResultData === 'object' && 'result' in latestResultData ? latestResultData.result : null) as QuestionnaireResult | null;
  if (latestResult && !showQuestionnaire) {
    const resultAnswers = latestResult.answers as Record<string, any>;
    const completedDate = new Date(latestResult.completedAt);
    
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Tu último cuestionario</h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/perfil")}
              data-testid="button-back-profile"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al perfil
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Resultados del cuestionario</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-2">
                    <Calendar className="h-4 w-4" />
                    Completado el {completedDate.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </CardDescription>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary">{latestResult.longevityPoints}</div>
                  <div className="text-sm text-muted-foreground">Puntos de longevidad</div>
                  <div className="text-xs mt-1 px-3 py-1 bg-primary/10 text-primary rounded-full">
                    {latestResult.healthStatus}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Mostrar resumen de respuestas */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Tus respuestas:</h3>
                {QUESTIONS.map((question, index) => {
                  let answerText = "";
                  if (question.type === "weight-height") {
                    const weight = resultAnswers[`${question.id}_weight`];
                    const height = resultAnswers[`${question.id}_height`];
                    answerText = weight && height ? `Peso: ${weight} kg, Estatura: ${height} cm` : "No respondida";
                  } else {
                    answerText = resultAnswers[question.id] || "No respondida";
                  }
                  
                  return (
                    <div key={question.id} className="border-l-2 border-primary/20 pl-4 py-2">
                      <div className="text-sm text-muted-foreground mb-1">{question.section}</div>
                      <div className="font-medium mb-1">{question.question}</div>
                      <div className="text-sm text-primary">{answerText}</div>
                    </div>
                  );
                })}
              </div>

              {/* Botones de acción */}
              <div className="pt-6 border-t space-y-3">
                <Button
                  onClick={handleStartNewQuestionnaire}
                  className="w-full"
                  size="lg"
                  data-testid="button-new-questionnaire"
                >
                  <RotateCcw className="h-5 w-5 mr-2" />
                  Hacer cuestionario nuevamente
                </Button>
                
                <Button
                  onClick={() => navigate("/historial-cuestionarios")}
                  variant="outline"
                  className="w-full"
                  size="lg"
                  data-testid="button-view-history"
                >
                  <Calendar className="h-5 w-5 mr-2" />
                  Ver historial completo
                </Button>
                
                <p className="text-xs text-gray-600 dark:text-gray-400 text-center mt-2">
                  Tus resultados anteriores se guardan automáticamente en el historial
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentQuestion = QUESTIONS[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / QUESTIONS.length) * 100;
  const currentSection = currentQuestion.section;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Conócete mejor</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/perfil")}
            disabled={isSaving}
            data-testid="button-back-profile"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al perfil
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Pregunta {currentQuestionIndex + 1} de {QUESTIONS.length}</span>
            <span>{Math.round(progress)}% completado</span>
          </div>
          <Progress value={progress} className="h-2" data-testid="progress-bar" />
        </div>

        <Card>
          <CardHeader>
            <div className="text-sm font-medium text-primary mb-2">{currentSection}</div>
            <CardTitle className="text-lg">{currentQuestion.question}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentQuestion.type === "select" && currentQuestion.options && (
              <Select
                value={answers[currentQuestion.id] || ""}
                onValueChange={(value) => setAnswers({ ...answers, [currentQuestion.id]: value })}
              >
                <SelectTrigger data-testid={`select-question-${currentQuestion.id}`}>
                  <SelectValue placeholder="Selecciona una opción" />
                </SelectTrigger>
                <SelectContent>
                  {currentQuestion.options.map((option, index) => (
                    <SelectItem key={index} value={option.text}>
                      {option.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {currentQuestion.type === "weight-height" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Peso (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="70"
                    value={answers[`${currentQuestion.id}_weight`] || ""}
                    onChange={(e) => setAnswers({ ...answers, [`${currentQuestion.id}_weight`]: e.target.value })}
                    data-testid="input-weight"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Estatura (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder="170"
                    value={answers[`${currentQuestion.id}_height`] || ""}
                    onChange={(e) => setAnswers({ ...answers, [`${currentQuestion.id}_height`]: e.target.value })}
                    data-testid="input-height"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0 || isSaving}
                data-testid="button-previous"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>

              {currentQuestionIndex < QUESTIONS.length - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={isSaving}
                  className="flex-1"
                  data-testid="button-next"
                >
                  Siguiente
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleComplete}
                  disabled={isSaving}
                  className="flex-1"
                  data-testid="button-complete"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Finalizar
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() => handleSaveProgress(true)}
                disabled={isSaving}
                data-testid="button-save"
              >
                <Save className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                onClick={handlePauseAndExit}
                disabled={isSaving}
                data-testid="button-pause"
              >
                <Pause className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
