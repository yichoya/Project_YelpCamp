if(process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}


const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
// const { campgroundSchema, reviewSchema } = require('./schemas.js');
// const catchAsync = require('./utils/catchAsync');
const ExpressError = require('./utils/ExpressError');
const methodOverride = require('method-override');
// const Campground = require('./models/campground');
// const Review = require('./models/review');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const helmet = require('helmet');

const userRoutes = require('./routes/users');
const campgroundRoutes = require('./routes/campgrounds');
const reviewRoutes = require('./routes/reviews');
const mongoSanitize = require('express-mongo-sanitize');

const MongoDBStore = require('connect-mongo');
const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp';
// 'mongodb://localhost:27017/yelp-camp'
mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const app = express();

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({extended: true}));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
    mongoSanitize({
        replaceWith:"_",
    })
);

const secret = process.env.SECRET || 'thisshouldbebettersecret!';

const store = MongoDBStore.create({
    mongoUrl: dbUrl,
    secret,
    touchAfter: 24 * 60 * 60, // 데이터와 세션이 변경되지 않았을 때의 불필요한 재저장이나 업데이트를 지정한 시간마다 진행
  });

store.on("error", function(e){
    console.log("SESSION STOR ERROR", e)
})

const sessionConfig = {
    store,
    name: 'session',
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        // secure: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionConfig));
app.use(flash());

const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
  ];
  const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
    "https://cdn.jsdelivr.net",
  ];
  const connectSrcUrls = [
    "https://api.mapbox.com/",
    "https://a.tiles.mapbox.com/",
    "https://b.tiles.mapbox.com/",
    "https://events.mapbox.com/",
  ];
  const fontSrcUrls = [];
  app.use(
    helmet({
      // Cross-Origin Embedder Policy (COEP)를 활성화하는 설정. 이를 통해, 애플리케이션이 다른 도메인에서 로드된 리소스를 제어할 수 있습니다. false로 설정하면 COEP를 비활성화.
      // COEP는 웹 애플리케이션 보안을 강화하기 위한 보안 메커니즘 중 하나.
      // 이 정책은 iframe, object, embed 요소의 크로스 오리진 로딩을 제한하고 이러한 요소의 리소스가 동일한 출처에서 로드되도록 강제
      // COEP는 iframe 및 브라우저의 자체 보안 기능을 강화하여 다른 도메인에서 호스팅되는 페이지로부터의 공격을 방지.
      // crossOriginEmbedderPolicy: false는 브라우저가 Cross-Origin Embedder Policy를 적용하지 않도록 하며, 사용자가 웹 사이트를 더 쉽게 사용할 수 있도록 도와주지만, 보안을 감소시킬 수 있으므로 이 값을 변경하기 전에 신중히 검토해야함
      crossOriginEmbedderPolicy: false,
      // Cross-Origin Resource Policy (CORP)를 활성화하는 설정. 이를 통해, 애플리케이션이 다른 도메인에서 로드된 리소스를 허용할지 제어할 수 있습니다. 아래 코드에서는 모든 도메인("*")에서 리소스를 허용하도록 설정하고 있다.
      // 웹 페이지에서 리소스의 로딩 및 배포에 대한 제어를 제공. 이것은 다른 출처에서 제공되는 리소스의 사용을 제한하고, 신뢰할 수 있는 출처로부터 제공되는 리소스를 사용하도록 촉진
      // allowOrigins 속성을 사용하여 리소스를 제공할 수 있는 출처를 설정할 수 있으며, 리소스를 사용할 수 있는 도메인의 목록을 지정할 수 있다.
      crossOriginResourcePolicy: {
        allowOrigins: ["*"],
      },
      // `contentSecurityPolicy: false` 해당 애플리케이션에서 Content Security Policy (CSP)를 사용하지 않겠다는 것을 의미
      // CSP는 웹 애플리케이션 보안을 강화하는 기술 중 하나로, 웹 애플리케이션에서 로드되는 리소스들의 출처를 제한하거나, 허용되는 실행 방식을 제한하여 XSS, 데이터 탈취 등의 공격을 방지할 수 있다.
      // 따라서, 대부분의 경우에는 CSP를 활성화하는 것이 좋은 보안적인 선택
      // contentSecurityPolicy: false로 설정하는 것은 해당 애플리케이션에서 CSP를 사용하지 않겠다는 것이므로, CSP 관련 설정을 하지 않아도 됨.
      // 이 경우, CSP에 관련된 오류나 경고 메시지를 피할 수 있지만, 보안적인 취약점이 발생할 가능성이 높아지므로 주의
      // CSP는 애플리케이션에서 로드되는 리소스들의 출처를 제한하여, XSS와 같은 보안 공격을 방지하는 역할.
      // 아래 코드에서는 directives를 사용하여, defaultSrc, connectSrc, scriptSrc, styleSrc, workerSrc, objectSrc, imgSrc, fontSrc 등의 CSP 설정을 추가하고 있다.
      // 각각의 Src 디렉티브는 허용할 출처를 지정한다. 여기서 self는 애플리케이션의 현재 도메인을 의미한다. unsafe-inline, data:, blob:, 특정 도메인 등의 값을 추가하여, 허용할 리소스 출처를 지정할 수 있다.
      // 아래 코드에서는 Cloudinary 이미지 리소스와 Unsplash 이미지 리소스를 허용하도록 설정하고 있다.
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [],
          connectSrc: ["'self'", ...connectSrcUrls],
          scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
          styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
          workerSrc: ["'self'", "blob:"],
          objectSrc: [],
          imgSrc: [
            "'self'",
            "blob:",
            "data:",
            "https://res.cloudinary.com/djd5egppp/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT!
            "https://images.unsplash.com/",
            "https://images.pexels.com/",
          ],
          fontSrc: ["'self'", ...fontSrcUrls],
        },
      },
    })
  );


app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

/* campgroundSchema, reviewSchema는 joi로 데이터 유효성 검사를 위한 스키마를 재사용하기위해
미들웨어로 만든 것!! (파일 분리함) */
// const validateCampground = (req, res, next) => {
//     const { error } = campgroundSchema.validate(req.body);
//     if(error) {
//         const msg = error.details.map(el => el.message).join(',')
//         throw new ExpressError(msg, 400)
//     } else {
//         next();
//     }
// }

// const validateReview = (req, res, next) => {
//     const { error } = reviewSchema.validate(req.body);
//     if(error) {
//         const msg = error.details.map(el => el.message).join(',')
//         throw new ExpressError(msg, 400)
//     } else {
//         next();
//     }
// }

app.use((req, res, next) => {

    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});



app.use('/', userRoutes);
app.use('/campgrounds', campgroundRoutes);
app.use('/campgrounds/:id/reviews', reviewRoutes);

app.get('/', (req, res) => {
    res.render('home')
});


app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404));
})

app.use((err, req, res, next) => {
    const {statusCode = 500} = err;
    if(!err.message) err.message = 'Oh No, Something Went Wrong!'
    res.status(statusCode).render('error', { err })
})

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Serving on port ${port}`)
})