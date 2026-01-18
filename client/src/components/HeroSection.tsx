import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useRef } from "react";
import heroBackground from "@assets/Gemini_Generated_Image_64rbf264rbf264rb_1765770834961_1766003947092.png";
import heroVideo from "@assets/generated_videos/light_beige_particles_animation.mp4";

export default function HeroSection() {
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);

  const scrollToWaitlist = () => {
    const waitlistSection = document.getElementById('waitlist-section');
    if (waitlistSection) {
      waitlistSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Seamless infinite loop: two staggered videos always playing
  // Video2 starts when video1 is halfway through, creating continuous coverage
  useEffect(() => {
    const video1 = video1Ref.current;
    const video2 = video2Ref.current;
    if (!video1 || !video2) return;

    let video1Started = false;
    let video2Started = false;

    const startVideo2WhenReady = () => {
      if (!video1Started || video2Started) return;
      
      // Start video2 when video1 is at 40% to ensure overlap
      if (video1.currentTime >= video1.duration * 0.4) {
        video2.currentTime = 0;
        video2.play().catch(() => {});
        video2Started = true;
      }
    };

    const loopVideo = (video: HTMLVideoElement, otherVideo: HTMLVideoElement) => {
      // Reset to beginning before reaching the problematic end frames
      const loopPoint = video.duration - 0.3; // Skip last 0.3 seconds
      if (video.currentTime >= loopPoint) {
        video.currentTime = 0;
      }
    };

    const handleVideo1TimeUpdate = () => {
      startVideo2WhenReady();
      loopVideo(video1, video2);
    };

    const handleVideo2TimeUpdate = () => {
      loopVideo(video2, video1);
    };

    const handleVideo1CanPlay = () => {
      video1Started = true;
      video1.play().catch(() => {});
    };

    video1.addEventListener('canplay', handleVideo1CanPlay);
    video1.addEventListener('timeupdate', handleVideo1TimeUpdate);
    video2.addEventListener('timeupdate', handleVideo2TimeUpdate);

    // Initial play attempt
    video1.play().catch(() => {});

    return () => {
      video1.removeEventListener('canplay', handleVideo1CanPlay);
      video1.removeEventListener('timeupdate', handleVideo1TimeUpdate);
      video2.removeEventListener('timeupdate', handleVideo2TimeUpdate);
    };
  }, []);

  const videoStyle = { filter: 'sepia(20%) saturate(60%) brightness(1.05) hue-rotate(-5deg)' };

  return (
    <section 
      id="inicio" 
      className="relative h-full min-h-screen flex items-center justify-center overflow-hidden pt-16"
    >
      {/* Animated Video Background - Two staggered videos for seamless loop */}
      <video
        ref={video1Ref}
        muted
        playsInline
        poster={heroBackground}
        className="absolute inset-0 w-full h-full object-cover"
        style={videoStyle}
      >
        <source src={heroVideo} type="video/mp4" />
      </video>
      <video
        ref={video2Ref}
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={videoStyle}
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
