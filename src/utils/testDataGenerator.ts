// src/utils/testDataGenerator.ts

import fetch from "node-fetch";

export type Sample = {
  image: string;
  text: string;
};

const UNSPLASH_ACCESS_KEY = "ak_77d00daf15b115eae252879ab9030e77a185af362a80a08ee53f2cde455b34e9";

export async function fetchCategorySamples(category: string): Promise<Sample[]> {
  const url = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(
    category
  )}&count=3&client_id=${UNSPLASH_ACCESS_KEY}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch Unsplash images: ${response.statusText}`);
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("Unexpected response format from Unsplash API");
  }

  return data.map((item: any) => ({
    image: item.urls?.regular,
    text: item.alt_description || `Image about ${category}`,
  }));
}
