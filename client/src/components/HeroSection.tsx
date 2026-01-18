import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useRef, useState } from "react";
import heroBackground from "@assets/Gemini_Generated_Image_64rbf264rbf264rb_1765770834961_1766003947092.png";
import heroVideo from "@assets/generated_videos/light_beige_particles_animation.mp4";

export default function HeroSection() {
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);
  const [activeVideo, setActiveVideo] = useState<1 | 2>(1);

  const scrollToWaitlist = () => {
    const waitlistSection = document.getElementById('waitlist-section');
    if (waitlistSection) {
      waitlistSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Seamless infinite loop with two videos that crossfade
  useEffect(() => {
    const video1 = video1Ref.current;
    const video2 = video2Ref.current;
    if (!video1 || !video2) return;

    let currentActive = 1;
    const crossfadeTime = 2.5; // Start crossfade 2.5 seconds before end
    let video2Ready = false;

    // Preload video2 immediately
    video2.load();
    video2.addEventListener('canplaythrough', () => {
      video2Ready = true;
    }, { once: true });

    const handleVideo1TimeUpdate = () => {
      if (!video1.duration || isNaN(video1.duration)) return;
      const timeRemaining = video1.duration - video1.currentTime;
      
      if (timeRemaining <= crossfadeTime && timeRemaining > 0.5 && currentActive === 1 && video2Ready) {
        currentActive = 2;
        video2.currentTime = 0;
        video2.play().catch(() => {});
        setActiveVideo(2);
      }
    };

    const handleVideo2TimeUpdate = () => {
      if (!video2.duration || isNaN(video2.duration)) return;
      const timeRemaining = video2.duration - video2.currentTime;
      
      if (timeRemaining <= crossfadeTime && timeRemaining > 0.5 && currentActive === 2) {
        currentActive = 1;
        video1.currentTime = 0;
        video1.play().catch(() => {});
        setActiveVideo(1);
      }
    };

    const handleVideo1Ended = () => {
      if (currentActive === 2) {
        video1.pause();
        video1.currentTime = 0;
      }
    };

    const handleVideo2Ended = () => {
      if (currentActive === 1) {
        video2.pause();
        video2.currentTime = 0;
      }
    };

    video1.addEventListener('timeupdate', handleVideo1TimeUpdate);
    video2.addEventListener('timeupdate', handleVideo2TimeUpdate);
    video1.addEventListener('ended', handleVideo1Ended);
    video2.addEventListener('ended', handleVideo2Ended);

    // Start video1
    video1.play().catch(() => {});

    return () => {
      video1.removeEventListener('timeupdate', handleVideo1TimeUpdate);
      video2.removeEventListener('timeupdate', handleVideo2TimeUpdate);
      video1.removeEventListener('ended', handleVideo1Ended);
      video2.removeEventListener('ended', handleVideo2Ended);
    };
  }, []);

  const videoStyle = { filter: 'sepia(20%) saturate(60%) brightness(1.05) hue-rotate(-5deg)' };

  return (
    <section 
      id="inicio" 
      className="relative h-full min-h-screen flex items-center justify-center overflow-hidden pt-16"
    >
      {/* Animated Video Background - Two videos for seamless crossfade loop */}
      <video
        ref={video1Ref}
        muted
        playsInline
        preload="auto"
        poster={heroBackground}
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[2000ms] ease-in-out"
        style={{ ...videoStyle, opacity: activeVideo === 1 ? 1 : 0 }}
      >
        <source src={heroVideo} type="video/mp4" />
      </video>
      <video
        ref={video2Ref}
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[2000ms] ease-in-out"
        style={{ ...videoStyle, opacity: activeVideo === 2 ? 1 : 0 }}
      >
        <source src={heroVideo} type="video/mp4" />
      </video>
      {/* Beige color tint overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ 
          background: 'linear-gradient(to bottom, rgba(245, 240, 230, 0.12) 0%, rgba(240, 235, 225, 0.08) 100%)',
          mixBlendMode: 'overlay'
        }}
      />
      {/* Fallback Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat -z-10"
        style={{ backgroundImage: `url(${heroBackground})` }}
      />
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center flex items-center justify-center">
        <div className="max-w-4xl mx-auto">
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-light text-[#2C3E2D] mb-6 leading-[1.1] tracking-tight" style={{ fontFamily: "'Lovelace Light', serif" }}>
            {t('hero.title1')}
          </h1>
          
          <p className="text-[#3D4F3E]/90 mb-8 max-w-2xl mx-auto text-[24px]">
            {t('hero.subtitle')}
          </p>
          
          <div className="flex justify-center">
            <Button 
              className="px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md"
              data-testid="button-hero-comenzar"
              onClick={scrollToWaitlist}
            >
              Unirme a la lista de espera
            </Button>
          </div>
          
        </div>
      </div>
    </section>
  );
}
