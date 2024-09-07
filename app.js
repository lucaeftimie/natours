//Third Party modules
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');
const hpp = require('hpp');
const compression = require('compression');
//App Module - start txpress app
const app = express();
const path = require('path');

app.enable('trust proxy');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//Error modules
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

//Route modules
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

// 1)GLOBAL  MIDDLEWARES
//Serving static files
app.use(express.static(path.join(__dirname, 'public'))); //__dirname = directory path to where the server was started

//Set security HTTP headers

// Set security HTTP headers
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
  })
);

// Further HELMET configuration for Security Policy (CSP)
const scriptSrcUrls = [
  'https://api.tiles.mapbox.com/',
  'https://api.mapbox.com/',
  'https://*.cloudflare.com',
  'https://js.stripe.com/v3/',
  'https://js.stripe.com',
];
const styleSrcUrls = [
  'https://api.mapbox.com/',
  'https://api.tiles.mapbox.com/',
  'https://fonts.googleapis.com/',
  'https://www.myfonts.com/fonts/radomir-tinkov/gilroy/*',
];
const connectSrcUrls = [
  'https://*.mapbox.com/',
  'https://*.cloudflare.com',
  'http://127.0.0.1:3000',
  'https://api.stripe.com',
];
// for (let i = 10000; i <= 59999; i++) {
//   connectSrcUrls.push(`ws://127.0.0.1:${i}`);
// }
const imgSrcUrls = ['https://*.stripe.com'];
const frameSrcUrls = ['https://js.stripe.com', 'https://checkout.stripe.com'];
const fontSrcUrls = ['fonts.googleapis.com', 'fonts.gstatic.com'];

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", ...scriptSrcUrls],
      frameSrc: ["'self'", ...frameSrcUrls],
      connectSrc: ["'self'", ...connectSrcUrls],
      imgSrc: ["'self'", 'blob:', 'data:', ...imgSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      fontSrc: ["'self'", ...fontSrcUrls],
      workerSrc: ["'self'", 'blob:'],
      objectSrc: ["'none'"],
    },
  })
);

//Development Loggging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//Limit requests from same IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 100,
  message: 'Too many request from this IP, please try again in an hour',
});

app.use('/api', limiter);

app.use(express.json());

//Body parser ,readint data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

//Data sanitization against NOSQL query injection
app.use(mongoSanitize()); // 'email' : {$gt: ""} -- will not work

//Data sanitizitation against XSS
app.use(xss());

//Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

app.use(compression());

//Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  // console.log(req.headers);
  next();
});

// 3) ROUTES
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
