import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { createTask, deleteTask, getRange, getToday, toggleComplete, updateTask } from '../controllers/task.js';

const router = Router();
router.use(auth);
router.get('/today', getToday);
router.get('/range', getRange);
router.post('/', createTask);
router.patch('/:id/complete', toggleComplete);
router.patch('/:id', updateTask);
router.delete('/:id', deleteTask);
export default router;
