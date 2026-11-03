import { targetJsonSchemaV1, targetSchemaV1 } from "../target";

const fixture = {
  schemaVersion: 1,
  id: "target_uong",
  version: 1,
  status: "published",
  canonicalText: "uống",
  normalizedSearchText: "uong",
  targetType: "action",
  skillDomainId: "domain_expression",
  topicIds: ["topic_daily_life"],
  semanticTags: ["verb"],
  complexity: 1,
  regionAccentNote: null,
  prerequisiteTargetIds: [],
  allowedActivityTypes: ["word_model", "naming", "functional_sentence", "parent_transfer"],
  safetyNote: null,
  provenanceRef: "provenance_editorial_001"
} as const;

describe("target schema v1", () => {
  it("exports a schema with a stable id", () => {
    expect(targetJsonSchemaV1.$id).toBe("urn:kidedu:content:target:v1");
  });
  it("accepts a Vietnamese target with reusable activity types", () => {
    expect(targetSchemaV1.parse(fixture).canonicalText).toBe("uống");
  });

  it("rejects an unknown schema version or activity type", () => {
    expect(targetSchemaV1.safeParse({ ...fixture, schemaVersion: 2 }).success).toBe(false);
    expect(
      targetSchemaV1.safeParse({ ...fixture, allowedActivityTypes: ["flashcard"] }).success
    ).toBe(false);
  });

  it("rejects duplicate or self prerequisites and unrecognized fields", () => {
    expect(
      targetSchemaV1.safeParse({ ...fixture, prerequisiteTargetIds: ["target_uong"] }).success
    ).toBe(false);
    expect(
      targetSchemaV1.safeParse({ ...fixture, topicIds: ["topic_daily_life", "topic_daily_life"] })
        .success
    ).toBe(false);
    expect(targetSchemaV1.safeParse({ ...fixture, providerUid: "external" }).success).toBe(false);
  });
});
