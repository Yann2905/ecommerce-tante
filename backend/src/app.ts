import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import productRoutes from './modules/product/product.routes';
import orderRoutes from './modules/order/order.routes';

const app: Application = express();

// ✅ CORS restreint à ton frontend uniquement
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10kb' })); // ✅ Limite la taille des requêtes

// ✅ Rate limiting global — max 100 requêtes / 15 min par IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Trop de requêtes, réessaie dans quelques minutes." }
});
app.use(limiter);

// ✅ Rate limiting strict sur les routes sensibles (admin)
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: "Trop de tentatives admin." }
});

app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('Serveur Ecommerce-Tante opérationnel !');
});

export default app;