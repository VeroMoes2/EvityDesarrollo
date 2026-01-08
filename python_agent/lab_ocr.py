#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
lab_ocr.py

Recibe bytes de un archivo de laboratorio (PDF o imagen),
extrae el texto y pide al modelo que estructure los resultados.
"""

import base64
import io
import json
import re
from pathlib import Path

from openai import OpenAI
from pypdf import PdfReader
from pdf2image import convert_from_bytes
from analyte_ranges import PREDEFINED_ANALYTES, ANALYTE_NAMES, ANALYTE_SYNONYMS, get_analyte_info

client = OpenAI()

CBC_VALUE_RANGES = {
    "Eritrocitos": {"min": 3.5, "max": 7.0, "typical_unit": "mill/mm³"},
    "Hemoglobina": {"min": 8.0, "max": 20.0, "typical_unit": "g/dL"},
    "Hematocrito": {"min": 25.0, "max": 60.0, "typical_unit": "%"},
    "VCM": {"min": 70.0, "max": 110.0, "typical_unit": "fL"},
    "HCM": {"min": 20.0, "max": 40.0, "typical_unit": "pg"},
    "CHCM": {"min": 28.0, "max": 40.0, "typical_unit": "g/dL"},
    "RDW": {"min": 10.0, "max": 20.0, "typical_unit": "%"},
    "Leucocitos": {"min": 2.0, "max": 20.0, "typical_unit": "×10^9/L"},
    "Linfocitos": {"min": 5.0, "max": 60.0, "typical_unit": "%"},
    "Monocitos": {"min": 0.0, "max": 15.0, "typical_unit": "%"},
    "Basófilos": {"min": 0.0, "max": 5.0, "typical_unit": "%"},
    "Eosinófilos": {"min": 0.0, "max": 15.0, "typical_unit": "%"},
    "Neutrófilos": {"min": 20.0, "max": 85.0, "typical_unit": "%"},
    "Plaquetas": {"min": 100.0, "max": 500.0, "typical_unit": "×10^9/L"},
    "VPM": {"min": 5.0, "max": 15.0, "typical_unit": "fL"},
}

def _validate_and_correct_cbc(analytes: list) -> list:
    """
    Valida y corrige los valores de CBC mal atribuidos.
    Si un valor no está en el rango esperado para su analito asignado,
    busca el analito correcto basándose en los rangos.
    """
    corrected = {}
    unassigned_values = []
    assigned_analytes = set()
    
    for analyte in analytes:
        name = analyte.get("nombre", "")
        valor = analyte.get("valor")
        
        if valor is None or not isinstance(valor, (int, float)):
            continue
        
        if name in CBC_VALUE_RANGES:
            range_info = CBC_VALUE_RANGES[name]
            if range_info["min"] <= valor <= range_info["max"]:
                if name not in assigned_analytes:
                    corrected[name] = analyte
                    assigned_analytes.add(name)
                else:
                    unassigned_values.append((valor, analyte.get("unidad", "")))
            else:
                unassigned_values.append((valor, analyte.get("unidad", "")))
        else:
            corrected[name] = analyte
            assigned_analytes.add(name)
    
    for valor, unidad in unassigned_values:
        best_match = None
        for analyte_name, range_info in CBC_VALUE_RANGES.items():
            if analyte_name in assigned_analytes:
                continue
            if range_info["min"] <= valor <= range_info["max"]:
                best_match = analyte_name
                break
        
        if best_match and best_match not in corrected:
            analyte_info = get_analyte_info(best_match)
            range_info = CBC_VALUE_RANGES.get(best_match, {})
            if analyte_info:
                corrected[best_match] = {
                    "nombre": best_match,
                    "valor": valor,
                    "unidad": analyte_info.get("unit") or range_info.get("typical_unit") or unidad,
                    "observaciones": None,
                    "rango_normal": analyte_info.get("normal"),
                    "riesgo_moderado": analyte_info.get("moderate_risk"),
                    "riesgo_elevado": analyte_info.get("high_risk"),
                }
                assigned_analytes.add(best_match)
    
    return list(corrected.values())


def _read_pdf_text(file_bytes: bytes) -> str:
    """Extrae texto de un PDF en memoria."""
    reader = PdfReader(io.BytesIO(file_bytes))
    pages_text = []
    for page in reader.pages:
        txt = page.extract_text() or ""
        pages_text.append(txt)
    return "\n\n".join(pages_text).strip()


def _pdf_to_images(file_bytes: bytes) -> list:
    """Convierte páginas de PDF a imágenes base64 de alta resolución."""
    images = convert_from_bytes(file_bytes, dpi=300)
    base64_images = []
    for img in images:
        img_buffer = io.BytesIO()
        img.save(img_buffer, format='PNG')
        img_buffer.seek(0)
        encoded = base64.b64encode(img_buffer.read()).decode('utf-8')
        base64_images.append(encoded)
    return base64_images


def ocr_and_extract_labs(file_bytes: bytes, filename: str):
    """
    Procesa un archivo de laboratorio (PDF o imagen) y devuelve
    un dict con datos listos para la BD / gráficas.

    Devuelve algo tipo:
    {
      "analitos": [
        {"nombre": "Glucosa", "valor": 90, "unidad": "mg/dL", "fecha": "2024-01-10"},
        ...
      ]
    }
    """
    ext = Path(filename or "").suffix.lower()

    analyte_list_str = ", ".join(ANALYTE_NAMES)
    
    prompt_text = (
        "You are an expert clinical laboratory analysis assistant. "
        "Your task is to CAREFULLY extract lab results from the document, reading each row precisely.\n\n"
        "PREDEFINED ANALYTES (only extract these):\n"
        f"{analyte_list_str}\n\n"
        "CBC (Biometría Hemática) NAME MAPPINGS with EXPECTED VALUE RANGES:\n"
        "1. ERITROCITOS (RBC/Red Blood Cells) -> 'Eritrocitos' - values typically 4.0-6.5 mill/mm³\n"
        "2. HEMOGLOBINA (HGB/Hemoglobin) -> 'Hemoglobina' - values typically 12-18 g/dL\n"
        "3. HEMATOCRITO (HCT/Hematocrit) -> 'Hematocrito' - values typically 36-54%\n"
        "4. VOLUMEN CORPUSCULAR MEDIO (MCV) -> 'VCM' - values typically 80-100 fL\n"
        "5. HEMOGLOBINA CORPUSCULAR MEDIA (MCH) -> 'HCM' - values typically 26-34 pg\n"
        "6. CONCENTRACION MEDIA DE HEMOGLOBINA (MCHC/CHCM) -> 'CHCM' - values typically 31-37 g/dL or %\n"
        "7. ANCHURA DE DISTRIBUCION DE ERITROCITOS (RDW) -> 'RDW' - values typically 11-16%\n"
        "8. LEUCOCITOS (WBC/White Blood Cells) -> 'Leucocitos' - values typically 4-11 miles/mm³\n"
        "9. LINFOCITOS -> 'Linfocitos' - values typically 15-50%\n"
        "10. MONOCITOS -> 'Monocitos' - values typically 2-10%\n"
        "11. BASOFILOS -> 'Basófilos' - values typically 0-2%\n"
        "12. EOSINOFILOS -> 'Eosinófilos' - values typically 0-7%\n"
        "13. NEUTROFILOS -> 'Neutrófilos' - values typically 40-75%\n"
        "14. PLAQUETAS (PLT/Platelets) -> 'Plaquetas' - values typically 150-400 miles/mm³\n"
        "15. VOLUMEN PLAQUETARIO MEDIO (MPV) -> 'VPM' - values typically 7-12 fL\n\n"
        "READING INSTRUCTIONS:\n"
        "- Read each ROW of the lab results table CAREFULLY from left to right\n"
        "- The FIRST column contains the test NAME\n"
        "- The RESULT column contains the NUMERIC VALUE\n"
        "- Match each result value to its corresponding test name on the SAME row\n"
        "- Use the expected value ranges above to VALIDATE your extraction\n\n"
        "FIRST: Classify the document type:\n"
        "- 'laboratorio': Blood tests, urine tests, chemistry panels with numeric analyte values\n"
        "- 'estudio_imagen': Ultrasound, X-ray, MRI, CT scan (descriptive reports without numeric analytes)\n"
        "- 'documento_medico': Other medical documents\n\n"
        "Return ONLY a JSON with this structure:\n"
        "{\n"
        '  "tipo_estudio": "laboratorio",\n'
        '  "nombre_estudio": "BIOMETRIA HEMATICA" or "ULTRASONIDO ABDOMINAL" etc.,\n'
        '  "nombre_paciente": "Patient Name",\n'
        '  "nombre_laboratorio": "Lab Name",\n'
        '  "fecha_estudio": "YYYY-MM-DD",\n'
        '  "analitos": [\n'
        '    {"nombre": "Eritrocitos", "valor": 5.57, "unidad": "mill/mm3", "observaciones": null},\n'
        '    {"nombre": "Hemoglobina", "valor": 16.5, "unidad": "g/dL", "observaciones": null}\n'
        "  ]\n"
        "}\n\n"
        "For 'estudio_imagen' or 'documento_medico', return empty analitos array: \"analitos\": []\n\n"
        "CRITICAL RULES:\n"
        "- Read the table row by row, matching each test name with its result value\n"
        "- Each analyte appears ONLY ONCE - no duplicates\n"
        "- Validate values against expected ranges to ensure correct name-value pairing\n"
        "- Use exact names from the list (e.g., 'Eritrocitos' not 'ERITROCITOS')\n"
        "- For '<3.0' extract 3.0, for '>200' extract 200\n"
        "- The 'valor' must be numeric\n"
        "- Respond ONLY with valid JSON"
    )

    if ext == ".pdf":
        pdf_images = _pdf_to_images(file_bytes)
        if not pdf_images:
            raise ValueError("No se pudo convertir el PDF a imágenes.")
        
        image_content = [
            {
                "type": "text",
                "text": "Analiza estas imágenes de un reporte de laboratorio clínico y extrae los analitos:"
            }
        ]
        for encoded_img in pdf_images:
            image_content.append({
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/png;base64,{encoded_img}"
                }
            })
        
        messages = [
            {"role": "system", "content": prompt_text},
            {"role": "user", "content": image_content}
        ]

    elif ext in (".png", ".jpg", ".jpeg"):
        encoded = base64.b64encode(file_bytes).decode("utf-8")
        mime = "image/png" if ext == ".png" else "image/jpeg"

        messages = [
            {"role": "system", "content": prompt_text},
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Analiza esta imagen de un reporte de laboratorio clínico y extrae los analitos:"
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{mime};base64,{encoded}"
                        }
                    }
                ]
            }
        ]
    else:
        raise ValueError(
            f"Tipo de archivo no soportado para labs: {ext or 'desconocido'} "
            "(usa PDF, JPG o PNG)."
        )

    model_to_use = "gpt-4o"
    
    response = client.chat.completions.create(
        model=model_to_use,
        messages=messages,
        temperature=0.0,  # Zero temperature for maximum accuracy
        max_tokens=8000
    )

    raw_output = response.choices[0].message.content or ""

    try:
        data = json.loads(raw_output)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", raw_output, re.DOTALL)
        if match:
            try:
                data = json.loads(match.group(0))
            except json.JSONDecodeError:
                data = {"analitos": [], "tipo_estudio": "documento_medico"}
        else:
            data = {"analitos": [], "tipo_estudio": "documento_medico"}

    if "analitos" not in data or not isinstance(data["analitos"], list):
        data["analitos"] = []
    
    if not data.get("tipo_estudio"):
        data["tipo_estudio"] = "laboratorio" if data["analitos"] else "estudio_imagen"

    raw_processed = []
    for analyte in data["analitos"]:
        analyte_info = get_analyte_info(analyte.get("nombre", ""))
        if analyte_info:
            name = analyte_info["name"]
            processed_analyte = {
                "nombre": name,
                "valor": analyte.get("valor"),
                "unidad": analyte_info.get("unit") or analyte.get("unidad", ""),
                "observaciones": analyte.get("observaciones"),
                "rango_normal": analyte_info.get("normal"),
                "riesgo_moderado": analyte_info.get("moderate_risk"),
                "riesgo_elevado": analyte_info.get("high_risk"),
            }
            raw_processed.append(processed_analyte)
    
    processed_analytes = _validate_and_correct_cbc(raw_processed)
    data["analitos"] = processed_analytes

    tipo_estudio = data.get("tipo_estudio", "laboratorio" if processed_analytes else "estudio_imagen")
    nombre_estudio = data.get("nombre_estudio", "Estudio de laboratorio" if processed_analytes else "Estudio médico")
    
    export_data = {
        "tipo_estudio": tipo_estudio,
        "nombre_estudio": nombre_estudio,
        "nombre_paciente": data.get("nombre_paciente"),
        "nombre_laboratorio": data.get("nombre_laboratorio"),
        "fecha_estudio": data.get("fecha_estudio"),
        "biomarcadores": [
            {
                "nombre": a["nombre"],
                "valor": a["valor"],
                "unidad": a["unidad"]
            }
            for a in processed_analytes
        ]
    }

    return {
        "filename": filename,
        "tipo_estudio": tipo_estudio,
        "nombre_estudio": nombre_estudio,
        "parsed": data,
        "export_json": export_data,
        "raw_model_output": raw_output,
    }
