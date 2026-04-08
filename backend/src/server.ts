import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// ✅ CHARGEMENT DU .ENV AVANT LES IMPORTS DE MODULES
dotenv.config();

// ✅ IMPORTS DES ROUTES (Vérifie bien que ces dossiers existent)
import productRoutes from './modules/product/product.routes';
import orderRoutes from './modules/order/order.routes'; 

const app = express();

// ✅ MIDDLEWARES
app.use(cors()); 
app.use(express.json()); // Indispensable pour lire le JSON des commandes

// ✅ ENREGISTREMENT DES ROUTES API
// Route pour la gestion du stock (Emma-Shop)
app.use('/api/products', productRoutes);

// Route pour les commandes (Clients & Panier)
app.use('/api/orders', orderRoutes); 

// ✅ ROUTE DE TEST
app.get('/api/health', (req, res) => {
  res.json({ 
    status: "OK", 
    message: "Le serveur de Emma-Shop est en ligne (Produits + Commandes) !" 
  });
});

// ✅ DÉMARRAGE DU SERVEUR
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
  ================================================
  ✅ SERVEUR Emma-Shop OPÉRATIONNEL : http://localhost:${PORT}
  📦 MODULE PRODUITS : http://localhost:${PORT}/api/products
  🛒 MODULE COMMANDES: http://localhost:${PORT}/api/orders
  ================================================
  `);
});
