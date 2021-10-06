const express = require('express');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');

const mongoDB = 'mongodb+srv://joankii-passport:4IPaZ9L6T2jDZgO8@cluster0.triwf.mongodb.net/passport_auth?retryWrites=true&w=majority';
mongoose.connect(mongoDB, {useUnifiedTopology: true, useNewUrlParser: true});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'mongo connection error'));


const User = mongoose.model(
  'User',
  new Schema({
    username: { type: String, required: true },
    password: { type: String, required: true }
  })
);

const app = express();
app.set('views', __dirname);
app.set('view engine', 'ejs');

app.use(session({ secret: 'cats', resace: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));

passport.use(
  new LocalStrategy((username, password, done) => {
    User.findOne({username: username}, (err, user) => {
      if (err) {return done(err)};
      if (!user) {return done(null, false, {message: 'Incorrect username'})};
      bcrypt.compare(password, user.password, (err, res) => {
        if (res) {return done(null, user)};
        if (err) {return done(null , false, {message: 'Incorrect username'})};
      });
    });
  })
);
passport.serializeUser(function(user, done) {
  done(null, user.id);
});
passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

app.use(function(req, res, next) {
  res.locals.currentUser = req.user;
  next();
});

app.get('/', (req, res) => {
  res.render('index');
});
app.get('/signup', (req, res) => res.render('signup-form'));
app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
})

app.post('/signup', (req, res, next) => {
  bcrypt.hash(req.body.password, 10, (err, hashedPassword) => {
    if (err) {return next(err)};
    const user = new User({
      username: req.body.username,
      password: hashedPassword
    }).save(err => {
      if (err) {return next(err)};
      res.redirect('/');
    });
  })
});
app.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/'
}));

app.listen(3000, () => console.log('app listening on port 3000!'));
