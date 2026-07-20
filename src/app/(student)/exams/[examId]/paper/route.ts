import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getFromR2 } from "@/lib/r2";

// Streams a PDF exam's question paper. Route handlers don't run layout guards,
// so access is enforced here: admins always, students only if they're an
// approved member of one of the exam's classrooms.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ examId: string }> },
) {
  const { examId } = await params;
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: { classrooms: { select: { id: true } }, paper: true },
  });
  if (!exam?.paper) {
    return new Response("Not found", { status: 404 });
  }

  if (session.user.role !== "ADMIN") {
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: session.user.id,
        status: "APPROVED",
        classroomId: { in: exam.classrooms.map((c) => c.id) },
      },
      select: { id: true },
    });
    if (!enrollment) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  let bytes: Uint8Array;
  try {
    bytes = await getFromR2(exam.paper.key);
  } catch {
    return new Response("Paper unavailable", { status: 502 });
  }

  // Copy into a plain ArrayBuffer so it's an unambiguous BodyInit.
  const body = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(body).set(bytes);

  return new Response(body, {
    headers: {
      "Content-Type": exam.paper.mimeType,
      "Content-Disposition": `inline; filename="${
        exam.paper.fileName ?? "question-paper.pdf"
      }"`,
      "Cache-Control": "private, no-store",
    },
  });
}
