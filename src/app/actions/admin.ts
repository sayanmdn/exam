"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { uploadToR2, deleteFromR2, examPaperKey } from "@/lib/r2";

// --------------------------------------------------------------------------
// Classrooms
// --------------------------------------------------------------------------

export async function createClassroom(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!name) throw new Error("Name is required");

  await prisma.classroom.create({
    data: { name, description: description || null },
  });
  revalidatePath("/admin/classrooms");
}

export async function deleteClassroom(classroomId: string) {
  await requireAdmin();
  await prisma.classroom.delete({ where: { id: classroomId } });
  revalidatePath("/admin/classrooms");
}

export async function createCategory(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const classroomId = String(formData.get("classroomId") ?? "");
  if (!name || !classroomId) throw new Error("Missing fields");
  await prisma.category.create({ data: { name, classroomId } });
  revalidatePath("/admin/classrooms");
}

// --------------------------------------------------------------------------
// Student validation (account-level teacher approval)
// --------------------------------------------------------------------------

/**
 * Validates a student's account and, in the same step, enrolls them into the
 * classroom(s) the teacher selected. Classroom mapping is teacher-driven:
 * the student never picks their own classroom.
 */
export async function approveStudent(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const classroomIds = formData
    .getAll("classroomIds")
    .map((v) => String(v))
    .filter(Boolean);
  if (!userId) throw new Error("Missing student");

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { status: "APPROVED" },
    });
    for (const classroomId of classroomIds) {
      await tx.enrollment.upsert({
        where: { userId_classroomId: { userId, classroomId } },
        update: { status: "APPROVED" },
        create: { userId, classroomId, status: "APPROVED" },
      });
    }
  });

  revalidatePath("/admin/students");
  revalidatePath("/admin");
}

/** Rejects a student's validation request. */
export async function rejectStudent(userId: string) {
  await requireAdmin();
  await prisma.user.update({
    where: { id: userId },
    data: { status: "REJECTED" },
  });
  revalidatePath("/admin/students");
  revalidatePath("/admin");
}

/**
 * Sets a student's account status directly. `PENDING` sends an already-approved
 * student back to "unverified" so they lose portal access until re-approved.
 * Name, email and phone are never touched here — those stay owned by the student.
 */
export async function setStudentStatus(
  studentId: string,
  status: "APPROVED" | "REJECTED" | "PENDING",
) {
  await requireAdmin();
  await prisma.user.update({
    where: { id: studentId },
    data: { status },
  });
  revalidatePath("/admin/students");
  revalidatePath(`/admin/students/${studentId}`);
  revalidatePath("/admin");
}

/**
 * Replaces the set of classrooms a student is enrolled in. Checked classrooms
 * become APPROVED enrollments; unchecked ones are removed. Teacher-driven only.
 */
export async function setStudentClassrooms(
  studentId: string,
  formData: FormData,
) {
  await requireAdmin();
  const classroomIds = formData
    .getAll("classroomIds")
    .map((v) => String(v))
    .filter(Boolean);

  const all = await prisma.classroom.findMany({ select: { id: true } });

  await prisma.$transaction(async (tx) => {
    for (const c of all) {
      if (classroomIds.includes(c.id)) {
        await tx.enrollment.upsert({
          where: {
            userId_classroomId: { userId: studentId, classroomId: c.id },
          },
          update: { status: "APPROVED" },
          create: { userId: studentId, classroomId: c.id, status: "APPROVED" },
        });
      } else {
        await tx.enrollment.deleteMany({
          where: { userId: studentId, classroomId: c.id },
        });
      }
    }
  });

  revalidatePath(`/admin/students/${studentId}`);
  revalidatePath("/admin/students");
}

// --------------------------------------------------------------------------
// Enrollments (student approval)
// --------------------------------------------------------------------------

export async function setEnrollmentStatus(
  enrollmentId: string,
  status: "APPROVED" | "REJECTED",
) {
  await requireAdmin();
  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: { status },
  });
  revalidatePath("/admin/students");
  revalidatePath("/admin");
}

