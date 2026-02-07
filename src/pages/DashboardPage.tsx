import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GameCard } from "@/components/GameCard";
import { Bell, Search, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

// Import game images
import freefireImg from "@/assets/games/freefire.jpg";
import wildriftImg from "@/assets/games/wildrift.jpg";
import valorantImg from "@/assets/games/valorant.jpg";
import codmobileImg from "@/assets/games/codmobile.jpg";
import cs2Img from "@/assets/games/cs2.jpg";
import pubgImg from "@/assets/games/pubg.jpg";

type GameType = Database["public"]["Enums"]["game_type"];

// Base game data with images
const gameImages: Partial<Record<GameType, string>> = {
  freefire: freefireImg,
  wildrift: wildriftImg,
  valorant: valorantImg,
  codmobile: codmobileImg,
  cs2: cs2Img,
  pubg: pubgImg,
};

const gameNames: Partial<Record<GameType, string>> = {
  freefire: "Free Fire",
  wildrift: "LoL: Wild Rift",
  valorant: "Valorant",
  codmobile: "CoD Mobile",
  cs2: "CS2",
  pubg: "PUBG Mobile",
  clashroyale: "Clash Royale",
  fortnite: "Fortnite",
};

const allGameTypes: GameType[] = ["freefire", "wildrift", "valorant", "codmobile", "cs2", "pubg", "clashroyale", "fortnite"];

interface GameData {
  id: GameType;
  name: string;
  image: string;
  isActive: boolean;
  tournamentCount: number;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [games, setGames] = useState<GameData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchGamesWithTournaments();
  }, []);

  const fetchGamesWithTournaments = async () => {
    try {
      // Fetch tournaments that are open or in_progress
      const { data: tournaments, error } = await supabase
        .from("tournaments")
        .select("game, status")
        .in("status", ["open", "in_progress", "upcoming"]);

      if (error) throw error;

      // Count active tournaments per game
      const tournamentCounts: Partial<Record<GameType, number>> = {
        freefire: 0,
        wildrift: 0,
        valorant: 0,
        codmobile: 0,
        cs2: 0,
        pubg: 0,
        clashroyale: 0,
        fortnite: 0,
      };

      tournaments?.forEach((t) => {
        const game = t.game as GameType;
        if (game && game in tournamentCounts) {
          tournamentCounts[game] = (tournamentCounts[game] || 0) + 1;
        }
      });

      // Build games array - games with tournaments are active
      const gamesData: GameData[] = allGameTypes.map((gameType) => ({
        id: gameType,
        name: gameNames[gameType] || gameType,
        image: gameImages[gameType] || "",
        isActive: (tournamentCounts[gameType] || 0) > 0,
        tournamentCount: tournamentCounts[gameType] || 0,
      }));

      // Sort: active games first
      gamesData.sort((a, b) => {
        if (a.isActive && !b.isActive) return -1;
        if (!a.isActive && b.isActive) return 1;
        return b.tournamentCount - a.tournamentCount;
      });

      setGames(gamesData);
    } catch (err) {
      console.error("Error fetching games:", err);
      // Fallback to static data
      setGames(
        allGameTypes.map((gameType) => ({
          id: gameType,
          name: gameNames[gameType],
          image: gameImages[gameType],
          isActive: false,
          tournamentCount: 0,
        }))
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGameClick = (gameId: string) => {
    const game = games.find((g) => g.id === gameId);
    if (game?.isActive) {
      navigate(`/tournament/${gameId}`);
    }
  };

  const handleLogout = async () => {
    await signOut();
    toast.success("Logout realizado com sucesso!");
    navigate("/");
  };

  const displayName =
    profile?.full_name ||
    profile?.username ||
    (user?.user_metadata as { full_name?: string; username?: string } | null)?.full_name ||
    (user?.user_metadata as { full_name?: string; username?: string } | null)?.username ||
    user?.email?.split("@")[0] ||
    "Jogador";
  const activeGamesCount = games.filter((g) => g.isActive).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm h-14 sm:h-16 lg:h-20 border-b border-border px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4">
          <h1 className="font-display text-base sm:text-lg lg:text-xl font-bold truncate">Dashboard</h1>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 lg:gap-4">
          {/* Search - hidden on mobile */}
          <div className="hidden lg:flex relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={18}
            />
            <Input
              type="search"
              placeholder="Buscar..."
              className="pl-10 w-64 bg-secondary/30"
            />
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative h-9 w-9 sm:h-10 sm:w-10 touch-manipulation">
            <Bell size={18} className="sm:w-5 sm:h-5" />
            <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-2 h-2 bg-primary rounded-full" />
          </Button>

          {/* Profile */}
          <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10 touch-manipulation">
            <User size={18} className="sm:w-5 sm:h-5" />
          </Button>

          {/* Logout */}
          <Button variant="ghost" size="icon" onClick={handleLogout} className="h-9 w-9 sm:h-10 sm:w-10 touch-manipulation">
            <LogOut size={18} className="sm:w-5 sm:h-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-4 sm:p-6 lg:p-10">
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8 lg:mb-10">
          <h2 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">
            Olá, <span className="text-primary truncate">{displayName}</span>!
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
            Escolha seu jogo e comece a competir.
          </p>
        </div>

        {/* Games Grid */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
            <h3 className="font-display text-base sm:text-lg lg:text-xl font-bold">Jogos Disponíveis</h3>
            <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
              {isLoading ? "Carregando..." : `${activeGamesCount} de ${games.length} ativos`}
            </span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <div className="flex gap-3 sm:gap-4 lg:gap-6 overflow-x-auto pb-4 scrollbar-hide">
              {games.map((game) => (
                <div key={game.id} className="flex-shrink-0 w-36 sm:w-44 lg:w-48">
                  <GameCard
                    name={game.name}
                    image={game.image}
                    isActive={game.isActive}
                    onClick={() => handleGameClick(game.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {[
            { label: "Partidas Jogadas", value: "0", change: "Comece agora!" },
            { label: "Vitórias", value: "0", change: "Sua primeira espera" },
            { label: "Ranking", value: "-", change: "Não ranqueado" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="gradient-card p-4 sm:p-6 rounded-xl border border-border/50"
            >
              <p className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wide mb-1">
                {stat.label}
              </p>
              <p className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-1">
                {stat.value}
              </p>
              <p className="text-xs sm:text-sm text-primary">{stat.change}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
