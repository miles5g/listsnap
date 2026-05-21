import React from "react";
import { Tag } from "lucide-react";
import type { ItemDetails } from "@/types/listing";

interface ItemDetectionCardProps {
  details: ItemDetails;
}

const ItemDetectionCard: React.FC<ItemDetectionCardProps> = ({ details }) => {
  const fields = [
    { label: "Item", value: details.itemType },
    { label: "Brand", value: details.brand },
    { label: "Color", value: details.color },
    { label: "Category", value: details.category },
  ];

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h3 className="font-mono text-sm font-semibold text-primary mb-4 flex items-center gap-2">
        <Tag className="w-4 h-4" />
        ITEM DETECTED
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {fields.map((field) => (
          <div key={field.label} className="bg-secondary/50 rounded-md px-3 py-2">
            <span className="text-xs text-muted-foreground font-mono">{field.label}</span>
            <p className="text-sm text-foreground font-medium mt-0.5">{field.value || "—"}</p>
          </div>
        ))}
      </div>
      {details.keyDetails.length > 0 && (
        <div className="mt-3 bg-secondary/50 rounded-md px-3 py-2">
          <span className="text-xs text-muted-foreground font-mono">Key Details</span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {details.keyDetails.map((detail, i) => (
              <span
                key={i}
                className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20"
              >
                {detail}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemDetectionCard;
