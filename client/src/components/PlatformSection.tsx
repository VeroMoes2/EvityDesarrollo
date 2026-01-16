import { motion } from "framer-motion";

export default function PlatformSection() {
  return (
    <section className="min-h-screen flex items-center bg-[#fafaf8] dark:bg-[#0f0f0f]">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-24 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="mb-20"
        >
          <p 
            className="text-sm tracking-widest text-muted-foreground/70 uppercase mb-4"
            style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
          >
            Nuestra filosofía
          </p>
          <h2 
            className="text-2xl md:text-3xl lg:text-4xl font-light text-foreground leading-snug max-w-2xl"
            style={{ fontFamily: "'Lovelace Light', serif" }}
          >
            Tu plataforma de salud preventiva y longevidad
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-5%" }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="md:col-span-7"
          >
            <div 
              className="bg-white/80 dark:bg-[#1a1a1a]/80 rounded-2xl p-8 lg:p-10 h-full transition-opacity duration-500 hover:bg-white dark:hover:bg-[#1a1a1a] border border-black/[0.03] dark:border-white/[0.03]"
            >
              <p 
                className="text-xs tracking-widest text-primary/60 uppercase mb-6"
                style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 400 }}
              >
                01 — Diagnóstico
              </p>
              <h3 
                className="text-xl lg:text-2xl text-foreground mb-5"
                style={{ fontFamily: "'Lovelace Light', serif" }}
              >
                Entendemos tu salud como un todo
              </h3>
              <p 
                className="text-muted-foreground leading-relaxed"
                style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
              >
                Biomarcadores, historial clínico, hábitos y estilo de vida. Una evaluación profunda que conecta cada parte de ti.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-5%" }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="md:col-span-5 md:mt-12"
          >
            <div 
              className="bg-[#f0ede8] dark:bg-[#1f1f1f] rounded-2xl p-8 lg:p-10 h-full transition-opacity duration-500 hover:bg-[#ebe8e3] dark:hover:bg-[#252525]"
            >
              <p 
                className="text-xs tracking-widest text-primary/60 uppercase mb-6"
                style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 400 }}
              >
                02 — Acción
              </p>
              <p 
                className="text-lg lg:text-xl text-foreground leading-relaxed italic"
                style={{ fontFamily: "'Lovelace Light', serif" }}
              >
                "Recomendaciones claras en nutrición, ejercicio, sueño y prevención — diseñadas para tu vida real."
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-5%" }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            className="md:col-span-5 md:-mt-6"
          >
            <div 
              className="rounded-2xl p-8 lg:p-10 h-full border border-black/[0.06] dark:border-white/[0.06] transition-all duration-500 hover:border-black/[0.1] dark:hover:border-white/[0.1]"
            >
              <p 
                className="text-xs tracking-widest text-muted-foreground/60 uppercase mb-4"
                style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 400 }}
              >
                03 — Evolución
              </p>
              <h3 
                className="text-lg text-foreground mb-3"
                style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
              >
                Seguimiento continuo
              </h3>
              <p 
                className="text-sm text-muted-foreground/80 leading-relaxed"
                style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
              >
                Medimos tu progreso y ajustamos tu plan. Un sistema que evoluciona contigo.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-5%" }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="md:col-span-7 flex items-center"
          >
            <p 
              className="text-lg md:text-xl text-muted-foreground/70 leading-relaxed pl-4 border-l-2 border-primary/20"
              style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
            >
              Evaluamos tu salud de forma integral para prevenir enfermedades y ayudarte a vivir mejor, con más energía, claridad y bienestar desde hoy.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
