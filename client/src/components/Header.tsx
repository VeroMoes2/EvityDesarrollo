import { Button } from "@/components/ui/button";
import { useConfluenceData } from "@/hooks/useConfluenceData";
import { useLocation } from "wouter";

export default function Header() {
  const { data: confluenceData } = useConfluenceData();
  const [, navigate] = useLocation();

  const companyName = confluenceData?.companyName || "Evity";

  const scrollToWaitlist = () => {
    const waitlistSection = document.getElementById('waitlist-section');
    if (waitlistSection) {
      waitlistSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50" style={{ backgroundColor: '#f8f8f3' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-20">
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center"
            data-testid="nav-home"
          >
            <h1 
              className="text-xl font-medium text-[#21242c]"
              style={{ 
                fontFamily: "'Lovelace Light', serif",
                textShadow: `
                  0 0 2px rgba(245, 240, 230, 1),
                  0 0 4px rgba(245, 240, 230, 1),
                  0 0 6px rgba(245, 240, 230, 0.9),
                  0 0 12px rgba(245, 240, 230, 0.7),
                  0 0 20px rgba(245, 240, 230, 0.5),
                  0 0 30px rgba(245, 240, 230, 0.3)
                `,
              }}
            >{companyName}</h1>
          </button>

          <div className="flex items-center space-x-4">
            <Button 
              data-testid="button-waitlist"
              onClick={scrollToWaitlist}
            >Acceso anticipado</Button>
          </div>
        </div>
      </div>
    </header>
  );
}
