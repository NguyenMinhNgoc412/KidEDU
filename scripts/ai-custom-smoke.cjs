/* Adult developer-only synthetic experiment. Never import from app/server runtime.
 * No user prompt, family records, media, database, publication or paid fallback.
 */
const { z } = require("zod");
const draftSchema = z
  .strictObject({
    words: z
      .array(
        z
          .string()
          .trim()
          .min(1)
          .max(40)
          .regex(/^[\p{L} ]+$/u)
      )
      .length(5)
  })
  .refine(
    ({ words }) =>
      new Set(words.map((word) => word.normalize("NFC").toLocaleLowerCase("vi"))).size === 5
  );
const FIXED_PROMPT =
  "Internal synthetic Vietnamese vocabulary experiment. Return only a JSON object with a words array of exactly five distinct Vietnamese names of common household objects. No personal names, identifying information, diagnoses, explanations or markdown. This is a draft for adult review, not published educational content.";

async function runSyntheticSmoke({
  apiKey,
  model,
  freeTierConfirmed,
  fetchImpl = globalThis.fetch
}) {
  if (!freeTierConfirmed) throw new Error("Confirm a free-tier-only project before live testing");
  if (!apiKey) throw new Error("Set GEMINI_API_KEY locally; never paste it into chat");
  if (!/^gemini-[a-z0-9.-]+$/.test(model ?? ""))
    throw new Error("Set GEMINI_TEST_MODEL to an available free-tier model");
  let response;
  try {
    response = await fetchImpl(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        redirect: "error",
        signal: globalThis.AbortSignal.timeout(30_000),
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: FIXED_PROMPT }] }],
          generationConfig: { maxOutputTokens: 512, candidateCount: 1 }
        })
      }
    );
  } catch {
    throw new Error("Provider request failed; no retry or paid fallback was attempted");
  }
  // Never log provider error bodies (may echo credentials or prompts).
  if (!response.ok) throw new Error(`Provider HTTP ${response.status}; stopped without retry`);
  let draft;
  try {
    const result = await response.json();
    const candidate = result.candidates?.[0];
    if (candidate?.finishReason !== "STOP" || result.promptFeedback?.blockReason)
      throw new Error("Incomplete or blocked output");
    const text = candidate.content.parts
      .filter((part) => !part.thought)
      .map((part) => part.text ?? "")
      .join("");
    draft = draftSchema.parse(JSON.parse(text));
  } catch {
    throw new Error("Provider output failed draft validation; no content saved or published");
  }
  return { status: "draft_requires_human_review", draft };
}

if (require.main === module) {
  const live = process.argv.includes("--live");
  if (!live) {
    draftSchema.parse({ words: ["bàn", "ghế", "cốc", "bát", "thìa"] });
    console.log("Offline schema smoke passed. No provider request, no publication.");
  } else {
    runSyntheticSmoke({
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_TEST_MODEL,
      freeTierConfirmed: process.env.GEMINI_TEST_FREE_TIER === "confirmed"
    })
      .then((result) => console.log(JSON.stringify(result)))
      .catch((error) => {
        console.error(error.message);
        process.exitCode = 1;
      });
  }
}
module.exports = { runSyntheticSmoke, draftSchema };
