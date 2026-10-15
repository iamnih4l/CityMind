import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import {
  runMultiAgentSimulation,
  consultSpecialistAgents,
  generateScenarioDraft,
  SIMULATION_MODEL,
} from './src/server/geminiSimulation.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// API Router
const apiRouter = express.Router();

// Health check endpoint
apiRouter.get('/health', (_req: Request, res: Response) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    status: 'ok',
    hasGeminiKey: hasKey,
    model: SIMULATION_MODEL,
    timestamp: new Date().toISOString(),
  });
});

// Run Simulation endpoint
apiRouter.post('/simulation/run', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    if (!payload || !payload.scenario || !payload.targetZone) {
      res.status(400).json({
        error: 'Invalid request payload: scenario and targetZone are required.',
      });
      return;
    }

    const report = await runMultiAgentSimulation(payload);
    res.json({ success: true, report });
  } catch (err: any) {
    console.error('Simulation execution error:', err);
    res.status(500).json({
      error: err.message || 'An unexpected error occurred during simulation analysis.',
    });
  }
});

// Consult Specialist Agents endpoint (Interactive AI Q&A / Refinement)
apiRouter.post('/simulation/consult', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    if (!payload || !payload.question || !payload.scenario) {
      res.status(400).json({
        error: 'Invalid request payload: question and scenario are required.',
      });
      return;
    }

    const consultation = await consultSpecialistAgents(payload);
    res.json({ success: true, consultation });
  } catch (err: any) {
    console.error('Consultation error:', err);
    res.status(500).json({
      error: err.message || 'Failed to complete specialist agent consultation.',
    });
  }
});

// Generate AI Scenario Draft endpoint
apiRouter.post('/simulation/generate-draft', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    if (!payload || !payload.category || !payload.targetZone) {
      res.status(400).json({
        error: 'Invalid request payload: category and targetZone are required.',
      });
      return;
    }

    const draft = await generateScenarioDraft(payload);
    res.json({ success: true, draft });
  } catch (err: any) {
    console.error('Draft generation error:', err);
    res.status(500).json({
      error: err.message || 'Failed to generate scenario draft via Gemini.',
    });
  }
});

// Catch-all 404 for API routes so they never fall through to Vite HTML
apiRouter.all('*', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Express error handler for API
apiRouter.use((err: any, _req: Request, res: Response, _next: any) => {
  console.error('Unhandled API error:', err);
  res.status(500).json({ error: err.message || 'Internal API server error' });
});

app.use('/api', apiRouter);

// Set up Vite or static serving
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        port: PORT,
        host: '0.0.0.0',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CityMind server active at http://0.0.0.0:${PORT} [${isProduction ? 'PROD' : 'DEV'}]`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
