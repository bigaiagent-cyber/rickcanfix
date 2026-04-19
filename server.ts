import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import multer from 'multer';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Setup Multer for file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 50 * 1024 * 1024, // Increased to 50MB
    },
  });

  // API Route for Contact Form
  app.post('/api/contact', (req, res, next) => {
    console.log('\n--- CONTACT FORM: INCOMING ATTEMPT ---');
    next();
  }, upload.array('files'), async (req, res) => {
    let supabaseStatus = 'not_attempted';
    let emailStatus = 'not_attempted';
    let dbErrorDetail = '';
    let emailErrorDetail = '';

    try {
      const { name, email, phone, message } = req.body;
      const files = req.files as Express.Multer.File[];

      const userEmail = process.env.EMAIL_USER?.trim();
      const userPass = process.env.EMAIL_PASS?.trim();
      const sbUrl = process.env.SUPABASE_URL?.trim();
      const sbKey = process.env.SUPABASE_ANON_KEY?.trim();

      console.log('Credentials Present:', { email: !!userEmail, pass: !!userPass, sb: !!sbUrl });

      // 1. SUPABASE STORAGE (PRIORITY)
      if (sbUrl && sbKey) {
        try {
          const supabase = createClient(sbUrl, sbKey);
          const { error: sbError } = await supabase
            .from('contact_inquiries')
            .insert([{ name, email, phone, message }]);
          
          if (sbError) {
            supabaseStatus = 'error';
            dbErrorDetail = sbError.message;
            console.error('SUPABASE FAILURE:', sbError.message);
          } else {
            supabaseStatus = 'success';
            console.log('SUPABASE SUCCESS: Lead stored.');
          }
        } catch (err: any) {
          supabaseStatus = 'error';
          dbErrorDetail = err.message;
        }
      }

      // 2. EMAIL NOTIFICATION
      if (userEmail && userPass) {
        try {
          const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: { user: userEmail, pass: userPass },
            tls: { rejectUnauthorized: false }
          });

          await transporter.sendMail({
            from: userEmail,
            to: 'bigaiagent@gmail.com',
            replyTo: email,
            subject: `[LEAD] ${name} - Project Inquiry`,
            text: `Contact Info:\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\n\nMessage:\n${message}`,
            attachments: files?.map(file => ({
              filename: file.originalname,
              content: file.buffer,
            })),
          });
          emailStatus = 'success';
          console.log('EMAIL SUCCESS: Notification sent.');
        } catch (err: any) {
          emailStatus = 'error';
          emailErrorDetail = err.message;
          console.error('EMAIL FAILURE (535 Usually means bad App Password):', err.message);
        }
      }

      // 3. LOGIC-BASED RESPONSE
      if (supabaseStatus === 'success' && emailStatus === 'success') {
        return res.status(200).json({ success: true, message: 'Success! Inquiry saved and emailed.' });
      }

      if (supabaseStatus === 'success' && emailStatus !== 'success') {
        return res.status(200).json({ 
          success: true, 
          message: 'Inquiry Saved to Database! (Note: Email notification failed, please check your EMAIL_PASS).',
          emailError: emailErrorDetail 
        });
      }

      // If we got here, something critical failed or config is missing
      return res.status(500).json({
        success: false,
        message: 'Submission issues detected.',
        supabase: dbErrorDetail || (sbUrl ? 'Pending check' : 'Configuration missing (URL/Key)'),
        email: emailErrorDetail || (userEmail ? 'Pending check' : 'Configuration missing (User/Pass)')
      });

    } catch (globalError: any) {
      console.error('GLOBAL ROUTE CRASH:', globalError);
      res.status(500).json({ success: false, message: 'Critical Error: ' + globalError.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Contact submissions will be emailed to: bigaiagent@gmail.com`);
  });
}

startServer();
