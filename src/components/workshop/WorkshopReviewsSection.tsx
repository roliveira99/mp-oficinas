"use client";

import { useCallback, useEffect, useState } from "react";
import { formatCpf, formatCpfInput, isValidCpfFormat, maskCpf } from "@/lib/cpf";
import {
  fetchWorkshopReviews,
  formatReviewDate,
  submitWorkshopReview,
  verifyWorkshopClient,
} from "@/lib/api/reviews-client";
import type { Workshop } from "@/types/workshop";
import type { StarRating, WorkshopReview } from "@/types/review";
import { getOperationalConfig } from "@/lib/verticals/operational";
import { RatingSummary, StarDisplay, StarInput } from "./StarRating";

interface WorkshopReviewsSectionProps {
  workshop: Workshop;
  onStatsChange?: (average: number, count: number) => void;
}

type FormStep = "cpf" | "register" | "form" | "success";

export function WorkshopReviewsSection({ workshop, onStatsChange }: WorkshopReviewsSectionProps) {
  const ops = getOperationalConfig(workshop.vertical);
  const requireReference = ops.reviews.requireAssetReference;
  const referenceLabel = ops.reviews.assetReferenceLabel;
  const [reviews, setReviews] = useState<WorkshopReview[]>([]);
  const [stats, setStats] = useState({ average: workshop.rating, count: workshop.reviewCount });
  const [step, setStep] = useState<FormStep>("cpf");
  const [cpf, setCpf] = useState("");
  const [plate, setPlate] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerBirthDate, setRegisterBirthDate] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [stars, setStars] = useState<StarRating | 0>(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [clientName, setClientName] = useState("");

  const refresh = useCallback(async () => {
    try {
      const data = await fetchWorkshopReviews(workshop.slug);
      setReviews(data.reviews);
      setStats(data.stats);
      onStatsChange?.(data.stats.average, data.stats.count);
    } catch {
      /* mantém dados iniciais */
    }
  }, [workshop.slug, onStatsChange]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleCpfSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!isValidCpfFormat(cpf)) {
      setError("Informe um CPF válido.");
      return;
    }
    if (requireReference && !plate.trim()) {
      setError(`Informe a ${referenceLabel.toLowerCase()}.`);
      return;
    }

    const result = await verifyWorkshopClient(workshop.slug, {
      cpf,
      ...(requireReference ? { plate } : {}),
    });

    if ("error" in result) {
      setError(result.error);
      return;
    }

    if ("needsRegistration" in result) {
      setStep("register");
      return;
    }

    applyVerifiedClient(result.client, result.existingReview);
  }

  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!registerName.trim()) {
      setError("Informe seu nome para concluir o cadastro.");
      return;
    }
    if (!registerBirthDate) {
      setError("Informe sua data de nascimento.");
      return;
    }

    const result = await verifyWorkshopClient(workshop.slug, {
      cpf,
      ...(requireReference ? { plate } : {}),
      name: registerName.trim(),
      phone: registerPhone.trim() || undefined,
      birthDate: registerBirthDate,
    });

    if ("error" in result) {
      setError(result.error);
      return;
    }
    if ("needsRegistration" in result) {
      setError("Não foi possível concluir o cadastro. Tente novamente.");
      return;
    }

    applyVerifiedClient(result.client, result.existingReview);
  }

  function applyVerifiedClient(
    client: { name: string },
    existingReview: WorkshopReview | null
  ) {
    setClientName(client.name);
    setIsEditing(!!existingReview);

    if (existingReview) {
      setStars(existingReview.stars);
      setComment(existingReview.comment);
    } else {
      setStars(0);
      setComment("");
    }

    setStep("form");
  }

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (stars < 1 || stars > 5) {
      setError("Selecione uma nota de 1 a 5 estrelas.");
      return;
    }
    if (comment.trim().length < 10) {
      setError("Escreva um comentário com pelo menos 10 caracteres.");
      return;
    }

    const result = await submitWorkshopReview(workshop.slug, {
      cpf,
      stars: stars as StarRating,
      comment,
    });

    if ("error" in result) {
      setError(result.error);
      return;
    }

    setReviews((prev) => {
      const filtered = prev.filter((r) => r.cpf !== result.review.cpf);
      return [result.review, ...filtered];
    });
    setStats(result.stats);
    onStatsChange?.(result.stats.average, result.stats.count);
    setStep("success");
  }

  function resetForm() {
    setStep("cpf");
    setCpf("");
    setPlate("");
    setRegisterName("");
    setRegisterBirthDate("");
    setRegisterPhone("");
    setStars(0);
    setComment("");
    setError("");
    setIsEditing(false);
    setClientName("");
  }

  return (
    <section id="avaliacoes" className="scroll-mt-24">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Avaliações de clientes</h2>
          <p className="mt-1 text-sm text-muted">
            Opiniões verificadas — apenas quem realizou serviço neste estabelecimento.
          </p>
        </div>
        <RatingSummary average={stats.average} count={stats.count} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          {reviews.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted">
              Ainda não há avaliações públicas. Seja o primeiro a avaliar após seu serviço!
            </p>
          ) : (
            <ul className="space-y-4">
              {reviews.map((review) => (
                <li key={review.id} className="rounded-xl border border-border bg-surface/80 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{review.clientName}</p>
                      <p className="text-xs text-muted">
                        CPF {maskCpf(review.cpf)} · Serviço: {review.serviceLabel}
                      </p>
                    </div>
                    <div className="text-right">
                      <StarDisplay value={review.stars} size="sm" />
                      <p className="mt-1 text-xs text-muted">{formatReviewDate(review.updatedAt)}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{review.comment}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="lg:col-span-2">
          <div className="sticky top-24 rounded-xl border border-border bg-surface-hover/50 p-5">
            <h3 className="font-semibold text-foreground">
              {step === "success"
                ? "Avaliação registrada"
                : isEditing
                  ? "Editar sua avaliação"
                  : "Deixe sua avaliação"}
            </h3>
            <p className="mt-1 text-xs text-muted">
              {requireReference
                ? `Informe CPF e ${referenceLabel.toLowerCase()}. Se ainda não estiver cadastrado, faremos seu registro aqui.`
                : "Informe seu CPF. Só quem teve serviço concluído neste estabelecimento pode avaliar."}
            </p>

            {step === "cpf" && (
              <form onSubmit={handleCpfSubmit} className="mt-4 space-y-3">
                <label className="block text-sm">
                  <span className="font-medium">CPF</span>
                  <input
                    required
                    value={cpf}
                    onChange={(e) => setCpf(formatCpfInput(e.target.value))}
                    className="input-field mt-1.5"
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                </label>
                {requireReference && (
                  <label className="block text-sm">
                    <span className="font-medium">{referenceLabel}</span>
                    <input
                      required
                      value={plate}
                      onChange={(e) => setPlate(e.target.value.toUpperCase())}
                      className="input-field mt-1.5"
                      placeholder={ops.assets.fields[0]?.placeholder ?? "Referência"}
                      maxLength={32}
                    />
                  </label>
                )}
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button
                  type="submit"
                  className="w-full rounded-lg bg-accent py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90"
                >
                  Verificar elegibilidade
                </button>
                <DemoCpfHint workshopId={workshop.id} />
              </form>
            )}

            {step === "register" && (
              <form onSubmit={handleRegisterSubmit} className="mt-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  {requireReference
                    ? `Encontramos serviço concluído para esta ${referenceLabel.toLowerCase()}. Complete seu cadastro para avaliar.`
                    : "Encontramos serviço concluído para este CPF. Complete seu cadastro para avaliar."}
                </p>
                <label className="block text-sm">
                  <span className="font-medium">Seu nome</span>
                  <input
                    required
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    className="input-field mt-1.5"
                    placeholder="Nome completo"
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium">Data de nascimento</span>
                  <input
                    required
                    type="date"
                    value={registerBirthDate}
                    onChange={(e) => setRegisterBirthDate(e.target.value)}
                    className="input-field mt-1.5"
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium">Telefone (opcional)</span>
                  <input
                    value={registerPhone}
                    onChange={(e) => setRegisterPhone(e.target.value)}
                    className="input-field mt-1.5"
                    placeholder="WhatsApp"
                  />
                </label>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("cpf");
                      setError("");
                    }}
                    className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium hover:bg-surface"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-accent py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90"
                  >
                    Continuar
                  </button>
                </div>
              </form>
            )}

            {step === "form" && (
              <form onSubmit={handleReviewSubmit} className="mt-4 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Olá, <strong className="text-foreground">{clientName}</strong>.{" "}
                  {isEditing ? "Atualize sua nota e comentário abaixo." : "Como foi sua experiência?"}
                </p>
                <StarInput value={stars} onChange={setStars} />
                <label className="block text-sm">
                  <span className="font-medium">Comentário</span>
                  <textarea
                    required
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="input-field mt-1.5 min-h-[100px] resize-y"
                    placeholder="Conte como foi o atendimento, prazo e qualidade do serviço..."
                    maxLength={500}
                  />
                </label>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium hover:bg-surface"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-accent py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90"
                  >
                    {isEditing ? "Salvar alterações" : "Publicar avaliação"}
                  </button>
                </div>
              </form>
            )}

            {step === "success" && (
              <div className="mt-4 space-y-4">
                <p className="text-sm text-emerald-700 dark:text-emerald-400">
                  {isEditing
                    ? "Sua avaliação foi atualizada e já aparece no perfil."
                    : "Obrigado! Sua avaliação já está visível para outros clientes."}
                </p>
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full rounded-lg border border-border py-2.5 text-sm font-medium hover:bg-surface"
                >
                  Fechar
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

function DemoCpfHint({ workshopId }: { workshopId: string }) {
  const hints: Record<string, string> = {
    "1": "Demo: 111.444.777-35 (já pode avaliar) · conclua OS-003 para 529.982.247-25",
    "7": "Demo: 529.982.247-25 (Fernanda Costa)",
  };
  const hint = hints[workshopId];
  if (!hint) return null;
  return <p className="text-center text-xs text-muted">{hint}</p>;
}
