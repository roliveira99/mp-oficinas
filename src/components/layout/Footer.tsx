"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAME, CONTACT_PHONE, SUPPORT_EMAIL } from "@/lib/brand";
import { getPlatformTerminology, isBusinessProfilePath } from "@/lib/platform-routes";
import { Logo } from "@/components/ui/Logo";

const terms = getPlatformTerminology();

export function Footer() {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith("/dashboard");
  const isWorkshopProfile = isBusinessProfilePath(pathname);

  if (isDashboard || isWorkshopProfile) return null;

  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              Plataforma para conectar clientes a empresas e comércios locais — oficinas, lojas,
              salões, restaurantes e qualquer empreendimento.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">Plataforma</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-muted">
              <li>
                <Link href={terms.directoryPath} className="hover:text-accent">
                  Buscar negócios
                </Link>
              </li>
              <li>
                <Link href="/curiosidades" className="hover:text-accent">
                  Jornal e manchetes
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-accent">
                  Painel gerencial
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">Contato</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-muted">
              <li>{SUPPORT_EMAIL}</li>
              <li>{CONTACT_PHONE}</li>
              <li>Seg–Sex, 8h às 18h</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-border pt-6 text-xs text-muted sm:flex-row">
          <span>© {new Date().getFullYear()} {APP_NAME}. Todos os direitos reservados.</span>
          <span>Desenvolvido para empreendedores brasileiros</span>
        </div>
      </div>
    </footer>
  );
}
