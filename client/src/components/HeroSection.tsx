import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import heroBackground from "@assets/Gemini_Generated_Image_64rbf264rbf264rb_1765770834961_1766003947092.png";
import heroVideo from "@assets/generated_videos/light_beige_particles_animation.mp4";

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
    >
      {/* Animated Video Background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        poster={heroBackground}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: 'sepia(15%) saturate(85%) hue-rotate(-5deg)' }}
      >
        <source src={heroVideo} type="video/mp4" />
      </video>
      {/* Beige color tint overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ 
          background: 'linear-gradient(to bottom, rgba(245, 240, 230, 0.12) 0%, rgba(240, 235, 225, 0.08) 100%)',
          mixBlendMode: 'overlay'
        }}
      />
      {/* Fallback Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat -z-10"
        style={{ backgroundImage: `url(${heroBackground})` }}
      />
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
