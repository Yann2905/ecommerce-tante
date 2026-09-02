import { z } from 'zod';

const ImageUrlSchema = z.preprocess(
  (value) => value === '' ? null : value,
  z.string().url().nullable().optional(),
);

const ProductFields = z.object({
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(5000).optional().nullable(),
  price: z.number().positive(),
  stock: z.number().int().min(0),
  category_id: z.number().int().positive(),
  discount_price: z.number().positive().nullable().optional(),
  image_url: ImageUrlSchema,
  gallery: z.array(z.string().url()).max(6).optional().default([]),
  is_active: z.boolean().optional().default(true),
});

function validateDiscount(value: { price?: number; discount_price?: number | null }, context: z.RefinementCtx) {
  if (value.discount_price != null && value.price != null && value.discount_price >= value.price) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['discount_price'], message: 'Le prix promo doit être inférieur au prix normal.' });
  }
}

export const ProductSchema = ProductFields.superRefine(validateDiscount);
export const ProductPatchSchema = ProductFields.partial().superRefine(validateDiscount);
