import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import {
  decodeLaunchImageDataUrl,
  detectLaunchImageMime,
  processLaunchImage
} from "../src/lib/launchImageProcessor.js";

async function sampleImage(format = "png") {
  const source = sharp({
    create: {
      width: 40,
      height: 24,
      channels: 4,
      background: { r: 57, g: 255, b: 20, alpha: 1 }
    }
  });
  if (format === "jpeg") return source.jpeg().toBuffer();
  if (format === "webp") return source.webp().toBuffer();
  return source.png().toBuffer();
}

test("PNG launch image resizes to a square upload image", async () => {
  const buffer = await sampleImage("png");
  const result = await processLaunchImage({
    buffer,
    filename: "token.PNG",
    contentType: "application/octet-stream"
  }, {
    outputSize: 128
  });

  assert.equal(result.detectedMime, "image/png");
  assert.equal(result.outputWidth, 128);
  assert.equal(result.outputHeight, 128);
  assert.equal(result.contentType, "image/png");
  assert.ok(result.outputBytes > 0);
});

test("JPEG launch image auto-orients and resizes", async () => {
  const buffer = await sampleImage("jpeg");
  const result = await processLaunchImage({
    buffer,
    filename: "phone-photo.jpg",
    contentType: "image/jpeg"
  }, {
    outputSize: 128
  });

  assert.equal(result.detectedMime, "image/jpeg");
  assert.equal(result.outputWidth, 128);
  assert.equal(result.outputHeight, 128);
  assert.equal(result.contentType, "image/jpeg");
});

test("WEBP launch image converts through backend processing", async () => {
  const buffer = await sampleImage("webp");
  const result = await processLaunchImage({
    buffer,
    filename: "screen.webp",
    contentType: ""
  }, {
    outputSize: 128
  });

  assert.equal(result.detectedMime, "image/webp");
  assert.equal(result.outputWidth, 128);
  assert.equal(result.outputHeight, 128);
});

test("wrong extension but valid image bytes still works", async () => {
  const buffer = await sampleImage("png");
  const result = await processLaunchImage({
    buffer,
    filename: "wrong.txt",
    contentType: ""
  }, {
    outputSize: 128
  });

  assert.equal(result.detectedMime, "image/png");
  assert.equal(result.outputWidth, 128);
});

test("data URL decoder accepts common phone image MIME strings", () => {
  const decoded = decodeLaunchImageDataUrl("data:image/heic;base64,AAAAIGZ0eXBoZWlj", {
    imageName: "phone.HEIC",
    symbol: "PHN"
  });

  assert.equal(decoded.reportedMime, "image/heic");
  assert.equal(decoded.originalFilename, "phone.HEIC");
  assert.equal(detectLaunchImageMime(decoded.buffer, decoded), "image/heif");
});

test("corrupt image returns a safe decode error and does not continue", async () => {
  await assert.rejects(
    () => processLaunchImage({
      buffer: Buffer.from("not an image"),
      filename: "bad.png",
      contentType: "image/png"
    }),
    (error) => {
      assert.equal(error.code, "PUMP_LAUNCH_IMAGE_DECODE_FAILED");
      assert.equal(error.stage, "metadata_upload");
      return true;
    }
  );
});

test("SVG is rejected clearly instead of being uploaded unsanitized", async () => {
  await assert.rejects(
    () => processLaunchImage({
      buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'),
      filename: "bad.svg",
      contentType: "image/svg+xml"
    }),
    (error) => {
      assert.equal(error.code, "PUMP_LAUNCH_IMAGE_UNSUPPORTED");
      assert.match(error.message, /SVG token images are not accepted/);
      return true;
    }
  );
});
