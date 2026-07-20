import { getFromR2 } from "@/lib/r2";
import { getAccessiblePaper } from "@/lib/paper-access";

// Streams a PDF exam's question paper. Route handlers don't run layout guards,
// so access is enforced in getAccessiblePaper.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ examId: string }> },
) {
  const { examId } = await params;
  const access = await getAccessiblePaper(examId);
  if ("error" in access) {
    return new Response("Denied", { status: access.error });
  }

  let bytes: Uint8Array;
  try {
    bytes = await getFromR2(access.paper.key);
  } catch {
    return new Response("Paper unavailable", { status: 502 });
  }

  // Copy into a plain ArrayBuffer so it's an unambiguous BodyInit.
  const body = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(body).set(bytes);

  return new Response(body, {
    headers: {
      "Content-Type": access.paper.mimeType,
      "Content-Disposition": `inline; filename="${
        access.paper.fileName ?? "question-paper.pdf"
      }"`,
      "Cache-Control": "private, no-store",
    },
  });
}
