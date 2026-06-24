"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { SiteSearchBar } from "@/components/search/SiteSearchBar";
import { Logo } from "@/components/ui/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

import { getPlatformTerminology, isBusinessProfilePath } from "@/lib/platform-routes";
import { getDashboardHomeHref } from "@/lib/permissions";

const terms = getPlatformTerminology();

const navLinks = [
  { href: "/", label: "Início" },
  { href: "/curiosidades", label: "Jornal" },
  { href: terms.directoryPath, label: terms.directoryNav },
  { href: "/classificados", label: "Classificados" },
];

function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/curiosidades") {
    return pathname === "/curiosidades" || pathname.startsWith("/curiosidades/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isDashboard = pathname.startsWith("/dashboard");
  const isWorkshopProfile = isBusinessProfilePath(pathname);

  useEffect(() => setMounted(true), []);
  useEffect(() => setMenuOpen(false), [pathname]);

  if (isDashboard || isWorkshopProfile) return null;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/95 shadow-sm backdrop-blur-md">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                isNavActive(pathname, link.href)
                  ? "bg-accent-soft text-accent"
                  : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <SiteSearchBar variant="header" />
          <ThemeToggle variant="compact" />
          {mounted && user ? (
            <ButtonLink href={getDashboardHomeHref(user.role)} variant="primary">
              Acessar painel
            </ButtonLink>
          ) : (
            <ButtonLink href="/login" variant="primary">
              Entrar
            </ButtonLink>
          )}
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <SiteSearchBar variant="header" />
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-surface-hover"
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          >
            <Icon name={menuOpen ? "x" : "menu"} className="h-5 w-5" />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-border bg-surface px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium ${
                  isNavActive(pathname, link.href)
                    ? "bg-accent-soft text-accent"
                    : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-sm text-muted-foreground">Tema</span>
                <ThemeToggle variant="compact" />
              </div>
              {mounted && user ? (
                <ButtonLink href={getDashboardHomeHref(user.role)} variant="primary" className="w-full">
                  Acessar painel
                </ButtonLink>
              ) : (
                <ButtonLink href="/login" variant="primary" className="w-full">
                  Entrar
                </ButtonLink>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
