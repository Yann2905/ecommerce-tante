import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(3, "Le nom doit avoir au moins 3 caractères"),
  description: z.string().optional(),
  price: z.number().positive("Le prix doit être supérieur à 0"),
  stock: z.number().int().nonnegative("Le stock ne peut pas être négatif"),
  category_id: z.number().optional(),
  on_sale: z.boolean().optional(),
  discount_price: z.number().optional(),
});