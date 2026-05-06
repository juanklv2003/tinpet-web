require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed knowledge");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding knowledge...");

  const knowledge = [
    {
      title: "Qué es TinPet Web",
      content:
        "TinPet Web es un lugar donde las personas pueden conocer mascotas que buscan hogar y donde los refugios pueden mostrar sus animales de una forma clara y ordenada. La idea es que todo sea simple: ver mascotas, guardarlas, escribir al refugio y dar el siguiente paso sin enredos.",
      category: "overview",
    },
    {
      title: "Cómo funciona para quien quiere adoptar",
      content:
        "Si quieres adoptar, primero completas tu perfil y luego exploras las mascotas disponibles. Cuando una te gusta, puedes marcarla como favorita. Si hay interés de ambas partes, se abre una conversación con el refugio para coordinar visitas, hacer preguntas y avanzar con la adopción.",
      category: "faq",
    },
    {
      title: "Cómo funciona para refugios",
      content:
        "Los refugios pueden mostrar sus mascotas, actualizar la información de cada una y responder mensajes de personas interesadas. También pueden cambiar el estado de una mascota cuando ya fue adoptada o cuando deja de estar disponible.",
      category: "features",
    },
    {
      title: "Qué puede hacer una persona en su cuenta",
      content:
        "Cada persona puede crear su perfil, editar sus datos, ver las mascotas que le interesan, guardar favoritas y seguir la conversación con el refugio desde un mismo lugar. La idea es que no tenga que andar buscando por varios sitios.",
      category: "features",
    },
    {
      title: "Qué pasa cuando una mascota recibe interés",
      content:
        "Cuando una mascota llama la atención de alguien, TinPet Web permite guardar ese interés y empezar una charla con el refugio si corresponde. Así se evita perder mensajes y todo queda más ordenado para ambas partes.",
      category: "features",
    },
    {
      title: "Cómo se habla con el refugio",
      content:
        "La conversación sirve para resolver dudas, coordinar visitas y pedir más información sobre la mascota. Está pensada para que el intercambio sea directo, amable y fácil de seguir.",
      category: "chat",
    },
    {
      title: "Qué información muestra cada mascota",
      content:
        "Cada ficha puede mostrar nombre, tipo de animal, raza, edad aproximada, descripción, fotos y estado actual. Así la persona puede entender rápido si esa mascota encaja con lo que busca.",
      category: "pets",
    },
    {
      title: "Cómo se organizan las mascotas",
      content:
        "TinPet Web ayuda a mantener todo ordenado para que los refugios puedan actualizar sus animales y las personas encuentren lo que buscan sin perder tiempo. También evita confusiones mostrando solo las mascotas que están disponibles.",
      category: "organization",
    },
  ];

  await prisma.assistant_knowledge.deleteMany({
    where: {
      title: {
        in: knowledge.map((item) => item.title),
      },
    },
  });

  await prisma.assistant_knowledge.createMany({
    data: knowledge.map((item) => ({
      ...item,
      isPublished: true,
    })),
  });

  for (const item of knowledge) {
    console.log(`✅ Created: ${item.title}`);
  }

  console.log("\n✅ Seeding complete!");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
