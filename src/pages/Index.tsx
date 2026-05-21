import React, { useState, useCallback, useEffect } from "react";
import { Camera, RotateCcw, Zap, History } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import PhotoUpload from "@/components/PhotoUpload";
import ItemDetectionCard from "@/components/ItemDetectionCard";
import ListingEditor from "@/components/ListingEditor";
import ListingSkeleton from "@/components/ListingSkeleton";
import Stepper from "@/components/Stepper";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ItemDetails, ListingData, HistoryEntry } from "@/types/listing";

function isValidListingData(v: unknown): v is ListingData {
  return (
    typeof v === "object" &&
    v !== null &&
    "title" in v &&
    "description" in v &&
    "tags" in v &&
    "suggestedPrice" in v &&
    typeof (v as ListingData).title === "string" &&
    typeof (v as ListingData).description === "string" &&
    Array.isArray((v as ListingData).tags) &&
    typeof (v as ListingData).suggestedPrice === "string"
  );
}

function isValidItemDetails(v: unknown): v is ItemDetails {
  return (
    typeof v === "object" &&
    v !== null &&
    "itemType" in v &&
    "brand" in v &&
    "color" in v &&
    "category" in v &&
    "keyDetails" in v &&
    typeof (v as ItemDetails).itemType === "string" &&
    typeof (v as ItemDetails).brand === "string" &&
    typeof (v as ItemDetails).color === "string" &&
    typeof (v as ItemDetails).category === "string" &&
    Array.isArray((v as ItemDetails).keyDetails)
  );
}

const LISTNAP_STORAGE_KEY = "listnap_last_listing";
const LISTNAP_HISTORY_KEY = "listnap_history";
const MAX_HISTORY = 10;
const MAX_STORED_IMAGE_LENGTH = 300_000; // skip storing huge base64

function loadLastListing(): {
  listing: ListingData;
  itemDetails: ItemDetails;
  imagePreview: string | null;
} | null {
  try {
    const raw = localStorage.getItem(LISTNAP_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      !isValidListingData(parsed.listing) ||
      !isValidItemDetails(parsed.itemDetails)
    )
      return null;
    return {
      listing: parsed.listing,
      itemDetails: parsed.itemDetails,
      imagePreview:
        typeof parsed.imagePreview === "string" ? parsed.imagePreview : null,
    };
  } catch {
    return null;
  }
}

function saveLastListing(
  listing: ListingData,
  itemDetails: ItemDetails,
  imagePreview: string | null
) {
  try {
    const toStore =
      imagePreview && imagePreview.length <= MAX_STORED_IMAGE_LENGTH
        ? imagePreview
        : null;
    localStorage.setItem(
      LISTNAP_STORAGE_KEY,
      JSON.stringify({ listing, itemDetails, imagePreview: toStore })
    );
  } catch {
    // quota or disabled storage
  }
}

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(LISTNAP_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e: unknown) =>
        e &&
        typeof e === "object" &&
        "id" in e &&
        "title" in e &&
        "listing" in e &&
        "itemDetails" in e &&
        "createdAt" in e &&
        isValidListingData((e as HistoryEntry).listing) &&
        isValidItemDetails((e as HistoryEntry).itemDetails)
    );
  } catch {
    return [];
  }
}

function saveToHistory(listing: ListingData, itemDetails: ItemDetails) {
  try {
    const prev = loadHistory();
    const entry: HistoryEntry = {
      id: crypto.randomUUID(),
      title: listing.title,
      listing,
      itemDetails,
      createdAt: Date.now(),
    };
    const next = [entry, ...prev].slice(0, MAX_HISTORY);
    localStorage.setItem(LISTNAP_HISTORY_KEY, JSON.stringify(next));
  } catch {
    // quota or disabled storage
  }
}

export type ListingTemplate = "default" | "minimal" | "detailed";

