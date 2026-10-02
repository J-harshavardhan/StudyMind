import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import {
  createCategory,
  deleteCategory,
  getCategory,
  listCategories,
  updateCategory
} from '../controllers/category.js';

const router = Router();

router.use(auth);
router.get('/', listCategories);
router.post('/', createCategory);
router.get('/:id', getCategory);
router.patch('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router;
