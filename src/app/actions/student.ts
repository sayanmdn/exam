"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";
import { gradeAttempt } from "@/lib/grading";

export async function requestEnrollment(classroomId: string) {
  const user = await requireUser();
  await prisma.enrollment.upsert({
    where: {
      userId_classroomId: { userId: user.id, classroomId },
    },
    // Re-requesting after rejection resets to pending.
    update: { status: "PENDING" },
    create: { userId: user.id, classroomId, status: "PENDING" },
  });
  revalidatePath("/classrooms");
}

/**
 * Onboarding step for a brand-new (unverified) student. Captures their name
 * and phone, marks the profile complete, and hands them off to the "pending
 * validation" screen where they wait for a teacher's approval.
 */
export async function completeProfile(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (!name) throw new Error("Your name is required");
  if (!phone) throw new Error("A phone number is required");

  await prisma.user.update({
    where: { id: user.id },
    data: { name, phone, profileCompleted: true },
  });
  revalidatePath("/pending");
  redirect("/pending");
}

export async function updateProfile(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: name || undefined,
      phone: phone || null,
    },
  });
  revalidatePath("/profile");
}

/**
 * Starts (or resumes) an attempt for an exam the student is entitled to take.
 * Returns the attempt id so the caller can navigate to the test screen.
 */
export async function startAttempt(examId: string) {
  const user = await requireUser();

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      _count: { select: { questions: true } },
      classrooms: { select: { id: true } },
    },
  });
  if (!exam || !exam.isPublished) throw new Error("Exam not available");

  // Must be an approved member of at least one of the exam's classrooms.
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId: user.id,
      status: "APPROVED",
      classroomId: { in: exam.classrooms.map((c) => c.id) },
    },
  });
  if (!enrollment) {
    throw new Error("You are not approved for this exam's classroom");
  }

  // Resume an in-progress attempt if one exists.
  const existing = await prisma.attempt.findFirst({
    where: { userId: user.id, examId, submittedAt: null },
  });
  if (existing) {
    redirect(`/exams/${examId}/attempt/${existing.id}`);
  }

  const attempt = await prisma.attempt.create({
    data: {
      userId: user.id,
      examId,
      totalQuestions: exam._count.questions,
    },
  });
  redirect(`/exams/${examId}/attempt/${attempt.id}`);
}

/** Submits an attempt with the collected responses and grades it. */
export async function submitAttempt(
  attemptId: string,
  responses: Record<string, string | null>,
) {
  const user = await requireUser();
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
  });
  if (!attempt || attempt.userId !== user.id) {
    throw new Error("Attempt not found");
  }
  await gradeAttempt(attemptId, responses);
  revalidatePath("/results");
  return { ok: true };
}
