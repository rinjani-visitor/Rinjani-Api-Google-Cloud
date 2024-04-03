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

const transporterKedua = nodemailer.createTransport({
  service: process.env.MAIL_SERVICE_2,
  auth: {
    user: process.env.MAIL_USER_2,
    pass: process.env.MAIL_PASS_2,
  },
});

const createEmail = (email, userId) => {
  return {
    from: process.env.MAIL_USER_2,
    to: email,
    subject: 'Account Activation - Confirmation',
    html: `
      <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #32823A;">Account Activation</h2>
        <p>Welcome to Rinjani Visitor! To activate your account, please click the link below:</p>

        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-top: 20px;">
          <a href="${base_url}/api/users/activate/${userId}" style="display: inline-block; padding: 10px 20px; background-color: #32823A; color: #ffffff; text-decoration: none; border-radius: 3px;">Activate Your Account</a>
        </div>

        <p style="margin-top: 20px;">If the button above does not work, you can also activate your account by copying and pasting the following link into your browser:</p>

        <p>${base_url}/api/users/activate/${userId}</p>

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
        <h2 style="color: #32823A;">Password Reset Confirmation</h2>
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
        <h2 style="color: #32823A;">Booking Confirmation</h2>
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

const bookingDeclinedConfirmation = (emailTo, bookingDetails) => {
  const {
    title,
    name,
    bookingId,
    offeringPrice,
    addOns,
    totalPersons,
    createdAt,
    updatedAt,
    bookingStatus,
    adminMessage,
  } = bookingDetails;

  return {
    from: process.env.MAIL_FROM,
    to: emailTo,
    subject: 'Booking Confirmation - Reservation Successful',
    html: `
      <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #32823A;">Booking Decline Confirmation</h2>
        <p>Dear ${name},</p>
        <p>Booking has been declined.</p>

        <div style="background-color: #f5f5f5; padding: 10px; border-radius: 5px; margin-top: 20px;">
          <h3>Booking Details:</h3>
          <ul style="list-style-type: none; padding: 0;">
            <li><strong>Product Title:</strong> ${title}</li>
            <li><strong>Booking ID:</strong> ${bookingId}</li>
            <li><strong>Offering Price:</strong> ${offeringPrice}</li>
            ${addOns ? `<li><strong>AddOns:</strong> ${addOns}</li>` : ''}
            <li><strong>Total Persons:</strong> ${totalPersons}</li>
            <li><strong>Created At:</strong> ${createdAt}</li>
            <li><strong>Updated At:</strong> ${updatedAt}</li>
            <li><strong>Booking Status:</strong> ${bookingStatus}</li>
            <li><strong>Admin Message:</strong> ${adminMessage}</li>
          </ul>
        </div>

        <p style="margin-top: 20px;">You can book again with consider about <strong>Admin Message</strong> from admin or you can cancel the booking.</p>

        <p style="margin-top: 20px;">Customer Service Team!</p>

        <p style="margin-top: 40px; color: #888;">Best Regards,<br>Rinjani Visitor</p>
      </div>
    `,
  };
}

const bookingConfirmationAdmin = (emailTo, bookingDetails) => {
  const {
    title,
    name,
    country,
    email,
    phoneNumber,
    bookingId,
    startDateTime,
    endDateTime,
    offeringPrice,
    addOns,
    totalPersons,
    createdAt,
    updatedAt,
    bookingStatus,
    note,
  } = bookingDetails;

  return {
    from: process.env.MAIL_FROM,
    to: emailTo,
    subject: 'Booking Confirmation - Reservation Successful',
    html: `
      <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #32823A;">Booking Confirmation (Offering)</h2>
        <p>Dear Admin,</p>
        <p>Booking has been successfully confirmed. Please find the details below:</p>

        <div style="background-color: #f5f5f5; padding: 10px; border-radius: 5px; margin-top: 20px;">
          <h3>Booking Details:</h3>
          <ul style="list-style-type: none; padding: 0;">
            <li><strong>Product Title:</strong> ${title}</li>
            <li><strong>Customer Name:</strong> ${name}</li>
            <li><strong>Customer Country:</strong> ${country}</li>
            <li><strong>Customer Email:</strong> ${email}</li>
            ${phoneNumber ? `<li><strong>Customer Phone Number:</strong> ${phoneNumber}</li>` : ''}
            <li><strong>Booking ID:</strong> ${bookingId}</li>
            <li><strong>Start Date and Time:</strong> ${startDateTime}</li>
            ${endDateTime ? `<li><strong>End Date and Time:</strong> ${endDateTime}</li>` : ''}
            <li><strong>Offering Price:</strong> ${offeringPrice}</li>
            <li><strong>AddOns:</strong> ${addOns}</li>
            <li><strong>Total Persons:</strong> ${totalPersons}</li>
            <li><strong>Created At:</strong> ${createdAt}</li>
            <li><strong>Updated At:</strong> ${updatedAt}</li>
            <li><strong>Booking Status:</strong> ${bookingStatus}</li>
            <li><strong>Note:</strong> ${note}</li>
          </ul>
        </div>

        <p style="margin-top: 20px;">Thank you for reading this email. If you have any questions or need further assistance, feel free to contact us.</p>

        <p style="margin-top: 20px;">Customer Service Team!</p>

        <p style="margin-top: 40px; color: #888;">Best Regards,<br>Rinjani Visitor</p>
      </div>
    `,
  };
};

const updateBookingConfirmation = (emailTo, updatedBookingDetails) => {
  const { title, name, country, email, phoneNumber, startDateTime, endDateTime, addOns, offeringPrice, totalPersons, userMessage } =
    updatedBookingDetails;

  return {
    from: process.env.MAIL_FROM,
    to: emailTo,
    subject: 'Booking Update Confirmation - Changes Successful',
    html: `
      <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #32823A;">Booking Update Confirmation</h2>
        <p>Dear Admin,</p>
        <p>Booking has been successfully updated. Please find the updated details below:</p>

        <div style="background-color: #f5f5f5; padding: 10px; border-radius: 5px; margin-top: 20px;">
          <h3>Updated Booking Details:</h3>
          <ul style="list-style-type: none; padding: 0;">
            <li><strong>Product Title:</strong> ${title}</li>
            <li><strong>Customer Name:</strong> ${name}</li>
            <li><strong>Customer Country:</strong> ${country}</li>
            <li><strong>Customer Email:</strong> ${email}</li>
            <li><strong>Customer Phone Number:</strong> ${phoneNumber}</li>
            <li><strong>Start Date and Time:</strong> ${startDateTime}</li>
            ${endDateTime ? `<li><strong>End Date and Time:</strong> ${endDateTime}</li>` : ''}
            <li><strong>AddOns:</strong> ${addOns}</li>
            <li><strong>Offering Price:</strong> ${offeringPrice}</li>
            <li><strong>Total Persons:</strong> ${totalPersons}</li>
            <li><strong>User Message:</strong> ${userMessage}</li>
          </ul>
        </div>

        <p style="margin-top: 20px;">Thank you for reading this update. If you have any questions or need further assistance, feel free to contact us.</p>

        <p style="margin-top: 20px;">Customer Service Team!</p>

        <p style="margin-top: 40px; color: #888;">Best Regards,<br>Rinjani Visitor</p>
      </div>
    `,
  };
};

const cancelOrderConfirmation = (emailTo, cancelOrderDetails) => {
  const { orderId, title, name, country, orderApproveDate } = cancelOrderDetails;

  return {
    from: process.env.MAIL_FROM,
    to: emailTo,
    subject: 'Order Cancellation Confirmation',
    html: `
      <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #FF0000;">Order Cancellation Confirmation</h2>
        <p>Dear Admin,</p>
        <p>An order has been canceled. Please find the details below:</p>

        <div style="background-color: #f5f5f5; padding: 10px; border-radius: 5px; margin-top: 20px;">
          <h3>Canceled Order Details:</h3>
          <ul style="list-style-type: none; padding: 0;">
            <li><strong>Order Number:</strong> ${orderId}</li>
            <li><strong>Order Approve Date:</strong> ${orderApproveDate}</li>
            <li><strong>Product Title:</strong> ${title}</li>
            <li><strong>Customer Name:</strong> ${name}</li>
            <li><strong>Customer Country:</strong> ${country}</li>
          </ul>
        </div>

        <p style="margin-top: 20px;">Thank you for handling this cancellation. If you have any questions or need further assistance, feel free to contact us.</p>

        <p style="margin-top: 20px;">Customer Service Team!</p>

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
        <h2 style="color: #32823A;">Payment Status Update</h2>
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

const wisePaymentConfirmation = (email, paymentDetails) => {
  const {
    paymentId,
    bookingId,
    method,
    wiseEmail,
    wiseAccountName,
    imageProofTransfer,
    createdAt,
  } = paymentDetails;

  return {
    from: process.env.MAIL_FROM,
    to: email,
    subject: 'Payment Confirmation - Wise Transfer (Need Review)',
    html: `
      <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #32823A;">Payment Confirmation (Need Review)</h2>
        <p>Dear Admin,</p>
        <p>Payment via Wise has been successfully transfered. Please find the details below to review:</p>

        <div style="background-color: #f5f5f5; padding: 10px; border-radius: 5px; margin-top: 20px;">
          <h3>Payment Details:</h3>
          <ul style="list-style-type: none; padding: 0;">
            <li><strong>Payment ID:</strong> ${paymentId}</li>
            <li><strong>Booking ID:</strong> ${bookingId}</li>
            <li><strong>Method:</strong> ${method}</li>
            <li><strong>Wise Email:</strong> ${wiseEmail}</li>
            <li><strong>Wise Account Name:</strong> ${wiseAccountName}</li>
            <li><strong>Image Proof of Transfer:</strong> ${imageProofTransfer}</li>
            <li><strong>Created At:</strong> ${createdAt}</li>
          </ul>
        </div>

        <p style="margin-top: 20px;">Thank you for reading. If you have any questions or need further assistance, feel free to contact us.</p>

        <p style="margin-top: 20px;">Customer Service Team!</p>

        <p style="margin-top: 40px; color: #888;">Best Regards,<br>Rinjani Visitor</p>
      </div>
    `,
  };
};

const bankPaymentConfirmation = (email, paymentDetails) => {
  const {
    paymentId,
    bookingId,
    method,
    bankName,
    bankAccountName,
    imageProofTransfer,
    createdAt,
  } = paymentDetails;

  return {
    from: process.env.MAIL_FROM,
    to: email,
    subject: 'Payment Confirmation - Bank Transfer (Need Review)',
    html: `
      <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #32823A;">Payment Confirmation (Need Review)</h2>
        <p>Dear Admin,</p>
        <p>Payment via Bank has been successfully transfered. Please find the details below to review:</p>

        <div style="background-color: #f5f5f5; padding: 10px; border-radius: 5px; margin-top: 20px;">
          <h3>Payment Details:</h3>
          <ul style="list-style-type: none; padding: 0;">
            <li><strong>Payment ID:</strong> ${paymentId}</li>
            <li><strong>Booking ID:</strong> ${bookingId}</li>
            <li><strong>Method:</strong> ${method}</li>
            <li><strong>Bank Name:</strong> ${bankName}</li>
            <li><strong>Bank Account Name:</strong> ${bankAccountName}</li>
            <li><strong>Image Proof of Transfer:</strong> ${imageProofTransfer}</li>
            <li><strong>Created At:</strong> ${createdAt}</li>
          </ul>
        </div>

        <p style="margin-top: 20px;">Thank you for reading. If you have any questions or need further assistance, feel free to contact us.</p>

        <p style="margin-top: 20px;">Customer Service Team!</p>

        <p style="margin-top: 40px; color: #888;">Best Regards,<br>Rinjani Visitor</p>
      </div>
    `,
  };
};

const createMessage = (email, emailUser, name, subject, message) => ({
  from: process.env.MAIL_FROM,
  to: email,
  subject: `${subject} - Rinjani Visitor`,
  html: `
      <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #32823A;">${subject}</h2>
        <p>Hi admin, you have a new message from <strong>${name}</strong> <i>(${emailUser})</i></p>

        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-top: 20px;">
          <table style="width: 100%;">
            <tr>
              <td>${message}</td>
            </tr>
          </table>
        </div>

        <p style="margin-top: 20px;">If you have any questions or need assistance, feel free to contact us.</p>

        <p style="margin-top: 40px; color: #888;">Best Regards,<br>Rinjani Visitor</p>
      </div>
    `,
});

const confirmDeleteAccountUserByAdmin = (email) => {
  return {
    from: process.env.MAIL_FROM,
    to: email,
    subject: 'Delete Account Confirmation',
    html: `
      <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #32823A;">Delete Account Confirmation</h2>
      
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-top: 20px;">
          <table style="width: 100%;">
            <tr>
              <td style="width: 30%;"><strong>Hi ${email},</strong><br><p>We received a request to delete your account and your account has been successfully deleted</p></td>
            </tr>
          </table>
        </div>

        <p style="margin-top: 20px;">Thank you for using our service. If you have any questions or need further assistance, feel free to contact us.</p>

        <p style="margin-top: 40px; color: #888;">Best Regards,<br>Rinjani Visitor</p>
      </div>
    `,
  };
};

const sendMail = (email, token) => {
  return new Promise((resolve, reject) => {
    transporterKedua.sendMail(createEmail(email, token), (err, info) => {
      if (err) {
        console.error('Error sending email:', err);
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
    transporterKedua.sendMail(contentPwd(email, password), (err, info) => {
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
    transporterKedua.sendMail(bookingSuccess(email, bookingDetails), (err, info) => {
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
    transporterKedua.sendMail(bookingFailed(email, bookingDetails), (err, info) => {
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
    transporterKedua.sendMail(
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

const sendWisePaymentToAdmin = (email, paymentDetails) => {
  return new Promise((resolve, reject) => {
    transporter.sendMail(
      wisePaymentConfirmation(email, paymentDetails),
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

const sendBankPaymentToAdmin = (email, paymentDetails) => {
  return new Promise((resolve, reject) => {
    transporter.sendMail(
      bankPaymentConfirmation(email, paymentDetails),
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

const sendBookingOfferingToAdmin = (email, bookingDetails) => {
  return new Promise((resolve, reject) => {
    transporter.sendMail(
      bookingConfirmationAdmin(email, bookingDetails),
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

const sendBookingDeclinedConfirmation = (email, bookingDetails) => {
  return new Promise((resolve, reject) => {
    transporter.sendMail(
      bookingDeclinedConfirmation(email, bookingDetails),
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
}

const sendUpdateBookingOfferingToAdmin = (email, bookingDetails) => {
  return new Promise((resolve, reject) => {
    transporter.sendMail(
      updateBookingConfirmation(email, bookingDetails),
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

const sendOrderCancelToAdmin = (email, orderDetais) => {
  return new Promise((resolve, reject) => {
    transporter.sendMail(
      cancelOrderConfirmation(email, orderDetais),
      (err, info) => {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          console.log('Email sent (send Cancel Order Email): ' + info.response);
          resolve(true);
        }
      }
    );
  })
}

const sendMailMessage = (email, emailUser, name, subject, message) => new Promise((resolve, reject) => {
  transporter.sendMail(createMessage(email, emailUser, name, subject, message), (err, info) => {
    if (err) {
      console.error('Error sending email:', err);
      reject(err);
    } else {
      console.log(`Email sent (sendMail): ${info.response}`);
      resolve(true);
    }
  });
});

const sendConfirmDeleteAccountUserByAdmin = (email) => new Promise((resolve, reject) => {
  transporter.sendMail(confirmDeleteAccountUserByAdmin(email), (err, info) => {
    if (err) {
      console.error('Error sending email:', err);
      reject(err);
    } else {
      console.log(`Email sent (sendConfirmDeleteAccountUserByAdmin): ${info.response}`);
      resolve(true);
    }
  });
})

export {
  sendMail,
  sendPassword,
  sendBookingSuccess,
  sendBookingFailed,
  sendPayment,
  sendWisePaymentToAdmin,
  sendBankPaymentToAdmin,
  sendBookingOfferingToAdmin,
  sendUpdateBookingOfferingToAdmin,
  sendBookingDeclinedConfirmation,
  sendOrderCancelToAdmin,
  sendMailMessage,
  sendConfirmDeleteAccountUserByAdmin,
};
