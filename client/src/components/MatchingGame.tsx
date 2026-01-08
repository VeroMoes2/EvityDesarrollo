import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Brain, Apple, Dumbbell, Moon, Droplets, Smile, Leaf } from "lucide-react";

interface MatchItem {
  id: string;
  icon: string;
  label: string;
  isMatched: boolean;
}

const CONCEPTS = [
  { name: "heart", Icon: Heart, color: "text-red-500", label: "Corazón" },
  { name: "brain", Icon: Brain, color: "text-purple-500", label: "Salud Mental" },
  { name: "apple", Icon: Apple, color: "text-green-500", label: "Nutrición" },
  { name: "dumbbell", Icon: Dumbbell, color: "text-blue-500", label: "Ejercicio" },
  { name: "moon", Icon: Moon, color: "text-indigo-500", label: "Sueño" },
  { name: "droplets", Icon: Droplets, color: "text-cyan-500", label: "Hidratación" },
  { name: "smile", Icon: Smile, color: "text-yellow-500", label: "Bienestar" },
  { name: "leaf", Icon: Leaf, color: "text-emerald-500", label: "Longevidad" },
];

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

interface MatchingGameProps {
  onComplete?: () => void;
}

export function MatchingGame({ onComplete }: MatchingGameProps) {
  const [icons, setIcons] = useState<MatchItem[]>([]);
  const [labels, setLabels] = useState<MatchItem[]>([]);
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [matches, setMatches] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [wrongPair, setWrongPair] = useState<{icon: string, label: string} | null>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);

  const initializeGame = useCallback(() => {
    const selectedConcepts = shuffleArray(CONCEPTS).slice(0, 5);
    
    const iconItems: MatchItem[] = shuffleArray(selectedConcepts.map(c => ({
      id: `icon-${c.name}`,
      icon: c.name,
      label: c.label,
      isMatched: false,
    })));

    const labelItems: MatchItem[] = shuffleArray(selectedConcepts.map(c => ({
      id: `label-${c.name}`,
      icon: c.name,
      label: c.label,
      isMatched: false,
    })));

    setIcons(iconItems);
    setLabels(labelItems);
    setSelectedIcon(null);
    setSelectedLabel(null);
    setMatches(0);
    setAttempts(0);
    setGameWon(false);
    setWrongPair(null);
    setStartTime(Date.now());
    setElapsedTime(0);
  }, []);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  useEffect(() => {
    if (gameWon) return;
    
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [startTime, gameWon]);

  useEffect(() => {
    if (matches === 5) {
      onComplete?.();
    }
  }, [matches, onComplete]);

  const handleIconClick = (iconName: string) => {
    if (icons.find(i => i.icon === iconName)?.isMatched) return;
    setSelectedIcon(iconName);
    setWrongPair(null);

    if (selectedLabel) {
      checkMatch(iconName, selectedLabel);
    }
  };

  const handleLabelClick = (iconName: string) => {
    if (labels.find(l => l.icon === iconName)?.isMatched) return;
    setSelectedLabel(iconName);
    setWrongPair(null);

    if (selectedIcon) {
      checkMatch(selectedIcon, iconName);
    }
  };

  const checkMatch = (iconName: string, labelIconName: string) => {
    setAttempts(prev => prev + 1);

    if (iconName === labelIconName) {
      setIcons(prev => prev.map(i => 
        i.icon === iconName ? { ...i, isMatched: true } : i
      ));
      setLabels(prev => prev.map(l => 
        l.icon === labelIconName ? { ...l, isMatched: true } : l
      ));
      setMatches(prev => prev + 1);
      setSelectedIcon(null);
      setSelectedLabel(null);
    } else {
      setWrongPair({ icon: iconName, label: labelIconName });
      setTimeout(() => {
        setSelectedIcon(null);
        setSelectedLabel(null);
        setWrongPair(null);
      }, 800);
    }
  };

  const getIconComponent = (iconName: string, size: string = "w-8 h-8") => {
    const concept = CONCEPTS.find(c => c.name === iconName);
    if (!concept) return null;
    const { Icon, color } = concept;
    return <Icon className={`${size} ${color}`} />;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-4 bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl border-2 border-primary/20">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-primary mb-1">
          🔗 Unir Concepto
        </h3>
        <p className="text-sm text-muted-foreground">
          ¡Conecta cada icono con su nombre!
        </p>
      </div>

      <div className="flex justify-center gap-4 mb-4 text-sm">
        <div className="px-3 py-1 bg-background rounded-full border">
          ⏱️ {formatTime(elapsedTime)}
        </div>
        <div className="px-3 py-1 bg-background rounded-full border">
          🎯 {attempts} intentos
        </div>
        <div className="px-3 py-1 bg-background rounded-full border">
          ✨ {matches}/5 pares
        </div>
      </div>

      {gameWon ? (
        <div className="text-center py-6">
          <div className="text-4xl mb-2">🎉</div>
          <h4 className="text-lg font-bold text-primary mb-2">¡Excelente!</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Uniste todos los conceptos en {attempts} intentos y {formatTime(elapsedTime)}
          </p>
          <Button onClick={initializeGame} size="sm" data-testid="button-play-again-matching">
            Jugar de nuevo
          </Button>
        </div>
      ) : (
        <div className="flex justify-center gap-6">
          <div className="flex flex-col gap-2">
            <p className="text-xs text-center text-muted-foreground mb-1">Iconos</p>
            {icons.map((item) => (
              <Card
                key={item.id}
                onClick={() => handleIconClick(item.icon)}
                className={`w-14 h-14 flex items-center justify-center cursor-pointer transition-all ${
                  item.isMatched
                    ? 'bg-green-100 dark:bg-green-900/30 border-green-500 opacity-60'
                    : selectedIcon === item.icon
                      ? 'bg-primary/20 border-primary ring-2 ring-primary'
                      : wrongPair?.icon === item.icon
                        ? 'bg-red-100 dark:bg-red-900/30 border-red-500'
                        : 'hover-elevate'
                }`}
                data-testid={`matching-icon-${item.icon}`}
              >
                {getIconComponent(item.icon)}
              </Card>
            ))}
          </div>

          <div className="flex flex-col justify-center">
            <div className="text-2xl text-muted-foreground">↔️</div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs text-center text-muted-foreground mb-1">Conceptos</p>
            {labels.map((item) => (
              <Card
                key={item.id}
                onClick={() => handleLabelClick(item.icon)}
                className={`px-3 h-14 flex items-center justify-center cursor-pointer transition-all min-w-[100px] ${
                  item.isMatched
                    ? 'bg-green-100 dark:bg-green-900/30 border-green-500 opacity-60'
                    : selectedLabel === item.icon
                      ? 'bg-primary/20 border-primary ring-2 ring-primary'
                      : wrongPair?.label === item.icon
                        ? 'bg-red-100 dark:bg-red-900/30 border-red-500'
                        : 'hover-elevate'
                }`}
                data-testid={`matching-label-${item.icon}`}
              >
                <span className="text-sm font-medium">{item.label}</span>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-center mt-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={initializeGame}
          data-testid="button-restart-matching"
        >
          🔄 Reiniciar
        </Button>
      </div>

      <p className="text-xs text-center text-muted-foreground mt-3">
        💡 Tip: Selecciona un icono y luego su concepto correspondiente
      </p>
    </div>
  );
}
