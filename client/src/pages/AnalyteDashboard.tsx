import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Search, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "wouter";
import heroImage from "@assets/stock_images/mountain_landscape_d_f560ecb3.jpg";

interface LabAnalyte {
  id: string;
  analyteName: string;
  valueNumeric: string;
  unit: string;
  referenceMin: string | null;
  referenceMax: string | null;
  referenceText: string | null;
  collectedAt: string | null;
}

const ANALYTE_CATEGORIES: Record<string, string[]> = {
  "Panel Metabólico Básico": [
    "Glucosa", "Glucosa en Ayunas", "Sodio", "Potasio", "Cloro", "Calcio", 
    "Magnesio", "Fósforo", "Bicarbonato", "CO2", "Hierro", "Ferritina"
  ],
  "Panel Lipídico": [
    "Colesterol Total", "Colesterol", "Colesterol HDL", "HDL", 
    "Colesterol LDL", "LDL", "Triglicéridos", "VLDL", 
    "Índice Aterogénico", "Colesterol No HDL", "Colesterol No-HDL",
    "Índice Colesterol/HDL", "Índice TG/HDL", "Partículas LDL",
    "Partículas LDL Pequeñas", "Tamaño LDL", "Partículas HDL",
    "Partículas HDL Grandes", "Tamaño VLDL", "Partículas VLDL Grandes"
  ],
  "Hemograma Completo": [
    "Hemoglobina", "Hematocrito", "Eritrocitos", "Leucocitos", "Plaquetas",
    "VCM", "HCM", "CHCM", "VPM", "RDW", "Neutrófilos", "Linfocitos", "Monocitos",
    "Eosinófilos", "Basófilos", "Reticulocitos", "VSG", "Glóbulos Rojos"
  ],
  "Panel Tiroideo": [
    "TSH", "T3", "T3 Libre", "T4", "T4 Libre", "T3 Total", "T4 Total",
    "Anticuerpos Antitiroideos", "Anti-TPO", "Tiroglobulina"
  ],
  "Función Hepática": [
    "ALT", "AST", "TGO", "TGP", "GGT", "Fosfatasa Alcalina", "ALP",
    "Bilirrubina Total", "Bilirrubina Directa", "Bilirrubina Indirecta",
    "Albúmina", "Proteínas Totales", "Globulinas", "ALT (TGP)", "AST (TGO)"
  ],
  "Función Renal": [
    "Creatinina", "BUN", "Urea", "Ácido Úrico", "TFG", "Cistatina C",
    "Microalbúmina", "Relación Albúmina/Creatinina"
  ],
  "Hormonas": [
    "Cortisol", "Testosterona", "Estradiol", "Progesterona", "FSH", "LH",
    "Prolactina", "DHEA", "DHEA-S", "IGF-1", "Hormona del Crecimiento",
    "Insulina", "HbA1c", "Hemoglobina Glicosilada"
  ],
  "Vitaminas y Minerales": [
    "Vitamina D", "Vitamina D3", "25-OH Vitamina D", "Vitamina B12",
    "Vitamina B9", "Ácido Fólico", "Folato", "Vitamina A", "Vitamina E",
    "Vitamina K", "Zinc", "Cobre", "Selenio", "Transferrina"
  ],
  "Uroanálisis": [
    "pH", "Densidad", "Proteínas", "Glucosa Urinaria", "Cetonas", "Sangre",
    "Leucocitos", "Nitritos", "Bilirrubina Urinaria", "Urobilinógeno",
    "Eritrocitos/µl", "Celulas Epiteliales", "Celulas Epiteliales Transicionales",
    "Bacterias", "Cristales"
  ],
  "Otros Análisis": []
};

function categorizeAnalyte(analyteName: string): string {
  const lowerName = analyteName.toLowerCase();
  for (const [category, analytes] of Object.entries(ANALYTE_CATEGORIES)) {
    if (category === "Otros Análisis") continue;
    if (analytes.some(a => 
      lowerName.includes(a.toLowerCase()) || 
      a.toLowerCase().includes(lowerName) ||
      lowerName === a.toLowerCase()
    )) {
      return category;
    }
  }
  return "Otros Análisis";
}

function getStatusColor(value: string, min: string | null, max: string | null): "green" | "yellow" | "red" {
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return "green";
  
  const numMin = min ? parseFloat(min) : null;
  const numMax = max ? parseFloat(max) : null;
  
  if (numMin !== null && numMax !== null) {
    if (numValue >= numMin && numValue <= numMax) {
      return "green";
    }
    const deviation = numValue < numMin 
      ? (numMin - numValue) / numMin 
      : (numValue - numMax) / numMax;
    return deviation > 0.15 ? "red" : "yellow";
  }
  
  if (numMin !== null && numValue < numMin) {
    const deviation = (numMin - numValue) / numMin;
    return deviation > 0.15 ? "red" : "yellow";
  }
  if (numMax !== null && numValue > numMax) {
    const deviation = (numValue - numMax) / numMax;
    return deviation > 0.15 ? "red" : "yellow";
  }
  
  return "green";
}

function StatusDot({ status }: { status: "green" | "yellow" | "red" }) {
  const colors = {
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500"
  };
  return <div className={`w-2.5 h-2.5 rounded-full ${colors[status]} flex-shrink-0`} />;
}

function formatRange(min: string | null, max: string | null, unit: string): string {
  if (min !== null && max !== null) return `${min}-${max} ${unit}`;
  if (min !== null) return `>${min} ${unit}`;
  if (max !== null) return `<${max} ${unit}`;
  return "";
}

