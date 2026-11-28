import test from "node:test";
import assert from "node:assert/strict";
import {
  deduplicateFileName,
  extractInlineImageRefs,
  getUnplacedImageAttachments,
  normalizeComposerBlocks,
  parseBodyToBlocks,
  resolveAttachmentForRef,
  serializeBlocksToBody,
  stripInlineImageTokens,
} from "./inline-media.ts";

test("parseBodyToBlocks and serializeBlocksToBody round-trip KaTeX, Myanmar prose, and special captions", () => {
  const original = [
    "Consider the trigonometric identity in Myanmar: ထောင့်မှန်တြိဂံအတွက်",
    "$$\\sin^2\\theta + \\cos^2\\theta = 1$$",
    "![Unit circle quadrant [I & II] for cos(2θ)](e2e-img:unit%20circle.webp)",
    "From the diagram above, $2\\theta = \\frac{\\pi}{3}$ gives the first root.",
    "![](e2e-img:wave-graph.webp)",
  ].join("\n\n");

  const blocks = parseBodyToBlocks(original);
  assert.equal(blocks.length, 4);
  assert.equal(blocks[0]?.type, "text");
  assert.equal(blocks[1]?.type, "image");
  assert.equal(blocks[2]?.type, "text");
  assert.equal(blocks[3]?.type, "image");

  if (blocks[1]?.type === "image") {
    assert.equal(blocks[1].imageRef, "unit circle.webp");
    assert.equal(blocks[1].caption, "Unit circle quadrant [I & II] for cos(2θ)");
  }

  const serialized = serializeBlocksToBody(blocks);
  assert.ok(
    serialized.includes(
      "![Unit circle quadrant (I & II) for cos(2θ)](e2e-img:unit%20circle.webp)"
    )
  );
  assert.ok(serialized.includes("$$\\sin^2\\theta + \\cos^2\\theta = 1$$"));
  assert.ok(serialized.includes("![](e2e-img:wave-graph.webp)"));

  const reparsed = parseBodyToBlocks(serialized);
  assert.equal(serializeBlocksToBody(reparsed), serialized);
});

test("parseBodyToBlocks handles empty body and adjacent image blocks", () => {
  const emptyBlocks = parseBodyToBlocks("");
  assert.equal(emptyBlocks.length, 1);
  assert.equal(emptyBlocks[0]?.type, "text");
  assert.equal(
    emptyBlocks[0]?.type === "text" ? emptyBlocks[0].content : null,
    ""
  );

  const adjacent = [
    "![First](e2e-img:first.webp)",
    "![Second](e2e-img:second.webp)",
  ].join("\n\n");

  const parsed = parseBodyToBlocks(adjacent);
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0]?.type, "image");
  assert.equal(parsed[1]?.type, "image");
  assert.equal(serializeBlocksToBody(parsed), adjacent);
});

test("normalizeComposerBlocks merges adjacent text blocks cleanly", () => {
  const blocks = [
    { id: "1", type: "text", content: "Step 1" },
    { id: "2", type: "text", content: "Step 2" },
    { id: "3", type: "image", imageRef: "diag.webp", caption: "Diagram" },
  ];
  const merged = normalizeComposerBlocks(blocks);
  assert.equal(merged.length, 2);
  assert.equal(merged[0]?.type, "text");
  if (merged[0]?.type === "text") {
    assert.equal(merged[0].content, "Step 1\n\nStep 2");
  }
});

test("deduplicateFileName handles collisions case-insensitively and preserves extensions", () => {
  assert.equal(deduplicateFileName("img.webp", []), "img.webp");
  assert.equal(deduplicateFileName("img.webp", ["img.webp"]), "img-2.webp");
  assert.equal(
    deduplicateFileName("IMG.webp", ["img.webp", "img-2.webp"]),
    "IMG-3.webp"
  );
  assert.equal(deduplicateFileName("notes", ["notes"]), "notes-2");
});

test("getUnplacedImageAttachments filters placed inline images while preserving legacy galleries", () => {
  const attachments = [
    { id: "a1", file_name: "placed-1.webp", file_url: "https://cdn/1.webp" },
    { id: "a2", file_name: "legacy-2.webp", file_url: "https://cdn/2.webp" },
    { id: "a3", attachment_name: "placed 3.png", attachment_url: "https://cdn/3.png" },
  ];

  const bodyWithInline = [
    "Intro text",
    "![Diagram](e2e-img:placed-1.webp)",
    "More text",
    "![](e2e-img:placed%203.png)",
  ].join("\n\n");

  assert.deepEqual(extractInlineImageRefs(bodyWithInline), [
    "placed-1.webp",
    "placed 3.png",
  ]);
  assert.equal(
    resolveAttachmentForRef("PLACED-1.WEBP", attachments)?.id,
    "a1"
  );

  const unplaced = getUnplacedImageAttachments(bodyWithInline, attachments);
  assert.equal(unplaced.length, 1);
  assert.equal(unplaced[0]?.id, "a2");

  const legacyUnplaced = getUnplacedImageAttachments(
    "Plain text without inline tokens",
    attachments
  );
  assert.equal(legacyUnplaced.length, 3);
});

test("stripInlineImageTokens removes e2e-img markers for feed excerpts", () => {
  const body =
    "First paragraph.\n\n![Circle caption](e2e-img:circle.webp)\n\nSecond paragraph.";
  const stripped = stripInlineImageTokens(body);
  assert.ok(!stripped.includes("e2e-img:"));
  assert.ok(!stripped.includes("Circle caption"));
  assert.ok(stripped.includes("First paragraph."));
  assert.ok(stripped.includes("Second paragraph."));
});

