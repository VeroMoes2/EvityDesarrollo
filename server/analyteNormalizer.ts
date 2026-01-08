/**
 * Normalización de nombres de analitos de laboratorio
 * Mapea nombres en inglés/variaciones a español estándar
 * para permitir comparaciones históricas entre estudios
 */

const ANALYTE_MAP: Record<string, string> = {
  // === LIPID PANEL ===
  "cholesterol, total": "Colesterol Total",
  "cholesterol total": "Colesterol Total",
  "total cholesterol": "Colesterol Total",
  "colesterol total": "Colesterol Total",
  
  "hdl cholesterol": "Colesterol HDL",
  "hdl-cholesterol": "Colesterol HDL",
  "hdl-c": "Colesterol HDL",
  "hdl": "Colesterol HDL",
  "colesterol hdl": "Colesterol HDL",
  
  "ldl cholesterol": "Colesterol LDL",
  "ldl-cholesterol": "Colesterol LDL",
  "ldl-c": "Colesterol LDL",
  "ldl": "Colesterol LDL",
  "colesterol ldl": "Colesterol LDL",
  
  "triglycerides": "Triglicéridos",
  "trigliceridos": "Triglicéridos",
  "triglicéridos": "Triglicéridos",
  "tg": "Triglicéridos",
  
  "vldl cholesterol": "Colesterol VLDL",
  "vldl": "Colesterol VLDL",
  "colesterol vldl": "Colesterol VLDL",
  
  "non hdl cholesterol": "Colesterol No-HDL",
  "non-hdl cholesterol": "Colesterol No-HDL",
  "colesterol no hdl": "Colesterol No-HDL",
  "colesterol no-hdl": "Colesterol No-HDL",
  
  "chol/hdl c": "Índice Colesterol/HDL",
  "chol/hdl": "Índice Colesterol/HDL",
  "cholesterol/hdl ratio": "Índice Colesterol/HDL",
  "indice colesterol/hdl": "Índice Colesterol/HDL",
  
  "tg/hdl c": "Índice TG/HDL",
  "tg/hdl": "Índice TG/HDL",
  "triglycerides/hdl ratio": "Índice TG/HDL",
  "indice tg/hdl": "Índice TG/HDL",

  // === LIPOPROTEIN PARTICLES ===
  "ldl p": "Partículas LDL",
  "ldl-p": "Partículas LDL",
  "ldl particles": "Partículas LDL",
  "particulas ldl": "Partículas LDL",
  
  "small ldl p": "Partículas LDL Pequeñas",
  "small ldl-p": "Partículas LDL Pequeñas",
  "small ldl particles": "Partículas LDL Pequeñas",
  
  "ldl size": "Tamaño LDL",
  "ldl particle size": "Tamaño LDL",
  "tamaño ldl": "Tamaño LDL",
  
  "hdl p": "Partículas HDL",
  "hdl-p": "Partículas HDL",
  "hdl particles": "Partículas HDL",
  "particulas hdl": "Partículas HDL",
  
  "large hdl p": "Partículas HDL Grandes",
  "large hdl-p": "Partículas HDL Grandes",
  "large hdl particles": "Partículas HDL Grandes",
  
  "hdl size": "Tamaño HDL",
  "hdl particle size": "Tamaño HDL",
  "tamaño hdl": "Tamaño HDL",
  
  "vldl p": "Partículas VLDL",
  "vldl-p": "Partículas VLDL",
  "vldl particles": "Partículas VLDL",
  
  "large vldl p": "Partículas VLDL Grandes",
  "large vldl-p": "Partículas VLDL Grandes",
  
  "vldl size": "Tamaño VLDL",
  "vldl particle size": "Tamaño VLDL",
  "tamaño vldl": "Tamaño VLDL",

  // === METABOLIC MARKERS ===
  "insulin": "Insulina",
  "insulina": "Insulina",
  "insulin, intact, lc/ms/ms": "Insulina",
  "insulin, int": "Insulina",
  "fasting insulin": "Insulina en Ayunas",
  
  "glucose": "Glucosa",
  "glucosa": "Glucosa",
  "blood glucose": "Glucosa",
  "fasting glucose": "Glucosa en Ayunas",
  "glucosa en ayunas": "Glucosa en Ayunas",
  
  "hba1c": "Hemoglobina Glicosilada",
  "hemoglobin a1c": "Hemoglobina Glicosilada",
  "glycated hemoglobin": "Hemoglobina Glicosilada",
  "hemoglobina glicosilada": "Hemoglobina Glicosilada",
  "hemoglobina glucosilada": "Hemoglobina Glicosilada",
  
  "homa-ir": "HOMA-IR",
  "homa ir": "HOMA-IR",
  
  "c-peptide": "Péptido C",
  "c peptide": "Péptido C",
  "peptido c": "Péptido C",

  // === HEMATOLOGY / CBC ===
  "rbc": "Eritrocitos",
  "rbc/eritrocitos": "Eritrocitos",
  "red blood cells": "Eritrocitos",
  "eritrocitos": "Eritrocitos",
  "globulos rojos": "Eritrocitos",
  
  "hemoglobin": "Hemoglobina",
  "hemoglobina": "Hemoglobina",
  "hgb": "Hemoglobina",
  "hb": "Hemoglobina",
  
  "hematocrit": "Hematocrito",
  "hematocrito": "Hematocrito",
  "hct": "Hematocrito",
  
  "mcv": "VCM",
  "mean corpuscular volume": "VCM",
  "volumen corpuscular medio": "VCM",
  "vcm": "VCM",
  
  "mch": "HCM",
  "mean corpuscular hemoglobin": "HCM",
  "hemoglobina corpuscular media": "HCM",
  "hcm": "HCM",
  
  "mchc": "CHCM",
  "mean corpuscular hemoglobin concentration": "CHCM",
  "concentracion de hemoglobina corpuscular media": "CHCM",
  "chcm": "CHCM",
  
  "rdw": "ADE",
  "red cell distribution width": "ADE",
  "ancho de distribucion eritrocitaria": "ADE",
  "ade": "ADE",
  
  "wbc": "Leucocitos",
  "wbc/leucocitos": "Leucocitos",
  "white blood cells": "Leucocitos",
  "leucocitos": "Leucocitos",
  "globulos blancos": "Leucocitos",
  
  "neutrophils": "Neutrófilos",
  "neutrofilos": "Neutrófilos",
  "neutrófilos": "Neutrófilos",
  
  "lymphocytes": "Linfocitos",
  "linfocitos": "Linfocitos",
  
  "monocytes": "Monocitos",
  "monocitos": "Monocitos",
  
  "eosinophils": "Eosinófilos",
  "eosinofilos": "Eosinófilos",
  "eosinófilos": "Eosinófilos",
  
  "basophils": "Basófilos",
  "basofilos": "Basófilos",
  "basófilos": "Basófilos",
  
  "platelets": "Plaquetas",
  "plaquetas": "Plaquetas",
  "plt": "Plaquetas",
  
  "mpv": "VPM",
  "mean platelet volume": "VPM",
  "volumen plaquetario medio": "VPM",
  "vpm": "VPM",

  // === KIDNEY FUNCTION ===
  "creatinine": "Creatinina",
  "creatinina": "Creatinina",
  
  "bun": "Nitrógeno Ureico",
  "blood urea nitrogen": "Nitrógeno Ureico",
  "nitrogeno ureico": "Nitrógeno Ureico",
  "urea nitrogen": "Nitrógeno Ureico",
  
  "urea": "Urea",
  
  "uric acid": "Ácido Úrico",
  "acido urico": "Ácido Úrico",
  "ácido úrico": "Ácido Úrico",
  
  "egfr": "TFGe",
  "estimated gfr": "TFGe",
  "tasa de filtracion glomerular": "TFGe",
  "tfge": "TFGe",

  // === LIVER FUNCTION ===
  "ast": "AST (TGO)",
  "sgot": "AST (TGO)",
  "tgo": "AST (TGO)",
  "aspartate aminotransferase": "AST (TGO)",
  
  "alt": "ALT (TGP)",
  "sgpt": "ALT (TGP)",
  "tgp": "ALT (TGP)",
  "alanine aminotransferase": "ALT (TGP)",
  
  "ggt": "GGT",
  "gamma gt": "GGT",
  "gamma glutamyl transferase": "GGT",
  
  "alp": "Fosfatasa Alcalina",
  "alkaline phosphatase": "Fosfatasa Alcalina",
  "fosfatasa alcalina": "Fosfatasa Alcalina",
  
  "ldh": "LDH",
  "lactate dehydrogenase": "LDH",
  "deshidrogenasa lactica": "LDH",
  
  "bilirubin total": "Bilirrubina Total",
  "total bilirubin": "Bilirrubina Total",
  "bilirrubina total": "Bilirrubina Total",
  
  "bilirubin direct": "Bilirrubina Directa",
  "direct bilirubin": "Bilirrubina Directa",
  "bilirrubina directa": "Bilirrubina Directa",
  
  "bilirubin indirect": "Bilirrubina Indirecta",
  "indirect bilirubin": "Bilirrubina Indirecta",
  "bilirrubina indirecta": "Bilirrubina Indirecta",
  
  "albumin": "Albúmina",
  "albumina": "Albúmina",
  "albúmina": "Albúmina",
  
  "total protein": "Proteínas Totales",
  "total proteins": "Proteínas Totales",
  "proteinas totales": "Proteínas Totales",
  "proteínas totales": "Proteínas Totales",
  
  "globulin": "Globulina",
  "globulina": "Globulina",

  // === ELECTROLYTES ===
  "sodium": "Sodio",
  "sodio": "Sodio",
  "na": "Sodio",
  
  "potassium": "Potasio",
  "potasio": "Potasio",
  "k": "Potasio",
  
  "chloride": "Cloro",
  "cloro": "Cloro",
  "cl": "Cloro",
  
  "calcium": "Calcio",
  "calcio": "Calcio",
  "ca": "Calcio",
  
  "phosphorus": "Fósforo",
  "fosforo": "Fósforo",
  "fósforo": "Fósforo",
  "phosphate": "Fósforo",
  
  "magnesium": "Magnesio",
  "magnesio": "Magnesio",
  "mg": "Magnesio",

  // === THYROID ===
  "tsh": "TSH",
  "thyroid stimulating hormone": "TSH",
  "tirotropina": "TSH",
  
  "t3": "T3",
  "triiodothyronine": "T3",
  
  "t4": "T4",
  "thyroxine": "T4",
  "tiroxina": "T4",
  
  "free t3": "T3 Libre",
  "t3 libre": "T3 Libre",
  
  "free t4": "T4 Libre",
  "t4 libre": "T4 Libre",

  // === INFLAMMATION ===
  "crp": "Proteína C Reactiva",
  "c-reactive protein": "Proteína C Reactiva",
  "proteina c reactiva": "Proteína C Reactiva",
  "pcr": "Proteína C Reactiva",
  
  "hs-crp": "PCR Ultrasensible",
  "high sensitivity crp": "PCR Ultrasensible",
  "pcr ultrasensible": "PCR Ultrasensible",
  
  "esr": "VSG",
  "erythrocyte sedimentation rate": "VSG",
  "velocidad de sedimentacion globular": "VSG",
  "vsg": "VSG",
  
  "homocysteine": "Homocisteína",
  "homocisteina": "Homocisteína",
  "homocisteína": "Homocisteína",
  
  "lp(a)": "Lipoproteína(a)",
  "lipoprotein(a)": "Lipoproteína(a)",
  "lipoproteina a": "Lipoproteína(a)",
  
  "fibrinogen": "Fibrinógeno",
  "fibrinogeno": "Fibrinógeno",
  "fibrinógeno": "Fibrinógeno",

  // === VITAMINS ===
  "vitamin d": "Vitamina D",
  "vitamina d": "Vitamina D",
  "25-oh vitamin d": "Vitamina D",
  "25-hydroxyvitamin d": "Vitamina D",
  
  "vitamin b12": "Vitamina B12",
  "vitamina b12": "Vitamina B12",
  "cobalamin": "Vitamina B12",
  
  "folate": "Ácido Fólico",
  "folic acid": "Ácido Fólico",
  "acido folico": "Ácido Fólico",
  
  "iron": "Hierro",
  "hierro": "Hierro",
  "fe": "Hierro",
  
  "ferritin": "Ferritina",
  "ferritina": "Ferritina",
  
  "tibc": "CTFH",
  "total iron binding capacity": "CTFH",
  "capacidad total de fijacion de hierro": "CTFH",

  // === COAGULATION ===
  "pt": "TP",
  "prothrombin time": "TP",
  "tiempo de protrombina": "TP",
  "tp": "TP",
  
  "ptt": "TTP",
  "partial thromboplastin time": "TTP",
  "tiempo de tromboplastina parcial": "TTP",
  "ttp": "TTP",
  
  "inr": "INR",
  "international normalized ratio": "INR",

  // === HORMONES ===
  "testosterone": "Testosterona",
  "testosterona": "Testosterona",
  
  "free testosterone": "Testosterona Libre",
  "testosterona libre": "Testosterona Libre",
  
  "estradiol": "Estradiol",
  "e2": "Estradiol",
  
  "cortisol": "Cortisol",
  
  "dhea-s": "DHEA-S",
  "dhea sulfate": "DHEA-S",
  
  "fsh": "FSH",
  "follicle stimulating hormone": "FSH",
  
  "lh": "LH",
  "luteinizing hormone": "LH",
  
  "prolactin": "Prolactina",
  "prolactina": "Prolactina",
  
  "progesterone": "Progesterona",
  "progesterona": "Progesterona",
};

/**
 * Normaliza el nombre de un analito al español estándar
 * @param analyteName Nombre original del analito
 * @returns Nombre normalizado en español
 */
export function normalizeAnalyteName(analyteName: string): string {
  if (!analyteName) return "Desconocido";
  
  // Limpiar el nombre: quitar espacios extra, convertir a minúsculas
  const cleanName = analyteName.trim().toLowerCase();
  
  // Buscar en el mapa de traducciones
  const normalized = ANALYTE_MAP[cleanName];
  
  if (normalized) {
    return normalized;
  }
  
  // Si no está en el mapa, capitalizar el nombre original
  // Esto preserva analitos poco comunes pero los formatea consistentemente
  return analyteName.trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Obtiene todos los nombres conocidos para un analito dado
 * Útil para búsquedas
 */
export function getAnalyteAliases(spanishName: string): string[] {
  const aliases: string[] = [spanishName.toLowerCase()];
  
  for (const [key, value] of Object.entries(ANALYTE_MAP)) {
    if (value === spanishName) {
      aliases.push(key);
    }
  }
  
  return aliases;
}
