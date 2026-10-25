import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5433/online_exam";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database for Random Picker & Interactive Quiz Platform...");

  // Delete existing data
  await prisma.leaderboardSnapshot.deleteMany();
  await prisma.participantAnswer.deleteMany();
  await prisma.participant.deleteMany();
  await prisma.quizSession.deleteMany();
  await prisma.quizQuestion.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.randomPickHistory.deleteMany();
  await prisma.questionLink.deleteMany();
  await prisma.questionAttachment.deleteMany();
  await prisma.questionOption.deleteMany();
  await prisma.question.deleteMany();
  await prisma.randomPickerSettings.deleteMany();
  await prisma.randomPicker.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create Author User
  const hashedPassword = await bcryptjs.hash("Author123!", 10);
  const author = await prisma.user.create({
    data: {
      name: "Budi Santoso, M.Kom.",
      email: "author@example.com",
      password: hashedPassword,
      role: "AUTHOR",
    },
  });

  console.log(`Created author user: ${author.email}`);

  // 2. Create Published Random Picker
  const picker = await prisma.randomPicker.create({
    data: {
      authorId: author.id,
      title: "Random Picker Soal Informatika",
      description: "Kumpulan 20 soal latihan mata kuliah Dasar Informatika & Pemrograman. Tekan Shuffle untuk mendapatkan pertanyaan acak.",
      slug: "informatika-dasar",
      status: "PUBLISHED",
      publishedAt: new Date(),
      settings: {
        create: {
          allowRepeat: true,
          preventImmediateRepeat: true,
          noRepeatUntilAllShown: false,
          showQuestionNumber: true,
          showAttachments: true,
          showLinks: true,
        },
      },
    },
  });

  const sampleQuestions = [
    {
      content: "Apa yang dimaksud dengan algoritma dalam pemrograman komputer?",
      options: [
        { text: "Urutan langkah logis dan sistematis untuk menyelesaikan masalah", isCorrect: true },
        { text: "Bahasa pemrograman yang dipakai komputer", isCorrect: false },
        { text: "Perangkat keras penyimpan data", isCorrect: false },
        { text: "Kumpulan warna pada antarmuka aplikasi", isCorrect: false },
      ],
    },
    {
      content: "Jelaskan perbedaan utama antara Database Relasional (SQL) dan Non-Relasional (NoSQL)!",
      options: [
        { text: "SQL menyimpan data dalam tabel dengan skema tetap, NoSQL fleksibel (dokumen/key-value)", isCorrect: true },
        { text: "SQL hanya untuk gambar, NoSQL hanya untuk teks", isCorrect: false },
        { text: "Keduanya identik dan bisa saling menggantikan tanpa perbedaan", isCorrect: false },
        { text: "NoSQL tidak dapat menyimpan data sama sekali", isCorrect: false },
      ],
    },
    {
      content: "Apa fungsi utama dari protokol HTTP / HTTPS dalam komunikasi web?",
      options: [
        { text: "Mentransfer data antara browser dan server, HTTPS menambah enkripsi TLS", isCorrect: true },
        { text: "Mengompresi gambar menjadi format JPEG", isCorrect: false },
        { text: "Mengatur daya listrik perangkat jaringan", isCorrect: false },
        { text: "Menjalankan sistem operasi server", isCorrect: false },
      ],
    },
    {
      content: "Sebutkan dan jelaskan 4 pilar utama Object-Oriented Programming (OOP)!",
      options: [
        { text: "Encapsulation, Inheritance, Polymorphism, Abstraction", isCorrect: true },
        { text: "Compile, Link, Run, Debug", isCorrect: false },
        { text: "Select, Insert, Update, Delete", isCorrect: false },
        { text: "HTML, CSS, JavaScript, JSON", isCorrect: false },
      ],
    },
    {
      content: "Apa yang dimaksud dengan REST API dan jelaskan prinsip dasar arsitekturnya!",
      options: [
        { text: "API berbasis HTTP dengan resource ber-URI dan metode GET/POST/PUT/DELETE yang stateless", isCorrect: true },
        { text: "Basis data relasional yang menyimpan tabel", isCorrect: false },
        { text: "Bahasa markup untuk menyusun halaman web", isCorrect: false },
        { text: "Protokol transfer file bernama FTP", isCorrect: false },
      ],
    },
  ];

  for (let i = 0; i < sampleQuestions.length; i++) {
    await prisma.question.create({
      data: {
        randomPickerId: picker.id,
        content: sampleQuestions[i].content,
        position: i + 1,
        isActive: true,
        type: "MULTIPLE_CHOICE",
        options: {
          create: sampleQuestions[i].options.map((opt, pos) => ({
            text: opt.text,
            isCorrect: opt.isCorrect,
            position: pos + 1,
          })),
        },
      },
    });
  }

  // 3. Create Interactive Quiz ("Quiz Interaktif Komputer & Jaringan")
  const quiz = await prisma.quiz.create({
    data: {
      authorId: author.id,
      title: "Quiz Interaktif Komputer & Jaringan",
      description: "Kuis interaktif berhadiah skor & bonus kecepatan. Uji pengetahuan Anda seputar jaringan dan dasar komputer!",
      slug: "quiz-komputer",
      status: "PUBLISHED",
      mode: "LIVE",
      publishedAt: new Date(),
    },
  });

  // Create Quiz Questions with options
  const quizQuestionsData = [
    {
      type: "MULTIPLE_CHOICE" as const,
      content: "Apa ibu kota Indonesia yang baru di Kalimantan Timur?",
      explanation: "Ibu Kota Nusantara (IKN) terletak di Kabupaten Penajam Paser Utara, Kalimantan Timur.",
      points: 100,
      timeLimit: 30,
      options: [
        { text: "Jakarta", isCorrect: false },
        { text: "Nusantara (IKN)", isCorrect: true },
        { text: "Bandung", isCorrect: false },
        { text: "Surabaya", isCorrect: false },
      ],
    },
    {
      type: "MULTIPLE_SELECT" as const,
      content: "Mana saja yang termasuk bahasa pemrograman yang populer?",
      explanation: "Python dan Java adalah bahasa pemrograman, sedangkan HTML & CSS adalah bahasa markup dan styling.",
      points: 100,
      timeLimit: 30,
      options: [
        { text: "Python", isCorrect: true },
        { text: "HTML", isCorrect: false },
        { text: "Java", isCorrect: true },
        { text: "CSS", isCorrect: false },
      ],
    },
    {
      type: "TRUE_FALSE" as const,
      content: "Protokol HTTPS menggunakan enkripsi SSL/TLS untuk keamanan jaringan.",
      explanation: "Benar, HTTPS mengamankan transmisi data menggunakan sertifikat SSL/TLS.",
      points: 100,
      timeLimit: 20,
      options: [
        { text: "True", isCorrect: true },
        { text: "False", isCorrect: false },
      ],
    },
    {
      type: "SHORT_ANSWER" as const,
      content: "Siapakah nama pencipta bahasa pemrograman Python?",
      explanation: "Python diciptakan oleh Guido van Rossum pada tahun 1991.",
      points: 100,
      timeLimit: 30,
      options: [
        { text: "Guido van Rossum", isCorrect: true },
        { text: "Guido Van Rossum", isCorrect: true },
      ],
    },
  ];

  for (let i = 0; i < quizQuestionsData.length; i++) {
    const qData = quizQuestionsData[i];
    const q = await prisma.question.create({
      data: {
        type: qData.type,
        content: qData.content,
        explanation: qData.explanation,
        options: {
          create: qData.options.map((opt, pos) => ({
            text: opt.text,
            isCorrect: opt.isCorrect,
            position: pos + 1,
          })),
        },
      },
    });

    await prisma.quizQuestion.create({
      data: {
        quizId: quiz.id,
        questionId: q.id,
        position: i + 1,
        points: qData.points,
        timeLimit: qData.timeLimit,
      },
    });
  }

  // 4. Create Live Quiz Session with Join Code A7K92
  const session = await prisma.quizSession.create({
    data: {
      quizId: quiz.id,
      joinCode: "A7K92",
      status: "WAITING",
    },
  });

  console.log(`Created interactive quiz: ${quiz.title} (slug: ${quiz.slug})`);
  console.log(`Created live quiz session with Join Code: ${session.joinCode}`);
  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