// --------------------------------------------------------------------------
// Exams
// --------------------------------------------------------------------------

// Placeholder rows for a PDF exam. The real question text/options live in the
// uploaded paper; here we only need one row per question to hang the student's
// selected option and (optionally) an answer key off. "" correctOption means
// "not keyed yet" — such questions stay ungraded.
function pdfQuestionRows(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    text: `Question ${i + 1}`,
    optionA: "A",
    optionB: "B",
    optionC: "C",
    optionD: "D",
    correctOption: "",
    order: i,
  }));
}

export async function createExam(formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const classroomIds = formData
    .getAll("classroomIds")
    .map((v) => String(v))
    .filter(Boolean);
  const categoryId = String(formData.get("categoryId") ?? "");
  const durationMinutes = Number(formData.get("durationMinutes") ?? 60);
  const type = formData.get("type") === "PDF" ? "PDF" : "MANUAL";
  const numberOfQuestions = Number(formData.get("numberOfQuestions") ?? 0);

  if (!title) throw new Error("Title is required");
  if (classroomIds.length === 0) {
    throw new Error("Select at least one classroom");
  }
  if (type === "PDF" && (!Number.isFinite(numberOfQuestions) || numberOfQuestions < 1)) {
    throw new Error("Enter how many questions the paper has");
  }

  const exam = await prisma.exam.create({
    data: {
      title,
      description: description || null,
      type,
      classrooms: { connect: classroomIds.map((id) => ({ id })) },
      categoryId: categoryId || null,
      durationMinutes: Number.isFinite(durationMinutes)
        ? Math.max(1, durationMinutes)
        : 60,
      ...(type === "PDF"
        ? {
            questions: {
              create: pdfQuestionRows(Math.min(numberOfQuestions, 200)),
            },
          }
        : {}),
    },
  });
  revalidatePath("/admin/exams");
  redirect(`/admin/exams/${exam.id}`);
}

/** Uploads (or replaces) the PDF question paper for a PDF-type exam. */
export async function uploadExamPaper(examId: string, formData: FormData) {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Choose a PDF file to upload");
  }
  if (file.type !== "application/pdf") {
    throw new Error("The question paper must be a PDF");
  }
  // The upload passes through the Server Action, so it's bound by Vercel's
  // ~4.5MB serverless request cap even though it lands in R2.
  if (file.size > 4 * 1024 * 1024) {
    throw new Error("PDF is too large — please keep it under 4 MB");
  }

  const key = examPaperKey(examId);
  const body = Buffer.from(await file.arrayBuffer());
  await uploadToR2(key, body, file.type);

  await prisma.examPaper.upsert({
    where: { examId },
    update: { key, mimeType: file.type, fileName: file.name, size: file.size },
    create: {
      examId,
      key,
      mimeType: file.type,
      fileName: file.name,
      size: file.size,
    },
  });
  revalidatePath(`/admin/exams/${examId}`);
}

/** Adjusts how many questions a PDF paper has, syncing the placeholder rows. */
export async function setPaperQuestionCount(examId: string, formData: FormData) {
  await requireAdmin();
  const count = Math.min(Math.max(Number(formData.get("count") ?? 0), 1), 200);
  if (!Number.isFinite(count)) throw new Error("Enter a valid number");

  const existing = await prisma.question.findMany({
    where: { examId },
    orderBy: { order: "asc" },
    select: { id: true },
  });

  if (count < existing.length) {
    const remove = existing.slice(count).map((q) => q.id);
    await prisma.question.deleteMany({ where: { id: { in: remove } } });
  } else if (count > existing.length) {
    await prisma.question.createMany({
      data: pdfQuestionRows(count)
        .slice(existing.length)
        .map((q) => ({ ...q, examId })),
    });
  }
  revalidatePath(`/admin/exams/${examId}`);
}

