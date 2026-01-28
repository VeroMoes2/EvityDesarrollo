import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import preventionBackground from "@assets/Fondo_Evity_1768187185274.jpg";

export default function PreventionSection() {
  const { t } = useLanguage();

  const scrollToWaitlist = () => {
    const waitlistSection = document.getElementById('waitlist-section');
    if (waitlistSection) {
      waitlistSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="h-full min-h-screen flex items-center relative overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${preventionBackground})` }}
      />
      <div className="relative z-10 max-w-3xl mx-auto px-6 sm:px-8">
        <div className="text-left">
          <h2 
            className="md:text-5xl font-light text-foreground mb-8 text-[40px]"
            style={{ fontFamily: "'Lovelace Light', serif" }}
          >Construir bienestar hoy, para vivir mejor.</h2>
          
          <p className="text-xl md:text-2xl text-foreground leading-relaxed mb-8">Una plataforma enfocada en acompañamiento, educación y seguimiento de hábitos clave. En Evity combinamos tecnología y acompañamiento humano para ayudarte a vivir mejor, a tu ritmo. </p>
          
          <Button 
            className="px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md"
            data-testid="button-prevention-waitlist"
            onClick={scrollToWaitlist}
          >
            Unirme a la lista de espera
          </Button>
        </div>
      </div>
    </section>
  );
}
