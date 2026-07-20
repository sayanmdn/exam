import { PDFDocument } from "pdf-lib";
import { getFromR2 } from "@/lib/r2";
import { getAccessiblePaper } from "@/lib/paper-access";

// Returns a single page of the PDF paper as its own one-page PDF. iOS/WebKit
// only renders the first page of a multi-page PDF in an <iframe>, so the iOS
// viewer stacks one iframe per page, each pointing here.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ examId: string; n: string }> },
) {
  const { examId, n } = await params;
  const access = await getAccessiblePaper(examId);
  if ("error" in access) {
    return new Response("Denied", { status: access.error });
  }

  const pageNum = Number.parseInt(n, 10);
  if (!Number.isInteger(pageNum) || pageNum < 1) {
    return new Response("Bad page", { status: 400 });
  }

  let bytes: Uint8Array;
  try {
    bytes = await getFromR2(access.paper.key);
  } catch {
    return new Response("Paper unavailable", { status: 502 });
  }

  let outBytes: Uint8Array;
  try {
    const src = await PDFDocument.load(bytes);
    if (pageNum > src.getPageCount()) {
      return new Response("Not found", { status: 404 });
    }
    const out = await PDFDocument.create();
    const [copied] = await out.copyPages(src, [pageNum - 1]);
    out.addPage(copied);
    outBytes = await out.save();
  } catch {
    return new Response("Invalid PDF", { status: 502 });
  }

  const body = new ArrayBuffer(outBytes.byteLength);
  new Uint8Array(body).set(outBytes);

  return new Response(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="page-${pageNum}.pdf"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
