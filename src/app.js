const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const httpStatus = require('http-status');
const helmet = require('helmet');
const morgan = require('./config/morgan');
const routes = require('./routes');
const setVariables = require('./middlewares/setAppConfig');
const { errorConverter, errorHandler } = require('./middlewares/error');
const ApiError = require('./utils/ApiError');

const app = express();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

if (process.env.NODE_ENV !== 'test') {
  // app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}
// This disables the Content-Security-Policy
// and X-Download-Options headers.
app.use(
  helmet({
    contentSecurityPolicy: false,
    xDownloadOptions: false,
  }),
);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(setVariables);

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// parse cookie
app.use(cookieParser());

// serve static files
app.use(express.static(path.join(__dirname, 'public')));

// v1 api routes
app.use('/', routes);

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

module.exports = app;
