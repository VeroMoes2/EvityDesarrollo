import { Heart } from "lucide-react";
import { SiTiktok, SiInstagram } from "react-icons/si";
import { useConfluenceData } from "@/hooks/useConfluenceData";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { data: confluenceData } = useConfluenceData();
  const [, navigate] = useLocation();
  const { t, language } = useLanguage();

  const handleLinkClick = (linkName: string) => {
    if (linkName === "contact") {
      navigate('/contacto');
    } else {
      console.log(`Footer link clicked: ${linkName}`);
    }
  };

  const companyName = confluenceData?.companyName || "Evity";
  
  // Build comprehensive company description using available content while respecting language selection
  let companyDescription = t('footer.companyDescription');
  
  // For Spanish, use Confluence data when available (it's in Spanish)
  // For English, use the translated fallback
  if (language === 'es' && confluenceData?.mission) {
    companyDescription = confluenceData.mission;
    
    // If we have both mission and vision in Spanish, combine them
    if (confluenceData?.vision) {
      companyDescription = `${confluenceData.mission} ${confluenceData.vision}`;
    }
  }

  return (
    <footer className="bg-card border-t border-card-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-12">
          {/* Primera fila: Enlaces Rápidos, Contacto y Síguenos */}
          <div 
            className="grid gap-8"
            style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}
          >
            {/* Quick Links */}
            <div className="space-y-4">
              <h4 className="font-semibold text-card-foreground">{t('footer.quickLinks')}</h4>
              <nav className="space-y-2">
                <button 
                  onClick={() => handleLinkClick("contact")}
                  className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                  data-testid="footer-link-contact"
                >
                  {t('footer.contactUs')}
                </button>
              </nav>
            </div>

            {/* Social Media */}
            <div className="space-y-4">
              <h4 className="font-semibold text-card-foreground">{t('footer.followUs')}</h4>
              <div className="flex gap-4">
                <a 
                  href="https://www.tiktok.com/@evity.mx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  data-testid="footer-social-tiktok"
                  aria-label="TikTok"
                >
                  <SiTiktok className="h-5 w-5" />
                </a>
                <a 
                  href="https://www.instagram.com/evity.mx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  data-testid="footer-social-instagram"
                  aria-label="Instagram"
                >
                  <SiInstagram className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>

          {/* Segunda fila: Company Info (abarcando todo el ancho) */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-primary">{companyName}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {companyDescription}
            </p>
            <div className="flex items-center text-sm text-muted-foreground">
              <Heart className="h-4 w-4 mr-2 text-red-500" />
              {t('footer.madeWithLove')}
            </div>
          </div>
        </div>

        <div className="border-t border-card-border mt-12 pt-8">
          <div className="text-sm text-muted-foreground text-center">
            © {currentYear} {companyName}. {t('footer.allRightsReserved')}
          </div>
        </div>
      </div>
    </footer>
  );
}