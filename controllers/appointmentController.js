const { AppointmentModel } = require("../models/appointment.Model");
const { ProjectModel } = require("../models/project.Model");
const { successResponse, errorResponse } = require('../utils/helpers');

exports.getAllAppointments = async (req, res) => {
  try {
    const appointments = await AppointmentModel.find({})
      .populate('buyerId')
      .populate('brokerId');
    
    const projects = await ProjectModel.find({}).lean();
    const findPropertyById = (propertyId) => {
      for (const project of projects) {
        if (!Array.isArray(project.properties)) continue;
        const property = project.properties.find(
          (p) => p && p._id && p._id.toString() === propertyId?.toString()
        );
        if (property) return property;
      }
      return null;
    };

    const appointmentsWithProperty = appointments.map((appt) => {
      const apptObj = appt.toObject();
      apptObj.property = findPropertyById(appt.propertyId);
      return apptObj;
    });
    return res.status(200).json(successResponse(appointmentsWithProperty));
  } catch (error) {
    console.error('Get appointments error:', error);
    return res.status(500).json(errorResponse('Server error while fetching appointments.'));
  }
};

exports.getAppointmentById = async (req, res) => {
  try {
    const appointment = await AppointmentModel.findById(req.params.id)
      .populate('buyerId', 'username email')
      .populate('brokerId', 'username email');
    if (!appointment) {
      return res.status(404).json(errorResponse('Appointment not found.', 404));
    }
    const projects = await ProjectModel.find({}).lean();
    const findPropertyById = (propertyId) => {
      for (const project of projects) {
        if (!Array.isArray(project.properties)) continue;
        const property = project.properties.find(
          (p) => p && p._id && p._id.toString() === propertyId?.toString()
        );
        if (property) return property;
      }
      return null;
    };

    const appointmentObj = appointment.toObject();
    appointmentObj.property = findPropertyById(appointment.propertyId);
    return res.status(200).json(successResponse(appointmentObj));
  } catch (error) {
    console.error('Get appointment error:', error);
    return res.status(500).json(errorResponse('Server error while fetching appointment.'));
  }
};

exports.createAppointment = async (req, res) => {
  try {
    const { buyerId, brokerId, propertyId, appointmentDate, type } = req.body;
    
    // Basic validation
    if (!buyerId || !brokerId || !propertyId || !appointmentDate || !type) {
      return res.status(400).json(errorResponse('All required fields must be provided.'));
    }

    // Validate appointment type
    if (!['initial', 'payment'].includes(type)) {
      return res.status(400).json(errorResponse('Invalid appointment type. Must be either "initial" or "payment".'));
    }

    // Validate appointment date is in the future
    const appointmentDateTime = new Date(appointmentDate);
    if (appointmentDateTime < new Date()) {
      return res.status(400).json(errorResponse('Appointment date must be in the future.'));
    }

    // Find the project containing the property
    const project = await ProjectModel.findOne({ 'properties._id': propertyId });
    if (!project) {
      return res.status(404).json(errorResponse('Property not found.'));
    }

    // Find the property in the project
    const property = project.properties.id(propertyId);
    if (!property) {
      return res.status(404).json(errorResponse('Property not found.'));
    }

    // Update property status based on appointment type
    if (type === 'initial') {
      property.status = 'reserved';
    } else if (type === 'payment') {
      property.status = 'sold';
    }

    // Save the project to update the property status
    await project.save();

    const appointment = new AppointmentModel({
      buyerId,
      brokerId,
      propertyId,
      appointmentDate: appointmentDateTime,
      type,
      status: 'scheduled'
    });

    await appointment.save();
    
    return res.status(201).json(successResponse({
      message: 'Appointment created successfully.',
      appointment
    }));
  } catch (error) {
    console.error('Create appointment error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json(errorResponse(error.message));
    }
    return res.status(500).json(errorResponse('Server error while creating appointment.'));
  }
};