const Index = () => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [itemDetails, setItemDetails] = useState<ItemDetails | null>(null);
  const [listing, setListing] = useState<ListingData | null>(null);
  const [analysisFailed, setAnalysisFailed] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<ReturnType<typeof loadLastListing> | null>(null);
  const [listingTemplate, setListingTemplate] = useState<ListingTemplate>("default");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const currentStep = !imagePreview ? 1 : isAnalyzing ? 2 : !listing ? 2 : 3;

  useEffect(() => {
    const last = loadLastListing();
    if (last) setPendingRestore(last);
    setHistory(loadHistory());
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
    if (error) {
      console.error("Sign in error:", error);
      if (error.message?.includes("not enabled") || error.code === "validation_failed") {
        toast.error("Google sign-in is not set up yet for this app.");
      } else {
        toast.error(error.message ?? "Could not sign in. Please try again.");
      }
    }
  }, []);

  const analyzeImage = useCallback(async (base64Image: string) => {
    setIsAnalyzing(true);
    setAnalysisFailed(false);
    try {
      const ANALYZE_TIMEOUT_MS = 90_000; // 90s so AI has time to respond
      const invokePromise = supabase.functions.invoke("analyze-item", {
        body: { image: base64Image, template: listingTemplate },
      });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Analysis timed out. Try again or use a smaller image.")), ANALYZE_TIMEOUT_MS)
      );

      const result = await Promise.race([invokePromise, timeoutPromise]);
      const { data, error } = result as { data: unknown; error: { message?: string } | null };

      if (error) {
        let msg = error.message ?? "Request failed.";
        let code: string | undefined;
        try {
          const parsed = typeof error.message === "string" ? JSON.parse(error.message) : null;
          if (parsed && typeof parsed.error === "string") msg = parsed.error;
          if (parsed && typeof parsed.code === "string") code = parsed.code;
        } catch {
          // use msg as-is
        }
        const e = new Error(msg) as Error & { code?: string };
        e.code = code;
        throw e;
      }
      if (!data || !isValidListingData(data.listing) || !isValidItemDetails(data.itemDetails)) {
        throw new Error("Invalid response from analysis. Please retry.");
      }

      setItemDetails(data.itemDetails);
      setListing(data.listing);
      setAnalysisFailed(false);
      setPendingRestore(null);
      saveLastListing(data.listing, data.itemDetails, base64Image);
      saveToHistory(data.listing, data.itemDetails);
      toast.success("Listing generated!");
    } catch (err) {
      console.error("Analysis error:", err);
      setAnalysisFailed(true);
      const code = err && typeof err === "object" && "code" in err ? (err as { code: string }).code : undefined;
      const fallback = err instanceof Error ? err.message : "Failed to analyze image. Please try again.";
      const message =
        code === "IMAGE_TOO_LARGE"
          ? "Image too large. Use a smaller photo or try again."
          : code === "RATE_LIMIT"
          ? "Rate limit exceeded. Please try again in a moment."
          : code === "CREDITS_EXHAUSTED"
          ? "AI credits exhausted. Please add funds."
          : code === "INVALID_RESPONSE"
          ? "Invalid response from AI. Please retry."
          : fallback;
      toast.error(message);
    } finally {
      setIsAnalyzing(false);
    }
  }, [listingTemplate]);

  const handleImageUpload = useCallback(
    (_file: File, preview: string) => {
      setImagePreview(preview);
      setItemDetails(null);
      setListing(null);
      setAnalysisFailed(false);
      analyzeImage(preview);
    },
    [analyzeImage]
  );

  const handleReset = () => {
    setImagePreview(null);
    setItemDetails(null);
    setListing(null);
    setAnalysisFailed(false);
  };

  const handleRestoreLast = () => {
    if (!pendingRestore) return;
    setImagePreview(pendingRestore.imagePreview);
    setItemDetails(pendingRestore.itemDetails);
    setListing(pendingRestore.listing);
    setPendingRestore(null);
  };

  const dismissRestore = () => setPendingRestore(null);

  const restoreFromHistory = (entry: HistoryEntry) => {
    setImagePreview(null);
    setItemDetails(entry.itemDetails);
    setListing(entry.listing);
    setAnalysisFailed(false);
    setPendingRestore(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header — compact, sticky */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm pt-safe">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Camera className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">ListSnap</h1>
          </div>
          {imagePreview && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-muted-foreground min-h-[44px] min-w-[44px]"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              New
            </Button>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-5 safe-bottom">
        <Stepper currentStep={currentStep} />

        {!imagePreview && (
          <div className="mb-6">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold mb-1">Snap. List. Sell.</h2>
              <p className="text-muted-foreground text-sm">
                Photo → marketplace listing in seconds.
              </p>
            </div>
            <div className="flex flex-col gap-2 max-w-xs mx-auto">
              <label htmlFor="listing-template" className="text-xs font-mono text-muted-foreground">
                Listing style
              </label>
              <Select value={listingTemplate} onValueChange={(v) => setListingTemplate(v as ListingTemplate)}>
                <SelectTrigger id="listing-template" className="font-mono">
                  <SelectValue placeholder="Style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default" className="font-mono">Default</SelectItem>
                  <SelectItem value="minimal" className="font-mono">Minimal</SelectItem>
                  <SelectItem value="detailed" className="font-mono">Detailed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {pendingRestore && !imagePreview && !isAnalyzing && (
          <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3 mb-4">
            <p className="text-sm text-muted-foreground">
              Continue with your last listing?
            </p>
            <div className="flex gap-2">
              <Button
                className="flex-1 min-h-[44px] font-mono"
                onClick={handleRestoreLast}
              >
                Continue
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="min-h-[44px]"
                onClick={dismissRestore}
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}

        {history.length > 0 && !imagePreview && !isAnalyzing && (
          <div className="rounded-lg border border-border bg-card p-4 mb-4">
            <h3 className="font-mono text-sm font-semibold text-primary flex items-center gap-2 mb-3">
              <History className="w-4 h-4" />
              Past listings
            </h3>
            <ul className="space-y-2">
              {history.slice(0, 5).map((entry) => (
                <li key={entry.id}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-left font-normal h-auto py-2 text-sm"
                    onClick={() => restoreFromHistory(entry)}
                  >
                    <span className="truncate flex-1">{entry.title}</span>
                    <span className="text-xs text-muted-foreground ml-2 shrink-0">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </span>
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-4">
          <PhotoUpload
            onImageUpload={handleImageUpload}
            preview={imagePreview}
            isAnalyzing={isAnalyzing}
          />

          {isAnalyzing && !itemDetails && <ListingSkeleton />}

          {analysisFailed && imagePreview && !isAnalyzing && (
            <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">Analysis didn’t complete. You can retry with the same photo.</p>
              <Button
                className="w-full min-h-[48px] font-mono"
                onClick={() => analyzeImage(imagePreview)}
              >
                Retry analysis
              </Button>
            </div>
          )}

          {itemDetails && <ItemDetectionCard details={itemDetails} />}

          {listing && (
            <section aria-live="polite" aria-label="Generated listing">
              <ListingEditor listing={listing} onUpdate={setListing} />
              <div className="mt-4">
                {user ? (
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-mono text-primary">
                    <Zap className="w-3.5 h-3.5" />
                    Saved to your account
                  </div>
                ) : (
                  <div className="rounded-xl border border-border bg-card p-4 text-center">
                    <p className="font-mono text-sm font-medium text-foreground">Save your listing history</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Sign in with Google to keep track of all your scans and drafts.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 min-h-[40px] gap-2 font-mono border-border"
                      onClick={signInWithGoogle}
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Sign in with Google
                    </Button>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="mt-10 pb-4 text-center">
          <p className="text-xs text-muted-foreground font-mono flex items-center justify-center gap-1">
            <Zap className="w-3 h-3" /> Powered by AI
          </p>
        </div>
      </main>
    </div>
  );
};

export default Index;
