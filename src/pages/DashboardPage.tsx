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
const gameImages: Record<GameType, string> = {
  freefire: freefireImg,
  wildrift: wildriftImg,
  valorant: valorantImg,
  codmobile: codmobileImg,
  cs2: cs2Img,
  pubg: pubgImg,
};

const gameNames: Record<GameType, string> = {
  freefire: "Free Fire",
  wildrift: "LoL: Wild Rift",
  valorant: "Valorant",
  codmobile: "CoD Mobile",
  cs2: "CS2",
  pubg: "PUBG Mobile",
};

const allGameTypes: GameType[] = ["freefire", "wildrift", "valorant", "codmobile", "cs2", "pubg"];

interface GameData {
  id: GameType;
  name: string;
  image: string;
  isActive: boolean;
  tournamentCount: number;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
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
      const tournamentCounts: Record<GameType, number> = {
        freefire: 0,
        wildrift: 0,
        valorant: 0,
        codmobile: 0,
        cs2: 0,
        pubg: 0,
      };

      tournaments?.forEach((t) => {
        if (t.game && tournamentCounts[t.game as GameType] !== undefined) {
          tournamentCounts[t.game as GameType]++;
        }
      });

      // Build games array - games with tournaments are active
      const gamesData: GameData[] = allGameTypes.map((gameType) => ({
        id: gameType,
        name: gameNames[gameType],
        image: gameImages[gameType],
        isActive: tournamentCounts[gameType] > 0,
        tournamentCount: tournamentCounts[gameType],
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

  const displayName = user?.user_metadata?.username || user?.email?.split("@")[0] || "Jogador";
  const activeGamesCount = games.filter((g) => g.isActive).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-20 border-b border-border px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="font-display text-xl font-bold">Dashboard</h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="hidden md:flex relative">
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
          <Button variant="ghost" size="icon" className="relative">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
          </Button>

          {/* Profile */}
          <Button variant="ghost" size="icon">
            <User size={20} />
          </Button>

          {/* Logout */}
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut size={20} />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6 lg:p-10">
        {/* Welcome Section */}
        <div className="mb-10">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-2">
            Olá, <span className="text-primary">{displayName}</span>!
          </h2>
          <p className="text-muted-foreground text-lg">
            Escolha seu jogo e comece a competir.
          </p>
        </div>

        {/* Games Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display text-xl font-bold">Jogos Disponíveis</h3>
            <span className="text-sm text-muted-foreground">
              {isLoading ? "Carregando..." : `${activeGamesCount} de ${games.length} ativos`}
            </span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 lg:gap-6">
              {games.map((game) => (
                <GameCard
                  key={game.id}
                  name={game.name}
                  image={game.image}
                  isActive={game.isActive}
                  onClick={() => handleGameClick(game.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-4 lg:gap-6">
          {[
            { label: "Partidas Jogadas", value: "0", change: "Comece agora!" },
            { label: "Vitórias", value: "0", change: "Sua primeira espera" },
            { label: "Ranking", value: "-", change: "Não ranqueado" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="gradient-card p-6 rounded-xl border border-border/50"
            >
              <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">
                {stat.label}
              </p>
              <p className="font-display text-3xl font-bold text-foreground mb-1">
                {stat.value}
              </p>
              <p className="text-sm text-primary">{stat.change}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
