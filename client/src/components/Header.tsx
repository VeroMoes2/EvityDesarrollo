import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";
import { useConfluenceData } from "@/hooks/useConfluenceData";
import { useLocation } from "wouter";
import WaitlistModal from "./WaitlistModal";

export default function Header() {
  const [isDark, setIsDark] = useState(false);
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const { data: confluenceData } = useConfluenceData();
  const [, navigate] = useLocation();

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const isDarkMode = saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setIsDark(isDarkMode);
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  const companyName = confluenceData?.companyName || "Evity";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center"
            data-testid="nav-home"
          >
            <h1 className="text-xl font-bold text-primary">{companyName}</h1>
          </button>

          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme}
              data-testid="button-theme-toggle"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <Button 
              data-testid="button-waitlist"
              onClick={() => setWaitlistOpen(true)}
            >Comenzar</Button>
          </div>
        </div>
      </div>
      <WaitlistModal open={waitlistOpen} onOpenChange={setWaitlistOpen} />
    </header>
  );
}
