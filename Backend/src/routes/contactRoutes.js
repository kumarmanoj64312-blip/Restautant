import express from "express";

import {
  sendContactMessage,
  getAllMessages,
} from "../controllers/contactController.js";

const router = express.Router();

router.post("/", sendContactMessage);

router.get("/", getAllMessages);

export default router;