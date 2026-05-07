import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const articles = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/articles' }),
  schema: z.object({
    title: z.string().optional(),
    date: z.string().or(z.date()).optional(),
    summary: z.string().optional(),
    category: z.string().optional(),
    featured: z.boolean().optional(),
  })
});

const weekly_notes = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/weekly_notes' }),
  schema: z.object({
    week: z.number().optional(),
    year: z.number().optional(),
    date: z.string().or(z.date()).optional(),
    theme: z.string().optional(),
    tags: z.array(z.string()).optional(),
  })
});

export const collections = {
  articles,
  weekly_notes,
};
