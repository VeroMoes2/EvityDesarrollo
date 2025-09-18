import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Loader2 } from "lucide-react";
import heroImage from "@assets/generated_images/Hero_mountain_landscape_12ea45bd.png";
import { useConfluenceData } from "@/hooks/useConfluenceData";

export default function HeroSection() {
  const { data: confluenceData, isLoading, error } = useConfluenceData();
  
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleVideoClick = () => {
    console.log("Video demo clicked");
  };

  const companyName = confluenceData?.companyName || "Evity";
  const valueProposition = confluenceData?.valueProposition || confluenceData?.mission || "Tu plataforma de longevidad personalizada";

  return (
    <section 
      id="inicio" 
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${heroImage})`
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center mb-8">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
              <span className="ml-2 text-white">Cargando información de {companyName}...</span>
            </div>
          ) : null}
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Bienvenido a
            <span className="block text-transparent bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text">
              {companyName}
            </span>
          </h1>
          
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
            {valueProposition || "Descubre los secretos científicos de la longevidad. Herramientas personalizadas, recursos basados en evidencia y una comunidad dedicada a vivir más y mejor."}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => scrollToSection("calculadora")}
              data-testid="button-hero-calcular"
            >
              Descubre Más
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-6 bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
              onClick={handleVideoClick}
              data-testid="button-hero-video"
            >
              <Play className="mr-2 h-5 w-5" />
              Ver Demo
            </Button>
          </div>
          
          {(isLoading || confluenceData || error) && (
            <div className="mt-12 text-center">
              {isLoading && (
                <div className="inline-flex items-center px-6 py-3 bg-white/10 rounded-full backdrop-blur-sm border border-white/20">
                  <span className="text-white font-medium">
                    🔄 Conectando con Confluence...
                  </span>
                </div>
              )}
              
              {error && !isLoading && (
                <div className="inline-flex items-center px-6 py-3 bg-white/10 rounded-full backdrop-blur-sm border border-white/20">
                  <span className="text-white font-medium">
                    ⚠️ Modo offline - Datos locales
                  </span>
                </div>
              )}
              
              {confluenceData && !error && !isLoading && (
                <div className="inline-flex items-center px-6 py-3 bg-white/10 rounded-full backdrop-blur-sm border border-white/20">
                  <span className="text-white font-medium">
                    ✨ Contenido actualizado desde nuestro plan de negocio
                  </span>
                </div>
              )}
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