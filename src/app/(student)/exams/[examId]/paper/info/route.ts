import { PDFDocument } from "pdf-lib";
import { getFromR2 } from "@/lib/r2";
import { getAccessiblePaper } from "@/lib/paper-access";

// Returns the page count and per-page dimensions of a PDF paper. The iOS viewer
// uses this to lay out one correctly-proportioned iframe per page.
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

  try {
    const doc = await PDFDocument.load(bytes, { updateMetadata: false });
    const sizes = doc.getPages().map((p) => {
      const { width, height } = p.getSize();
      return { w: width, h: height };
    });
    return Response.json(
      { pages: sizes.length, sizes },
      { headers: { "Cache-Control": "private, max-age=3600" } },
    );
  } catch {
    return new Response("Invalid PDF", { status: 502 });
  }
}
