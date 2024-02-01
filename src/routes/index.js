const express = require('express');
const dashboardRoute = require('./dashboard.route');

const router = express.Router();

router.use('/', dashboardRoute);

module.exports = router;
