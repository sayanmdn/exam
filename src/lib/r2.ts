import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Cloudflare R2 is S3-compatible. We talk to it with the AWS S3 SDK pointed at
// the account's R2 endpoint. Credentials come from the environment (.env):
//   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

export const R2_BUCKET = process.env.R2_BUCKET_NAME ?? "";

/** True when all R2 credentials are configured. */
export function isR2Configured() {
  return Boolean(
    accountId && accessKeyId && secretAccessKey && R2_BUCKET,
  );
}

let client: S3Client | null = null;

function r2(): S3Client {
  if (!isR2Configured()) {
    throw new Error(
      "Cloudflare R2 is not configured — set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET_NAME.",
    );
  }
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId as string,
        secretAccessKey: secretAccessKey as string,
      },
    });
  }
  return client;
}

/** Object key for an exam's question paper (deterministic — replaces cleanly). */
export function examPaperKey(examId: string) {
  return `exam-papers/${examId}.pdf`;
}

export async function uploadToR2(
  key: string,
  body: Buffer,
  contentType: string,
) {
  await r2().send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

/** Fetches an object's bytes from R2. */
export async function getFromR2(key: string): Promise<Uint8Array> {
  const res = await r2().send(
    new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }),
  );
  if (!res.Body) throw new Error("Empty object body");
  // SDK v3 stream helper — collects the object into a byte array.
  return res.Body.transformToByteArray();
}

export async function deleteFromR2(key: string) {
  await r2().send(
    new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }),
  );
}

/**
 * Presigns a PUT URL so the browser can upload a file straight to R2, bypassing
 * the app's serverless request-body limit. The client must send the same
 * Content-Type it was signed with.
 */
export async function presignPutUrl(
  key: string,
  contentType: string,
  expiresIn = 600,
) {
  return getSignedUrl(
    r2(),
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn },
  );
}
