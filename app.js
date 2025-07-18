const express = require('express');
const app = express();
const ejsMate = require('ejs-mate');
const path = require('path');
const mongoose = require("mongoose");
const NodeGeocoder = require("node-geocoder")
const Upload = require('./models/uploads.js');
const Need = require('./models/needs.js');
const User = require('./models/user.js');
const flash = require('connect-flash');
const passport = require("passport");
const passportLocal = require("passport-local");
const session = require("express-session");
const { saveRedirectUrl, isLoggedIn } = require("./middleware.js");
const multer = require('multer');
const { storage } = require("./cloudConfig.js");
const upload = multer({ storage });

if (process.env.NODE_ENV != "production") {
    require('dotenv').config();
}

const isProduction = process.env.NODE_ENV === "production";
const refererURL = isProduction ? "https://nestin-wnne.onrender.com/listings" : "http://localhost:3000/home";

const MONGO_URL = process.env.DB_URL;

main()
    .then(() => {
        console.log("Connected to DB");
    })
    .catch((err) => {
        console.log(err);
    });

async function main() {
    await mongoose.connect(MONGO_URL);
}

app.set('view engine', 'ejs');
app.engine('ejs', ejsMate);
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

const sessionOptions = {
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
}

// app.get("/", (req, res) => {
//     res.send("Hi, I am root");
// });

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new passportLocal(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.curUser = req.user;
    next();
});

app.get('/home', (req, res) => {
    res.render('main/index.ejs');
});

app.get('/contribute', isLoggedIn, (req, res) => {
    res.render('main/contribute.ejs');
});

app.get('/needs', isLoggedIn, (req, res) => {
    res.render('main/needs.ejs');
});


// Create Route - Uploads
app.post('/uploads', isLoggedIn, upload.single('uploads[image]'), async (req, res) => {
    let uploads = req.body.uploads;
    console.log(uploads);
    const geocoder = NodeGeocoder({
        provider: 'openstreetmap',
        fetch: async (url, options = {}) => {
            const modifiedOptions = {
                ...options,
                headers: {
                    ...options.headers,
                    'User-Agent': 'EchoBridge/1.0 (503manashsvjc@gmail.com)',
                    'Referer': refererURL,
                }
            };

            return fetch(url, modifiedOptions);
        }

    });
    const response = await geocoder.geocode(uploads.location);
    const geometry = {
        type: "Point",
        coordinates: [
            response[0].longitude,
            response[0].latitude,
        ],
    }

    let url = req.file.path;
    let filename = req.file.filename;
    const newUpload = new Upload(uploads);
    newUpload.owner = req.user._id;
    newUpload.image = { url, filename };
    newUpload.geometry = geometry;
    await newUpload.save();
    req.flash("success", "New Nest Created!");
    res.redirect("/uploads");
});

// Show Route - Uploads
app.get('/uploads/:id', isLoggedIn, async (req, res) => {
    const uploads = await Upload.findById(req.params.id).populate("owner");
    const needs = await Need.find({ category: uploads.category }).populate("owner");
    res.render('main/show.ejs', { uploads, needs });
});

app.get('/uploads', isLoggedIn, async (req, res) => {
    const uploads = await Upload.find({}).populate("owner");
    const allUploads = uploads.filter(upload => {
        console.log(req.user.role);
        return (
            upload.owner && (
                upload.owner._id.equals(req.user._id) || req.user.role === 'ngo'
            )
        );
    });
    res.render('main/uploads.ejs', { allUploads });
});

// Create Route - Needs
app.post('/profile', isLoggedIn, async (req, res) => {
    let needs = req.body.needs;
    console.log(needs);
    const geocoder = NodeGeocoder({
        provider: 'openstreetmap',
        fetch: async (url, options = {}) => {
            const modifiedOptions = {
                ...options,
                headers: {
                    ...options.headers,
                    'User-Agent': 'EchoBridge/1.0 (503manashsvjc@gmail.com)',
                    'Referer': refererURL,
                }
            };

            return fetch(url, modifiedOptions);
        }

    });
    const response = await geocoder.geocode(needs.location);
    const geometry = {
        type: "Point",
        coordinates: [
            response[0].longitude,
            response[0].latitude,
        ],
    }

    const newNeed = new Need(needs);
    newNeed.owner = req.user._id;
    newNeed.geometry = geometry;
    await newNeed.save();
    req.flash("success", "Need Added!");
    res.redirect("/uploads");
});

app.get('/signup', (req, res) => {
    res.render('users/signup.ejs');
});

app.post('/signup', saveRedirectUrl, async (req, res) => {
    try {
        let { email, username, role, password, phone } = req.body;
        console.log(req.body);
        let newUser = new User({ email, username, phone, role });
        let registeredUser = await User.register(newUser, password);
        req.login(registeredUser, (err) => {
            if (err) {
                return next(err);
            }
            req.flash("success", `Welcome to EchoBridge!`);
            let redirectUrl = res.locals.redirectUrl || "/home";
            res.redirect(redirectUrl);
        });
    } catch (e) {
        req.flash("error", e.message);
        res.redirect("/signup");
    }
});

app.get('/login', (req, res) => {
    res.render('users/login.ejs');
});

app.post('/login', saveRedirectUrl, passport.authenticate("local", { failureRedirect: "/login", failureFlash: true }), async (req, res) => {
    let { username } = req.body;
    req.flash("success", `Hi ${username}, now you're all set to explore!`);
    let redirectUrl = res.locals.redirectUrl || "/home";
    res.redirect(redirectUrl);
});

app.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash("success", "Thank you for visiting us. Have a nice day!");
        res.redirect("/home");
    });
});

app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went wrong" } = err;
    // res.status(statusCode).send(message);
    res.status(statusCode).render("includes/error.ejs", { err });
});

app.listen(3000, () => {
    console.log("Listening to port 3000");
});