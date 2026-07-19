/**
 * Seeds the portal with a demo classroom and a published sample exam so the
 * app has content the first time you log in. Users themselves are created via
 * Google sign-in, so this only seeds classrooms / categories / exams.
 *
 * Run with:  npm run db:seed
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.classroom.count();
  if (existing > 0) {
    console.log("Classrooms already exist — skipping seed.");
    return;
  }

  const classroom = await prisma.classroom.create({
    data: {
      name: "NEET Physics 2026",
      description:
        "Full-length and topic-wise physics mock tests for NEET aspirants.",
      categories: {
        create: [{ name: "Mechanics" }, { name: "Full Mock" }],
      },
    },
    include: { categories: true },
  });

  const mechanics = classroom.categories.find((c) => c.name === "Mechanics");

  await prisma.exam.create({
    data: {
      title: "Mechanics — Kinematics Quiz",
      description:
        "A short 5-question quiz on motion in a straight line. +4 for correct, −1 for wrong.",
      classrooms: { connect: { id: classroom.id } },
      categoryId: mechanics?.id ?? null,
      durationMinutes: 10,
      isPublished: true,
      questions: {
        create: [
          {
            text: "A body starts from rest and accelerates uniformly at 2 m/s². How far does it travel in 5 s?",
            optionA: "10 m",
            optionB: "25 m",
            optionC: "50 m",
            optionD: "20 m",
            correctOption: "B",
            order: 0,
          },
          {
            text: "The area under a velocity–time graph represents:",
            optionA: "Acceleration",
            optionB: "Displacement",
            optionC: "Jerk",
            optionD: "Force",
            correctOption: "B",
            order: 1,
          },
          {
            text: "A car moving at 20 m/s decelerates at 4 m/s². Time to stop?",
            optionA: "4 s",
            optionB: "80 s",
            optionC: "5 s",
            optionD: "0.2 s",
            correctOption: "C",
            order: 2,
          },
          {
            text: "Which quantity is a vector?",
            optionA: "Speed",
            optionB: "Distance",
            optionC: "Displacement",
            optionD: "Time",
            correctOption: "C",
            order: 3,
          },
          {
            text: "SI unit of acceleration is:",
            optionA: "m/s",
            optionB: "m/s²",
            optionC: "m²/s",
            optionD: "N",
            correctOption: "B",
            order: 4,
          },
        ],
      },
    },
  });

  console.log("✓ Seeded demo classroom and a published sample exam.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
