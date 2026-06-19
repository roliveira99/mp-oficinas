export const APP_NAME = "Pesquisa Aqui";
export const APP_SHORT = "PA";
export const APP_TAGLINE = "Encontre oficinas perto de você";
export const APP_META_DESCRIPTION =
  "Plataforma para clientes encontrarem oficinas mecânicas, estética automotiva e motos, com conteúdo do setor e dashboard gerencial para gestores.";

export const SUPPORT_EMAIL = "contato@pesquisaaqui.com.br";
export const CONTACT_PHONE = "(11) 4000-0000";

export const DEMO_EMAIL_DOMAIN = "pesquisaaqui.com";
export const LEGACY_DEMO_EMAIL_DOMAIN = "mpoficinas.com";

export function demoEmail(localPart: string): string {
  return `${localPart}@${DEMO_EMAIL_DOMAIN}`;
}

export const ADMIN_EMAIL = demoEmail("admin");

export const STORAGE_PREFIX = "pesquisa-aqui";
export const LEGACY_STORAGE_PREFIX = "mp-oficinas";

export function storageKey(suffix: string): string {
  return `${STORAGE_PREFIX}-${suffix}`;
}

export function migrateStorageKey(suffix: string, store: Storage = localStorage): void {
  if (typeof window === "undefined") return;
  const newKey = storageKey(suffix);
  const oldKey = `${LEGACY_STORAGE_PREFIX}-${suffix}`;
  if (oldKey === newKey) return;
  const value = store.getItem(oldKey);
  if (value != null && store.getItem(newKey) == null) {
    store.setItem(newKey, value);
    store.removeItem(oldKey);
  }
}

export function getAppUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_URL ??
    (process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://mp-oficinas.onrender.com");
  return fromEnv.replace(/\/$/, "");
}

export function whatsappWorkshopMessage(
  workshopName: string,
  variant: "info" | "profile" = "info"
): string {
  if (variant === "profile") {
    return `Olá, ${workshopName}! Vi o perfil de vocês no ${APP_NAME}.`;
  }
  return `Olá, ${workshopName}! Vi o perfil de vocês no ${APP_NAME} e gostaria de mais informações.`;
}

export function subscriptionMessage(monthlyValue: number, paymentPart: string): string {
  return `Olá! Sua assinatura ${APP_NAME} (R$ ${monthlyValue.toFixed(2)}) ${paymentPart}`;
}
