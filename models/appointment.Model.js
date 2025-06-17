const mongoose = require('mongoose');
const { Schema, model, models } = mongoose;

const FeedbackSchema = new Schema({
  brokerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
  status: {
    type: String,
    enum: ['liked', 'not_liked'],
    required: true
  },
  reservationMade: { type: Boolean, default: false }
});

const AppointmentSchema = new Schema({
  buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  brokerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
  appointmentDate: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['scheduled', 'cancelled', 'completed', 'awaiting_payment','awaiting_payment_confirmation'], 
    default: 'scheduled' 
  },
  type: { 
    type: String, 
    enum: ['initial', 'payment'], 
    required: true 
  },
  reservationExpiry: { type: Date },
  feedbacks: [FeedbackSchema]
}, { timestamps: true });

AppointmentSchema.index({ buyerId: 1, brokerId: 1, propertyId: 1, appointmentDate: 1 });

const AppointmentModel = models.Appointment || model('Appointment', AppointmentSchema);

module.exports = { AppointmentModel };
