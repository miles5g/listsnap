import React, { useState } from "react";
import { Copy, Pencil, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import type { ListingData } from "@/types/listing";

interface ListingEditorProps {
  listing: ListingData;
  onUpdate: (listing: ListingData) => void;
}

/** Parse price range (e.g. $40–$55) and return recommended (mean) price for pasting into listing fields. */
function getRecommendedPriceFromRange(rangeStr: string): string {
  const numbers = rangeStr
    .replace(/[^\d.]/g, " ")
    .trim()
    .split(/\s+/)
    .map(Number)
    .filter((n) => !Number.isNaN(n) && n > 0);
  if (numbers.length >= 2) {
    const [low, high] = numbers.slice(0, 2);
    const mean = (low + high) / 2;
    const rounded = mean % 1 === 0 ? Math.round(mean) : Math.round(mean * 100) / 100;
    return rangeStr.includes("$") ? `$${rounded}` : String(rounded);
  }
  if (numbers.length === 1) return rangeStr.includes("$") ? `$${numbers[0]}` : String(numbers[0]);
  return rangeStr;
}

const ListingEditor: React.FC<ListingEditorProps> = ({ listing, onUpdate }) => {
  const copyToClipboard = useCopyToClipboard();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(listing);
  const [tagInput, setTagInput] = useState("");

  const startEdit = () => {
    setDraft(listing);
    setEditing(true);
  };

  const save = () => {
    onUpdate(draft);
    setEditing(false);
  };

  const cancel = () => setEditing(false);

  const removeTag = (index: number) => {
    setDraft((d) => ({ ...d, tags: d.tags.filter((_, i) => i !== index) }));
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !draft.tags.includes(tag)) {
      setDraft((d) => ({ ...d, tags: [...d.tags, tag] }));
      setTagInput("");
    }
  };

  const data = editing ? draft : listing;
  const tagsDisplay = data.tags.join(", ");

  const fullListingText = [
    data.title,
    "",
    data.description,
    "",
    `Tags: ${data.tags.length ? data.tags.join(", ") : ""}`,
    "",
    `Price: ${getRecommendedPriceFromRange(data.suggestedPrice)}`,
  ].join("\n");

  if (editing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-mono text-sm font-semibold text-primary">Edit listing</h3>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={cancel} className="min-h-[44px] min-w-[44px]">
              <X className="w-4 h-4" />
            </Button>
            <Button variant="default" size="sm" onClick={save} className="min-h-[44px]">
              <Check className="w-4 h-4 mr-1" />
              Save
            </Button>
          </div>
        </div>
        <Card className="border-border">
          <CardHeader className="pb-2">
            <h4 className="text-sm font-mono text-muted-foreground">Title</h4>
          </CardHeader>
          <CardContent className="pt-0">
            <input
              className="w-full bg-secondary border border-border rounded-md px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            />
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="pb-2">
            <h4 className="text-sm font-mono text-muted-foreground">Description</h4>
          </CardHeader>
          <CardContent className="pt-0">
            <textarea
              rows={4}
              className="w-full bg-secondary border border-border rounded-md px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary resize-none"
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
            />
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="pb-2">
            <h4 className="text-sm font-mono text-muted-foreground">Suggested Price</h4>
          </CardHeader>
          <CardContent className="pt-0">
            <input
              className="w-full bg-secondary border border-border rounded-md px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary"
              value={draft.suggestedPrice}
              onChange={(e) => setDraft((d) => ({ ...d, suggestedPrice: e.target.value }))}
            />
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="pb-2">
            <h4 className="text-sm font-mono text-muted-foreground">Tags</h4>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {draft.tags.map((tag, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1"
                >
                  {tag}
                  <button onClick={() => removeTag(i)} className="hover:text-destructive" aria-label="Remove tag">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <input
              className="text-sm bg-transparent border-b border-border text-foreground px-1 py-1 w-full max-w-[140px] focus:outline-none focus:border-primary"
              placeholder="Add tag..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="default"
          className="w-full min-h-[48px] gap-2 font-mono sm:w-auto"
          onClick={() => copyToClipboard(fullListingText, "Full listing")}
          aria-label="Copy full listing to clipboard"
        >
          <Copy className="w-5 h-5" />
          Copy full listing
        </Button>
        <Button variant="ghost" size="sm" onClick={startEdit} className="min-h-[44px] font-mono text-muted-foreground" aria-label="Edit listing">
          <Pencil className="w-4 h-4 mr-1" />
          Edit
        </Button>
      </div>

      {/* Title */}
      <Card className="border-border shadow-none">
        <CardHeader className="pb-1 pt-4 px-4">
          <h4 className="text-xs font-mono uppercase tracking-wide text-muted-foreground">Title</h4>
        </CardHeader>
        <CardContent className="px-4 pt-0 pb-3">
          <p className="text-foreground font-medium text-base">{data.title}</p>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <Button
            variant="outline"
            className="w-full min-h-[48px] gap-2 font-mono border-border"
            onClick={() => copyToClipboard(data.title, "Title")}
            aria-label="Copy title to clipboard"
          >
            <Copy className="w-5 h-5" />
            Copy
          </Button>
        </CardFooter>
      </Card>

      {/* Description */}
      <Card className="border-border shadow-none">
        <CardHeader className="pb-1 pt-4 px-4">
          <h4 className="text-xs font-mono uppercase tracking-wide text-muted-foreground">Description</h4>
        </CardHeader>
        <CardContent className="px-4 pt-0 pb-3">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{data.description}</p>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <Button
            variant="outline"
            className="w-full min-h-[48px] gap-2 font-mono border-border"
            onClick={() => copyToClipboard(data.description, "Description")}
            aria-label="Copy description to clipboard"
          >
            <Copy className="w-5 h-5" />
            Copy
          </Button>
        </CardFooter>
      </Card>

      {/* Price range (display only) + Recommended price (copyable) */}
      <Card className="border-border shadow-none">
        <CardHeader className="pb-1 pt-4 px-4">
          <h4 className="text-xs font-mono uppercase tracking-wide text-muted-foreground">Price range</h4>
        </CardHeader>
        <CardContent className="px-4 pt-0 pb-3 space-y-3">
          <p className="text-xl font-mono font-bold text-primary">{data.suggestedPrice}</p>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-mono text-muted-foreground">Recommended (use in listing)</span>
            <p className="text-lg font-mono font-semibold text-foreground">{getRecommendedPriceFromRange(data.suggestedPrice)}</p>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <Button
            variant="outline"
            className="w-full min-h-[48px] gap-2 font-mono border-border"
            onClick={() => copyToClipboard(getRecommendedPriceFromRange(data.suggestedPrice), "Recommended price")}
            aria-label="Copy recommended price to clipboard"
          >
            <Copy className="w-5 h-5" />
            Copy recommended price
          </Button>
        </CardFooter>
      </Card>

      {/* Tags */}
      <Card className="border-border shadow-none">
        <CardHeader className="pb-1 pt-4 px-4">
          <h4 className="text-xs font-mono uppercase tracking-wide text-muted-foreground">Tags</h4>
        </CardHeader>
        <CardContent className="px-4 pt-0 pb-3">
          <p className="text-sm text-muted-foreground">
            {data.tags.length ? data.tags.join(", ") : "—"}
          </p>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <Button
            variant="outline"
            className="w-full min-h-[48px] gap-2 font-mono border-border"
            onClick={() => copyToClipboard(tagsDisplay, "Tags")}
            aria-label="Copy tags to clipboard"
          >
            <Copy className="w-5 h-5" />
            Copy
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ListingEditor;
