import { Heart, Mail, MapPin, Phone } from "lucide-react";
import { useConfluenceData } from "@/hooks/useConfluenceData";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { data: confluenceData } = useConfluenceData();

  const handleLinkClick = (linkName: string) => {
    console.log(`Footer link clicked: ${linkName}`); // todo: remove mock functionality
  };

  const companyName = confluenceData?.companyName || "Evity";
  
  // Build comprehensive company description using all available content
  let companyDescription = "Tu plataforma de longevidad personalizada. Basado en ciencia, diseñado para ti.";
  
  if (confluenceData?.mission) {
    companyDescription = confluenceData.mission;
  }
  
  if (confluenceData?.vision) {
    // If we have both mission and vision, combine them
    if (confluenceData?.mission) {
      companyDescription = `${confluenceData.mission} ${confluenceData.vision}`;
    } else {
      companyDescription = confluenceData.vision;
    }
  }

  return (
    <footer className="bg-card border-t border-card-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-primary">{companyName}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {companyDescription}
            </p>
            <div className="flex items-center text-sm text-muted-foreground">
              <Heart className="h-4 w-4 mr-2 text-red-500" />
              Hecho con amor para tu bienestar
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-card-foreground">Enlaces Rápidos</h4>
            <nav className="space-y-2">
              <button 
                onClick={() => handleLinkClick("Sobre Nosotros")}
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                data-testid="footer-link-about"
              >
                Sobre Nosotros
              </button>
              <button 
                onClick={() => handleLinkClick("Investigación")}
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                data-testid="footer-link-research"
              >
                Investigación
              </button>
              <button 
                onClick={() => handleLinkClick("Comunidad")}
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                data-testid="footer-link-community"
              >
                Comunidad
              </button>
              <button 
                onClick={() => handleLinkClick("Preguntas Frecuentes")}
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                data-testid="footer-link-faq"
              >
                Preguntas Frecuentes
              </button>
            </nav>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h4 className="font-semibold text-card-foreground">Recursos</h4>
            <nav className="space-y-2">
              <button 
                onClick={() => handleLinkClick("Guías Gratuitas")}
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                data-testid="footer-link-guides"
              >
                Guías Gratuitas
              </button>
              <button 
                onClick={() => handleLinkClick("Calculadoras")}
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                data-testid="footer-link-calculators"
              >
                Calculadoras
              </button>
              <button 
                onClick={() => handleLinkClick("Blog")}
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                data-testid="footer-link-blog"
              >
                Blog
              </button>
              <button 
                onClick={() => handleLinkClick("Newsletter")}
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                data-testid="footer-link-newsletter"
              >
                Newsletter
              </button>
            </nav>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-semibold text-card-foreground">Contacto</h4>
            <div className="space-y-3">
              <div className="flex items-center text-sm text-muted-foreground">
                <Mail className="h-4 w-4 mr-3" />
                <button 
                  onClick={() => handleLinkClick("Email")}
                  className="hover:text-primary transition-colors"
                  data-testid="footer-contact-email"
                >
                  hola@evity.com
                </button>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Phone className="h-4 w-4 mr-3" />
                <button 
                  onClick={() => handleLinkClick("Phone")}
                  className="hover:text-primary transition-colors"
                  data-testid="footer-contact-phone"
                >
                  +34 900 123 456
                </button>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mr-3" />
                <span>Madrid, España</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-card-border mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              © {currentYear} {companyName}. Todos los derechos reservados.
            </div>
            <div className="flex items-center gap-6 text-sm">
              <button 
                onClick={() => handleLinkClick("Privacidad")}
                className="text-muted-foreground hover:text-primary transition-colors"
                data-testid="footer-link-privacy"
              >
                Política de Privacidad
              </button>
              <button 
                onClick={() => handleLinkClick("Términos")}
                className="text-muted-foreground hover:text-primary transition-colors"
                data-testid="footer-link-terms"
              >
                Términos de Uso
              </button>
              <button 
                onClick={() => handleLinkClick("Cookies")}
                className="text-muted-foreground hover:text-primary transition-colors"
                data-testid="footer-link-cookies"
              >
                Cookies
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}