/** Saves the answer key for a PDF exam (option per question, blank = unkeyed). */
export async function setAnswerKey(examId: string, formData: FormData) {
  await requireAdmin();
  const questions = await prisma.question.findMany({
    where: { examId },
    select: { id: true },
  });

  await prisma.$transaction(
    questions.map((q) => {
      const raw = String(formData.get(`key-${q.id}`) ?? "");
      const correctOption = ["A", "B", "C", "D"].includes(raw) ? raw : "";
      return prisma.question.update({
        where: { id: q.id },
        data: { correctOption },
      });
    }),
  );
  revalidatePath(`/admin/exams/${examId}`);
}

/** Replaces the set of classrooms an exam is accessible in. */
export async function setExamClassrooms(examId: string, formData: FormData) {
  await requireAdmin();
  const classroomIds = formData
    .getAll("classroomIds")
    .map((v) => String(v))
    .filter(Boolean);

  if (classroomIds.length === 0) {
    throw new Error("Select at least one classroom");
  }

  await prisma.exam.update({
    where: { id: examId },
    data: {
      // `set` replaces all existing links with exactly this list.
      classrooms: { set: classroomIds.map((id) => ({ id })) },
    },
  });
  revalidatePath(`/admin/exams/${examId}`);
  revalidatePath("/admin/exams");
}

export async function toggleExamPublished(examId: string) {
  await requireAdmin();
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: { _count: { select: { questions: true } }, paper: true },
  });
  if (!exam) throw new Error("Exam not found");
  if (!exam.isPublished) {
    if (exam.type === "PDF") {
      if (!exam.paper) {
        throw new Error("Upload the question paper before publishing");
      }
    } else if (exam._count.questions === 0) {
      throw new Error("Add at least one question before publishing");
    }
  }
  await prisma.exam.update({
    where: { id: examId },
    data: { isPublished: !exam.isPublished },
  });
  revalidatePath("/admin/exams");
  revalidatePath(`/admin/exams/${examId}`);
}

export async function deleteExam(examId: string) {
  await requireAdmin();
  // Remove the R2 object (if any) before the row cascades away.
  const paper = await prisma.examPaper.findUnique({
    where: { examId },
    select: { key: true },
  });
  if (paper) {
    try {
      await deleteFromR2(paper.key);
    } catch {
      // Best effort — don't block deletion if the object is already gone.
    }
  }
  await prisma.exam.delete({ where: { id: examId } });
  revalidatePath("/admin/exams");
  redirect("/admin/exams");
}

export async function addQuestion(formData: FormData) {
  await requireAdmin();
  const examId = String(formData.get("examId") ?? "");
  const text = String(formData.get("text") ?? "").trim();
  const optionA = String(formData.get("optionA") ?? "").trim();
  const optionB = String(formData.get("optionB") ?? "").trim();
  const optionC = String(formData.get("optionC") ?? "").trim();
  const optionD = String(formData.get("optionD") ?? "").trim();
  const correctOption = String(formData.get("correctOption") ?? "A");
  const marks = Number(formData.get("marks") ?? 4);
  const negativeMarks = Number(formData.get("negativeMarks") ?? 1);

  if (!examId || !text || !optionA || !optionB || !optionC || !optionD) {
    throw new Error("All question fields are required");
  }

  const count = await prisma.question.count({ where: { examId } });
  await prisma.question.create({
    data: {
      examId,
      text,
      optionA,
      optionB,
      optionC,
      optionD,
      correctOption: ["A", "B", "C", "D"].includes(correctOption)
        ? correctOption
        : "A",
      marks: Number.isFinite(marks) ? marks : 4,
      negativeMarks: Number.isFinite(negativeMarks) ? negativeMarks : 1,
      order: count,
    },
  });
  revalidatePath(`/admin/exams/${examId}`);
}

export async function deleteQuestion(questionId: string, examId: string) {
  await requireAdmin();
  await prisma.question.delete({ where: { id: questionId } });
  revalidatePath(`/admin/exams/${examId}`);
}
