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
  const [video1Opacity, setVideo1Opacity] = useState(1);
  const [video2Opacity, setVideo2Opacity] = useState(0);
  const isTransitioningRef = useRef(false);

  const scrollToWaitlist = () => {
    const waitlistSection = document.getElementById('waitlist-section');
    if (waitlistSection) {
      waitlistSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const video1 = video1Ref.current;
    const video2 = video2Ref.current;
    if (!video1 || !video2) return;

    const SKIP_START = 0.5;
    const CROSSFADE_BEFORE_END = 1.5;
    const CROSSFADE_DURATION = 1000;

    const startVideoFromSafePoint = (video: HTMLVideoElement) => {
      video.currentTime = SKIP_START;
      video.play().catch(() => {});
    };

    const handleVideo1TimeUpdate = () => {
      if (!video1.duration || isTransitioningRef.current) return;
      
      const timeRemaining = video1.duration - video1.currentTime;
      if (timeRemaining <= CROSSFADE_BEFORE_END && timeRemaining > 0) {
        isTransitioningRef.current = true;
        startVideoFromSafePoint(video2);
        
        setVideo1Opacity(0);
        setVideo2Opacity(1);
        
        setTimeout(() => {
          video1.pause();
          video1.currentTime = SKIP_START;
          isTransitioningRef.current = false;
        }, CROSSFADE_DURATION);
      }
    };

    const handleVideo2TimeUpdate = () => {
      if (!video2.duration || isTransitioningRef.current) return;
      
      const timeRemaining = video2.duration - video2.currentTime;
      if (timeRemaining <= CROSSFADE_BEFORE_END && timeRemaining > 0) {
        isTransitioningRef.current = true;
        startVideoFromSafePoint(video1);
        
        setVideo2Opacity(0);
        setVideo1Opacity(1);
        
        setTimeout(() => {
          video2.pause();
          video2.currentTime = SKIP_START;
          isTransitioningRef.current = false;
        }, CROSSFADE_DURATION);
      }
    };

    video1.addEventListener('timeupdate', handleVideo1TimeUpdate);
    video2.addEventListener('timeupdate', handleVideo2TimeUpdate);

    startVideoFromSafePoint(video1);

    return () => {
      video1.removeEventListener('timeupdate', handleVideo1TimeUpdate);
      video2.removeEventListener('timeupdate', handleVideo2TimeUpdate);
    };
  }, []);

  const videoStyle = { filter: 'sepia(20%) saturate(60%) brightness(1.05) hue-rotate(-5deg)' };

  return (
    <section 
      id="inicio" 
      className="relative h-full min-h-screen flex items-center justify-center overflow-hidden pt-16"
      style={{ backgroundColor: '#f5f0e6' }}
    >
      {/* Solid beige background */}
      <div 
        className="absolute inset-0"
        style={{ backgroundColor: '#f5f0e6' }}
      />
      {/* Video 1 */}
      <video
        ref={video1Ref}
        muted
        playsInline
        poster={heroBackground}
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out"
        style={{ ...videoStyle, opacity: video1Opacity }}
      >
        <source src={heroVideo} type="video/mp4" />
      </video>
      {/* Video 2 */}
      <video
        ref={video2Ref}
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out"
        style={{ ...videoStyle, opacity: video2Opacity }}
      >
        <source src={heroVideo} type="video/mp4" />
      </video>
      {/* Content with gradient scrim for readability */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center flex items-center justify-center">
        <div className="relative max-w-4xl mx-auto">
          {/* Subtle gradient scrim - blends naturally with background */}
          <div 
            className="absolute pointer-events-none"
            style={{
              inset: '-200px -400px',
              background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(245, 240, 230, 0.5) 0%, rgba(245, 240, 230, 0.3) 30%, rgba(245, 240, 230, 0.1) 60%, transparent 100%)',
            }}
          />
          
          {/* Headline with localized text scrim */}
          <div className="relative mb-6">
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                inset: '-12px -40px',
                background: 'linear-gradient(to bottom, rgba(245, 240, 230, 0.7) 0%, rgba(245, 240, 230, 0.5) 50%, rgba(245, 240, 230, 0.3) 100%)',
                filter: 'blur(20px)',
              }}
            />
            <h1 className="relative text-5xl sm:text-6xl lg:text-7xl font-light text-[#2C3E2D] leading-[1.1] tracking-tight" style={{ fontFamily: "'Lovelace Light', serif" }}>
              {t('hero.title1')}
            </h1>
          </div>
          
          {/* Subheadline with localized text scrim */}
          <div className="relative mb-8 max-w-2xl mx-auto">
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                inset: '-8px -24px',
                background: 'rgba(245, 240, 230, 0.5)',
                filter: 'blur(16px)',
              }}
            />
            <p className="relative text-[#3D4F3E]/90 text-[24px]">
              {t('hero.subtitle')}
            </p>
          </div>
          
          <div className="relative flex justify-center">
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
