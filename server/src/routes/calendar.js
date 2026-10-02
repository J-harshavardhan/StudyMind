import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { getMonth, getUpcoming } from '../controllers/calendar.js';

const router = Router();
router.use(auth);
router.get('/month', getMonth);
router.get('/upcoming', getUpcoming);
export default router;
