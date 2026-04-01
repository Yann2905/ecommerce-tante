import { Request, Response } from 'express';
import { z } from 'zod';
import { OrderService } from './order.service';

const orderService = new OrderService();

// ✅ Schéma pour chaque article du panier
const OrderItemSchema = z.object({
  product_id: z.string().uuid("ID produit invalide"),
  quantity:   z.number().int().positive("Quantité invalide"),
  unit_price: z.number().positive("Prix invalide"),
});

// ✅ Schéma pour la commande complète
const CreateOrderSchema = z.object({
  customer_name:    z.string().min(2, "Nom trop court").max(100),
  customer_phone:   z.string().min(8, "Numéro invalide").max(20),
  delivery_address: z.string().max(300).optional().transform(val => val && val.trim().length > 0 ? val : "Non précisée"),
  total_price:      z.number().positive("Total invalide"),
  items:            z.array(OrderItemSchema).min(1, "Panier vide"),
});

export const createOrder = async (req: Request, res: Response) => {
  try {
    // ✅ Validation complète avant tout
    const parsed = CreateOrderSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ 
        error: "Données de commande invalides", 
        details: parsed.error.flatten().fieldErrors 
      });
    }

    const { customer_name, customer_phone, delivery_address, total_price, items } = parsed.data;

    const orderData = { customer_name, customer_phone, delivery_address, total_price };
    const newOrder  = await orderService.createOrder(orderData, items);

    res.status(201).json({ 
      message: "Commande réussie ! Le stock a été mis à jour.", 
      order: newOrder 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const orders = await orderService.getAllOrders();
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};