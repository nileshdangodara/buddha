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
      
      console.log('Email sent:', info.response);
      
      // If user wants to subscribe to newsletter
      if (newsletter) {
        // Add code here to save email to newsletter database or send to email marketing service
        console.log(`Adding ${email} to newsletter subscribers`);
      }
      
      return res.status(200).json({ success: true, message: 'Email sent successfully' });
    });
  });


  function numberToWords(num) {
    const single = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if (num < 20) return single[num];
    
    if (num < 100) {
      return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + single[num % 10] : '');
    }
    
    if (num < 1000) {
      return single[Math.floor(num / 100)] + ' Hundred' + (num % 100 !== 0 ? ' and ' + numberToWords(num % 100) : '');
    }
    
    if (num < 100000) {
      return numberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 !== 0 ? ' ' + numberToWords(num % 1000) : '');
    }
    
    if (num < 10000000) {
      return numberToWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 !== 0 ? ' ' + numberToWords(num % 100000) : '');
    }
    
    return numberToWords(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 !== 0 ? ' ' + numberToWords(num % 10000000) : '');
  }
  
  // Function to get the next receipt number
  async function getNextReceiptNumber() {
    const counter = await Counter.findOneAndUpdate(
      { _id: 'receiptNumber' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    
    const year = new Date().getFullYear();
    const formattedNumber = String(counter.seq).padStart(4, '0');
    return `PESWT/${year}/${formattedNumber}`;
  }


  app.post("/create-order", async (req, res) => {
    try {
      const { amount } = req.body;
      
      // Amount needs to be in paise (multiply by 100)
      const options = {
        amount: amount * 100,
        currency: "INR",
        receipt: "order_receipt_" + Date.now(),
        payment_capture: 1 // Auto capture payment
      };
      
      const order = await razorpay.orders.create(options);
      res.json({ order });
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ error: "Could not create order" });
    }
  });
  app.post("/verify-payment", async (req, res) => {
    try {
      const { razorpay_payment_id, razorpay_order_id, razorpay_signature, formData } = req.body;
      
      // Verify signature
      const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");
      
      if (generatedSignature !== razorpay_signature) {
        return res.status(400).json({ success: false, error: "Invalid payment signature" });
      }
      
      // Get payment details from Razorpay
      const payment = await razorpay.payments.fetch(razorpay_payment_id);
      
      // Generate receipt number
      const receiptNumber = await getNextReceiptNumber();
      
      // Prepare donation data
      const donationData = {
        receiptNumber: receiptNumber,
        name: formData.name,
        address: formData.address || '',
        amount: payment.amount / 100,
        date: new Date(),
        transactionId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        panNumber: formData.panNumber || '',
        email: formData.email,
        phone: formData.phone
      };
      
      // Save donation to database
      const donation = new Donation(donationData);
      await donation.save();
      
      // Attempt to send email (but don't fail if it doesn't work)
      try {
        await sendReceiptEmail({
          email: formData.email,
          name: formData.name,
          amount: payment.amount / 100,
          paymentId: razorpay_payment_id,
          date: new Date(),
          receiptNumber: receiptNumber
        });
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        // Continue even if email fails
      }
      
      // Successful response
      res.json({
        success: true,
        message: "Payment verified and recorded successfully",
        receiptNumber: receiptNumber,
        paymentDetails: {
          amount: payment.amount / 100,
          currency: payment.currency,
          date: payment.created_at
        }
      });
      
    } catch (error) {
      console.error("Payment verification error:", error);
      
      // More specific error messages
      let errorMessage = "Payment verification failed";
      if (error.message.includes("validation failed")) {
        errorMessage = "Data validation failed - please check all required fields";
      } else if (error.message.includes("credentials")) {
        errorMessage = "Server configuration error - please try again later";
      }
      
      res.status(500).json({ 
        success: false, 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });
  // Function to send receipt email
  async function sendReceiptEmail(data) {
    // Use a service like Nodemailer to send emails
   
    const mailOptions = {
      from: process.env.EMAIL,
      to: data.email,
      subject: "Thank You for Your Donation",
      html: `
        <h2>Donation Receipt</h2>
        <p>Dear ${data.name},</p>
        <p>Thank you for your generous donation of ₹${data.amount}.</p>
        <p>Payment ID: ${data.paymentId}</p>
        <p>Date: ${data.date.toLocaleDateString()}</p>
        <p>We appreciate your support!</p>
      `
    };
    
    return transporter.sendMail(mailOptions);
  }



 const PORT =  process.env.PORT || 3000
app.listen(PORT, function(){
    console.log(`server started at ${PORT}`);
});
