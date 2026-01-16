import { motion } from "framer-motion";

const features = [
  {
    title: "Diagnóstico integral",
    description: "Evaluación profunda basada en biomarcadores, historial clínico, hábitos y estilo de vida para entender tu salud como un todo."
  },
  {
    title: "Planes personalizados",
    description: "Recomendaciones claras y accionables en nutrición, ejercicio, sueño y prevención, diseñadas para tu perfil y objetivos."
  },
  {
    title: "Seguimiento continuo",
    description: "Un sistema de acompañamiento que te mantiene constante, mide tu progreso y te ayuda a cumplir tus objetivos de salud."
  }
];

export default function PlatformSection() {
  return (
    <section className="min-h-screen flex items-center bg-[#fafaf8] dark:bg-[#0f0f0f]">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-20 w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <h2 
            className="text-2xl md:text-3xl lg:text-4xl font-light text-foreground mb-6"
            style={{ fontFamily: "'Lovelace Light', serif" }}
          >Tu plataforma de salud preventiva y longevidad</h2>
          <p 
            className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto"
            style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
          >
            Evaluamos tu salud de forma integral para prevenir enfermedades y ayudarte a vivir mejor, con más energía, claridad y bienestar desde hoy.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
              className="group"
            >
              <div 
                className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-10 lg:p-12 h-full min-h-[280px] transition-all duration-300 hover:-translate-y-1"
              >
                <h3 
                  className="text-xl lg:text-2xl text-foreground mb-4 font-light"
                  style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
                >
                  {feature.title}
                </h3>
                <p 
                  className="text-base lg:text-lg text-muted-foreground"
                  style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
                >
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
