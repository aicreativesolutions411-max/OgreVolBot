import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertPinataAuthWorks,
  assertPinataConfigured,
  cleanToken,
  makePinataAuthHeader,
  pinataProviderError,
  safePinataDiagnostics,
  uploadImage,
  uploadJsonMetadata
} from "../src/lib/pinataMetadata.js";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("missing PUMP_LAUNCH_PINATA_JWT returns config error before provider call", () => {
  assert.throws(
    () => assertPinataConfigured({ tokenValue: "", metadataUrl: "https://uploads.pinata.cloud/v3/files" }),
    (error) => error.code === "PUMP_METADATA_CONFIG_MISSING"
  );
});

test("placeholder Pinata JWT returns config error before provider call", () => {
  assert.throws(
    () => assertPinataConfigured({ tokenValue: "your-pinata-jwt", metadataUrl: "https://uploads.pinata.cloud/v3/files" }),
    (error) => error.code === "PUMP_METADATA_CONFIG_PLACEHOLDER"
  );
});

test("Pinata token with accidental quotes is cleaned", () => {
  assert.equal(cleanToken('"abc.def.ghi"'), "abc.def.ghi");
  assert.equal(makePinataAuthHeader('"abc.def.ghi"').Authorization, "Bearer abc.def.ghi");
});

test("Pinata token with whitespace or newline is cleaned", () => {
  assert.equal(cleanToken(" \nabc.def.ghi\r\n "), "abc.def.ghi");
  assert.equal(makePinataAuthHeader(" \nabc.def.ghi\r\n ").Authorization, "Bearer abc.def.ghi");
});

test("Pinata token with Bearer prefix does not create duplicate Bearer header", () => {
  assert.equal(cleanToken("Bearer abc.def.ghi"), "abc.def.ghi");
  assert.equal(makePinataAuthHeader("Bearer abc.def.ghi").Authorization, "Bearer abc.def.ghi");
});

test("Pinata auth header is exactly Authorization Bearer token", () => {
  assert.deepEqual(makePinataAuthHeader("abc.def.ghi"), {
    Authorization: "Bearer abc.def.ghi"
  });
});

test("Pinata provider 401/403 is classified as metadata auth failure", () => {
  const providerError = new Error("Not Authorized");
  providerError.status = 401;
  providerError.responseBody = '{"error":"Not Authorized"}';

  const error = pinataProviderError(providerError);

  assert.equal(error.code, "PUMP_METADATA_AUTH_FAILED");
  assert.equal(error.providerStatus, 401);
  assert.equal(error.stage, "metadata_upload");
});

test("Pinata testAuthentication sends exact cleaned Authorization header", async () => {
  let observed = null;
  const result = await assertPinataAuthWorks({
    tokenValue: "Bearer abc.def.ghi",
    fetchImpl: async (url, options) => {
      observed = { url, options };
      return {
        ok: true,
        status: 200,
        text: async () => '{"message":"Congratulations! You are communicating with the Pinata API!"}'
      };
    }
  });

  assert.equal(result.ok, true);
  assert.equal(observed.options.headers.Authorization, "Bearer abc.def.ghi");
});

test("Pinata testAuthentication 401 maps to metadata auth failure without leaking JWT", async () => {
  await assert.rejects(
    () => assertPinataAuthWorks({
      tokenValue: "Bearer abc.def.ghi",
      fetchImpl: async () => ({
        ok: false,
        status: 401,
        text: async () => '{"error":"Not Authorized","token":"abc.def.ghi"}'
      })
    }),
    (error) => {
      assert.equal(error.code, "PUMP_METADATA_AUTH_FAILED");
      assert.equal(error.providerStatus, 401);
      assert.doesNotMatch(JSON.stringify(error), /abc\.def\.ghi/);
      return true;
    }
  );
});

