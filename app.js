const express = require('express');
const app = express();
const ejsMate = require('ejs-mate');
const path = require('path');

app.set('view engine', 'ejs');
app.engine('ejs', ejsMate);
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/home', (req, res) => {
    res.render('main/index.ejs');
});
app.get('/profile', (req, res) => {
    res.render('main/profile.ejs');
});


app.get('/signup', (req, res) => {
    res.render('users/signup.ejs');
});

app.get('/login', (req, res) => {
    res.render('users/login.ejs');
});

app.listen(3000, () => {
    console.log("Listening to port 3000");
});