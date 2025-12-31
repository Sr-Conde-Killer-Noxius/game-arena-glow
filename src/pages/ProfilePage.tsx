import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Save,
  Shield,
  Trophy,
  Target,
  Crosshair,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  cpf: string | null;
  cep: string | null;
  whatsapp: string | null;
  rank: string;
  points: number;
  kda_global: number;
  hs_rate: number;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    cpf: "",
    cep: "",
    whatsapp: "",
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return;
      }

      setProfile(data);
      setFormData({
        full_name: data.full_name || "",
        cpf: data.cpf || "",
        cep: data.cep || "",
        whatsapp: data.whatsapp || "",
      });
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
      .slice(0, 14);
  };

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers.replace(/(\d{5})(\d)/, "$1-$2").slice(0, 9);
  };

  const formatWhatsApp = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .slice(0, 15);
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name || null,
          cpf: formData.cpf || null,
          cep: formData.cep || null,
          whatsapp: formData.whatsapp || null,
        })
        .eq("id", user.id);

      if (error) {
        console.error("Error updating profile:", error);
        toast.error("Erro ao salvar perfil");
        return;
      }

      toast.success("Perfil atualizado com sucesso!");
      fetchProfile();
    } catch (err) {
      console.error("Error:", err);
      toast.error("Erro ao salvar perfil");
    } finally {
      setIsSaving(false);
    }
  };

  const getRankColor = (rank: string) => {
    const colors: Record<string, string> = {
      D: "text-zinc-400",
      C: "text-green-500",
      B: "text-blue-500",
      A: "text-purple-500",
      S: "text-amber-500",
      PRO: "text-primary",
    };
    return colors[rank] || "text-muted-foreground";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
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

        <h1 className="font-display text-3xl font-bold mb-2">Meu Perfil</h1>
        <p className="text-muted-foreground">
          Gerencie suas informações e veja suas estatísticas
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Profile Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <User className="text-primary" size={20} />
              </div>
              <h2 className="font-display font-bold text-xl">
                Informações Pessoais
              </h2>
            </div>

            <div className="grid gap-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    value={user?.email || ""}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    O e-mail não pode ser alterado
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full_name">Nome Completo</Label>
                  <Input
                    id="full_name"
                    placeholder="Seu nome completo"
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    placeholder="000.000.000-00"
                    value={formData.cpf}
                    onChange={(e) =>
                      setFormData({ ...formData, cpf: formatCPF(e.target.value) })
                    }
                    maxLength={14}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    placeholder="00000-000"
                    value={formData.cep}
                    onChange={(e) =>
                      setFormData({ ...formData, cep: formatCEP(e.target.value) })
                    }
                    maxLength={9}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    placeholder="(00) 00000-0000"
                    value={formData.whatsapp}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        whatsapp: formatWhatsApp(e.target.value),
                      })
                    }
                    maxLength={15}
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      <span>Salvando...</span>
                    </div>
                  ) : (
                    <>
                      <Save size={18} />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          {/* Rank Card */}
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="text-primary" size={40} />
            </div>
            <p className="text-sm text-muted-foreground mb-1">Seu Rank</p>
            <p
              className={`font-display text-5xl font-bold ${getRankColor(
                profile?.rank || "D"
              )}`}
            >
              {profile?.rank || "D"}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {profile?.points || 0} pontos
            </p>
          </div>

          {/* Stats */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-display font-bold text-lg mb-4">
              Estatísticas
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy size={18} className="text-amber-500" />
                  <span className="text-muted-foreground">Pontos</span>
                </div>
                <span className="font-bold">{profile?.points || 0}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target size={18} className="text-blue-500" />
                  <span className="text-muted-foreground">KDA Global</span>
                </div>
                <span className="font-bold">
                  {profile?.kda_global?.toFixed(2) || "0.00"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crosshair size={18} className="text-red-500" />
                  <span className="text-muted-foreground">HS Rate</span>
                </div>
                <span className="font-bold">
                  {profile?.hs_rate?.toFixed(1) || "0.0"}%
                </span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center mt-4 pt-4 border-t border-border">
              Estatísticas serão atualizadas após suas partidas
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
