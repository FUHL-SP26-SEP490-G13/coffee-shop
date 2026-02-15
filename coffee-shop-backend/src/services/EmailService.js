const nodemailer = require('nodemailer');
const env = require('../config/env');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE, // true for 465, false for other ports
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD,
      },
    });
  }

  /**
   * Send OTP email
   */
  async sendOTPEmail(to, otp, userName) {
    const mailOptions = {
      from: `"Coffee Shop" <${env.SMTP_USER}>`,
      to: to,
      subject: 'Xác thực Email - Coffee Shop',
      html: this.getOTPEmailTemplate(otp, userName),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent: %s', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Không thể gửi email');
    }
  }

  /**
   * OTP Email Template
   */
  getOTPEmailTemplate(otp, userName) {
    return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Xác thực Email</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .email-container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #6B4423 0%, #8B5E34 100%);
      color: #ffffff;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .header p {
      margin: 10px 0 0 0;
      font-size: 14px;
      opacity: 0.9;
    }
    .content {
      padding: 40px 30px;
      text-align: center;
    }
    .greeting {
      font-size: 18px;
      color: #333333;
      margin-bottom: 20px;
    }
    .message {
      font-size: 16px;
      color: #666666;
      line-height: 1.6;
      margin-bottom: 30px;
    }
    .otp-box {
      background-color: #f9f9f9;
      border: 2px dashed #6B4423;
      border-radius: 8px;
      padding: 30px;
      margin: 30px 0;
    }
    .otp-label {
      font-size: 14px;
      color: #666666;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .otp-code {
      font-size: 36px;
      font-weight: bold;
      color: #6B4423;
      letter-spacing: 8px;
      margin: 15px 0;
      font-family: 'Courier New', monospace;
    }
    .otp-note {
      font-size: 13px;
      color: #999999;
      margin-top: 15px;
    }
    .warning {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 25px 0;
      text-align: left;
      border-radius: 4px;
    }
    .warning-title {
      font-weight: bold;
      color: #856404;
      margin-bottom: 8px;
      font-size: 14px;
    }
    .warning-text {
      font-size: 13px;
      color: #856404;
      line-height: 1.5;
    }
    .footer {
      background-color: #f9f9f9;
      padding: 25px 30px;
      text-align: center;
      border-top: 1px solid #eeeeee;
    }
    .footer p {
      margin: 5px 0;
      font-size: 13px;
      color: #999999;
    }
    .social-links {
      margin-top: 15px;
    }
    .social-links a {
      display: inline-block;
      margin: 0 8px;
      color: #6B4423;
      text-decoration: none;
      font-size: 13px;
    }
    @media only screen and (max-width: 600px) {
      .email-container {
        margin: 20px;
      }
      .content {
        padding: 30px 20px;
      }
      .otp-code {
        font-size: 28px;
        letter-spacing: 5px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>☕ Coffee Shop</h1>
      <p>Xác thực tài khoản của bạn</p>
    </div>
    
    <div class="content">
      <div class="greeting">
        Xin chào <strong>${userName || 'bạn'}</strong>! 👋
      </div>
      
      <div class="message">
        Cảm ơn bạn đã đăng ký tài khoản tại <strong>Coffee Shop</strong>. 
        Để hoàn tất quá trình đăng ký, vui lòng sử dụng mã OTP bên dưới:
      </div>
      
      <div class="otp-box">
        <div class="otp-label">Mã xác thực của bạn</div>
        <div class="otp-code">${otp}</div>
        <div class="otp-note">
          ⏰ Mã này có hiệu lực trong <strong>10 phút</strong>
        </div>
      </div>
      
      <div class="warning">
        <div class="warning-title">⚠️ Lưu ý bảo mật</div>
        <div class="warning-text">
          • Không chia sẻ mã OTP này với bất kỳ ai<br>
          • Coffee Shop sẽ không bao giờ yêu cầu mã OTP qua điện thoại<br>
          • Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email
        </div>
      </div>
      
      <div class="message" style="margin-top: 30px;">
        Nếu bạn có bất kỳ thắc mắc nào, đừng ngần ngại liên hệ với chúng tôi!
      </div>
    </div>
    
    <div class="footer">
      <p><strong>Coffee Shop Management System</strong></p>
      <p>Email: support@coffeeshop.com | Hotline: 1900-xxxx</p>
      <p style="margin-top: 15px; font-size: 12px; color: #bbbbbb;">
        © ${new Date().getFullYear()} Coffee Shop. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(to, userName) {
    const mailOptions = {
      from: `"Coffee Shop" <${env.SMTP_USER}>`,
      to: to,
      subject: 'Chào mừng đến với Coffee Shop',
      html: this.getWelcomeEmailTemplate(userName),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Welcome email sent: %s', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending welcome email:', error);
      // Don't throw error for welcome email
      return { success: false, error: error.message };
    }
  }

  /**
   * Welcome Email Template
   */
  getWelcomeEmailTemplate(userName) {
    return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chào mừng</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .email-container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #6B4423 0%, #8B5E34 100%);
      color: #ffffff;
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 22px;
      color: #333333;
      margin-bottom: 20px;
      text-align: center;
    }
    .message {
      font-size: 16px;
      color: #666666;
      line-height: 1.8;
      margin-bottom: 25px;
    }
    .benefits {
      background-color: #f9f9f9;
      border-radius: 8px;
      padding: 25px;
      margin: 30px 0;
    }
    .benefit-item {
      display: flex;
      align-items: start;
      margin-bottom: 15px;
    }
    .benefit-icon {
      font-size: 24px;
      margin-right: 15px;
    }
    .benefit-text {
      flex: 1;
    }
    .benefit-title {
      font-weight: bold;
      color: #6B4423;
      margin-bottom: 5px;
    }
    .benefit-description {
      font-size: 14px;
      color: #666666;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #6B4423 0%, #8B5E34 100%);
      color: #ffffff;
      padding: 15px 40px;
      text-decoration: none;
      border-radius: 25px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
    }
    .footer {
      background-color: #f9f9f9;
      padding: 25px 30px;
      text-align: center;
      border-top: 1px solid #eeeeee;
    }
    .footer p {
      margin: 5px 0;
      font-size: 13px;
      color: #999999;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>☕ Chào mừng đến với Coffee Shop!</h1>
    </div>
    
    <div class="content">
      <div class="greeting">
        Xin chào <strong>${userName}</strong>! 🎉
      </div>
      
      <div class="message">
        Cảm ơn bạn đã tham gia cộng đồng Coffee Shop! Chúng tôi rất vui mừng được chào đón bạn.
      </div>
      
      <div class="benefits">
        <div class="benefit-item">
          <div class="benefit-icon">🎁</div>
          <div class="benefit-text">
            <div class="benefit-title">Ưu đãi độc quyền</div>
            <div class="benefit-description">Nhận thông báo về các chương trình khuyến mãi đặc biệt</div>
          </div>
        </div>
        
        <div class="benefit-item">
          <div class="benefit-icon">⭐</div>
          <div class="benefit-text">
            <div class="benefit-title">Tích điểm thưởng</div>
            <div class="benefit-description">Mỗi đơn hàng đều được tích điểm để đổi quà</div>
          </div>
        </div>
        
        <div class="benefit-item">
          <div class="benefit-icon">📱</div>
          <div class="benefit-text">
            <div class="benefit-title">Đặt hàng nhanh chóng</div>
            <div class="benefit-description">Quản lý đơn hàng và theo dõi lịch sử mua hàng dễ dàng</div>
          </div>
        </div>
      </div>
      
      <div class="message" style="text-align: center;">
        Hãy bắt đầu trải nghiệm những ly cà phê tuyệt vời cùng chúng tôi!
      </div>
      
      <div style="text-align: center;">
        <a href="${env.CLIENT_URL}" class="cta-button">Khám phá ngay</a>
      </div>
    </div>
    
    <div class="footer">
      <p><strong>Coffee Shop Management System</strong></p>
      <p>Email: support@coffeeshop.com | Hotline: 1900-xxxx</p>
      <p style="margin-top: 15px; font-size: 12px; color: #bbbbbb;">
        © ${new Date().getFullYear()} Coffee Shop. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
    `;
  }
}

module.exports = new EmailService();
