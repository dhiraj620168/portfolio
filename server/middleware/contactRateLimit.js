import rateLimit from "express-rate-limit";

const contactRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5, // Maximum 5 submissions per IP per window
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many contact submissions. Please try again after 15 minutes.",
  },
});

export default contactRateLimit;
