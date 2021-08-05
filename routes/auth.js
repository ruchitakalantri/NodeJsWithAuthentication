const express = require('express');

const { check , body} = require('express-validator/check');

const authController = require('../controllers/auth');

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post('/login', authController.postLogin);

router.post(
    '/signup',
    [
        check('email')
        .isEmail()
        .withMessage('Please enter valid email'),

        body(
            'password' ,
            'Please  enter valid password with only number and text and atleast 5 characters'
            )
            .isLength({min : 5 })
            .isAlphanumeric() ,
            
        body('confirmPassword')
            .custom((value , {req}) => {
               if(value !== req.body.password) {
                   throw new Error('Password has to match');
               }
               return true;
            })
    ],
    authController.postSignup
);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;