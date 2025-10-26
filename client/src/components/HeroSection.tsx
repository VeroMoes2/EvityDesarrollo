import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import heroImage from "@assets/image_1758350191302.png";
import { useConfluenceData } from "@/hooks/useConfluenceData";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";

export default function HeroSection() {
  const { data: confluenceData } = useConfluenceData();
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const companyName = confluenceData?.companyName || "Evity";
  const valueProposition = t('hero.valueProposition');

  return (
    <section 
      id="inicio" 
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.65)), url(${heroImage})`
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            {t('hero.welcome')}
            <span className="block text-transparent bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text">
              {companyName}
            </span>
          </h1>
          
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
            {valueProposition}
          </p>
          
          {isAuthenticated ? (
            <div className="flex justify-center">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => scrollToSection("calculadora")}
                data-testid="button-hero-calcular"
              >
                {t('hero.discoverMore')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/login">
                <Button 
                  size="lg" 
                  className="bg-primary text-primary-foreground px-8 py-3 text-lg"
                  data-testid="button-hero-login"
                >
                  {t('landing.accessProfile')}
                </Button>
              </Link>
              <Link href="/register">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="px-8 py-3 text-lg bg-white/10 border-white/30 text-white backdrop-blur-sm hover:bg-white/20"
                  data-testid="button-hero-register"
                >
                  {t('landing.createAccount')}
                </Button>
              </Link>
            </div>
          )}
          
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </div>
    </section>
  );
}