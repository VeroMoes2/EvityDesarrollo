import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useConfluenceData } from "@/hooks/useConfluenceData";
import { useLocation } from "wouter";
import WaitlistModal from "./WaitlistModal";

export default function Header() {
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const { data: confluenceData } = useConfluenceData();
  const [, navigate] = useLocation();

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
