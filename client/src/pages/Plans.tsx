import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Check, X } from "lucide-react";
import { motion } from "framer-motion";

const plans = [
  { id: "essential", name: "Essential", subtitle: "Longevity" },
  { id: "advanced", name: "Advanced", subtitle: "Longevity" },
  { id: "clinical", name: "Clinical", subtitle: "Longevity" },
  { id: "total", name: "Total", subtitle: "Longevity" },
];

const features = [
  { name: "Análisis +100 biomarcadores simples", essential: true, advanced: true, clinical: true, total: true },
  { name: "Informe clínico de longevidad", essential: true, advanced: true, clinical: true, total: true },
  { name: "Acceso a portal de biomarcadores", essential: true, advanced: true, clinical: true, total: true },
  { name: "Integración con wearables", essential: true, advanced: true, clinical: true, total: true },
  { name: "Cita de historia familiar", essential: true, advanced: true, clinical: true, total: true },
  { name: "Bot de dudas y seguimiento", essential: true, advanced: true, clinical: true, total: true },
  { name: "Checkup cada 6 meses", essential: false, advanced: true, clinical: true, total: true },
  { name: "Cita de interpretación de resultados", essential: false, advanced: true, clinical: true, total: true },
  { name: "Plan personalizado", essential: false, advanced: true, clinical: true, total: true },
  { name: "Análisis +35 biomarcadores premium", essential: false, advanced: true, clinical: true, total: true },
  { name: "Prueba de esfuerzo", essential: false, advanced: false, clinical: true, total: true },
  { name: "Eco carotídeo", essential: false, advanced: false, clinical: true, total: true },
  { name: "Visia Skin Analysis", essential: false, advanced: false, clinical: true, total: true },
  { name: "Electrocardiograma 12 derivaciones", essential: false, advanced: false, clinical: true, total: true },
  { name: "Presión arterial", essential: false, advanced: false, clinical: true, total: true },
  { name: "InBody", essential: false, advanced: false, clinical: true, total: true },
  { name: "Grip strength", essential: false, advanced: false, clinical: true, total: true },
  { name: "Índice tobillo-brazo (ITB)", essential: false, advanced: false, clinical: true, total: true },
  { name: "Grosor de la Íntima-Media Carotídea", essential: false, advanced: false, clinical: true, total: true },
  { name: "AngioTAC", essential: false, advanced: false, clinical: false, total: true },
  { name: "Score de calcio coronario (CAC)", essential: false, advanced: false, clinical: false, total: true },
  { name: "Colonoscopía", essential: false, advanced: false, clinical: false, total: true },
  { name: "Mamografía", essential: false, advanced: false, clinical: false, total: true },
  { name: "Densitometría ósea", essential: false, advanced: false, clinical: false, total: true },
  { name: "RMN total body", essential: false, advanced: false, clinical: false, total: true },
];

export default function Plans() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-16 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-5xl lg:text-6xl font-light italic text-foreground leading-[1.1] mb-6"
              style={{ fontFamily: "'Lovelace Light', serif" }}
              data-testid="plans-title"
            >
              Compara nuestros planes
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="text-lg text-muted-foreground"
              data-testid="plans-subtitle"
            >
              Encuentra el plan perfecto para tu camino hacia la longevidad
            </motion.p>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="pb-20 bg-background">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              className="overflow-x-auto"
            >
              <table className="w-full" data-testid="plans-comparison-table">
                {/* Header */}
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-6 pr-4 font-normal text-muted-foreground">
                      Características
                    </th>
                    {plans.map((plan) => (
                      <th 
                        key={plan.id} 
                        className="text-center py-6 px-4 font-normal"
                        data-testid={`plan-header-${plan.id}`}
                      >
                        <div className="text-foreground font-medium">{plan.name}</div>
                        <div className="text-muted-foreground text-sm">{plan.subtitle}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                
                {/* Body */}
                <tbody>
                  {features.map((feature, index) => (
                    <tr 
                      key={index} 
                      className={index % 2 === 0 ? "bg-muted/30" : "bg-background"}
                      data-testid={`feature-row-${index}`}
                    >
                      <td className="py-4 pr-4 text-foreground">
                        {feature.name}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {feature.essential ? (
                          <Check className="w-5 h-5 text-primary mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-muted-foreground/50 mx-auto" />
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {feature.advanced ? (
                          <Check className="w-5 h-5 text-primary mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-muted-foreground/50 mx-auto" />
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {feature.clinical ? (
                          <Check className="w-5 h-5 text-primary mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-muted-foreground/50 mx-auto" />
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {feature.total ? (
                          <Check className="w-5 h-5 text-primary mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-muted-foreground/50 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
