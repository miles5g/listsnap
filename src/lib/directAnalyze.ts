// Browser-only analysis path for the hosted demo. The visitor's own Gemini API key
// is stored in this browser's localStorage and sent straight to Google. Nothing is
// stored on a server and no key is committed to the repo.
const KEY_STORAGE = "listsnap_gemini_key";
export const getGeminiKey = () => localStorage.getItem(KEY_STORAGE) ?? "";
export const setGeminiKey = (k: string) =>
  k ? localStorage.setItem(KEY_STORAGE, k.trim()) : localStorage.removeItem(KEY_STORAGE);
export const hasBackend = Boolean(import.meta.env.VITE_SUPABASE_URL);

const schema = {
  type: "OBJECT",
  properties: {
    itemDetails: {
      type: "OBJECT",
      properties: {
        itemType: { type: "STRING" },
        brand: { type: "STRING" },
        color: { type: "STRING" },
        category: { type: "STRING" },
        keyDetails: { type: "ARRAY", items: { type: "STRING" } },
      },
      required: ["itemType", "brand", "color", "category", "keyDetails"],
    },
    listing: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING" },
        description: { type: "STRING" },
        tags: { type: "ARRAY", items: { type: "STRING" } },
        suggestedPrice: { type: "STRING" },
      },
      required: ["title", "description", "tags", "suggestedPrice"],
    },
  },
  required: ["itemDetails", "listing"],
};

export async function analyzeDirect(dataUrl: string, template: string) {
  const key = getGeminiKey();
  if (!key) {
    const e = new Error("Add your Gemini API key first (top of the page).") as Error & { code?: string };
    e.code = "NO_KEY";
    throw e;
  }
  const m = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
  if (!m) throw new Error("Could not read that photo. Try another one.");
  const hint =
    template === "minimal"
      ? " Keep the title and description short. Use fewer tags."
      : template === "detailed"
      ? " Write a longer description. Include condition and more key details."
      : "";
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: `You are a resale listing expert. Look at the item photo and return a marketplace listing. suggestedPrice is a used-resale price range like "$40-$55" based on typical sold prices for similar used items.${hint}` }],
        },
        contents: [{ role: "user", parts: [{ inline_data: { mime_type: m[1], data: m[2] } }, { text: "Analyze this item for a resale marketplace listing." }] }],
        generationConfig: { responseMimeType: "application/json", responseSchema: schema },
      }),
    }
  );
  if (!res.ok) {
    const e = new Error(
      res.status === 429 ? "Rate limit hit. Wait a minute and retry." :
      res.status === 400 || res.status === 403 ? "Gemini rejected the request. Check your API key." :
      `Gemini error ${res.status}`
    ) as Error & { code?: string };
    if (res.status === 429) e.code = "RATE_LIMIT";
    throw e;
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Invalid response from AI. Please retry.");
  return JSON.parse(text);
}
