const bcrypt = require('bcryptjs');
const User = require('../models/user');

exports.getLogin = (req, res, next) => {
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    isAuthenticated: false
  });
};

exports.getSignup = (req, res, next) => {
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    isAuthenticated: false
  });
};

exports.postLogin = (req, res, next) => {
  User.findById('6104f0474d38bd11eed21357')
    .then(user => {
      req.session.isLoggedIn = true;
      req.session.user = user;
      req.session.save(err => {
        console.log(err);
        res.redirect('/');
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
        //have user..user already exist
        return res.redirect('/signup');
      }
      //bcrypt package
      // hash value of 12 is considered highlly secured
      return bcrypt.hash(password , 12);
    
    })
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
    })
    .catch(err => console.log(err));




};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/');
  });
};
