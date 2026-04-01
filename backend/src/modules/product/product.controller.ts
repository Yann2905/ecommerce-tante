import { Request, Response } from 'express';
import { z } from 'zod';
import { ProductService } from './product.service';

const productService = new ProductService();

const ProductSchema = z.object({
  name:           z.string().min(2),
  description:    z.string().optional().nullable(),
  price:          z.number().positive(),
  stock:          z.number().int().min(0),
  category_id:    z.number().int().positive(), 
  discount_price: z.number().positive().optional().nullable(),
  image_url:      z.string().url(),
  is_active:      z.boolean().optional().default(true),
});

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const products = await productService.getAllAdmin();
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const parsed = ProductSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalide", details: parsed.error.flatten().fieldErrors });

    // ✅ Cast explicite pour rassurer TypeScript
    const product = await productService.create(parsed.data as any);
    res.status(201).json(product);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "ID requis" });

    const parsed = ProductSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalide", details: parsed.error.flatten().fieldErrors });

    const product = await productService.update(id as string, parsed.data as any);
    res.json(product);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "ID requis" });

    await productService.delete(id as string);
    res.status(200).json({ message: "Supprimé" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};