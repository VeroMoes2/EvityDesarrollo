import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import ParticleBackground from "./ParticleBackground";

export default function HeroSection() {
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();

  const scrollToWaitlist = () => {
    const waitlistSection = document.getElementById('waitlist-section');
    if (waitlistSection) {
      waitlistSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section 
      id="inicio" 
      className="relative h-full min-h-screen flex items-center justify-center overflow-hidden pt-16"
      style={{ backgroundColor: '#f5f0e6' }}
    >
      {/* Solid beige background */}
      <div 
        className="absolute inset-0"
        style={{ backgroundColor: '#f5f0e6' }}
      />
      {/* CSS Particle Animation - Seamless infinite loop */}
      <ParticleBackground />
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center flex items-center justify-center">
        <div className="max-w-4xl mx-auto">
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-light text-[#2C3E2D] mb-6 leading-[1.1] tracking-tight" style={{ fontFamily: "'Lovelace Light', serif" }}>
            {t('hero.title1')}
          </h1>
          
          <p className="text-[#3D4F3E]/90 mb-8 max-w-2xl mx-auto text-[24px]">
            {t('hero.subtitle')}
          </p>
          
          <div className="flex justify-center">
            <Button 
              className="px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md"
              data-testid="button-hero-comenzar"
              onClick={scrollToWaitlist}
            >
              Unirme a la lista de espera
            </Button>
          </div>
          
        </div>
      </div>
    </section>
  );
}
