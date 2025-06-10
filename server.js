require('dotenv').config();
require("./db/conn.js");
const express = require('express');
const bodyparser = require('body-parser');
const nodemailer= require('nodemailer');
const mongoose = require('mongoose');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const ejs =require("ejs");
const app = express();
app.set('view engine',"ejs");

const Donation = require('./model/schema.js').Donation;
const Counter = require('./model/schema.js').Counter;

app.use(bodyparser.urlencoded({ extended: true }));
const path = require('path');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'resource'))); 
app.use(express.json());
app.use(express.urlencoded({extended:false}));
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


const transporter = nodemailer.createTransport({
    service: 'gmail', // Change this to your email provider
    auth: {
      user: process.env.EMAIL, // Your email
      pass: process.env.PASSWORD // Your email password or app password
    }
  });
app.get("/", function(req, res) {
    res.render("index")
 });
app.get("/about",function(req,res){
    res.render("aboutus")
});
app.get("/donation", function(req, res) {
  res.render("donation", {
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID
  });
});
app.get("/contact",function(req,res){
    res.render("contact")
});
app.get("/programs",function(req,res){
    res.render("program")})




app.post('/send-email', (req, res) => {
    const { name, email, phone, subject, message, newsletter } = req.body;
    
    // Create email content
    const mailOptions = {
      from: process.env.EMAIL, // Sender email
      to:req.body.email, // Recipient email
      subject: `Contact Form: ${subject}`,
      html: `
        <h3>Thank you for contacting with us</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
        <p><strong>Newsletter Subscription:</strong> ${newsletter ? 'Yes' : 'No'}</p>
      `
    };
    

    const adminMailOptions = {
    from: process.env.EMAIL,
    to: process.env.EMAIL, 
    subject: `New Contact Form Submission: ${subject}`,
    html: `
      <h3>New Contact Form Submission</h3>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong></p>
      <p>${message}</p>
      <p><strong>Newsletter Subscription:</strong> ${newsletter ? 'Yes' : 'No'}</p>
    `
  };
    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error sending email:', error);
        return res.status(500).json({ success: false, message: 'Error sending email' });
      }
    
      


transporter.sendMail(adminMailOptions, (error, info) => {
      if (error) {
        console.log('Error sending email:', error);
        return res.status(500).json({ success: false, message: 'Error sending email' });
      }
      

});
      // If user wants to subscribe to newsletter
      //if (newsletter) {
        // Add code here to save email to newsletter database or send to email marketing service
        //console.log(`Adding ${email} to newsletter subscribers`);
     // }
      
      return res.status(200).json({ success: true, message: 'Email sent successfully' });
    });
  });

app.post('/send-donation-receipt', (req, res) => {
  const { name, email, phone, address, panNumber, date, amount } = req.body;

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: "Your Donation Receipt Request",
    html: `
  <div style="font-family: Arial, sans-serif; color: #333;">
    <h2 style="color: #007BFF;">Thank You for Your Generous Donation!</h2>
    <p>Dear ${name},</p>
    <p>We sincerely thank you for your contribution to <strong>Phiniex Educational and Social Welfare Trust</strong>. Your support helps us continue our mission to empower lives through education and social initiatives.</p>

    <h4>Donation Details</h4>
    <ul style="line-height: 1.6;">
      <li><strong>Name:</strong> ${name}</li>
      <li><strong>Email:</strong> ${email}</li>
      <li><strong>Phone:</strong> ${phone}</li>
      <li><strong>Address:</strong> ${address}</li>
      <li><strong>PAN Number:</strong> ${panNumber || 'Not provided'}</li>
      <li><strong>Date:</strong> ${date}</li>
      <li><strong>Amount Donated:</strong> ₹${amount}</li>
    </ul>

    <p>You will receive an official donation receipt shortly. If you have any questions, feel free to reach out to us at <a href="mailto:phiniex1891@gmail.com">phiniex1891@gmail.com</a>.</p>

    <p style="margin-top: 20px;">With heartfelt gratitude,<br/><strong>The Phiniex Trust Team</strong></p>

    <hr style="margin: 30px 0;" />
    <small>This is an automated email. Please do not reply to this message.</small>
  </div>
`

  };

  const adminOptions = {
    from: process.env.EMAIL,
    to: process.env.EMAIL, // Admin email
    subject: `New Donation Receipt Request from ${name}`,
    html: mailOptions.html
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error("User email error:", err);
      return res.status(500).json({ success: false });
    }

    transporter.sendMail(adminOptions, (err2, info2) => {
      if (err2) {
        console.error("Admin email error:", err2);
        return res.status(500).json({ success: false });
      }
      return res.status(200).redirect("/donation");
      alert("thanks for donating check your Email for further updates")
       
    });
  });
});


 
  
 

  


 const PORT =  process.env.PORT || 3000
app.listen(PORT, function(){
    console.log(`server started at ${PORT}`);
});
