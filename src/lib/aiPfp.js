// ✨ AI Slime PFP — the "next level" custom effect: repaint the user's ACTUAL photo into a glossy
// SlimeWire slime creature via an image-to-image model (fal.ai hosts nano-banana, the Higgs family, so
// the output matches our Higgs art). Sharp tinting can never look like this; this is the real transform.
//
// SECRET: FAL_KEY (owner-set on Render, never logged). DARK until it's present — endpoints report "not
// enabled" and the UI hides the AI section, so nothing costs a cent until the owner opts in.
// Cost: ~$0.02–0.05 per image (pay-as-you-go). Model tunable via FAL_PFP_MODEL.

export function aiPfpConfigured() { return Boolean((process.env.FAL_KEY || "").trim()); }
function falModel() { return String(process.env.FAL_PFP_MODEL || "fal-ai/nano-banana/edit").trim(); }

// Rotating slime styles — "lots of options", each a distinct look. Prompt is written for image-EDIT
// models: keep the person's pose/likeness, repaint them as the slime creature.
const AI_STYLES = [
  { id: "slimeself", label: "💚 Slime Self", prompt: "Transform this person into a glossy neon-green slime creature version of themselves: repaint the skin as dripping wet translucent slime, keep their pose, hairstyle and recognizable features, add big glossy cartoon eyes, thick bold black outline, vibrant, premium 3D sticker mascot look. Clean solid background." },
  { id: "king", label: "👑 Slime King", prompt: "Transform this person into a glossy green slime creature and add a dripping neon-green slime crown on their head. Keep their pose and recognizable features, skin repainted as wet dripping slime, big glossy eyes, thick bold black outline, regal, premium 3D sticker mascot look. Clean solid background." },
  { id: "toxic", label: "☢️ Toxic Ogre", prompt: "Transform this person into a radioactive toxic-green ogre-slime creature: glowing green skin, oozing goo, two small white tusks, glowing lime eyes, keep their pose and features, menacing but cute, thick bold black outline, premium 3D sticker mascot look. Clean dark background." },
  { id: "cyber", label: "🌀 Cyber Slime", prompt: "Transform this person into a cyber-slime being: slime-green skin with glowing neon-green circuit-wire patterns tracing across their face, holographic sheen, keep their pose and features, futuristic, thick bold outline, premium 3D sticker mascot look. Clean dark background." },
  { id: "gold", label: "🏆 Gold Slime", prompt: "Transform this person into a molten gold-and-green slime creature: luxurious glossy dripping metallic-green and gold slime skin, keep their pose and features, big glossy eyes, thick bold black outline, premium 3D sticker mascot look. Clean solid background." },
  { id: "zombie", label: "🧟 Swamp Zombie", prompt: "Transform this person into a friendly swamp-slime zombie ogre: mossy green dripping skin, glowing eyes, small tusks, keep their pose and features, cute not scary, thick bold black outline, premium 3D sticker mascot look. Clean solid background." }
];

export function aiPfpStyles() { return AI_STYLES.map((s) => ({ id: s.id, label: s.label })); }

// Restyle a photo. imageDataUrl = data:image/...;base64,... . Returns a PNG Buffer, or null if disabled.
// Throws on a real API error so the caller can surface it.
export async function aiSlimePfp({ imageDataUrl, styleId }) {
  if (!aiPfpConfigured()) return null;
  const style = AI_STYLES.find((s) => s.id === styleId) || AI_STYLES[0];
  const res = await fetch(`https://fal.run/${falModel()}`, {
    method: "POST",
    headers: { Authorization: `Key ${String(process.env.FAL_KEY).trim()}`, "Content-Type": "application/json" },
    // nano-banana/edit takes image_urls (data URIs accepted). Kept generic so most fal edit models work.
    body: JSON.stringify({ prompt: style.prompt, image_urls: [imageDataUrl], image_url: imageDataUrl, num_images: 1, output_format: "png" }),
    signal: AbortSignal.timeout ? AbortSignal.timeout(90_000) : undefined
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    const e = new Error(`AI slime failed (${res.status})${t ? ": " + t.slice(0, 160) : ""}`);
    e.statusCode = res.status === 401 ? 401 : 502;
    throw e;
  }
  const data = await res.json().catch(() => ({}));
  const url = data?.images?.[0]?.url || data?.image?.url || (Array.isArray(data?.output) ? data.output[0] : null) || data?.url;
  if (!url) throw new Error("AI slime returned no image.");
  const img = await fetch(url, { signal: AbortSignal.timeout ? AbortSignal.timeout(30_000) : undefined });
  if (!img.ok) throw new Error("Couldn't fetch the AI image.");
  const buf = Buffer.from(await img.arrayBuffer());
  if (buf.length < 200) throw new Error("AI image was empty.");
  return buf;
}

export async function aiSiteArt({ imageDataUrl, prompt = "", format = "hero" }) {
  if (!aiPfpConfigured()) return null;
  const shape = format === "gallery" ? "square editorial campaign artwork" : "cinematic ultra-wide website hero artwork with clear negative space for headline text";
  const safePrompt = String(prompt || "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, 700);
  const fullPrompt = `Using the supplied coin mascot as the exact main character reference, create ${shape}. ${safePrompt || "Build a bold, premium memecoin world around this character."} Preserve the mascot identity, colors and recognizable face. Professional art direction, cohesive lighting, rich environmental detail, sharp high-end commercial finish. No text, no logos, no watermarks.`;
  const res = await fetch(`https://fal.run/${falModel()}`, {
    method: "POST",
    headers: { Authorization: `Key ${String(process.env.FAL_KEY).trim()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: fullPrompt, image_urls: [imageDataUrl], image_url: imageDataUrl, num_images: 1, output_format: "png" }),
    signal: AbortSignal.timeout ? AbortSignal.timeout(90_000) : undefined
  });
  if (!res.ok) throw Object.assign(new Error(`AI site art failed (${res.status}).`), { statusCode: res.status === 401 ? 401 : 502 });
  const data = await res.json().catch(() => ({}));
  const url = data?.images?.[0]?.url || data?.image?.url || (Array.isArray(data?.output) ? data.output[0] : null) || data?.url;
  if (!url) throw new Error("AI site art returned no image.");
  const img = await fetch(url, { signal: AbortSignal.timeout ? AbortSignal.timeout(30_000) : undefined });
  if (!img.ok) throw new Error("Couldn't fetch the generated site art.");
  const buf = Buffer.from(await img.arrayBuffer());
  if (buf.length < 200) throw new Error("Generated site art was empty.");
  return buf;
}
