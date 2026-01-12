import { useLanguage } from "@/contexts/LanguageContext";

export default function PreventionSection() {
  const { t } = useLanguage();

  return (
    <section className="py-10 bg-background pt-[100px] pb-[100px]">
      <div className="max-w-3xl mx-auto px-6 sm:px-8">
        <div className="text-left">
          <h2 
            className="md:text-5xl font-light text-foreground mb-8 text-[40px]"
            style={{ fontFamily: "'Lovelace Light', serif" }}
          >Vive más años, con mejor salud.</h2>
          
          <p className="text-xl md:text-2xl text-foreground leading-relaxed mb-6">En Evity combinamos medicina preventiva, biomarcadores avanzados e inteligencia artificial para identificar riesgos tempranos y diseñar un plan de salud hecho especialmente a tu medida, para que te veas y sientas mejor, desde hoy.</p>
          
          <p className="text-lg text-muted-foreground leading-relaxed">En Evity combinamos medicina preventiva, biomarcadores avanzados e inteligencia artificial para identificar riesgos tempranos y diseñar un plan de salud hecho especialmente a tu medida.</p>
        </div>
      </div>
    </section>
  );
}
