"use client";

import { useState } from "react";
import { APP_NAME, whatsappWorkshopMessage } from "@/lib/brand";
import { DIRECTORY_PATH, getBusinessSegmentLabel } from "@/lib/platform-routes";
import Image from "next/image";
import Link from "next/link";
import { AgendaRequestForm } from "@/components/workshop/AgendaRequestForm";
import {
  WorkshopCatalogSection,
  WorkshopMechanicRanking,
  WorkshopPaymentMethods,
} from "@/components/workshop/WorkshopCatalogSection";
import { WorkshopContactActions } from "@/components/workshop/WorkshopContactActions";
import { WorkshopGallery } from "@/components/workshop/WorkshopGallery";
import { WorkshopProfileShowcase } from "@/components/workshop/WorkshopProfileShowcase";
import { WorkshopProfileVideos } from "@/components/workshop/WorkshopProfileVideos";
import { WorkshopReviewsSection } from "@/components/workshop/WorkshopReviewsSection";
import { RatingSummary } from "@/components/workshop/StarRating";
import { WorkshopOpenBadge } from "@/components/workshop/WorkshopOpenBadge";
import { WorkshopTypeBadge } from "@/components/workshop/WorkshopTypeBadge";
import { Icon } from "@/components/ui/Icon";
import { buildMapsUrl } from "@/lib/workshop-hours";
import { sponsorshipTierLabels, sponsorshipTierBadgeClass } from "@/types/platform-admin";
import type { SponsorshipTier } from "@/types/platform-admin";
import { workshopTypeLabels } from "@/lib/labels";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import type { Workshop } from "@/types/workshop";

const navItems = [
  { id: "inicio", label: "Início" },
  { id: "galeria", label: "Galeria" },
  { id: "catalogo", label: "Catálogo" },
  { id: "avaliacoes", label: "Avaliações" },
  { id: "contato", label: "Contato" },
  { id: "agenda", label: "Agenda" },
];

interface WorkshopProfileSiteProps {
  workshop: Workshop;
  sponsorshipTier?: SponsorshipTier;
}

