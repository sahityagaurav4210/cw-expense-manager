import { Router } from 'express';
import { AppController } from '../controllers/app.controller';

const router = Router();

router.get('/', AppController.home);
router.get('/health', AppController.health);

export default router;
