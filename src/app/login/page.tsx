"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { DashboardThemeToggle } from "@/components/dashboard/DashboardThemeToggle";
import { APP_NAME } from "@/lib/brand";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { apiLogin } from "@/lib/auth-client";
import { getDashboardHomeHref } from "@/lib/permissions";

export default function LoginPage() {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) router.replace(getDashboardHomeHref(user.role));
  }, [user, router]);

  if (user) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const result = await apiLogin(email, password);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setUser(result.user);
    router.push(getDashboardHomeHref(result.user.role));
  }

  return (
    <div className="dashboard-app min-h-[calc(100vh-4rem)] bg-background">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl lg:grid-cols-2">
        <div className="hidden flex-col justify-between border-r border-[var(--dash-sidebar-border)] bg-[var(--dash-sidebar)] p-10 lg:flex xl:p-14">
          <Logo variant="system" />
          <div>
            <h1 className="text-3xl font-semibold leading-tight text-[var(--dash-sidebar-active-text)]">
              Gestão profissional para qualquer empreendimento
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-[var(--dash-sidebar-text)]">
              Acesse o painel conforme seu perfil. Cada usuário visualiza apenas
              o que tem permissão — financeiro, operação ou execução técnica.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-[var(--dash-sidebar-text)]">
              <li className="flex items-center gap-2">
                <Icon name="dashboard" className="h-4 w-4 opacity-70" />
                Dashboards por perfil de acesso
              </li>
              <li className="flex items-center gap-2">
                <Icon name="chart" className="h-4 w-4 opacity-70" />
                Relatórios e indicadores em tempo real
              </li>
              <li className="flex items-center gap-2">
                <Icon name="users" className="h-4 w-4 opacity-70" />
                Controle de equipe e permissões
              </li>
            </ul>
          </div>
          <p className="text-xs text-[var(--dash-sidebar-text)]">
            © {APP_NAME} — Plataforma de gestão automotiva
          </p>
        </div>

        <div className="flex flex-col justify-center px-4 py-12 sm:px-8">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 flex items-start justify-between gap-4 lg:hidden">
              <Logo variant="system" />
              <DashboardThemeToggle compact />
            </div>

            <div className="mb-8 hidden items-center justify-end lg:flex">
              <DashboardThemeToggle />
            </div>

            <h2 className="text-2xl font-semibold tracking-tight">Entrar</h2>
            <p className="mt-1 text-sm text-muted">
              Use seu e-mail e senha. O painel aberto depende do seu perfil — gestor,
              equipe, jornalista ou administrador.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="seu@email.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
                  Senha
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="••••••••"
                />
              </div>

              {error && <p className="dash-alert dash-alert-error">{error}</p>}

              <Button type="submit" variant="primary" className="w-full">
                Entrar
              </Button>
            </form>

            <p className="mt-8 text-center text-sm text-muted">
              <Link href="/" className="dash-link font-medium">
                ← Voltar ao site
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
