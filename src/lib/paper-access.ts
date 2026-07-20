import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type PaperRow = {
  key: string;
  mimeType: string;
  fileName: string | null;
};

// Access check shared by the paper route handlers (which don't run layout
// guards). Admins always pass; students only if they're an approved member of
// one of the exam's classrooms. Returns the paper row or an HTTP status to deny.
export async function getAccessiblePaper(
  examId: string,
): Promise<{ paper: PaperRow } | { error: 401 | 403 | 404 }> {
  const session = await auth();
  if (!session?.user) return { error: 401 };

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: { classrooms: { select: { id: true } }, paper: true },
  });
  if (!exam?.paper) return { error: 404 };

  if (session.user.role !== "ADMIN") {
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: session.user.id,
        status: "APPROVED",
        classroomId: { in: exam.classrooms.map((c) => c.id) },
      },
      select: { id: true },
    });
    if (!enrollment) return { error: 403 };
  }

  return {
    paper: {
      key: exam.paper.key,
      mimeType: exam.paper.mimeType,
      fileName: exam.paper.fileName,
    },
  };
}
