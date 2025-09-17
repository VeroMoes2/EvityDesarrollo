import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import heroImage from "@assets/generated_images/Hero_mountain_landscape_12ea45bd.png";

export default function HeroSection() {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleVideoClick = () => {
    console.log("Video demo clicked"); // todo: remove mock functionality
  };

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
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Tu Camino Hacia una
            <span className="block text-transparent bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text">
              Vida Más Larga
            </span>
          </h1>
          
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
            Descubre los secretos científicos de la longevidad. Herramientas personalizadas, 
            recursos basados en evidencia y una comunidad dedicada a vivir más y mejor.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => scrollToSection("calculadora")}
              data-testid="button-hero-calcular"
            >
              Calcula tu Longevidad
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
          
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-8 text-white">
            <div className="text-center" data-testid="stat-usuarios">
              <div className="text-3xl font-bold text-teal-400">10,000+</div>
              <div className="text-white/80">Usuarios Activos</div>
            </div>
            <div className="text-center" data-testid="stat-estudios">
              <div className="text-3xl font-bold text-emerald-400">500+</div>
              <div className="text-white/80">Estudios Científicos</div>
            </div>
            <div className="text-center" data-testid="stat-anos">
              <div className="text-3xl font-bold text-teal-400">15+</div>
              <div className="text-white/80">Años de Investigación</div>
            </div>
          </div>
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