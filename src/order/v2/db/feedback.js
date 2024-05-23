import mongoose from "mongoose";
// Define a schema for feedback
const feedbackSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  orderID: {
    type: String,
    required: true
  },
  websiteDesign: {
    type: Boolean,
    required: true
  },
  deliveryTime: {
    type: Boolean,
    required: true
  },
  quality: {
    type: Boolean,
    required: true
  },
  recommendWebsite: {
    type: Boolean,
    required: true
  },
  checkoutSatisfaction: {
    type: Boolean,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create a model from the schema
const Feedback = mongoose.model('Feedback', feedbackSchema);

export default Feedback
