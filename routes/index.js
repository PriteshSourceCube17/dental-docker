const express = require("express");
const authRoutes = require("./authRoutes");
const labRoutes = require("./labRoutes");
const adminRoutes = require("./adminRoutes");
const clinicRoutes = require("./clinicRoutes");
const quoteRoutes = require("./quotesRoutes");

const router = express.Router();

router.use('/admin',adminRoutes);
router.use('/auth', authRoutes);
router.use('/lab',labRoutes);
router.use('/clinic',clinicRoutes);
router.use('/quotes',quoteRoutes)

module.exports = router;
