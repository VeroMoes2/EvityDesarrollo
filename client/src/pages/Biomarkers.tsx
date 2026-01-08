import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState } from "react";
import { ChevronUp, ChevronDown, Crown } from "lucide-react";
import { motion } from "framer-motion";

interface Biomarker {
  name: string;
  premium?: boolean;
}

interface Category {
  name: string;
  tests: number;
  premiumCount?: number;
  biomarkers: Biomarker[];
}

const categories: Category[] = [
  {
    name: "Química Sanguínea",
    tests: 6,
    biomarkers: [
      { name: "Glucosa" },
      { name: "Urea" },
      { name: "Creatinina" },
      { name: "Ácido úrico" },
      { name: "Colesterol" },
      { name: "Triglicéridos" },
    ]
  },
  {
    name: "Electrolitos Séricos",
    tests: 6,
    biomarkers: [
      { name: "Potasio" },
      { name: "Sodio" },
      { name: "Cloro" },
      { name: "Calcio" },
      { name: "Fósforo" },
      { name: "Magnesio" },
    ]
  },
  {
    name: "Perfil Hepático",
    tests: 11,
    biomarkers: [
      { name: "ALT" },
      { name: "AST" },
      { name: "GGT" },
      { name: "FA" },
      { name: "Proteínas totales" },
      { name: "Albúmina" },
      { name: "Globulinas" },
      { name: "Relación albúmina/globulina (A/G)" },
      { name: "Bilirrubina total" },
      { name: "Bilirrubina indirecta" },
      { name: "Bilirrubina directa" },
    ]
  },
  {
    name: "Perfil de Lípidos Avanzado",
    tests: 20,
    biomarkers: [
      { name: "Colesterol total" },
      { name: "LDL-C" },
      { name: "HDL-C" },
      { name: "Triglicéridos" },
      { name: "Non-HDL-C" },
      { name: "VLDL-C" },
      { name: "TG/HDL-C" },
      { name: "TC/HDL" },
      { name: "LDL-P" },
      { name: "Small LDL-P" },
      { name: "LDL size" },
      { name: "HDL-P" },
      { name: "Large HDL-P" },
      { name: "HDL size" },
      { name: "Large VLDL-P" },
      { name: "VLDL size" },
      { name: "Lp(a)" },
      { name: "Apo A1" },
      { name: "Apo B" },
      { name: "Apo B/A1" },
    ]
  },
  {
    name: "Marcadores Metabólicos",
    tests: 8,
    premiumCount: 5,
    biomarkers: [
      { name: "Insulina en ayuno" },
      { name: "hsCRP" },
      { name: "HbA1c" },
      { name: "Péptido C", premium: true },
      { name: "Amilasa", premium: true },
      { name: "Lipasa", premium: true },
      { name: "Cistatina C", premium: true },
      { name: "Homocisteína", premium: true },
    ]
  },
  {
    name: "Biometría Hemática",
    tests: 14,
    biomarkers: [
      { name: "Eritrocitos" },
      { name: "Hemoglobina" },
      { name: "Hematocrito" },
      { name: "VCM" },
      { name: "HCM" },
      { name: "CHCM" },
      { name: "Leucocitos" },
      { name: "Neutrófilos" },
      { name: "Linfocitos" },
      { name: "Monocitos" },
      { name: "Eosinófilos" },
      { name: "Basófilos" },
      { name: "Plaquetas" },
      { name: "VPM" },
    ]
  },
  {
    name: "Perfil de Hierro",
    tests: 4,
    biomarkers: [
      { name: "Hierro" },
      { name: "Capacidad total de fijación del hierro" },
      { name: "Saturación de transferrina" },
      { name: "Ferritina" },
    ]
  },
  {
    name: "Perfil Tiroideo",
    tests: 9,
    premiumCount: 2,
    biomarkers: [
      { name: "T3" },
      { name: "T4" },
      { name: "T4 libre" },
      { name: "Captación TU" },
      { name: "TSH" },
      { name: "Índice de tiroxina libre" },
      { name: "Iodo proteico" },
      { name: "Anticuerpos anti-tiroglobulina", premium: true },
      { name: "Anticuerpos antiperoxidasa tiroidea", premium: true },
    ]
  },
  {
    name: "Perfil Hormonal",
    tests: 10,
    premiumCount: 5,
    biomarkers: [
      { name: "DHEA-s" },
      { name: "Testosterona libre y total" },
      { name: "Hormona leutinizante" },
      { name: "Globulina transportadora de hormonas sexuales (SHBG)" },
      { name: "Antígeno prostático total" },
      { name: "Estradiol", premium: true },
      { name: "FSH", premium: true },
      { name: "LH", premium: true },
      { name: "Cortisol en saliva", premium: true },
      { name: "Hormona antimuleriana", premium: true },
    ]
  },
  {
    name: "Vitaminas y Nutrientes",
    tests: 8,
    premiumCount: 7,
    biomarkers: [
      { name: "Vitamina D" },
      { name: "Vitamina B12", premium: true },
      { name: "Ácido metilmalónico", premium: true },
      { name: "Folate", premium: true },
      { name: "Vitamin E (Alpha Tocopherol)", premium: true },
      { name: "Vitamin E (Beta-Gamma tocopherol)", premium: true },
      { name: "Vitamin A (Retinol)", premium: true },
      { name: "Coenzyme Q10", premium: true },
    ]
  },
  {
    name: "Ácidos Grasos",
    tests: 2,
    premiumCount: 2,
    biomarkers: [
      { name: "Omega 3", premium: true },
      { name: "Omega 6", premium: true },
    ]
  },
  {
    name: "Minerales y Oligoelementos",
    tests: 5,
    premiumCount: 5,
    biomarkers: [
      { name: "Selenium", premium: true },
      { name: "Molybdenum", premium: true },
      { name: "Iodine", premium: true },
      { name: "Copper", premium: true },
      { name: "Chromium", premium: true },
    ]
  },
  {
    name: "Metales Pesados",
    tests: 3,
    premiumCount: 3,
    biomarkers: [
      { name: "Mercurio", premium: true },
      { name: "Plomo", premium: true },
      { name: "Cadmio", premium: true },
    ]
  },
  {
    name: "Marcadores Genéticos y Avanzados",
    tests: 4,
    premiumCount: 4,
    biomarkers: [
      { name: "Apo E", premium: true },
      { name: "Epi Age", premium: true },
      { name: "Gut Zoomer", premium: true },
      { name: "GRAIL Cancer Test", premium: true },
    ]
  },
  {
    name: "Marcadores de Autoinmunidad",
    tests: 6,
    premiumCount: 4,
    biomarkers: [
      { name: "Anticuerpos antinucleares" },
      { name: "Factor reumatoide" },
      { name: "Deamidated Gliadin (IgG)", premium: true },
      { name: "Deamidated Gliadin (IgA)", premium: true },
      { name: "Tissue Transglutaminase (IgG)", premium: true },
      { name: "Tissue Transglutaminase (IgA)", premium: true },
    ]
  },
  {
    name: "Examen General de Orina",
    tests: 24,
    biomarkers: [
      { name: "Color" },
      { name: "Aspecto" },
      { name: "Densidad" },
      { name: "pH" },
      { name: "Esterasa leucocitaria" },
      { name: "Nitritos" },
      { name: "Proteínas" },
      { name: "Glucosa" },
      { name: "Cetonas" },
      { name: "Bilirrubina" },
      { name: "Urobilinógeno" },
      { name: "Hemoglobina" },
      { name: "Eritrocitos/μL" },
      { name: "Eritrocitos/CPA" },
      { name: "Eritrocitos no lisados/μL" },
      { name: "Eritrocitos no lisados/CPA" },
      { name: "Leucocitos/μL" },
      { name: "Leucocitos/CPA" },
      { name: "Cúmulos de leucocitos/μL" },
      { name: "Bacterias/μL" },
      { name: "Bacterias/CPA" },
      { name: "Células epiteliales escamosas" },
      { name: "Células epiteliales transicionales" },
      { name: "Filamento mucoso" },
    ]
  },
  {
    name: "Función Renal en Orina",
    tests: 2,
    biomarkers: [
      { name: "Albúmina en orina" },
      { name: "Relación microalbúmina/creatinina en orina" },
    ]
  },
];

