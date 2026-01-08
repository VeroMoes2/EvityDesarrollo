import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";

const steps = [
  {
    number: 1,
    title: "Historia Clínica",
    description: "Tu historia importa. Una conversación profunda con nuestros doctores para entender tu genética, hábitos y riesgos.",
    imagePosition: "left" as const
  },
  {
    number: 2,
    title: "Estudios y exámenes",
    description: "Simple. Intuitivo. Preciso. Realiza tus laboratorios en Evity o con nuestros aliados. Todo inicia con datos reales.",
    imagePosition: "right" as const
  },
  {
    number: 3,
    title: "Diagnóstico de Longevidad",
    description: "Claro. Visual. Accionable. Biomarcadores, edad biológica y riesgos en un portal fácil de entender.",
    imagePosition: "left" as const
  },
  {
    number: 4,
    title: "Plan Personalizado",
    description: "Diseñado para ti. Nutrición, ejercicio, sueño, suplementos y prevención. Una ruta clara y personalizada para transformar tu salud día a día.",
    imagePosition: "right" as const
  },
  {
    number: 5,
    title: "Monitoreo y Evolución",
    description: "Siempre contigo. Monitoreamos tu progreso, ajustamos tu plan y te guiamos para mantener y mejorar tus resultados en el tiempo. Te revaluamos cada 6 meses para optimizar tu evolución.",
    imagePosition: "left" as const
  }
];

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-16 bg-background">
          <div className="max-w-7xl mx-auto px-2 sm:px-4">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-6xl lg:text-7xl font-light text-foreground leading-[1.1] mb-8"
              style={{ fontFamily: "'Lovelace Light', serif" }}
              data-testid="evity-way-title"
            >
              Lo de hoy es prevenir
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="text-xl text-foreground mb-6 max-w-4xl italic"
              data-testid="evity-way-subtitle"
            >
              Anticipa riesgos y vive más años con mejor salud – viéndote y sintiéndote mejor, desde hoy.
            </motion.p>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
              className="text-base text-muted-foreground max-w-4xl"
              data-testid="evity-way-description"
            >
              Combinamos medicina preventiva, biomarcadores avanzados e inteligencia artificial.
            </motion.p>
          </div>
        </section>

        {/* Steps Section */}
        <section className="py-10 bg-background">
          <div className="max-w-7xl mx-auto px-2 sm:px-4 space-y-32">
            {steps.map((step, index) => (
              <div 
                key={index}
                className="grid gap-12 items-center"
                style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}
                data-testid={`step-${step.number}`}
              >
                {step.imagePosition === "left" ? (
                  <>
                    {/* Image on left */}
                    <motion.div 
                      className="flex justify-center"
                      initial={{ opacity: 0, x: -60 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                      <div 
                        className="bg-[#b8b8a8] rounded-2xl w-full max-w-md aspect-square"
                        data-testid={`step-${step.number}-image`}
                      />
                    </motion.div>
                    
                    {/* Content on right */}
                    <motion.div 
                      className="flex flex-col justify-center"
                      initial={{ opacity: 0, x: 60 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    >
                      <span className="text-sm text-muted-foreground tracking-widest mb-2">
                        PASO {step.number}
                      </span>
                      <h2 
                        className="text-4xl font-light text-foreground mb-6"
                        style={{ fontFamily: "'Lovelace Light', serif" }}
                      >
                        {step.title}
                      </h2>
                      <p className="text-lg text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </motion.div>
                  </>
                ) : (
                  <>
                    {/* Content on left */}
                    <motion.div 
                      className="flex flex-col justify-center"
                      initial={{ opacity: 0, x: -60 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    >
                      <span className="text-sm text-muted-foreground tracking-widest mb-2">
                        PASO {step.number}
                      </span>
                      <h2 
                        className="text-4xl font-light text-foreground mb-6"
                        style={{ fontFamily: "'Lovelace Light', serif" }}
                      >
                        {step.title}
                      </h2>
                      <p className="text-lg text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </motion.div>
                    
                    {/* Image on right */}
                    <motion.div 
                      className="flex justify-center"
                      initial={{ opacity: 0, x: 60 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                      <div 
                        className="bg-[#b8b8a8] rounded-2xl w-full max-w-md aspect-square"
                        data-testid={`step-${step.number}-image`}
                      />
                    </motion.div>
                  </>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
