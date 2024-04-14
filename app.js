const express = require('express');
const Web3 = require('web3');
const TruffleContract = require('truffle-contract');
const fs = require('fs');
const mongoose = require('mongoose');
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user.js');
const { saveRedirectUrl } = require('./middleware.js');

const MONGO_URL = "mongodb+srv://sumit957602:GAezeicrv1JrwvDU@fakeproductidentificati.89wqfei.mongodb.net/?retryWrites=true&w=majority&appName=fakeProductIdentification";

function asyncWrap(fn) {
    return function(req, res, next) {
        fn(req, res, next).catch(next);
    };
}


main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
    await mongoose.connect(MONGO_URL);
}

const app = express();
const port = 3000;

app.use(express.static('build'));
app.use(express.static('build/contracts'));
app.use(express.static('contracts'));
app.use(express.static('migrations'));
app.use(express.static('views'));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

let web3;
let productContract;

async function init() {
    try {
        // Initialize web3 provider
        if (typeof window !== 'undefined' && typeof window.web3 !== 'undefined') {
            // MetaMask is installed
            web3 = new Web3(window.web3.currentProvider);
        } else {
            // MetaMask is not installed, fallback to localhost
            web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:7545'));
        }

        // Initialize contract
        const contractJson = fs.readFileSync('build\contracts\product.json', 'utf8');
        const productArtifact = JSON.parse(contractJson);
        productContract = TruffleContract(productArtifact);
        productContract.setProvider(web3.currentProvider);
    } catch (error) {
        console.error('Error initializing:', error);
    }
}

// Initialize Express app
app.get('/getData', async (req, res) => {
    try {
        const consumerCode = req.query.consumerCode;

        // Get accounts
        const accounts = await web3.eth.getAccounts();

        // Get contract instance
        const instance = await productContract.deployed();

        // Get purchase history
        const result = await instance.getPurchaseHistory(web3.utils.fromAscii(consumerCode), { from: accounts[0] });

        // Process result
        const productSNs = result[0].map(sn => web3.utils.hexToAscii(sn));
        const sellerCodes = result[1].map(code => web3.utils.hexToAscii(code));
        const manufacturerCodes = result[2].map(code => web3.utils.hexToAscii(code));

        res.send({ productSNs, sellerCodes, manufacturerCodes });
    } catch (error) {
        console.error('Error getting data:', error);
        res.status(500).send({ error: 'Internal server error' });
    }
});

// Start server
init().then(() => {
    app.listen(port, () => {
        console.log(`Server is listening on port ${port}`);
    });
});

const sessionOption = {
    secret: "superstar",
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 12,
        maxAge: 1000 * 60 * 60 * 12,
    },
};

app.use(session(sessionOption));
app.use(flash());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currentUser = req.user;
    next();
});

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    req.time = new Date(Date.now()).toString();
    res.locals.currentUser = req.user;
    next();
});

app.get('/', (req, res) => {
    res.render('index.ejs');
});

app.get('/home', (req, res) => {
    res.render('home.ejs');
});

app.get('/manufacturer', (req, res) => {
    res.render('manufacturer.ejs');
});

app.get('/seller', (req, res) => {
    res.render('seller.ejs');
});

app.get('/consumer', (req, res) => {
    res.render('consumer.ejs');
});

app.get('/add_seller', (req, res) => {
    if (req.isAuthenticated()) {
        const m_id =  res.locals.currentUser.username;
        res.render('addSeller.ejs',{m_id});
    } else {
        req.session.redirectUrl = req.originalUrl;
        req.flash('error', 'You must be logged in first!');
        res.redirect('/login');
    }
});

app.get('/add_product', (req, res) => {
    if (req.isAuthenticated()) {
        const m_id =  res.locals.currentUser.username;
        res.render('addProduct.ejs',{m_id});
    } else {
        req.session.redirectUrl = req.originalUrl;
        req.flash('error', 'You must be logged in first!');
        res.redirect('/login');
    }
});

app.get('/sell_product_manufacturer', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('sellProductManufacturer.ejs');
    } else {
        req.session.redirectUrl = req.originalUrl;
        req.flash('error', 'You must be logged in first!');
        res.redirect('/login');
    }
});

app.get('/query_seller', (req, res) => {
    if (req.isAuthenticated()) {
        const m_id =  res.locals.currentUser.username;
        res.render('querySeller.ejs',{m_id});
    } else {
        req.session.redirectUrl = req.originalUrl;
        req.flash('error', 'You must be logged in first!');
        res.redirect('/login');
    }     
});

app.get('/sellProduct_seller', (req, res) => {
    res.render('sellProductSeller.ejs');
});

app.get('/avilable_products', (req, res) => {
    res.render('queryProducts.ejs');
});

app.get('/purchase_history', (req, res) => {
    res.render('consumerPurchaseHistory.ejs');
});

app.get('/product_verification', (req, res) => {
    res.render('verifyProducts.ejs');
});

app.get('/login', (req, res) => {
    res.render('login.ejs');
});

app.get('/signup', (req, res) => {
    res.render('signup.ejs');
});

app.post("/signup", async (req, res) => {
    try {
        const { manufacturer_name, manufacturer_brand, manufacturer_CEO, manufacturer_phone_no, address,username, password } = req.body;
        const newUser = new User({ manufacturer_name, manufacturer_brand, manufacturer_CEO, manufacturer_phone_no,address, username });
        await User.register(newUser, password);
        req.flash('success', 'You sucessfully registered');
        res.redirect('/login');
    }  catch (error) {
        console.error(error);
        req.flash('error', 'Registration failed. Please try again.');
        res.redirect('/signup');
    }
});

app.post('/login', saveRedirectUrl, (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            req.flash('error', 'Your Manufacturer ID and your account address do not match.');
            return res.redirect('/login');
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            req.flash('success', 'Welcome!');
            res.redirect(res.locals.redirectUrl || '/manufacturer');
        });
    })(req, res, next);
});



app.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash('success', 'You Sucessful Logout');
        res.redirect('/manufacturer');
    });
});

app.all("*", (req, res) => {
    res.status(404).render("404.ejs");
});