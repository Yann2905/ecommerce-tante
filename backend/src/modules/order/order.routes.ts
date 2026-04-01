import { Router } from 'express';
import { createOrder, getAllOrders } from './order.controller';
import { isAdmin } from '../../middlewares/auth.middleware';

const router = Router();

// ✅ Public — un client peut passer commande
router.post('/', createOrder);

// ✅ Protégé — seule ta tante voit les commandes
router.get('/', isAdmin, getAllOrders);

export default router;