const mongoose = require('mongoose');
const { Schema, models, model } = mongoose;

const PropertySchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  type: {
    type: String,
    enum: ['chalet', 'apartment', 'twin_villa', 'standalone_villa'],
    required: true
  },
  areaRange: {
    type: String,
    enum: ['less_than_100', '100_to_150', '150_to_200', 'over_200'],
    required: true
  },
  priceRange: {
    type: String,
    enum: ['2_to_3_million', '3_to_4_million', '4_to_5_million', 'over_5_million'],
    required: true
  },
  bedrooms: {
    type: Number,
    required: false,
    min: 1
  },
  bathrooms: {
    type: Number,
    required: false,
    min: 1
  },
  status: {
    type: String,
    enum: ['available', 'reserved', 'sold'],
    default: 'available'
  },
  images: [{ type: String }]
});

const ProjectSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  image: { type: String },
  developer: { type: String },
  properties: [PropertySchema]
}, { timestamps: true });

ProjectSchema.index({ location: '2dsphere' });

const ProjectModel = models.Project || model('Project', ProjectSchema);

module.exports = { ProjectModel };
