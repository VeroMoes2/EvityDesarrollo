import { Heart, Mail, MapPin, Phone } from "lucide-react";
import { useConfluenceData } from "@/hooks/useConfluenceData";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { data: confluenceData } = useConfluenceData();
  const [, navigate] = useLocation();
  const { t, language } = useLanguage();

  const handleLinkClick = (linkName: string) => {
    if (linkName === "about") {
      navigate('/nosotros');
    } else {
      console.log(`Footer link clicked: ${linkName}`); // todo: remove mock functionality for other links
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
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

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-card-foreground">{t('footer.quickLinks')}</h4>
            <nav className="space-y-2">
              <button 
                onClick={() => handleLinkClick("about")}
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                data-testid="footer-link-about"
              >
                {t('footer.aboutUs')}
              </button>
              <button 
                onClick={() => handleLinkClick("research")}
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                data-testid="footer-link-research"
              >
                {t('footer.research')}
              </button>
              <button 
                onClick={() => handleLinkClick("community")}
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                data-testid="footer-link-community"
              >
                {t('footer.community')}
              </button>
              <button 
                onClick={() => handleLinkClick("faq")}
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                data-testid="footer-link-faq"
              >
                {t('footer.faq')}
              </button>
            </nav>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h4 className="font-semibold text-card-foreground">{t('footer.resources')}</h4>
            <nav className="space-y-2">
              <button 
                onClick={() => handleLinkClick("guides")}
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                data-testid="footer-link-guides"
              >
                {t('footer.guides')}
              </button>
              <button 
                onClick={() => handleLinkClick("calculators")}
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                data-testid="footer-link-calculators"
              >
                {t('footer.calculators')}
              </button>
              <button 
                onClick={() => handleLinkClick("blog")}
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                data-testid="footer-link-blog"
              >
                {t('footer.blog')}
              </button>
            </nav>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-semibold text-card-foreground">{t('footer.contact')}</h4>
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
                <span>{t('footer.location')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-card-border mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              © {currentYear} {companyName}. {t('footer.allRightsReserved')}
            </div>
            <div className="flex items-center gap-6 text-sm">
              <button 
                onClick={() => handleLinkClick("privacy")}
                className="text-muted-foreground hover:text-primary transition-colors"
                data-testid="footer-link-privacy"
              >
                {t('footer.privacyPolicy')}
              </button>
              <button 
                onClick={() => handleLinkClick("terms")}
                className="text-muted-foreground hover:text-primary transition-colors"
                data-testid="footer-link-terms"
              >
                {t('footer.termsOfUse')}
              </button>
              <button 
                onClick={() => handleLinkClick("cookies")}
                className="text-muted-foreground hover:text-primary transition-colors"
                data-testid="footer-link-cookies"
              >
                {t('footer.cookies')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}