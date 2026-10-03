import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { askAssistant } from '../controllers/assistant.js';

const router = Router();
router.use(auth);
router.post('/ask', askAssistant);
export default router;
