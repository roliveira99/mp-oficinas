"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { AdminHome } from "@/components/dashboard/home/AdminHome";
import { OwnerHome } from "@/components/dashboard/home/OwnerHome";
import { ManagerHome } from "@/components/dashboard/home/ManagerHome";
import { MechanicHome } from "@/components/dashboard/home/MechanicHome";
import { getDashboardHomeHref } from "@/lib/permissions";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user && user.role === "jornalista") {
      router.replace(getDashboardHomeHref(user.role));
    }
  }, [user, router]);

  if (!user) return null;

  switch (user.role) {
    case "master":
      return <AdminHome />;
    case "dono":
      return <OwnerHome />;
    case "gerencia":
      return <ManagerHome />;
    case "mecanico":
      return <MechanicHome />;
    case "jornalista":
      return null;
    default:
      return null;
  }
}
