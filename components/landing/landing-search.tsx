"use client";

import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

/** Submit an explicit ghost search without replacing the persistent app shell. */
export function LandingSearch() {
  const router = useRouter();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get("q");
    const query = typeof value === "string" ? value.trim() : "";
    const params = new URLSearchParams(query ? { q: query } : {});
    router.push(`/search${params.size ? `?${params}` : ""}`);
  }

  return (
    <form
      action="/search"
      method="get"
      onSubmit={submit}
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
