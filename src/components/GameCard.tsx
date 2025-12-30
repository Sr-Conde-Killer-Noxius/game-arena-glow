import { Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface GameCardProps {
  name: string;
  image: string;
  isActive: boolean;
  onClick?: () => void;
}

export function GameCard({ name, image, isActive, onClick }: GameCardProps) {
  return (
    <Card
      variant={isActive ? "game" : "gameDisabled"}
      onClick={isActive ? onClick : undefined}
      className="relative aspect-[3/4]"
    >
      {/* Game Image */}
      <div className="absolute inset-0">
        <img
          src={image}
          alt={name}
          className={cn(
            "w-full h-full object-cover transition-transform duration-500",
            isActive && "group-hover:scale-110"
          )}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-4">
        <h3
          className={cn(
            "font-display font-bold text-lg md:text-xl transition-all duration-300",
            isActive
              ? "text-foreground group-hover:text-primary group-hover:text-neon-glow"
              : "text-muted-foreground"
          )}
        >
          {name}
        </h3>
        
        {isActive ? (
          <p className="text-sm text-primary font-medium mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            Jogar agora →
          </p>
        ) : (
          <div className="flex items-center gap-1 mt-2">
            <Clock size={14} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              Em breve
            </span>
          </div>
        )}
      </div>

      {/* Coming Soon Badge */}
      {!isActive && (
        <div className="absolute top-3 right-3 bg-muted/90 backdrop-blur-sm px-3 py-1 rounded-full">
          <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Aguardando
          </span>
        </div>
      )}

      {/* Active indicator */}
      {isActive && (
        <div className="absolute top-3 right-3 w-3 h-3 bg-primary rounded-full animate-pulse-neon" />
      )}
    </Card>
  );
}