function CategorySection({ category, index }: { category: Category; index: number }) {
  const [isOpen, setIsOpen] = useState(index < 3);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="border border-border rounded-lg overflow-hidden bg-card"
      data-testid={`category-${index}`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover-elevate transition-colors"
        data-testid={`category-toggle-${index}`}
      >
        <h3 className="text-lg font-normal text-foreground">{category.name}</h3>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground border border-border rounded-full px-3 py-1">
            {category.tests} pruebas
          </span>
          {category.premiumCount && (
            <span className="text-sm text-amber-500 flex items-center gap-1">
              <Crown className="w-4 h-4" />
              {category.premiumCount}
            </span>
          )}
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </button>
      
      {isOpen && (
        <div className="px-4 pb-4">
          <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {category.biomarkers.map((biomarker, idx) => (
              <div
                key={idx}
                className={`py-3 px-4 rounded-md text-sm ${
                  biomarker.premium
                    ? "bg-[#f5f0d8] dark:bg-[#3d3a2d]"
                    : "bg-background"
                }`}
                data-testid={`biomarker-${index}-${idx}`}
              >
                {biomarker.premium && (
                  <Crown className="w-3.5 h-3.5 text-amber-500 inline mr-2" />
                )}
                <span className="text-foreground">{biomarker.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function Biomarkers() {
  const totalBasic = 105;
  const totalPremium = 37;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-16 bg-background">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-5xl lg:text-6xl font-light italic text-foreground leading-[1.1] mb-6"
              style={{ fontFamily: "'Lovelace Light', serif" }}
              data-testid="biomarkers-title"
            >
              Biomarcadores
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="text-lg text-muted-foreground mb-8"
              data-testid="biomarkers-subtitle"
            >
              142 biomarcadores para un análisis completo de tu salud
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              className="flex items-center justify-center gap-8"
            >
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span className="text-foreground">{totalBasic} Básicos</span>
              </div>
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                <span className="text-foreground">{totalPremium} Premium</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="pb-20 bg-background">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-4">
            {categories.map((category, index) => (
              <CategorySection key={index} category={category} index={index} />
            ))}
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
