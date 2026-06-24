"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { searchUrl } from "@/lib/platform-routes";

interface SiteSearchBarProps {
  variant?: "masthead" | "header";
  className?: string;
  initialQuery?: string;
}

export function SiteSearchBar({
  variant = "masthead",
  className = "",
  initialQuery = "",
}: SiteSearchBarProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(initialQuery);
  const [expanded, setExpanded] = useState(variant === "masthead");

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (expanded && variant === "header") {
      inputRef.current?.focus();
    }
  }, [expanded, variant]);

  function closeHeaderSearch() {
    setExpanded(false);
    setQuery("");
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(searchUrl(q));
    if (variant === "header") setExpanded(false);
  }

  if (variant === "header" && !expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="site-search-header-trigger"
        aria-label="Buscar notícias e negócios"
      >
        <Icon name="search" className="h-4 w-4 shrink-0 text-accent" />
        <span className="hidden max-w-[8rem] truncate sm:inline">Pesquisar...</span>
      </button>
    );
  }

  const isMasthead = variant === "masthead";
  const formClass = isMasthead
    ? `site-search site-search-masthead ${className}`.trim()
    : `site-search site-search-header ${className}`.trim();

  const form = (
    <form onSubmit={submit} className={formClass} role="search">
      <span className="site-search-icon" aria-hidden>
        <Icon name="search" className="h-4 w-4" />
      </span>
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={isMasthead ? "Pesquise notícias, negócios ou cidade..." : "Notícias e negócios..."}
        className="site-search-input"
        aria-label="Buscar notícias e negócios"
      />
      {variant === "header" && (
        <button
          type="button"
          onClick={closeHeaderSearch}
          className="rounded-full p-1.5 text-muted transition hover:bg-surface-hover hover:text-foreground"
          aria-label="Fechar busca"
        >
          <Icon name="x" className="h-4 w-4" />
        </button>
      )}
      <button type="submit" className="site-search-submit">
        Buscar
      </button>
    </form>
  );

  if (variant === "header") {
    return (
      <>
        <div className="hidden md:block">{form}</div>
        <div className="site-search-header-panel md:hidden">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">{form}</div>
        </div>
      </>
    );
  }

  return form;
}
