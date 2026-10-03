import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { createReminder, deleteReminder, getByDate, getUpcoming, updateReminder, updateStatus } from '../controllers/reminder.js';

const router = Router();
router.use(auth);
router.get('/upcoming', getUpcoming);
router.get('/date/:dateKey', getByDate);
router.post('/', createReminder);
router.patch('/:id/status', updateStatus);
router.patch('/:id', updateReminder);
router.delete('/:id', deleteReminder);

export default router;
