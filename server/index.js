import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';

// Load env vars
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:5173', 'https://cetea.vercel.app'],
  credentials: true
}));
app.use(express.json());

// Transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper: Create Hash
const createHash = (email, otp, expires) => {
  const data = `${email}.${otp}.${expires}`;
  const secret = process.env.SMTP_PASSWORD || 'secret'; // Use SMTP password as secret salt
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
};

// Endpoint: Send OTP
app.post('/api/send-otp', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
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

  if (hashValue === expectedHash) {
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
