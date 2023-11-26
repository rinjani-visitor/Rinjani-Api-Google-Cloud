const userNotFoundHtml = `
  <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 50px auto;">
    <h2 style="color: #e74c3c;">Activate User Failed</h2>
    <p>User not found or expired</p>
  </div>
`;

const userActivatedHtml = (userName, userEmail) => `
    <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 50px auto;">
        <h2 style="color: #32823A;">User activated successfully</h2>
        <h4 style="color: #32823A;">Welcome to Rinjani Visitor</h4>
        <p>Dear ${userName},</p>
        <p>Your account has been successfully activated.</p>
        <p>Name: ${userName}</p>
        <p>Email: ${userEmail}</p>
    </div>
`;

export { userNotFoundHtml, userActivatedHtml };
