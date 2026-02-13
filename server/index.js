import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Load env vars
dotenv.config();

if (!process.env.OTP_SECRET) {
  console.warn('Warning: OTP_SECRET is not set. Using fallback secret.');
}

const app = express();
const PORT = process.env.PORT || 3000;

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Trust Proxy (Required for Vercel/Heroku to get correct IP)
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 OTP requests per hour
  message: 'Too many OTP requests, please try again after an hour',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:5173', 'https://cetea.vercel.app'],
  credentials: true
}));
app.use(express.json({ limit: '10kb' })); // Limit body size

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Generate 6-digit OTP securely
const generateOTP = () => {
  // Generates a number between 0 and 999999, then pads with leading zeros
  return crypto.randomInt(0, 1000000).toString().padStart(6, '0');
};

// Helper: Create Hash
const createHash = (email, otp, expires) => {
  const data = `${email}.${otp}.${expires}`;
  const secret = process.env.OTP_SECRET || process.env.SMTP_PASSWORD || 'default_secret_please_change';
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
};

// Endpoint: Send OTP
app.post('/api/send-otp', otpLimiter, async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Basic email validation (Relaxed regex to avoid false positives)
  if (!email.includes('@') || !email.includes('.')) {
     return res.status(400).json({ error: 'Invalid email format' });
  }

  const otp = generateOTP();
  const expires = Date.now() + 5 * 60 * 1000; // 5 minutes expiration

  // Create hash to send to client (Stateless verification)
  const hash = createHash(email, otp, expires);
  const fullHash = `${hash}.${expires}`;

  const mailOptions = {
    from: process.env.SMTP_EMAIL,
    to: email,
    subject: 'Your Verification Code - CETea',
    text: `Your verification code is: ${otp}. It expires in 5 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
        <h2>Welcome to CETea!</h2>
        <p>Your verification code is:</p>
        <h1 style="font-size: 32px; letter-spacing: 5px; color: #E11D48;">${otp}</h1>
        <p>This code expires in 5 minutes.</p>
        <p>Visit us at <a href="https://cetea.vercel.app/">cetea.vercel.app</a></p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP sent to ${email}`);
    // Send hash back to client
    res.status(200).json({ message: 'OTP sent successfully', hash: fullHash });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Endpoint: Verify OTP
app.post('/api/verify-otp', async (req, res) => {
  const { email, otp, hash } = req.body;

  if (!email || !otp || !hash) {
    return res.status(400).json({ error: 'Email, OTP, and Hash are required' });
  }

  const [hashValue, expires] = hash.split('.');

  // Check if expired
  if (Date.now() > parseInt(expires)) {
    return res.status(400).json({ error: 'OTP expired' });
  }

  // Re-compute hash to verify
  const expectedHash = createHash(email, otp, parseInt(expires));

  // Secure comparison to prevent timing attacks
  const hashBuffer = Buffer.from(hashValue, 'utf-8');
  const expectedHashBuffer = Buffer.from(expectedHash, 'utf-8');

  if (hashBuffer.length === expectedHashBuffer.length && crypto.timingSafeEqual(hashBuffer, expectedHashBuffer)) {
    res.status(200).json({ message: 'OTP verified successfully' });
  } else {
    return res.status(400).json({ error: 'Invalid OTP' });
  }
});

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
