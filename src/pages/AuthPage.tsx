import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Eye, EyeOff, Gamepad2 } from "lucide-react";
import { toast } from "sonner";

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(searchParams.get("mode") !== "signup");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate auth process
    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (!isLogin && formData.password !== formData.confirmPassword) {
      toast.error("As senhas não coincidem!");
      setIsLoading(false);
      return;
    }

    toast.success(isLogin ? "Login realizado com sucesso!" : "Conta criada com sucesso!");
    setIsLoading(false);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 lg:px-20 py-12">
        <div className="max-w-md w-full mx-auto">
          {/* Back Link */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft size={18} />
            <span className="text-sm">Voltar ao início</span>
          </Link>

          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center neon-glow">
              <span className="font-display font-bold text-primary-foreground text-xl">
                J
              </span>
            </div>
            <span className="font-display font-bold text-2xl text-foreground">
              JPG
            </span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold mb-2">
              {isLogin ? "Bem-vindo de volta" : "Criar sua conta"}
            </h1>
            <p className="text-muted-foreground">
              {isLogin
                ? "Entre na sua conta para continuar sua jornada."
                : "Junte-se a milhares de jogadores na JPG."}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="username">Nome de usuário</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Digite seu username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>
            )}

            {isLogin && (
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                >
                  Esqueceu a senha?
                </button>
              </div>
            )}

            <Button
              type="submit"
              variant="default"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  <span>Aguarde...</span>
                </div>
              ) : isLogin ? (
                "Entrar"
              ) : (
                "Criar conta"
              )}
            </Button>
          </form>

          {/* Toggle */}
          <div className="mt-8 text-center">
            <p className="text-muted-foreground">
              {isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}{" "}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary font-semibold hover:underline"
              >
                {isLogin ? "Cadastre-se" : "Entre aqui"}
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:flex flex-1 relative gradient-hero items-center justify-center p-12">
        {/* Pattern */}
        <div className="absolute inset-0 bg-grid-pattern bg-[size:40px_40px] opacity-10" />

        {/* Glow */}
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-primary/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-primary/20 rounded-full blur-3xl" />

        {/* Content */}
        <div className="relative text-center">
          <div className="w-32 h-32 bg-primary/20 rounded-3xl flex items-center justify-center mx-auto mb-8 neon-glow animate-float">
            <Gamepad2 className="text-primary" size={64} />
          </div>

          <h2 className="font-display text-4xl font-bold mb-4">
            JOGUE PARA
            <br />
            <span className="text-primary text-neon-glow">GANHAR</span>
          </h2>

          <p className="text-muted-foreground max-w-xs mx-auto">
            A plataforma definitiva para jogadores competitivos do Brasil.
          </p>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-6">
            {[
              { value: "50K+", label: "Jogadores" },
              { value: "1K+", label: "Torneios" },
              { value: "R$500K", label: "Em prêmios" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-display text-2xl font-bold text-primary">
                  {stat.value}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
