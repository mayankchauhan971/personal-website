import { defineCollection } from 'astro:content';

const articles = defineCollection({
  type: 'content'
});

export const collections = {
  articles,
};
