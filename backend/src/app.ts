import express from 'express';
import cors from 'cors';
import path from 'path';
import { errorHandler } from './middlewares/error.middleware';

import authRoutes from './routes/auth.routes';
import clientesRoutes from './routes/clientes.routes';
import ordensRoutes from './routes/ordens.routes';
import pendenciasRoutes from './routes/pendencias.routes';
import relatoriosRoutes from './routes/relatorios.routes';
import anexosRoutes from './routes/anexos.routes';
import dashboardRoutes from './routes/dashboard.routes';
import alertasRoutes from './routes/alertas.routes';
import auditoriaRoutes from './routes/auditoria.routes';
import estatisticasRoutes from './routes/estatisticas.routes';
import usuariosRoutes from './routes/usuarios.routes';

const app = express();

// CORS aberto para desenvolvimento em rede local.
// Em produção, restrinja a origem para o IP do servidor:
//   app.use(cors({ origin: 'http://192.168.1.100:3001' }));
app.use(cors());

// Desabilita cache do navegador para evitar dados antigos
app.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

app.use(express.json());

// Healthcheck
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend estático em produção
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/ordens', ordensRoutes);
app.use('/api/ordens', pendenciasRoutes);
app.use('/api/ordens', relatoriosRoutes);
app.use('/api/ordens', anexosRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/alertas', alertasRoutes);
app.use('/api/auditoria', auditoriaRoutes);
app.use('/api/estatisticas', estatisticasRoutes);
app.use('/api/usuarios', usuariosRoutes);

// SPA fallback: qualquer rota não-API serve index.html
app.get(/^(?!\/api\/).*/, (_req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// Error handler global (deve ser o último middleware)
app.use(errorHandler);

export default app;
