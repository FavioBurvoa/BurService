import express from 'express';
import { renderRouter } from './routes/render.routes';

export const app = express();

app.use(express.json({ limit: '25mb' }));

app.get('/health', (_req, res) => { res.json({ status: 'ok' }); });
app.use('/render', renderRouter);