export function WorkshopProfileSite({ workshop, sponsorshipTier = "none" }: WorkshopProfileSiteProps) {
  const [ratingAverage, setRatingAverage] = useState(workshop.rating);
  const [ratingCount, setRatingCount] = useState(workshop.reviewCount);
  const sponsorship = sponsorshipTier;
  const mapsUrl = buildMapsUrl(workshop.address, workshop.city, workshop.state);
  const whatsappUrl = buildWhatsAppUrl(
    workshop.whatsapp,
    whatsappWorkshopMessage(workshop.name, "profile")
  );
  const hasShowcase = (workshop.profileShowcase?.length ?? 0) > 0;
  const profileNavItems = hasShowcase
    ? [
        ...navItems.slice(0, 2),
        { id: "vitrine", label: "Vitrine" },
        ...navItems.slice(2),
      ]
    : navItems;

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <div className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2 text-xs text-muted sm:px-6">
          <Link href={DIRECTORY_PATH} className="inline-flex items-center gap-1 hover:text-accent">
            <Icon name="arrow-right" className="h-3.5 w-3.5 rotate-180" />
            {APP_NAME}
          </Link>
          <span className="hidden sm:inline">
            {getBusinessSegmentLabel(workshop)}
          </span>
          <WorkshopOpenBadge openingHours={workshop.openingHours} />
        </div>
      </div>

      <header id="inicio" className="scroll-mt-16 relative">
        <div className="relative h-56 sm:h-72 lg:h-80">
          {workshop.coverImage && (
            <Image
              src={workshop.coverImage}
              alt={workshop.name}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-black/30" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="-mt-16 sm:-mt-20">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <WorkshopTypeBadge type={workshop.type} />
                  {sponsorship !== "none" && (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${sponsorshipTierBadgeClass[sponsorship]}`}
                    >
                      Patrocinado · {sponsorshipTierLabels[sponsorship]}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                  {workshop.name}
                </h1>
                {workshop.tagline && (
                  <p className="mt-2 text-base font-medium text-accent">{workshop.tagline}</p>
                )}
                <p className="mt-3 leading-relaxed text-muted-foreground">{workshop.description}</p>
                <div className="mt-4">
                  <RatingSummary average={ratingAverage} count={ratingCount} size="lg" />
                </div>
              </div>
              <div className="hidden shrink-0 flex-col gap-2 lg:flex">
                <WorkshopContactActions workshop={workshop} />
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-surface-hover"
                >
                  Ver no mapa
                </a>
              </div>
            </div>

            <nav className="mt-8 flex gap-2 overflow-x-auto pb-2">
              {profileNavItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="shrink-0 rounded-full border border-border bg-surface px-4 py-1.5 text-sm font-medium text-muted-foreground transition hover:border-accent hover:text-accent"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
        {workshop.gallery && workshop.gallery.length > 0 && (
          <WorkshopGallery items={workshop.gallery} workshopName={workshop.name} />
        )}

        {workshop.profileVideos && workshop.profileVideos.length > 0 && (
          <WorkshopProfileVideos videos={workshop.profileVideos} workshopName={workshop.name} />
        )}

        {hasShowcase && workshop.profileShowcase && (
          <WorkshopProfileShowcase items={workshop.profileShowcase} workshopName={workshop.name} />
        )}

        <div className="mt-12 grid gap-12 lg:grid-cols-3">
          <div className="space-y-12 lg:col-span-2">
            <section id="catalogo" className="scroll-mt-24">
              <WorkshopCatalogSection workshop={workshop} />
            </section>

            <WorkshopReviewsSection
              workshop={workshop}
              onStatsChange={(avg, count) => {
                setRatingAverage(avg);
                setRatingCount(count);
              }}
            />

            {workshop.mechanicRanking && workshop.mechanicRanking.length > 0 && (
              <WorkshopMechanicRanking
                ranking={workshop.mechanicRanking}
                workshopType={workshop.type}
              />
            )}

            <section id="agenda" className="scroll-mt-24">
              <AgendaRequestForm workshop={workshop} />
            </section>
          </div>

          <aside id="contato" className="scroll-mt-24 space-y-6 lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <div className="rounded-xl border border-border bg-surface p-6 shadow-sm lg:hidden">
                <WorkshopContactActions workshop={workshop} />
              </div>

              <WorkshopPaymentMethods methods={workshop.paymentMethods} />

              <div className="rounded-xl border border-border bg-surface p-6">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
                  Localização
                </h2>
                <p className="mt-3 text-sm text-foreground">
                  {workshop.address}
                  <br />
                  {workshop.city}/{workshop.state}
                </p>
                <p className="mt-2 text-sm text-muted">{workshop.openingHours}</p>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
                >
                  Abrir no Google Maps
                  <Icon name="arrow-right" className="h-4 w-4" />
                </a>
              </div>

              <div className="rounded-xl border border-border bg-surface p-6">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Contato</h2>
                <dl className="mt-4 space-y-2 text-sm">
                  <div>
                    <dt className="text-muted">Telefone</dt>
                    <dd>{workshop.phone}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">E-mail</dt>
                    <dd>{workshop.email}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
                  Especialidades
                </h2>
                <div className="flex flex-wrap gap-2">
                  {workshop.specialties.map((s) => (
                    <span
                      key={s}
                      className="rounded-md border border-border bg-surface-hover px-3 py-1 text-xs font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 flex gap-2 border-t border-border bg-surface/95 p-3 backdrop-blur lg:hidden">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 rounded-lg bg-[#25D366] py-3 text-center text-sm font-semibold text-white"
        >
          WhatsApp
        </a>
        <a
          href="#agenda"
          className="flex-1 rounded-lg bg-accent py-3 text-center text-sm font-semibold text-accent-foreground"
        >
          Agendar
        </a>
      </div>

      <footer className="border-t border-border bg-surface-hover/40 py-6 text-center text-xs text-muted">
        Perfil hospedado em{" "}
        <Link href="/" className="font-medium text-accent hover:underline">
          {APP_NAME}
        </Link>
      </footer>
    </div>
  );
}
