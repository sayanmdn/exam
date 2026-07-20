// One-off: configure CORS on the R2 bucket so the browser can PUT PDFs
// directly via presigned URLs.
//
// Run it with the app's env loaded:
//   node --env-file=.env scripts/setup-r2-cors.mjs
//
// Extra allowed origins can be passed as args:
//   node --env-file=.env scripts/setup-r2-cors.mjs https://staging.example.com
import { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } from "@aws-sdk/client-s3";

const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME } = process.env;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
  console.error("Missing R2_* env vars. Run with: node --env-file=.env scripts/setup-r2-cors.mjs");
  process.exit(1);
}

const origins = [
  "http://localhost:3000",
  "https://ntapattern.vercel.app",
  ...process.argv.slice(2),
];

const client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});

await client.send(
  new PutBucketCorsCommand({
    Bucket: R2_BUCKET_NAME,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedMethods: ["PUT", "GET"],
          AllowedOrigins: origins,
          AllowedHeaders: ["*"],
          ExposeHeaders: ["ETag"],
          MaxAgeSeconds: 3600,
        },
      ],
    },
  }),
);

const current = await client.send(new GetBucketCorsCommand({ Bucket: R2_BUCKET_NAME }));
console.log("✓ CORS applied to", R2_BUCKET_NAME);
console.log("Allowed origins:", origins.join(", "));
console.log(JSON.stringify(current.CORSRules, null, 2));
