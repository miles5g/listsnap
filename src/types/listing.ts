export interface ItemDetails {
  itemType: string;
  brand: string;
  color: string;
  category: string;
  keyDetails: string[];
}

export interface ListingData {
  title: string;
  description: string;
  tags: string[];
  suggestedPrice: string;
}

export interface HistoryEntry {
  id: string;
  title: string;
  listing: ListingData;
  itemDetails: ItemDetails;
  createdAt: number;
}
