import React from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ListingData {
  title: string;
  description: string;
  tags: string[];
  suggestedPrice: string;
}

interface ExportButtonsProps {
  listing: ListingData;
}

const platforms = [
  { name: "eBay", label: "eBay", icon: "🏷️" },
  { name: "Facebook Marketplace", label: "Facebook Marketplace", icon: "📘" },
  { name: "Etsy", label: "Etsy", icon: "🧶" },
  { name: "Depop", label: "Depop", icon: "👗" },
] as const;

function formatListing(listing: ListingData, platform: string): string {
  const lines = [
    `📸 ${listing.title}`,
    "",
    listing.description,
    "",
    `🏷️ Tags: ${listing.tags.join(", ")}`,
    "",
    `💰 Price: ${listing.suggestedPrice}`,
  ];

  if (platform === "eBay") {
    lines.unshift(`[eBay Listing]`);
  } else if (platform === "Facebook Marketplace") {
    lines.unshift(`[Facebook Marketplace]`);
  } else if (platform === "Etsy") {
    lines.unshift(`[Etsy Listing]`);
  } else if (platform === "Depop") {
    lines.unshift(`[Depop Listing]`);
  }

  return lines.join("\n");
}

const ExportButtons: React.FC<ExportButtonsProps> = ({ listing }) => {
  const [copied, setCopied] = React.useState<string | null>(null);

  const handleCopy = async (platform: string) => {
    const text = formatListing(listing, platform);
    await navigator.clipboard.writeText(text);
    setCopied(platform);
    toast.success(`Copied ${platform} listing to clipboard`);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h3 className="font-mono text-sm font-semibold text-primary mb-3">
        Export listing
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {platforms.map((p) => (
          <Button
            key={p.name}
            variant="snapOutline"
            className="justify-start gap-2 min-h-[48px] text-sm"
            onClick={() => handleCopy(p.name)}
          >
            {copied === p.name ? (
              <Check className="w-4 h-4 text-primary" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            <span>{p.icon}</span>
            {p.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default ExportButtons;
