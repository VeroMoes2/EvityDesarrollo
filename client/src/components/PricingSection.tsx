import { useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

const comparisonFeatures = [
  { name: "Análisis +100 biomarcadores simples", essential: true, advanced: true, clinical: true, total: true },
  { name: "Informe clínico de longevidad", essential: true, advanced: true, clinical: true, total: true },
  { name: "Acceso a portal de biomarcadores", essential: false, advanced: true, clinical: true, total: true },
  { name: "Integración con wearables", essential: false, advanced: true, clinical: true, total: true },
  { name: "Cita de historia familiar", essential: true, advanced: true, clinical: true, total: true },
  { name: "Bot de dudas y seguimiento", essential: true, advanced: true, clinical: true, total: true },
  { name: "Checkup cada 6 meses", essential: false, advanced: true, clinical: true, total: true },
  { name: "Cita de interpretación de resultados", essential: false, advanced: true, clinical: true, total: true },
  { name: "Plan personalizado", essential: false, advanced: false, clinical: true, total: true },
  { name: "Análisis +35 biomarcadores premium", essential: false, advanced: false, clinical: true, total: true },
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

const plans = [
  {
    name: "Essential Longevity",
    price: "$5,000 MXN",
    features: [
      "Evaluación avanzada de biomarcadores (103 biomarcadores)",
      "Portal digital + carga de laboratorios externos",
      "Integración con wearables",
      "Perfil de salud familiar",
      "Tecnología de punta (IA) para seguimiento y entendimiento de tus datos"
    ]
  },
  {
    name: "Advanced Longevity",
    price: "$15,000 MXN",
    includes: "Todo lo de Essential, más:",
    features: [
      "Checkup cada 6 meses",
      "Biomarcadores premium (+20 biomarcadores adicionales)",
      "Interpretación individualizada de resultados con un especialista",
      "Plan de salud y longevidad personalizado"
    ]
  },
  {
    name: "Clinical Longevity",
    price: "$25,000 MXN",
    includes: "Todo lo de Advanced, más:",
    subtitle: "Pruebas clínicas presenciales:",
    features: [
      "Prueba de esfuerzo",
      "Eco carotídeo",
      "Visia Skin Analysis",
      "Electrocardiograma de 12 derivaciones",
      "Presión arterial",
      "InBody",
      "Grip strength"
    ]
  },
  {
    name: "Total Longevity",
    price: "$50,000 MXN",
    includes: "Todo lo de Clinical, más Imagenología avanzada:",
    features: [
      "AngioTAC",
      "Score de calcio coronario (CAC)",
      "Colonoscopía",
      "Mamografía",
      "Densitometría ósea",
      "RMN total body"
    ]
  }
];

export default function PricingSection() {
  const [, navigate] = useLocation();
  const [showComparison, setShowComparison] = useState(false);

  return (
    <section className="py-10 bg-background">
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <div className="text-center mb-12">
          <h2 
            className="text-4xl lg:text-5xl font-light text-foreground leading-[1.1] mb-6"
            style={{ fontFamily: "'Lovelace Light', serif" }}
          >
            Tu punto de partida
          </h2>
          <button 
            onClick={() => setShowComparison(!showComparison)}
            className="text-primary hover:underline inline-flex items-center gap-1"
            data-testid="link-comparativa"
          >
            {showComparison ? "Ocultar comparativa" : "Ver comparativa completa"} →
          </button>
        </div>

        {showComparison && (
          <div id="comparativa" className="mb-16">
            <div className="text-center mb-10">
              <h2 
                className="text-4xl lg:text-5xl font-light text-foreground leading-[1.1] mb-4"
                style={{ fontFamily: "'Lovelace Light', serif" }}
              >
                Compara nuestros planes
              </h2>
              <p className="text-muted-foreground">
                Encuentra el plan perfecto para tu camino hacia la longevidad
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse" data-testid="comparison-table">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-4 px-4 font-medium text-muted-foreground w-1/3">
                      Características
                    </th>
                    <th className="text-center py-4 px-2 font-medium text-foreground">
                      Essential<br/>Longevity
                    </th>
                    <th className="text-center py-4 px-2 font-medium text-foreground">
                      Advanced<br/>Longevity
                    </th>
                    <th className="text-center py-4 px-2 font-medium text-foreground">
                      Clinical<br/>Longevity
                    </th>
                    <th className="text-center py-4 px-2 font-medium text-foreground">
                      Total<br/>Longevity
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((feature, index) => (
                    <tr 
                      key={index} 
                      className="border-b border-border"
                      data-testid={`comparison-row-${index}`}
                    >
                      <td className="py-4 px-4 text-foreground text-sm">
                        {feature.name}
                      </td>
                      <td className="py-4 px-2 text-center">
                        {feature.essential ? (
                          <Check className="w-5 h-5 text-primary mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-muted-foreground/50 mx-auto" />
                        )}
                      </td>
                      <td className="py-4 px-2 text-center">
                        {feature.advanced ? (
                          <Check className="w-5 h-5 text-primary mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-muted-foreground/50 mx-auto" />
                        )}
                      </td>
                      <td className="py-4 px-2 text-center">
                        {feature.clinical ? (
                          <Check className="w-5 h-5 text-primary mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-muted-foreground/50 mx-auto" />
                        )}
                      </td>
                      <td className="py-4 px-2 text-center">
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
            </div>
          </div>
        )}

        <div 
          className="grid gap-4"
          style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}
        >
          {plans.map((plan, index) => (
            <div 
              key={index}
              className="bg-card border border-border rounded-2xl p-6 flex flex-col"
              data-testid={`pricing-card-${index}`}
            >
              <h3 className="text-xl font-medium text-card-foreground mb-2">
                {plan.name}
              </h3>
              <p className="text-2xl font-semibold text-primary mb-4">
                {plan.price}
              </p>
              
              {plan.includes && (
                <p className="text-sm text-muted-foreground mb-3">
                  {plan.includes}
                </p>
              )}
              
              {plan.subtitle && (
                <p className="text-sm font-medium text-card-foreground mb-3">
                  {plan.subtitle}
                </p>
              )}
              
              <ul className="space-y-3 flex-grow mb-6">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                variant="outline" 
                className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                onClick={() => navigate('/register')}
                data-testid={`button-comenzar-${index}`}
              >
                Comenzar
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
