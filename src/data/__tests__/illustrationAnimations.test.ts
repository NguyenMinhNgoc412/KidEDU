import { illustrationAnimations, resolveIllustrationAnimation } from "../illustrationAnimations";
import {
  bundledDefaultMedia,
  createBundledDefaultMediaUri,
  getBundledDefaultMediaFile
} from "../defaultMediaRegistry";
import { seedLearningItems } from "../seedData";
import type { LearningItemMedia } from "../types";

test("every sample word has an eight-frame illustration and a registered still image", () => {
  for (const item of seedLearningItems) {
    expect(illustrationAnimations[item.id]?.frameCount).toBe(8);
    const definition = bundledDefaultMedia.find(
      (media) => media.itemId === item.id && media.role === "illustration"
    );
    expect(definition).toBeDefined();
    expect(
      getBundledDefaultMediaFile(createBundledDefaultMediaUri(definition!.asset.key))?.module
    ).toBeDefined();
  }
  expect(Object.keys(illustrationAnimations)).toHaveLength(seedLearningItems.length);
});

test("mẹ and bà resolve bundled stills directly and missing old seed mappings can use animation", () => {
  expect(getBundledDefaultMediaFile("bundle://default/item-me-illustration-v2")).not.toBeNull();
  expect(getBundledDefaultMediaFile("bundle://default/item-ba-noi-illustration-v1")).not.toBeNull();
  expect(resolveIllustrationAnimation("item-me")?.itemId).toBe("item-me");
  expect(resolveIllustrationAnimation("item-ba-noi")?.itemId).toBe("item-ba-noi");
  expect(getBundledDefaultMediaFile("bundle://default/unknown")).toBeNull();
});

test("family images and non-bundled assets are never replaced by sample animation", () => {
  const media = {
    asset: { source: "custom", uri: "file:///family/photo.jpg" }
  } as LearningItemMedia;
  expect(resolveIllustrationAnimation("item-me", media)).toBeNull();
  expect(
    resolveIllustrationAnimation("item-me", {
      ...media,
      asset: { ...media.asset, source: "default" }
    })
  ).toBeNull();
  expect(resolveIllustrationAnimation("custom-item")).toBeNull();
});
