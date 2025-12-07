const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmail() {
  try {
    console.log('[TEST] Starting email configuration test...');
    console.log(`[TEST] Email User: ${process.env.EMAIL_USER}`);
    console.log(`[TEST] Email Password: ${process.env.EMAIL_PASSWORD ? '***SET***' : 'NOT SET'}`);
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    console.log('[TEST] Verifying email credentials...');
    await transporter.verify();
    console.log('[TEST] ✓ Email credentials verified successfully!');
    
    // Send test email
    console.log('[TEST] Sending test email...');
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: 'gudiamishra274001@gmail.com',
      subject: 'Test Email - Verify Your Email System',
      html: '<p>If you received this, your email system is working!</p>'
    });
    
    console.log('[TEST] ✓ Test email sent successfully!');
    console.log('[TEST] Message ID:', info.messageId);
    process.exit(0);
  } catch (error) {
    console.error('[TEST] ✗ Email error:', error.message);
    console.error('[TEST] Full error:', error);
    process.exit(1);
  }
}

testEmail();
