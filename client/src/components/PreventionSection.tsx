import { useLanguage } from "@/contexts/LanguageContext";

export default function PreventionSection() {
  const { t } = useLanguage();

  return (
    <section className="py-10 bg-background pt-[100px] pb-[100px]">
      <div className="max-w-3xl mx-auto px-6 sm:px-8">
        <div className="text-left">
          <h2 
            className="text-4xl md:text-5xl font-light text-foreground leading-[1.1] mb-8"
            style={{ fontFamily: "'Lovelace Light', serif" }}
          >
            Lo de hoy es prevenir
          </h2>
          
          <p className="text-xl md:text-2xl text-foreground leading-relaxed mb-6">
            Anticipa riesgos y vive más años con mejor salud – viéndote y sintiéndote mejor, desde hoy.
          </p>
          
          <p className="text-lg text-muted-foreground leading-relaxed">
            Combinamos medicina preventiva, biomarcadores avanzados e inteligencia artificial.
          </p>
        </div>
      </div>
    </section>
  );
}
