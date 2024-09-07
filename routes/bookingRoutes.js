const express = require('express');
const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authController');

const router = express.Router();

//API Routes
router
  .route('/')
  .get(bookingController.getAllBookings)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    bookingController.createBooking
  );
router
  .route('/:id')
  .get(bookingController.getBooking)
  .patch(
    authController.protect,
    authController.restrictTo('admin'),
    bookingController.updateBooking
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin'),
    bookingController.deleteBooking
  );

router.get(
  '/checkout-session/:tourId',
  authController.protect,
  bookingController.getCheckoutSession
);

module.exports = router;
