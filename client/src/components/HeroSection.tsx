import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "wouter";
import heroBackground from "@assets/Gemini_Generated_Image_64rbf264rbf264rb_1765770834961_1766003947092.png";
import WaitlistModal from "./WaitlistModal";

export default function HeroSection() {
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  return (
    <section 
      id="inicio" 
      className="relative min-h-[70vh] flex items-center justify-center overflow-hidden pt-16"
    >
      {/* DNA Helix Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBackground})` }}
      />
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center flex items-center justify-center">
        <div className="max-w-4xl mx-auto">
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-light text-[#2C3E2D] mb-6 leading-[1.1] tracking-tight" style={{ fontFamily: "'Lovelace Light', serif" }}>
            {t('hero.title1')}
            <span className="block">{t('hero.title2')}</span>
          </h1>
          
          <p className="text-lg text-[#3D4F3E]/90 mb-8 max-w-2xl mx-auto leading-relaxed">
            {t('hero.subtitle')}
          </p>
          
          <div className="flex justify-center">
            <Button 
              className="px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md"
              data-testid="button-hero-comenzar"
              onClick={() => setWaitlistOpen(true)}
            >
              Unirme a la lista de espera
            </Button>
          </div>
          
        </div>
      </div>

      <WaitlistModal open={waitlistOpen} onOpenChange={setWaitlistOpen} />
    </section>
  );
}
