import { useMemo } from "react";

interface Particle {
  id: number;
  size: number;
  x: number;
  y: number;
  duration: number;
  delay: number;
  opacity: number;
}

export default function ParticleBackground() {
  const particles = useMemo(() => {
    const particleCount = 80;
    const generated: Particle[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      generated.push({
        id: i,
        size: Math.random() * 4 + 1,
        x: Math.random() * 100,
        y: Math.random() * 100,
        duration: Math.random() * 20 + 15,
        delay: Math.random() * -30,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }
    
    return generated;
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <style>
        {`
          @keyframes floatParticle {
            0% {
              transform: translate(0, 0) rotate(0deg);
              opacity: var(--particle-opacity);
            }
            25% {
              transform: translate(15px, -20px) rotate(90deg);
              opacity: calc(var(--particle-opacity) * 1.2);
            }
            50% {
              transform: translate(-10px, -40px) rotate(180deg);
              opacity: var(--particle-opacity);
            }
            75% {
              transform: translate(20px, -60px) rotate(270deg);
              opacity: calc(var(--particle-opacity) * 0.8);
            }
            100% {
              transform: translate(0, -80px) rotate(360deg);
              opacity: var(--particle-opacity);
            }
          }
          
          @keyframes drift {
            0%, 100% {
              transform: translateX(0) translateY(0);
            }
            25% {
              transform: translateX(30px) translateY(-15px);
            }
            50% {
              transform: translateX(-20px) translateY(10px);
            }
            75% {
              transform: translateX(15px) translateY(-25px);
            }
          }
          
          @keyframes shimmer {
            0%, 100% {
              opacity: var(--particle-opacity);
            }
            50% {
              opacity: calc(var(--particle-opacity) * 1.5);
            }
          }
          
          .particle {
            position: absolute;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(180, 160, 130, 0.8) 0%, rgba(200, 180, 150, 0.4) 50%, transparent 70%);
            animation: 
              floatParticle var(--duration) ease-in-out infinite,
              drift calc(var(--duration) * 1.5) ease-in-out infinite,
              shimmer calc(var(--duration) * 0.5) ease-in-out infinite;
            animation-delay: var(--delay);
            will-change: transform, opacity;
          }
        `}
      </style>
      
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="particle"
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            '--duration': `${particle.duration}s`,
            '--delay': `${particle.delay}s`,
            '--particle-opacity': particle.opacity,
          } as React.CSSProperties}
        />
      ))}
      
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 30% 20%, rgba(220, 200, 170, 0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(200, 180, 150, 0.1) 0%, transparent 50%)',
        }}
      />
    </div>
  );
}
