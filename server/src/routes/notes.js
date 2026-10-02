import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { createNote, deleteNote, getNote, listNotes, togglePin, updateNote } from '../controllers/note.js';

const router = Router();

router.use(auth);
router.get('/', listNotes);
router.post('/', createNote);
router.patch('/:id/pin', togglePin);
router.get('/:id', getNote);
router.patch('/:id', updateNote);
router.delete('/:id', deleteNote);

export default router;
