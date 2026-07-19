"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

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

  if (!title) throw new Error("Title is required");
  if (classroomIds.length === 0) {
    throw new Error("Select at least one classroom");
  }

  const exam = await prisma.exam.create({
    data: {
      title,
      description: description || null,
      classrooms: { connect: classroomIds.map((id) => ({ id })) },
      categoryId: categoryId || null,
      durationMinutes: Number.isFinite(durationMinutes)
        ? Math.max(1, durationMinutes)
        : 60,
    },
  });
  revalidatePath("/admin/exams");
  redirect(`/admin/exams/${exam.id}`);
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
    include: { _count: { select: { questions: true } } },
  });
  if (!exam) throw new Error("Exam not found");
  if (!exam.isPublished && exam._count.questions === 0) {
    throw new Error("Add at least one question before publishing");
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
