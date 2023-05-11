const express = require('express')
const multer = require('multer');
const path = require("path")
const bodyParser = require('body-parser');
const util = require("util")
const fs = require("fs")
const unlinkFile = util.promisify(fs.unlink)
const mongoose = require("mongoose")
const { dirname } = require('path');
const { unlink } = require('fs/promises');
const bcrypt = require("bcrypt");
const { log } = require('console');
const saltRounds =10
const alert = require("alert")
const nodemailer = require("nodemailer");
require('dotenv').config();



const app = express();
app.use(express.urlencoded({extended:true}))
app.use(bodyParser.urlencoded({extended:true}))
app.use(bodyParser.json());
app.use(express.static("public"))
app.use(express.static(__dirname + '/public'));
app.set('view engine','ejs');



mongoose.set("strictQuery", false);
mongoose.connect("mongodb+srv://mokshkukreja999:moksh.1234@cluster0.frzozja.mongodb.net/?retryWrites=true&w=majority")




const userSchema = new mongoose.Schema({
  email: String,
  password:String
})


const User = new mongoose.model("User",userSchema)




const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null,uniqueSuffix+path.extname(file.originalname))
  }
})

const upload = multer({ 
  storage: storage ,
  limits:{fileSize:100000000},
  fileFilter: function(req,file,cb){
    checkFileType(file,cb)
  }
}).any()

function checkFileType (file, cb) {

  const fileTypes = /jpeg|png|jpg/
  const extname =fileTypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = fileTypes.test(file.mimetype)

  if(mimetype && extname){
    return cb(null,true)
  }else{
    cb("Please upload images only")
  }

}


app.get("/",(req,res)=>{
    res.render("home")
})

app.get("/login",(req,res)=>{
  res.render("login")
})
app.get("/register",(req,res)=>{
  res.render("register")
})
app.get("/contact",(req,res)=>{
  res.render("contact")
})
app.get("/index",(req,res)=>{
  if(req.isAuthenticated()){
    res.redirect("/main")
  }else{
    res.redirect("/login")
  }
})


app.post('/upload',(req,res)=>{
  upload(req,res,(err)=>{
    if(!err && req.files!=""){
      res.status(200).send()
    }else if(!err && req.files==""){
      res.statusMessage="Please select an image to upload"
      res.status(400).end()
    }else{
      res.statusMessage = (err === "Please upload images only") ? err : "Photo exceed limit of 1 MB"
      res.status(400).end()
    }
  })
})

app.post("/register",(req,res)=>{
  bcrypt.hash(req.body.password,10,function(err,hash){
    const newUser = new User({
      email:req.body.username,
      password: hash
     })
     newUser.save(function(err){
      if(err){
        console.log(err);
      }else{
        res.redirect("/")
      }
     })
  })
   
})

app.post("/login",(req,res)=>{
   const username = req.body.username
  const password = req.body.password

  User.findOne({email:username},function(err,founduser){
    if(err){
      console.log(err)
    }else if(!founduser){
      alert("Email not registered")
    }else{
      if(founduser){
        bcrypt.compare(password,founduser.password,function(err,result){
          if(result===false){
              alert("Invalid password!")
              }else if(result===true){
                let images=[]
                fs.readdir("./public/uploads/",(err,files)=>{
                  if(!err){
                    files.forEach(file=>{
                      images.push(file)
                    })
                    res.render("index",{images:images})
              }else{
                 console.log(err)
              }
            })
          }
        })
      }
    }
  })

})

app.post("/contact",(req,res)=>{


 const  contactusername = req.body.contactname
 const contactemail = req.body.contactemail
 const contactnumber = req.body.contactnumber
 const contactmessage = req.body.message

  const transporter = nodemailer.createTransport({
    service:"gmail",
    auth: {
      user: "mokshkukreja999@gmail.com", // generated ethereal user
      pass: process.env.EMAIL, // generated ethereal password
    },
  });
  const mailOptions={
    from: contactusername,
    to : "mokshkukreja999@gmail.com",
    subject:`Message from ${contactusername}`,
    text:  `Name: ${contactusername}
    Email: ${contactemail}
    Number: ${contactnumber}
    Message: ${contactmessage}
    `
  }
  transporter.sendMail(mailOptions,function(err,info){
    if(err){
        console.log(err);
    }else{
         alert("Mail Sent")
        console.log("email sent:"+info.response);
        res.render("contact")
    }
  })

})
  
app.put("/delete", (req, res) => {
  const deleteImages = req.body.deleteImages;
  function unlinkFile(filePath) {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(err);
      }
    });
  }

  if (deleteImages === undefined || !Array.isArray(deleteImages) || deleteImages.length == 0) {
    res.statusMessage = "Please select an image to delete";
    res.status(400).end();
  }else {
    deleteImages.forEach(image => {
      unlinkFile("./public/uploads/" + image);
    });
    res.statusMessage = "Successfully deleted";
    res.status(200).end();
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
