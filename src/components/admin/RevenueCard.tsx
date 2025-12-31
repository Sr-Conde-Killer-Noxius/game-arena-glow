import { DollarSign, TrendingUp, Percent } from "lucide-react";
import { cn } from "@/lib/utils";

interface RevenueCardProps {
  totalRevenue: number;
  prizePool: number;
  platformRevenue: number;
  totalParticipations: number;
}

export function RevenueCard({
  totalRevenue,
  prizePool,
  platformRevenue,
  totalParticipations,
}: RevenueCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <DollarSign className="text-primary" size={20} />
          </div>
          <span className="text-muted-foreground text-sm">Total Arrecadado</span>
        </div>
        <p className="font-display text-2xl font-bold text-foreground">
          {formatCurrency(totalRevenue)}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {totalParticipations} inscrições pagas
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-accent/10">
            <TrendingUp className="text-accent" size={20} />
          </div>
          <span className="text-muted-foreground text-sm">Pool de Premiação</span>
        </div>
        <p className="font-display text-2xl font-bold text-primary">
          {formatCurrency(prizePool)}
        </p>
        <p className="text-sm text-muted-foreground mt-1">70% do total</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-secondary">
            <Percent className="text-muted-foreground" size={20} />
          </div>
          <span className="text-muted-foreground text-sm">Receita Plataforma</span>
        </div>
        <p className="font-display text-2xl font-bold text-foreground">
          {formatCurrency(platformRevenue)}
        </p>
        <p className="text-sm text-muted-foreground mt-1">30% do total</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-secondary">
            <DollarSign className="text-muted-foreground" size={20} />
          </div>
          <span className="text-muted-foreground text-sm">Ticket Médio</span>
        </div>
        <p className="font-display text-2xl font-bold text-foreground">
          {totalParticipations > 0
            ? formatCurrency(totalRevenue / totalParticipations)
            : formatCurrency(0)}
        </p>
        <p className="text-sm text-muted-foreground mt-1">Por inscrição</p>
      </div>
    </div>
  );
}