function AnalyteRow({ analyte }: { analyte: LabAnalyte }) {
  const status = getStatusColor(analyte.valueNumeric, analyte.referenceMin, analyte.referenceMax);
  const rangeText = formatRange(analyte.referenceMin, analyte.referenceMax, analyte.unit);
  
  const statusTextColors = {
    green: "text-green-500",
    yellow: "text-yellow-500", 
    red: "text-red-500"
  };
  
  return (
    <Link 
      href={`/analito/${encodeURIComponent(analyte.analyteName)}`}
      className="flex items-center justify-between py-3.5 px-4 border-b border-gray-100 dark:border-gray-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors"
      data-testid={`link-analyte-${analyte.analyteName.replace(/\s+/g, '-').toLowerCase()}`}
    >
      <div className="flex-1">
        <div className="font-semibold text-gray-900 dark:text-gray-100">{analyte.analyteName}</div>
        {rangeText && (
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{rangeText}</div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className={`font-semibold text-xl ${statusTextColors[status]}`}>
          {analyte.valueNumeric}
        </span>
        <StatusDot status={status} />
      </div>
    </Link>
  );
}

function CategoryCard({ 
  category, 
  analytes,
  defaultOpen = true
}: { 
  category: string; 
  analytes: LabAnalyte[];
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  if (analytes.length === 0) return null;
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="bg-white dark:bg-[#1e1e1e] rounded-lg overflow-hidden shadow-sm dark:shadow-none dark:border dark:border-gray-700/50" data-testid={`category-card-${category.replace(/\s+/g, '-').toLowerCase()}`}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between py-4 px-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors border-b border-gray-100 dark:border-gray-700/50">
            <span className="text-base font-semibold text-gray-900 dark:text-gray-100">{category}</span>
            {isOpen ? <ChevronUp className="h-5 w-5 text-gray-400 dark:text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-400 dark:text-gray-500" />}
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {analytes.map((analyte) => (
              <AnalyteRow key={analyte.id} analyte={analyte} />
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export default function AnalyteDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data, isLoading, error } = useQuery<{ analytes: LabAnalyte[] }>({
    queryKey: ["/api/labs/analytes/latest"],
  });

  const categorizedAnalytes = useMemo(() => {
    if (!data?.analytes) return {};
    
    const filtered = searchQuery 
      ? data.analytes.filter(a => 
          a.analyteName.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : data.analytes;
    
    const grouped: Record<string, LabAnalyte[]> = {};
    
    for (const analyte of filtered) {
      const category = categorizeAnalyte(analyte.analyteName);
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(analyte);
    }
    
    return grouped;
  }, [data?.analytes, searchQuery]);

  const categoryOrder = [
    "Panel Metabólico Básico",
    "Panel Lipídico", 
    "Hemograma Completo",
    "Panel Tiroideo",
    "Función Hepática",
    "Función Renal",
    "Hormonas",
    "Vitaminas y Minerales",
    "Uroanálisis",
    "Otros Análisis"
  ];

  const totalAnalytes = data?.analytes?.length || 0;

  return (
    <div className="min-h-screen bg-[#f5f3ef] dark:bg-[#121212]">
      <div className="relative h-32 overflow-hidden">
        <img 
          src={heroImage} 
          alt="Mountains" 
          className="w-full h-full object-cover dark:opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60 dark:from-black/40 dark:to-[#121212]" />
        <Link href="/perfil" className="absolute top-3 left-4 z-10">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white/80 hover:text-white hover:bg-white/10"
            data-testid="button-back-profile"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div className="absolute bottom-4 left-6">
          <h1 
            className="text-2xl text-white dark:text-amber-100 italic" 
            style={{ fontFamily: "'Merriweather', serif" }}
          >
            Mis resultados
          </h1>
          <p className="text-white/70 dark:text-gray-400 text-sm mt-1">
            Revisa tus últimos análisis de laboratorio.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 relative z-10">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <Input
            placeholder="Buscar analito..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 bg-white dark:bg-[#1e1e1e] border-gray-200 dark:border-gray-700/50 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-lg h-11 shadow-sm dark:shadow-none"
            data-testid="input-search-analyte"
          />
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg bg-white dark:bg-[#1e1e1e]" />
            ))}
          </div>
        ) : error || !data?.analytes ? (
          <div className="bg-white dark:bg-[#1e1e1e] rounded-lg shadow-sm dark:shadow-none dark:border dark:border-gray-700/50 py-12 text-center px-4">
            <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100">Sin resultados aún</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Sube tus análisis de laboratorio para ver tus resultados aquí
            </p>
            <Link href="/perfil">
              <Button data-testid="button-upload-labs-error">
                Subir Laboratorios
              </Button>
            </Link>
          </div>
        ) : totalAnalytes === 0 ? (
          <div className="bg-white dark:bg-[#1e1e1e] rounded-lg shadow-sm dark:shadow-none dark:border dark:border-gray-700/50 py-12 text-center px-4">
            <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100">Sin resultados aún</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Sube tus análisis de laboratorio para ver tus resultados aquí
            </p>
            <Link href="/perfil">
              <Button data-testid="button-upload-labs">
                Subir Laboratorios
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {categoryOrder.map((category) => (
              <CategoryCard 
                key={category}
                category={category}
                analytes={categorizedAnalytes[category] || []}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
