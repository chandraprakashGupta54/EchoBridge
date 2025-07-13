const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const uploadSchema = new Schema({
  category: {
    type: [String],
    enum: ["Electronics", "Furniture", "Clothing", "Books", "Plastic", "Metal", "Glass", "Others"],
  },
  description: String,
  location: String,
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  location: String,
  geometry: {
    type: {
      type: String,
      enum: ["Point"],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
});

const Need = mongoose.model("Need", uploadSchema);
module.exports = Need;