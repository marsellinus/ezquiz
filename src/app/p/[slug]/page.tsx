import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { PublicShuffleClient } from "@/components/public/PublicShuffleClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const picker = await prisma.randomPicker.findUnique({
    where: { slug },
    select: { title: true, description: true, status: true },
  });

  if (!picker || picker.status !== "PUBLISHED") {
    return {
      title: "Random Picker Not Found",
    };
  }

  return {
    title: `${picker.title} | RANDOM PICKER SOAL`,
    description: picker.description || "Tekan Shuffle untuk mendapatkan soal secara acak.",
  };
}

export default async function PublicPickerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const picker = await prisma.randomPicker.findUnique({
    where: { slug },
    select: {
      title: true,
      description: true,
      slug: true,
      status: true,
    },
  });

  if (!picker || picker.status !== "PUBLISHED") {
    return notFound();
  }

  return (
    <PublicShuffleClient
      picker={{
        title: picker.title,
        description: picker.description,
        slug: picker.slug,
      }}
    />
  );
}
