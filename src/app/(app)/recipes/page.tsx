"use client";

import { useState, useMemo, useRef } from "react";
import {
  BookOpen,
  Upload,
  Sparkles,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useRecipes } from "@/lib/hooks/use-recipes";
import { useInventory } from "@/lib/hooks/use-inventory";
import { parseUmamiExport } from "@/lib/umami-parser";
import type { Recipe } from "@/lib/schemas/recipe";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type AISuggestion = {
  name: string;
  description: string;
  ingredients: string[];
  instructions: string;
  matchedItems: string[];
};

function computeMatchPercent(
  recipe: Recipe,
  inventoryNames: Set<string>,
): number {
  if (recipe.ingredients.length === 0) return 0;
  const matched = recipe.ingredients.filter((ing) => {
    const name = ing.name.toLowerCase();
    for (const invName of inventoryNames) {
      if (invName.includes(name) || name.includes(invName)) return true;
    }
    return false;
  });
  return Math.round((matched.length / recipe.ingredients.length) * 100);
}

export default function RecipesPage() {
  const { recipes, loading, importRecipes, removeRecipe } = useRecipes();
  const { items: inventoryItems } = useInventory();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);
  const [deletingRecipe, setDeletingRecipe] = useState<Recipe | null>(null);

  const inventoryNames = useMemo(
    () => new Set(inventoryItems.map((i) => i.name.toLowerCase().trim())),
    [inventoryItems],
  );

  const recipesWithMatch = useMemo(
    () =>
      recipes
        .map((r) => ({ ...r, matchPercent: computeMatchPercent(r, inventoryNames) }))
        .sort((a, b) => b.matchPercent - a.matchPercent),
    [recipes, inventoryNames],
  );

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const parsed = parseUmamiExport(json);

      if (parsed.length === 0) {
        toast.error("No recipes found in this file");
        return;
      }

      await importRecipes(parsed, "umami");
      toast.success(`Imported ${parsed.length} recipe${parsed.length !== 1 ? "s" : ""}`);
    } catch (err) {
      console.error("Import error:", err);
      toast.error("Failed to parse recipe file. Make sure it's a JSON export.");
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSuggest() {
    if (inventoryItems.length === 0) {
      toast.error("Add items to your fridge first");
      return;
    }

    setSuggestLoading(true);
    try {
      const response = await fetch("/api/recipes/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: inventoryItems.map((i) => ({
            name: i.name,
            category: i.category,
            quantity: i.quantity,
          })),
        }),
      });

      if (!response.ok) throw new Error("Failed to get suggestions");

      const { recipes: aiRecipes } = await response.json();
      setSuggestions(aiRecipes ?? []);

      if (!aiRecipes?.length) {
        toast.error("No suggestions generated. Try again.");
      }
    } catch {
      toast.error("Failed to generate suggestions");
    } finally {
      setSuggestLoading(false);
    }
  }

  async function confirmDelete() {
    if (!deletingRecipe) return;
    try {
      await removeRecipe(deletingRecipe.id);
      setDeletingRecipe(null);
      toast.success("Recipe removed");
    } catch {
      toast.error("Failed to remove recipe");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold italic tracking-tight">
        Recipes
      </h1>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1 rounded-xl text-xs"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mr-1.5 h-3.5 w-3.5" />
          Import Umami
        </Button>
        <Button
          className="flex-1 rounded-xl text-xs"
          onClick={handleSuggest}
          disabled={suggestLoading}
        >
          {suggestLoading ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
          )}
          {suggestLoading ? "Thinking..." : "What can I make?"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImport}
        />
      </div>

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Suggested meals</h2>
          </div>
          <div className="space-y-2">
            {suggestions.map((s, i) => (
              <div
                key={i}
                className="rounded-xl border border-primary/20 bg-primary/5 p-3"
              >
                <button
                  className="flex w-full items-center justify-between text-left"
                  onClick={() =>
                    setExpandedRecipe(
                      expandedRecipe === `ai-${i}` ? null : `ai-${i}`,
                    )
                  }
                >
                  <div>
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {s.description}
                    </p>
                  </div>
                  {expandedRecipe === `ai-${i}` ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </button>
                {expandedRecipe === `ai-${i}` && (
                  <div className="mt-3 space-y-2 border-t border-primary/10 pt-3 text-xs">
                    <div>
                      <p className="font-medium text-muted-foreground">
                        Ingredients
                      </p>
                      <ul className="mt-1 list-disc pl-4 space-y-0.5">
                        {s.ingredients.map((ing, j) => (
                          <li key={j}>{ing}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">
                        Instructions
                      </p>
                      <p className="mt-1 whitespace-pre-wrap">
                        {s.instructions}
                      </p>
                    </div>
                    {s.matchedItems.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {s.matchedItems.map((item, j) => (
                          <span
                            key={j}
                            className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Saved recipes */}
      {recipesWithMatch.length > 0 ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold">
            Your recipes ({recipesWithMatch.length})
          </h2>
          <div className="space-y-2">
            {recipesWithMatch.map((recipe) => (
              <div
                key={recipe.id}
                className="rounded-xl border border-border/60 bg-card p-3"
              >
                <div className="flex items-center gap-3">
                  <button
                    className="flex flex-1 items-center justify-between text-left min-w-0"
                    onClick={() =>
                      setExpandedRecipe(
                        expandedRecipe === recipe.id ? null : recipe.id,
                      )
                    }
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {recipe.name}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        {recipe.prepTime && <span>{recipe.prepTime} min</span>}
                        {recipe.servings && (
                          <span>{recipe.servings} servings</span>
                        )}
                        <span className="rounded bg-secondary px-1 py-0.5 text-[10px]">
                          {recipe.source}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <MatchBadge percent={recipe.matchPercent} />
                      {expandedRecipe === recipe.id ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => setDeletingRecipe(recipe)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {expandedRecipe === recipe.id && (
                  <div className="mt-3 space-y-2 border-t border-border/40 pt-3 text-xs">
                    <div>
                      <p className="font-medium text-muted-foreground">
                        Ingredients
                      </p>
                      <ul className="mt-1 list-disc pl-4 space-y-0.5">
                        {recipe.ingredients.map((ing, j) => (
                          <li
                            key={j}
                            className={cn(
                              inventoryNames.has(ing.name.toLowerCase())
                                ? "text-primary font-medium"
                                : "",
                            )}
                          >
                            {ing.amount && `${ing.amount} `}
                            {ing.name}
                            {ing.optional && (
                              <span className="text-muted-foreground">
                                {" "}
                                (optional)
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">
                        Instructions
                      </p>
                      <p className="mt-1 whitespace-pre-wrap">
                        {recipe.instructions}
                      </p>
                    </div>
                    {recipe.sourceUrl && (
                      <a
                        href={recipe.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Original recipe
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      ) : (
        suggestions.length === 0 && (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5">
              <BookOpen className="h-8 w-8 text-primary/40" />
            </div>
            <p className="mt-4 font-heading text-base font-semibold italic">
              No recipes yet
            </p>
            <p className="mt-1 max-w-[240px] text-sm text-muted-foreground">
              Import your Umami recipe book or ask AI what you can make with
              what&apos;s in your fridge
            </p>
          </div>
        )
      )}

      {/* Delete dialog */}
      <Dialog
        open={deletingRecipe !== null}
        onOpenChange={(open) => !open && setDeletingRecipe(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove recipe?</DialogTitle>
            <DialogDescription>
              Remove{" "}
              <span className="font-medium text-foreground">
                {deletingRecipe?.name}
              </span>
              ?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => setDeletingRecipe(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1 rounded-xl"
              onClick={confirmDelete}
            >
              Remove
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MatchBadge({ percent }: { percent: number }) {
  if (percent === 0) return null;

  const color =
    percent >= 75
      ? "bg-primary/10 text-primary"
      : percent >= 40
        ? "bg-warm/15 text-warm-foreground"
        : "bg-secondary text-muted-foreground";

  return (
    <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-medium", color)}>
      {percent}% match
    </span>
  );
}
