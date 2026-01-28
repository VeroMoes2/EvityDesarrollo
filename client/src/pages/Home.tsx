import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import PlatformSection from "@/components/PlatformSection";
import PreventionSection from "@/components/PreventionSection";
import WaitlistSection from "@/components/WaitlistSection";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import fondoEvity from "@assets/Fondo_Evity_1768605844451.jpg";

const steps = [
  {
    number: 1,
    title: "Conocer tu punto de partida",
    description: "Iniciamos con una conversación guiada para entender tu estilo de vida, hábitos y contexto personal.",
    bgColor: "bg-[#f8f8f3] dark:bg-[#1a1a1a]"
  },
  {
    number: 2,
    title: "Sumamos contexto",
    description: "Integramos información relevante que tú decides compartir para darte una guía más clara y personalizada en tu proceso.",
    bgColor: "bg-[#f0f0ea] dark:bg-[#1e1e1e]"
  },
  {
    number: 3,
    title: "Explora tu panorama actual",
    description: "Traducimos la información que compartes en una visión clara de tus hábitos, patrones y oportunidades de mejora cotidiana. Te damos acceso completo a tu propio portal de vida.",
    bgColor: "bg-[#e8e8e0] dark:bg-[#222222]"
  },
  {
    number: 4,
    title: "Acompañamiento personalizado",
    description: "Te acompañamos con la creación de una guía práctica para construir hábitos que puedas sostener en tu día a día, alineados a tu estilo de vida y obejtivos personales.",
    bgColor: "bg-[#e0e0d6] dark:bg-[#262626]"
  },
  {
    number: 5,
    title: "Evolución constante",
    description: "Brindamos un acompañamiento cercano para mantener claridad, constancia y visualizar avances a lo largo de tu proceso. Un monitoreo especial diseñádo con herramientas digitales por y para ti.",
    bgColor: "bg-[#d8d8cc] dark:bg-[#2a2a2a]"
  }
];

export default function Home() {
  return (
    <div className="bg-background">
      <Header />
      <main className="snap-container">
        {/* Hero Section */}
        <div className="snap-section">
          <HeroSection />
        </div>

        {/* Platform Section */}
        <div className="snap-section">
          <PlatformSection />
        </div>
        
        {/* Prevention Section */}
        <div className="snap-section">
          <PreventionSection />
        </div>
        
        {/* Evity Way Steps - Sticky Stacking Sections */}
        <div className="steps-container">
          {steps.map((step, index) => (
            <section 
              key={index}
              className={`step-section ${step.bgColor}`}
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
            </section>
          ))}
        </div>

        {/* Waitlist Section + Footer */}
        <div 
          id="waitlist-section" 
          className="snap-section flex flex-col justify-between"
          style={{
            backgroundImage: `url(${fondoEvity})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <WaitlistSection />
          <Footer />
        </div>
      </main>
    </div>
  );
}
