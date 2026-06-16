import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSigV4Headers, r2Configured } from "../src/lib/r2.js";

// AWS's own published Signature V4 example ("GET Object" from the AWS docs). If our signer
// reproduces this exact signature, the SigV4 math is correct and safe to trust for R2.
// https://docs.aws.amazon.com/AmazonS3/latest/API/sig-v4-header-based-auth.html
test("buildSigV4Headers matches AWS's published GET-object signature", () => {
  const out = buildSigV4Headers({
    method: "GET",
    host: "examplebucket.s3.amazonaws.com",
    path: "/test.txt",
    query: "",
    region: "us-east-1",
    service: "s3",
    accessKeyId: "AKIAIOSFODNN7EXAMPLE",
    secretKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    payload: "", // empty body → e3b0c4... hash, as in the AWS example (Range request)
    amzDate: "20130524T000000Z",
    dateStamp: "20130524",
    headers: { range: "bytes=0-9" }
  });
  assert.equal(out._signedHeaders, "host;range;x-amz-content-sha256;x-amz-date");
  assert.equal(out._signature, "f0e8bdb87c964420e857bd35b5d6ed310bd44f0170aba48dd91039c6036bdb41");
  assert.match(out.authorization, /^AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE\/20130524\/us-east-1\/s3\/aws4_request/);
});

test("r2Configured requires all four credentials", () => {
  assert.equal(r2Configured({ accountId: "a", accessKeyId: "b", secretAccessKey: "c", bucket: "d" }), true);
  assert.equal(r2Configured({ accountId: "a", accessKeyId: "b", secretAccessKey: "c" }), false);
  assert.equal(r2Configured(null), false);
});

test("buildSigV4Headers always signs host + content-sha256 + date even with no extra headers", () => {
  const out = buildSigV4Headers({
    method: "PUT", host: "acct.r2.cloudflarestorage.com", path: "/bucket/key.gz",
    accessKeyId: "AK", secretKey: "SK", payload: Buffer.from("hello"),
    amzDate: "20260101T000000Z", dateStamp: "20260101"
  });
  assert.equal(out._signedHeaders, "host;x-amz-content-sha256;x-amz-date");
  assert.ok(out.authorization.includes("/auto/s3/aws4_request"), "R2 uses region 'auto'");
});
