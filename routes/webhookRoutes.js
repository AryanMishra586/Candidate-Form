const express = require("express");
const router = express.Router();

const {
  handleFormSubmission
} = require("../controllers/webhookController");

// When Apps Script POSTs form data:
router.post("/form-submission", handleFormSubmission);

module.exports = router;