exports.updateAppointment = async (req, res) => {
  try {
    const { appointmentDate, status, type } = req.body;
    const appointmentId = req.params.id;

    const appointment = await AppointmentModel.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json(errorResponse('Appointment not found.', 404));
    }

    // Update appointment fields
    if (appointmentDate) {
      const newDate = new Date(appointmentDate);
      if (newDate < new Date()) {
        return res.status(400).json(errorResponse('Appointment date must be in the future.'));
      }
      appointment.appointmentDate = newDate;
    }

    if (status) {
      if (!['scheduled', 'cancelled', 'completed', 'awaiting_payment','awaiting_payment_confirmation'].includes(status)) {
        return res.status(400).json(errorResponse('Invalid appointment status.'));
      }
      appointment.status = status;
    }

    // Find the project and property if we need to update property status
    if (status === 'completed' || type) {
      const project = await ProjectModel.findOne({ 'properties._id': appointment.propertyId });
      if (!project) {
        return res.status(404).json(errorResponse('Property not found.'));
      }

      // Find the property in the project
      const property = project.properties.id(appointment.propertyId);
      if (!property) {
        return res.status(404).json(errorResponse('Property not found.'));
      }

      // Update property status if appointment is completed
      if (status === 'completed') {
        property.status = 'sold';
      }
      
      // Handle type-specific updates if type is being changed
      if (type) {
        if (!['initial', 'payment'].includes(type)) {
          return res.status(400).json(errorResponse('Invalid appointment type.'));
        }
        appointment.type = type;
      }

      // Save the project to update the property status
      await project.save();
    }

    await appointment.save();
    
    return res.status(200).json(successResponse({
      message: 'Appointment updated successfully.',
      appointment
    }));
  } catch (error) {
    console.error('Update appointment error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json(errorResponse(error.message));
    }
    return res.status(500).json(errorResponse('Server error while updating appointment.'));
  }
};

exports.deleteAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id;

    const appointment = await AppointmentModel.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json(errorResponse('Appointment not found.', 404));
    }

    // Find the project containing the property
    const project = await ProjectModel.findOne({ 'properties._id': appointment.propertyId });
    if (!project) {
      return res.status(404).json(errorResponse('Property not found.'));
    }

    // Find the property in the project
    const property = project.properties.id(appointment.propertyId);
    if (!property) {
      return res.status(404).json(errorResponse('Property not found.'));
    }

    // Set property status back to available
    property.status = 'available';

    // Save the project to update the property status
    await project.save();

    // Delete the appointment
    await AppointmentModel.findByIdAndDelete(appointmentId);
    
    return res.status(200).json(successResponse({
      message: 'Appointment deleted successfully.'
    }));
  } catch (error) {
    console.error('Delete appointment error:', error);
    return res.status(500).json(errorResponse('Server error while deleting appointment.'));
  }
};

exports.addFeedback = async (req, res) => {
  try {
    const { brokerId, propertyId, status, reservationMade } = req.body;
    const appointmentId = req.params.id;

    if (!brokerId || !propertyId || !status) {
      return res.status(400).json(errorResponse('Broker ID, property ID, and status are required.'));
    }

    if (!['liked', 'not_liked'].includes(status)) {
      return res.status(400).json(errorResponse('Invalid feedback status.'));
    }

    const appointment = await AppointmentModel.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json(errorResponse('Appointment not found.', 404));
    }

    // Add new feedback
    appointment.feedbacks.push({
      brokerId,
      propertyId,
      status,
      reservationMade: reservationMade || false
    });

    await appointment.save();
    
    return res.status(200).json(successResponse({
      message: 'Feedback added successfully.',
      appointment
    }));
  } catch (error) {
    console.error('Add feedback error:', error);
    return res.status(500).json(errorResponse('Server error while adding feedback.'));
  }
};

exports.getMyAppointments = async (req, res) => {
  try {
    const userId = req.user.id; // Get user ID from protect middleware
    
    // Find appointments where user is either buyer or broker
    const appointments = await AppointmentModel.find({
      $or: [
        { buyerId: userId },
        { brokerId: userId }
      ]
    })
    .populate('buyerId', 'username email')
    .populate('brokerId', 'username email');

    const projects = await ProjectModel.find({}).lean();
    const findPropertyById = (propertyId) => {
      for (const project of projects) {
        if (!Array.isArray(project.properties)) continue;
        const property = project.properties.find(
          (p) => p && p._id && p._id.toString() === propertyId?.toString()
        );
        if (property) return property;
      }
      return null;
    };

    const appointmentsWithProperty = appointments.map((appt) => {
      const apptObj = appt.toObject();
      apptObj.property = findPropertyById(appt.propertyId);
      return apptObj;
    });

    return res.status(200).json(successResponse(appointmentsWithProperty));
  } catch (error) {
    console.error('Get my appointments error:', error);
    return res.status(500).json(errorResponse('Server error while fetching appointments.'));
  }
}; 