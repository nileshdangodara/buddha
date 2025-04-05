require('dotenv').config();
const express = require('express');
const bodyparser = require('body-parser');
const nodemailer= require('nodemailer');
const ejs =require("ejs");
const app = express();
app.set('view engine',"ejs");

app.use(bodyparser.urlencoded({ extended: true }));
const path = require('path');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'resource'))); 
app.use(express.json());
app.use(express.urlencoded({extended:false}));



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
 const PORT =  process.env.PORT || 3000
app.listen(PORT, function(){
    console.log(`server started at ${PORT}`);
});
