import nodemailer from 'nodemailer';
import 'dotenv/config';
const base_url = process.env.GOOGLE_CLOUD_RUN_EXTERNAL_URL;

const transporter = nodemailer.createTransport({
  service: process.env.MAIL_SERVICE,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const createEmail = (email, token) => {
  return {
    from: process.env.MAIL_FROM,
    to: email,
    subject: 'Account Activation - Confirmation',
    html: `
      <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3498db;">Account Activation</h2>
        <p>Welcome to Rinjani Visitor! To activate your account, please click the link below:</p>

        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-top: 20px;">
          <a href="${base_url}/api/users/activate/${token}" style="display: inline-block; padding: 10px 20px; background-color: #3498db; color: #ffffff; text-decoration: none; border-radius: 3px;">Activate Your Account</a>
        </div>

        <p style="margin-top: 20px;">If the button above does not work, you can also activate your account by copying and pasting the following link into your browser:</p>

        <p>${base_url}/api/users/activate/${token}</p>

        <p style="margin-top: 20px;">Thank you for joining our community. If you have any questions or need assistance, feel free to contact us.</p>

        <p style="margin-top: 40px; color: #888;">Best Regards,<br>Rinjani Visitor</p>
      </div>
    `,
  };
};

const contentPwd = (email, password) => {
  return {
    from: process.env.MAIL_FROM,
    to: email,
    subject: 'Password Reset Confirmation',
    html: `
      <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3498db;">Password Reset Confirmation</h2>
        <p>We received a request to reset your account password. Below are your new login details:</p>

        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-top: 20px;">
          <table style="width: 100%;">
            <tr>
              <td style="width: 30%;"><strong>Email:</strong></td>
              <td>${email}</td>
            </tr>
            <tr>
              <td style="width: 30%;"><strong>New Password:</strong></td>
              <td>${password}</td>
            </tr>
          </table>
        </div>

        <p style="margin-top: 20px;">For security reasons, we recommend changing your password after logging in. If you didn't request a password reset, please contact us immediately.</p>

        <p style="margin-top: 20px;">Thank you for using our service. If you have any questions or need further assistance, feel free to contact us.</p>

        <p style="margin-top: 40px; color: #888;">Best Regards,<br>Rinjani Visitor</p>
      </div>
    `,
  };
};

const bookingSuccess = (email, bookingDetails) => {
  const { name, title, bookingId, bookingDate, bookingStart, bookingEnd } =
    bookingDetails;

  return {
    from: process.env.MAIL_FROM,
    to: email,
    subject: 'Booking Confirmation - Payment Successful',
    html: `
      <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3498db;">Booking Confirmation</h2>
        <p>Dear ${name},</p>
        <p>Congratulations! Your payment has been successfully processed, and your booking is confirmed.</p>

        <div style="background-color: #f5f5f5; padding: 10px; border-radius: 5px; margin-top: 20px;">
          <h3>Booking Details:</h3>
          <ul style="list-style-type: none; padding: 0;">
            <li><strong>Product Title:</strong> ${title}</li>
            <li><strong>Booking ID:</strong> ${bookingId}</li>
            <li><strong>Booking Date:</strong> ${bookingDate}</li>
            <li><strong>Journey Start:</strong> ${bookingStart}</li>
            <li><strong>Journey End:</strong> ${bookingEnd}</li>
          </ul>
        </div>

        <p style="margin-top: 20px;">You can check the details of your booking and track its status by logging into your profile.</p>

        <p style="margin-top: 20px;">Thank you for choosing our service. If you have any questions or need further assistance, feel free to contact us.</p>

        <p style="margin-top: 20px;">Customer Service Team!</p>

        <p style="margin-top: 40px; color: #888;">Best Regards,<br>Rinjani Visitor</p>
      </div>
    `,
  };
};

const bookingFailed = (email, bookingDetails) => {
  const { name, title, bookingId, bookingDate, bookingStatus } = bookingDetails;

  return {
    from: process.env.MAIL_FROM,
    to: email,
    subject: 'Booking Payment Rejected',
    html: `
      <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e74c3c;">Booking Payment Rejected</h2>
        <p>Hi ${name},</p>
        <p>We regret to inform you that your payment for the booking has been rejected. Please take the following actions to resolve the issue:</p>

        <ul style="list-style-type: none; padding: 0;">
          <li>&#8226; Make a new payment to complete the booking.</li>
          <li>&#8226; If you encounter any issues, contact our customer service for further assistance.</li>
        </ul>

        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-top: 20px;">
          <h3>Booking Details:</h3>
          <ul style="list-style-type: none; padding: 0;">
            <li><strong>Product Title:</strong> ${title}</li>
            <li><strong>Booking ID:</strong> ${bookingId}</li>
            <li><strong>Booking Date:</strong> ${bookingDate}</li>
            <li><strong>Booking Status:</strong> ${bookingStatus}</li>
          </ul>
        </div>

        <p style="margin-top: 20px;">You can also check your booking details in your profile.</p>

        <p style="margin-top: 20px;">If you have any questions or need further assistance, feel free to contact our customer service team.</p>

        <p style="margin-top: 40px; color: #888;">Best Regards,<br>Rinjani Visitor</p>
      </div>
    `,
  };
};

const waitingForPaymentMail = (email, paymentDetails) => {
  const { name, title, bookingId, bookingDate, tax, subTotal, total } =
    paymentDetails;

  const wiseLogoUrl = process.env.WISE_LOGO_URL;
  const bankNtbLogoUrl = process.env.BANKNTB_LOGO_URL;

  return {
    from: process.env.MAIL_FROM,
    to: email,
    subject: 'Waiting for Payment',
    html: `
      <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3498db;">Payment Status Update</h2>
        <p>Hi ${name},</p>
        <p>Your offering has been approved. Please proceed with the payment to complete this booking.</p>

        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-top: 20px;">
          <h3>Payment Details:</h3>
          <ul style="list-style-type: none; padding: 0;">
            <li><strong>Product Title:</strong> ${title}</li>
            <li><strong>Booking ID:</strong> ${bookingId}</li>
            <li><strong>Booking Date:</strong> ${bookingDate}</li>
            <li><strong>Tax Rate:</strong> ${tax}%</li>
            <li><strong>Sub Total:</strong> ${subTotal} USD</li>
            <li><strong>Total:</strong> ${total} USD</li>
          </ul>
        </div>

        <p style="margin-top: 20px;">Choose one method to make payment:</p>

        <div style="margin-top: 10px;">
          <h4>1. Wise Transfer (USD Only)</h4>
          <img src="${wiseLogoUrl}" alt="Wise Logo" style="max-width: 100px; margin-bottom: 10px;">
          <p>Name: ${process.env.WISE_NAME}</p>
          <p>Wise Email: ${process.env.WISE_EMAIL}</p>
        </div>

        <div style="margin-top: 20px;">
          <h4>2. Bank NTB Syariah (IDR Only)</h4>
          <img src="${bankNtbLogoUrl}" alt="Bank NTB Syariah Logo" style="max-width: 100px; margin-bottom: 10px;">
          <p>Name: ${process.env.BANK_NAME}</p>
          <p>Account Number: ${process.env.BANK_NUMBER_ACCOUNT}</p>
        </div>

        <p style="margin-top: 20px;">You can also check your payment details in your profile.</p>

        <p style="margin-top: 20px;">Thank you for choosing our service. If you have any questions, feel free to contact us.</p>

        <p style="margin-top: 40px; color: #888;">Best Regards,<br>Rinjani Visitor</p>
      </div>
    `,
  };
};

const sendMail = (email, token) => {
  return new Promise((resolve, reject) => {
    transporter.sendMail(createEmail(email, token), (err, info) => {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        console.log('Email sent (sendMail): ' + info.response);
        resolve(true);
      }
    });
  });
};

const sendPassword = (email, password) => {
  return new Promise((resolve, reject) => {
    transporter.sendMail(contentPwd(email, password), (err, info) => {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        console.log('Email sent (sendPassword): ' + info.response);
        resolve(true);
      }
    });
  });
};

const sendBookingSuccess = (email, bookingDetails) => {
  return new Promise((resolve, reject) => {
    transporter.sendMail(bookingSuccess(email, bookingDetails), (err, info) => {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        console.log('Email sent (sendBookingSuccess): ' + info.response);
        resolve(true);
      }
    });
  });
};

const sendBookingFailed = (email, bookingDetails) => {
  return new Promise((resolve, reject) => {
    transporter.sendMail(bookingFailed(email, bookingDetails), (err, info) => {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        console.log('Email sent (sendBookingFailed): ' + info.response);
        resolve(true);
      }
    });
  });
};

const sendPayment = (email, paymentDetails) => {
  return new Promise((resolve, reject) => {
    transporter.sendMail(
      waitingForPaymentMail(email, paymentDetails),
      (err, info) => {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          console.log('Email sent (sendPayment): ' + info.response);
          resolve(true);
        }
      }
    );
  });
};

export {
  sendMail,
  sendPassword,
  sendBookingSuccess,
  sendBookingFailed,
  sendPayment,
};