test("safe Pinata diagnostics never include the secret token", () => {
  const diagnostics = safePinataDiagnostics("Bearer secret.jwt.value");
  const serialized = JSON.stringify(diagnostics);

  assert.equal(diagnostics.tokenPresent, true);
  assert.equal(diagnostics.tokenLength, "secret.jwt.value".length);
  assert.doesNotMatch(serialized, /secret\.jwt\.value/);
  assert.doesNotMatch(serialized, /Bearer secret/);
});

test("Pump metadata image and JSON uploads use the shared cleaned auth helper", async () => {
  const source = await fs.readFile(path.join(rootDir, "src", "index.js"), "utf8");
  const helperSource = await fs.readFile(path.join(rootDir, "src", "lib", "pinataMetadata.js"), "utf8");

  assert.match(source, /const pinataConfig = assertPinataConfigured/);
  assert.match(source, /await assertPinataAuthWorks/);
  assert.match(source, /await uploadImage/);
  assert.match(source, /await uploadJsonMetadata/);
  assert.doesNotMatch(source, /Authorization:\s*`Bearer \$\{CONFIG\.pumpLaunchPinataJwt\}`/);
  assert.equal((helperSource.match(/headers: config\.authHeader/g) || []).length, 1);
  assert.equal((helperSource.match(/form\.append\("network", "public"\)/g) || []).length, 1);
});

test("Pinata debug and smoke commands are available", async () => {
  const packageJson = JSON.parse(await fs.readFile(path.join(rootDir, "package.json"), "utf8"));
  const smokeSource = await fs.readFile(path.join(rootDir, "scripts", "smoke-pump-pinata-upload.js"), "utf8");

  assert.equal(packageJson.scripts["debug:pump-pinata"], "node scripts/debug-pump-metadata.js");
  assert.equal(packageJson.scripts["smoke:pump-pinata-upload"], "node scripts/smoke-pump-pinata-upload.js");
  assert.equal(packageJson.scripts["debug:metadata-provider"], "node scripts/debug-pump-metadata.js");
  assert.equal(packageJson.scripts["smoke:metadata-upload"], "node scripts/smoke-pump-pinata-upload.js");
  assert.match(smokeSource, /assertPinataAuthWorks/);
  assert.match(smokeSource, /uploadJsonMetadata/);
  assert.doesNotMatch(smokeSource, /console\.log\(.*tokenValue/);
});

test("Pinata JSON metadata upload returns CID and public metadata URI", async () => {
  let observed = null;
  const result = await uploadJsonMetadata({
    metadata: { name: "Smoke", symbol: "SMK" },
    filename: "smoke.json",
    tokenValue: "Bearer abc.def.ghi",
    metadataUrl: "https://uploads.pinata.cloud/v3/files",
    fetchImpl: async (url, options) => {
      observed = { url, options };
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ data: { cid: "bafybeismoke" } })
      };
    }
  });

  assert.equal(observed.url, "https://uploads.pinata.cloud/v3/files");
  assert.equal(observed.options.headers.Authorization, "Bearer abc.def.ghi");
  assert.equal(observed.options.body.get("network"), "public");
  assert.equal(result.cid, "bafybeismoke");
  assert.equal(result.uri, "https://gateway.pinata.cloud/ipfs/bafybeismoke");
});

test("Pinata image upload uses same auth helper and public network", async () => {
  let observed = null;
  const result = await uploadImage({
    image: {
      buffer: Buffer.from("png"),
      filename: "token.png",
      contentType: "image/png"
    },
    tokenValue: "Bearer abc.def.ghi",
    metadataUrl: "https://uploads.pinata.cloud/v3/files",
    fetchImpl: async (url, options) => {
      observed = { url, options };
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ data: { cid: "bafybeiimage" } })
      };
    }
  });

  assert.equal(observed.options.headers.Authorization, "Bearer abc.def.ghi");
  assert.equal(observed.options.body.get("network"), "public");
  assert.equal(result.imageUri, "https://gateway.pinata.cloud/ipfs/bafybeiimage");
  assert.equal(result.imageBytes, 3);
});
