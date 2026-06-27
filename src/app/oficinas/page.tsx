import { Suspense } from "react";
import { SiteAnnouncements } from "@/components/site/SiteAnnouncements";
import { WorkshopDirectory } from "@/components/workshop/WorkshopGrid";
import { getSponsorshipTier, sortWorkshopsBySponsorship } from "@/lib/db/platform";
import { listWorkshops } from "@/lib/db/workshops";
import type { SponsorshipTier } from "@/types/platform-admin";

function DirectoryFallback() {
  return <p className="py-12 text-center text-muted">Carregando oficinas...</p>;
}

export default async function OficinasPage() {
  const workshops = await sortWorkshopsBySponsorship(await listWorkshops());
  const tiers: Record<string, SponsorshipTier> = {};
  for (const w of workshops) {
    tiers[w.id] = await getSponsorshipTier(w.id);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <SiteAnnouncements placement="oficinas_topo" className="mb-8" />
      <Suspense fallback={<DirectoryFallback />}>
        <WorkshopDirectory workshops={workshops} tiers={tiers} />
      </Suspense>
    </div>
  );
}
