import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import PreventionSection from "@/components/PreventionSection";
import WaitlistSection from "@/components/WaitlistSection";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";

const steps = [
  {
    number: 1,
    title: "Historia Clínica",
    description: "Tu historia importa. Una conversación profunda con nuestros doctores para entender tu genética, hábitos y riesgos.",
    bgColor: "bg-[#f5f5f0] dark:bg-[#1a1a1a]"
  },
  {
    number: 2,
    title: "Estudios y exámenes",
    description: "Simple. Intuitivo. Preciso. Realiza tus laboratorios en Evity o con nuestros aliados. Todo inicia con datos reales.",
    bgColor: "bg-[#e8e8e0] dark:bg-[#222222]"
  },
  {
    number: 3,
    title: "Diagnóstico de Longevidad",
    description: "Claro. Visual. Accionable. Biomarcadores, edad biológica y riesgos en un portal fácil de entender.",
    bgColor: "bg-[#f0f0e8] dark:bg-[#1e1e1e]"
  },
  {
    number: 4,
    title: "Plan Personalizado",
    description: "Diseñado para ti. Nutrición, ejercicio, sueño, suplementos y prevención. Una ruta clara y personalizada para transformar tu salud día a día.",
    bgColor: "bg-[#e5e5dd] dark:bg-[#252525]"
  },
  {
    number: 5,
    title: "Monitoreo y Evolución",
    description: "Monitoreamos tu progreso, ajustamos tu plan y te guiamos para mantener y mejorar tus resultados en el tiempo. Te revaluamos cada mes para optimizar tu evolución.",
    bgColor: "bg-[#f5f5f0] dark:bg-[#1a1a1a]"
  }
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <PreventionSection />
        
        {/* Evity Way Steps - Sticky Scroll */}
        <section className="relative">
          {steps.map((step, index) => (
            <div 
              key={index}
              className={`sticky top-0 min-h-[50vh] flex items-center ${step.bgColor} shadow-[0_-10px_30px_rgba(0,0,0,0.1)]`}
              style={{ zIndex: index + 1 }}
              data-testid={`step-${step.number}`}
            >
              <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 py-12 w-full">
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-20%" }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="text-left"
                >
                  <span className="text-sm text-muted-foreground tracking-widest mb-4 block font-semibold">
                    PASO {step.number}
                  </span>
                  <h2 
                    className="text-4xl md:text-5xl lg:text-6xl font-light text-foreground mb-6"
                    style={{ fontFamily: "'Lovelace Light', serif" }}
                  >
                    {step.title}
                  </h2>
                  <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl font-light">
                    {step.description}
                  </p>
                </motion.div>
              </div>
            </div>
          ))}
        </section>

        <WaitlistSection />
      </main>
      <Footer />
    </div>
  );
}
