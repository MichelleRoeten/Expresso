const PORT = process.env.PORT || 4000;

// Instance of Express app
const express = require('express');
const app = express();

// Middleware for handling CORS requests from index.html
const cors = require('cors');
app.use(cors());

// Middleware for parsing request bodies
const bodyParser = require('body-parser');
app.use(bodyParser.json());

// Middleware for logging information about the HTTP request
const morgan = require('morgan');
app.use(morgan('dev'));

// Mount API router at the '/api' path
const apiRouter = require('./api/api');
app.use('/api', apiRouter);

// Middleware for handling errors - This needs to be the last app.use in the file!!!
const errorHandler = require('errorhandler');
app.use(errorHandler());

// Start the server listening at the port
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

// Module export(s)
module.exports = app;
