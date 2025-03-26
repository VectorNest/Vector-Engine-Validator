import { z } from "zod";
import { getCLIPEmbedding } from "@/utils/clip";
import { randomUUID } from "crypto";
import { Agreement } from "@forest-protocols/sdk";
import { Resource } from "@/core/types";
import { Validation } from "../protocol/validation";
import { fetchCategorySamples } from "./testDataGenerator";

export type TestItem = {
  id: string;
  image: string; // URL or base64
  text: string;
  embedding: number[];
  label: string;
};

export type PreparedCollection = {
  name: string;
  items: TestItem[];
};

export async function prepareTestCollection(
  validation: Validation,
  agreement: Agreement,
  resource: Resource,
  category: string
): Promise<PreparedCollection> {
  const name = `validator_${category}_${Date.now()}_${randomUUID().slice(0, 8)}`;

  const fields = [
    { name: "id", type: "String", properties: { isPrimary: true } },
    { name: "text", type: "String" },
    { name: "image", type: "String" },
    { name: "embedding", type: "Vector", properties: { dimension: 512 } },
    { name: "label", type: "String" },
  ];

  await validation.callEndpoint("/collection", {
    id: resource.id,
    pc: resource.protocol,
    name,
    fields,
  });

  const samples = await fetchCategorySamples(category);
  const items: TestItem[] = [];

  for (const sample of samples) {
    const embedding = await getCLIPEmbedding(sample.image, "image");
    items.push({
      id: randomUUID(),
      image: sample.image,
      text: sample.text,
      embedding,
      label: category,
    });
  }

  await validation.callEndpoint("/data", {
    id: resource.id,
    pc: resource.protocol,
    collection: name,
    data: items,
  });

  return { name, items };
}

export async function cleanupTestCollection(
  validation: Validation,
  agreement: Agreement,
  resource: Resource,
  name: string
) {
  await validation.callEndpoint("/collection", {
    id: resource.id,
    pc: resource.protocol,
    name,
  });
}
