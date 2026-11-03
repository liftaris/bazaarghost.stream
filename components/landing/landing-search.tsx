"use client";

import { useContext, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SearchHandoffContext } from "@/components/search-handoff";

function preloadWorkspace() {
  void import("@/components/search");
}

export function LandingSearch() {
  const router = useRouter();
  const handoffRef = useContext(SearchHandoffContext);
  const navigating = useRef(false);
  const composing = useRef(false);

  function search(value: string, submit = false) {
    const query = value.trim();
    if (navigating.current) {
      if (handoffRef) handoffRef.current = query;
      return;
    }
    if (!submit && query.length < 2) return;
    navigating.current = true;
    if (handoffRef) handoffRef.current = query;
    const params = new URLSearchParams(query ? { q: query } : {});
    router.push(`/search${params.size ? `?${params}` : ""}`, {
      scroll: false,
    });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get("q");
    search(typeof value === "string" ? value : "", true);
  }

  return (
    <form
      action="/search"
      method="get"
      onSubmit={submit}
      onPointerEnter={preloadWorkspace}
      onFocus={preloadWorkspace}
      role="search"
      aria-label="Find your ghost"
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="landing-query">Your in-game name</FieldLabel>
          <div className="flex gap-2">
            <Input
              id="landing-query"
              name="q"
              type="search"
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => {
                if (!composing.current) search(event.currentTarget.value);
              }}
              onCompositionStart={() => {
                composing.current = true;
              }}
              onCompositionEnd={(event) => {
                composing.current = false;
                search(event.currentTarget.value);
              }}
              placeholder="Search for your ghost…"
              className="h-14 min-w-0 flex-1"
            />
            <Button type="submit" size="lg" className="h-14">
              Search <ArrowRight data-icon="inline-end" aria-hidden />
            </Button>
          </div>
        </Field>
      </FieldGroup>
    </form>
  );
}
