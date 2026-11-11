import express, { Router } from 'express';
import { routers } from '../constant';
import { v1Routes } from './v1';

const router: Router = express.Router();
router.use(routers.endPoints.v1Base, v1Routes);

export const RootApiRouter = router;
export default {
  RootApiRouter,
};
