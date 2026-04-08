import { Router } from 'express';
import { 
  getAllProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct 
} from './product.controller';
import { isAdmin } from '../../middlewares/auth.middleware';

const router = Router();

// ✅ Public — tout le monde peut voir les produits
router.get('/', getAllProducts);

// ✅ Protégé — seule Emma-Shop peut modifier
// Note: Assure-toi que ton middleware 'isAdmin' fonctionne bien avec Supabase Auth
router.post('/', isAdmin, createProduct);
router.patch('/:id', isAdmin, updateProduct);
router.delete('/:id', isAdmin, deleteProduct);

export default router;
