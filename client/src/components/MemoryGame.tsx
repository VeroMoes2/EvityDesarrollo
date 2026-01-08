import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Brain, Apple, Dumbbell, Moon, Droplets, Smile, Leaf } from "lucide-react";

interface MemoryCard {
  id: number;
  icon: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const ICONS = [
  { name: "heart", Icon: Heart, color: "text-red-500" },
  { name: "brain", Icon: Brain, color: "text-purple-500" },
  { name: "apple", Icon: Apple, color: "text-green-500" },
  { name: "dumbbell", Icon: Dumbbell, color: "text-blue-500" },
  { name: "moon", Icon: Moon, color: "text-indigo-500" },
  { name: "droplets", Icon: Droplets, color: "text-cyan-500" },
  { name: "smile", Icon: Smile, color: "text-yellow-500" },
  { name: "leaf", Icon: Leaf, color: "text-emerald-500" },
];

interface MemoryGameProps {
  onComplete?: () => void;
}

export function MemoryGame({ onComplete }: MemoryGameProps) {
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);

  const initializeGame = useCallback(() => {
    const selectedIcons = ICONS.slice(0, 6);
    const cardPairs = [...selectedIcons, ...selectedIcons];
    
    const shuffledCards: MemoryCard[] = cardPairs
      .sort(() => Math.random() - 0.5)
      .map((icon, index) => ({
        id: index,
        icon: icon.name,
        isFlipped: false,
        isMatched: false,
      }));
    
    setCards(shuffledCards);
    setFlippedCards([]);
    setMoves(0);
    setMatches(0);
    setGameWon(false);
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
    if (matches === 6) {
      onComplete?.();
    }
  }, [matches, onComplete]);

  const handleCardClick = (cardId: number) => {
    if (isChecking) return;
    if (flippedCards.length === 2) return;
    if (cards[cardId].isFlipped || cards[cardId].isMatched) return;

    const newCards = [...cards];
    newCards[cardId].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedCards, cardId];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(prev => prev + 1);
      setIsChecking(true);

      const [first, second] = newFlipped;
      if (cards[first].icon === cards[second].icon) {
        setTimeout(() => {
          setCards(prev => prev.map(card => 
            card.id === first || card.id === second 
              ? { ...card, isMatched: true }
              : card
          ));
          setMatches(prev => prev + 1);
          setFlippedCards([]);
          setIsChecking(false);
        }, 500);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(card => 
            card.id === first || card.id === second 
              ? { ...card, isFlipped: false }
              : card
          ));
          setFlippedCards([]);
          setIsChecking(false);
        }, 1000);
      }
    }
  };

  const getIconComponent = (iconName: string) => {
    const iconData = ICONS.find(i => i.name === iconName);
    if (!iconData) return null;
    const { Icon, color } = iconData;
    return <Icon className={`w-6 h-6 ${color}`} />;
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
          🧠 Juego de Memoria
        </h3>
        <p className="text-sm text-muted-foreground">
          ¡Encuentra las parejas mientras procesamos tu archivo!
        </p>
      </div>

      <div className="flex justify-center gap-4 mb-4 text-sm">
        <div className="px-3 py-1 bg-background rounded-full border">
          ⏱️ {formatTime(elapsedTime)}
        </div>
        <div className="px-3 py-1 bg-background rounded-full border">
          🎯 {moves} movimientos
        </div>
        <div className="px-3 py-1 bg-background rounded-full border">
          ✨ {matches}/6 parejas
        </div>
      </div>

      {gameWon ? (
        <div className="text-center py-6">
          <div className="text-4xl mb-2">🎉</div>
          <h4 className="text-lg font-bold text-primary mb-2">¡Felicidades!</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Completaste el juego en {moves} movimientos y {formatTime(elapsedTime)}
          </p>
          <Button onClick={initializeGame} size="sm" data-testid="button-play-again">
            Jugar de nuevo
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2 max-w-xs mx-auto">
          {cards.map((card) => (
            <div
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className={`aspect-square cursor-pointer transition-all duration-300 transform ${
                card.isFlipped || card.isMatched ? 'rotate-y-180' : ''
              }`}
              data-testid={`memory-card-${card.id}`}
            >
              <Card 
                className={`w-full h-full flex items-center justify-center transition-all ${
                  card.isMatched 
                    ? 'bg-green-100 dark:bg-green-900/30 border-green-500' 
                    : card.isFlipped 
                      ? 'bg-primary/10 border-primary' 
                      : 'bg-muted hover-elevate'
                }`}
              >
                <CardContent className="p-0 flex items-center justify-center w-full h-full">
                  {card.isFlipped || card.isMatched ? (
                    getIconComponent(card.icon)
                  ) : (
                    <span className="text-2xl">❓</span>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-center mt-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={initializeGame}
          data-testid="button-restart-game"
        >
          🔄 Reiniciar
        </Button>
      </div>

      <p className="text-xs text-center text-muted-foreground mt-3">
        💡 Tip: Los íconos representan aspectos de tu salud y bienestar
      </p>
    </div>
  );
}
