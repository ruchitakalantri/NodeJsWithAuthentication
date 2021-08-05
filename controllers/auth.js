const crypto = require('crypto')

const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');

const User = require('../models/user');
const user = require('../models/user');

const transporter = nodemailer
  .createTransport(
    sendgridTransport({
      auth : { 
        api_key : 'SENDGRID_API_KEY_PASTE_HERE'                
        }
      })
    );

exports.getLogin = (req, res, next) => {
  let message = req.flash('error');
  if(message.length > 0) {
    message = message[0];
  } else {
    message = null
  }
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login' ,
    errorMessage : message
  });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash('error');
  if(message.length > 0) {
    message = message[0];
  } else {
    message = null
  }

  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    errorMessage : message
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  User.findOne({ email : email})
    .then(user => {
      if(!user) {
        req.flash('error' , 'Invalid Email');
        return res.redirect('/login');
      }
      // user exist 
      // validate password
      bcrypt
        .compare(password , user.password)
        .then(doMatch => {
          if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save(err => {
              console.log(err);
              return res.redirect('/');
          });  
        }
          req.flash('error' , 'Invalid Password');
          res.redirect('/login');
        })
        .catch(err => {
          console.log(err);
          res.redirect('/login')
        });   
    })
    .catch(err => console.log(err));
};

exports.postSignup = (req, res, next) => {
  //extract info from incoming request
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;

  // validate later

  //find email
  User
    .findOne({email : email})
    .then(userDoc => {
      if(userDoc) {
        req.flash('error' , 'E-mail Exist Already!! ');
        //have user..user already exist
        return res.redirect('/signup');
      }
      //bcrypt package
      // hash value of 12 is considered highlly secured
      return bcrypt
        .hash(password , 12)  
        .then(hashedPassword => {
          //create new user
          const user = new User ({
            email : email ,
            password : hashedPassword,
            cart : { items : [] }
          });
          return user.save();
        })
      .then(result => {
        res.redirect('/login');
        return transporter.sendMail({
          to : email ,
          from : 'shop@node-complete.com' ,
          subject : 'SignUp Success',
          html : '<h1> You Signed Up Successfuly!! </h1>'
        });  
      })
      .catch(err => console.log(err));
    })
    .catch(err => console.log(err));  
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/');
  });
};

exports.getReset = (req , res ,next) => {
  let message = req.flash('error');
  if(message.length > 0) {
    message = message[0];
  } else {
    message = null
  }
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    errorMessage : message
  });
};
 
exports.postReset = (req,res,next) => {
  crypto.randomBytes(32 , (err , buffer) => {
    if(err) {
      console.log(err);
      returnres.redirect('/reset')
    }
    const token = buffer.toString('hex');
    User
      .findOne({email : req.body.email})
      .then(user => {
        if(!user) {
          req.flash('error' , 'No Account With That Email !');
          return res.redirect('/reset');
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save();
      })
      .then(result => {
        res.redirect('/');
        transporter.sendMail({
          to : req.body.email ,
          from : 'shop@node-complete.com' ,
          subject : 'Password Reset',
          html : `
            <p> You requested password reset</p>
            <p> Click this<a href = "http://localhost:3000/reset/${token}"> link </a>to set new password</p>
          `
        });
      })
      .catch(err => console.log(err));
  });
};

exports.getNewPassword = (req,res,next) => {
  //get token
  const token = req.params.token;
  User
    .findOne({
      resetToken : token , 
      resetTokenExpiration : {$gt: Date.now()}
    })
    .then(user => {
      let message = req.flash('error');
      if(message.length > 0) {
        message = message[0];
      } else {
        message = null
      }   
      res.render('auth/new-password', {
        path: '/new-password',
        pageTitle: 'New Password',
        errorMessage : message,
        userid : user._id.toString(),
        passwordToken : token
      });
    })
    .catch(err => console.log(err));
};

exports.postNewPassword = (req,res,next) => {
  //extract new password
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;

  let resetUser;
  //reset user
  User
    .findOne ({
      resetToken : passwordToken , 
      resetTokenExpiration : {$gt : Date.now()} , 
      _id : userId 
    })
    .then(user => {
      resetUser = user ;
      return bcrypt.hash(newPassword , 12) ;
    })
    .then( hashedPassword => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = null;
      resetUser.resetTokenExpiration = undefined;
      return resetUser.save();
    })
    .then(result => {
      res.redirect('/login');
    })
    .catch(err => console.log(err));

};