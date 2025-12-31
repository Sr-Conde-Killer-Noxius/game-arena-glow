import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  ArrowLeft,
  Shield,
  Users,
  Trophy,
  Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { RevenueCard } from "@/components/admin/RevenueCard";
import { TournamentsTab } from "@/components/admin/TournamentsTab";
import { UsersTab } from "@/components/admin/UsersTab";
import { TicketsTab } from "@/components/admin/TicketsTab";

type Tab = "dashboard" | "tournaments" | "users" | "tickets";

interface RevenueData {
  totalRevenue: number;
  prizePool: number;
  platformRevenue: number;
  totalParticipations: number;
}

export default function AdminPage() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [revenueData, setRevenueData] = useState<RevenueData>({
    totalRevenue: 0,
    prizePool: 0,
    platformRevenue: 0,
    totalParticipations: 0,
  });

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    if (isAdmin && activeTab === "dashboard") {
      fetchRevenueData();
    }
  }, [isAdmin, activeTab]);

  const checkAdminStatus = async () => {
    if (!user) {
      setIsAdmin(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      setIsAdmin(!error && data !== null);
    } catch {
      setIsAdmin(false);
    }
  };

  const fetchRevenueData = async () => {
    try {
      // Get all paid participations with their tournament entry fees
      const { data: participations, error } = await supabase
        .from("participations")
        .select(`
          id,
          payment_status,
          tournaments:tournament_id (entry_fee)
        `)
        .eq("payment_status", "paid");

      if (error) throw error;

      const totalRevenue = participations?.reduce((sum, p) => {
        const entryFee = (p.tournaments as any)?.entry_fee || 0;
        return sum + entryFee;
      }, 0) || 0;

      const prizePool = totalRevenue * 0.7;
      const platformRevenue = totalRevenue * 0.3;

      setRevenueData({
        totalRevenue,
        prizePool,
        platformRevenue,
        totalParticipations: participations?.length || 0,
      });
    } catch (err) {
      console.error("Error fetching revenue data:", err);
    }
  };

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background p-6 lg:p-10">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft size={18} />
          <span className="text-sm">Voltar ao Dashboard</span>
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <Shield className="text-primary" size={28} />
          <h1 className="font-display text-3xl font-bold">Painel Administrativo</h1>
        </div>
        <p className="text-muted-foreground">
          Gerencie torneios, usuários, ingressos e receitas
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          variant={activeTab === "dashboard" ? "default" : "outline"}
          onClick={() => setActiveTab("dashboard")}
        >
          <Shield size={18} />
          Dashboard
        </Button>
        <Button
          variant={activeTab === "tickets" ? "default" : "outline"}
          onClick={() => setActiveTab("tickets")}
        >
          <Ticket size={18} />
          Ingressos
        </Button>
        <Button
          variant={activeTab === "tournaments" ? "default" : "outline"}
          onClick={() => setActiveTab("tournaments")}
        >
          <Trophy size={18} />
          Torneios
        </Button>
        <Button
          variant={activeTab === "users" ? "default" : "outline"}
          onClick={() => setActiveTab("users")}
        >
          <Users size={18} />
          Usuários
        </Button>
      </div>

      {/* Content */}
      {activeTab === "dashboard" && (
        <div>
          <RevenueCard
            totalRevenue={revenueData.totalRevenue}
            prizePool={revenueData.prizePool}
            platformRevenue={revenueData.platformRevenue}
            totalParticipations={revenueData.totalParticipations}
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-display font-bold text-lg mb-4">Ações Rápidas</h3>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setActiveTab("tournaments")}
                >
                  <Trophy size={18} />
                  Gerenciar Torneios
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setActiveTab("tickets")}
                >
                  <Ticket size={18} />
                  Validar Ingressos Pendentes
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setActiveTab("users")}
                >
                  <Users size={18} />
                  Gerenciar Usuários
                </Button>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-display font-bold text-lg mb-4">Regras de Distribuição</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <div>
                    <p className="font-medium text-primary">Pool de Premiação</p>
                    <p className="text-sm text-muted-foreground">
                      Destinado aos vencedores
                    </p>
                  </div>
                  <p className="font-display text-2xl font-bold text-primary">70%</p>
                </div>
                <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                  <div>
                    <p className="font-medium">Taxa da Plataforma</p>
                    <p className="text-sm text-muted-foreground">
                      Custos operacionais
                    </p>
                  </div>
                  <p className="font-display text-2xl font-bold">30%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "tickets" && <TicketsTab />}
      {activeTab === "tournaments" && <TournamentsTab />}
      {activeTab === "users" && <UsersTab />}
    </div>
  );
}
