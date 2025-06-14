const { userModel, roletypes } = require("../models/user.Model");
const { ProjectModel } = require("../models/project.Model");
const bcrypt = require('bcrypt');
const { successResponse, errorResponse } = require('../utils/helpers');
const mongoose = require('mongoose');

exports.getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const validRoles = ['buyer', 'broker', 'admin'];
    
    // Build query
    const query = {};
    if (role && validRoles.includes(role)) {
      query.role = role;
    }
    
    const users = await userModel.find(query).select('-password -otp -otpExpiry');
    return res.status(200).json(successResponse(users));
  } catch (error) {
    return res.status(500).json(errorResponse('Server error while fetching users.'));
  }
};

// Get single user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id).select('-password -otp -otpExpiry');
    
    if (!user) {
      return res.status(404).json(errorResponse('User not found.', 404));
    }
    return res.status(200).json(successResponse(user));
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json(errorResponse('Server error while fetching user.'));
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { username, email, phone, role, image } = req.body;
    const userId = req.params.id;

    // Find the user
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json(errorResponse('User not found.', 404));
    }

    // Update user fields
    if (username) user.username = username;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (role) user.role = role;
    if (image) user.image = image;
    await user.save();
    
    // Return updated user without sensitive data
    const updatedUser = user.toObject();
    delete updatedUser.password;
    delete updatedUser.otp;
    delete updatedUser.otpExpiry;

    return res.status(200).json(successResponse({
      message: 'User updated successfully.',
      user: updatedUser
    }));
  } catch (error) {
    console.error('Update user error:', error);
    if (error.code === 11000) {
      return res.status(400).json(errorResponse('Username or email already in use.', 400));
    }
    return res.status(500).json(errorResponse('Server error while updating user.'));
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;



    const user = await userModel.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json(errorResponse('User not found.', 404));
    }

    return res.status(200).json(successResponse({
      message: 'User deleted successfully.'
    }));
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json(errorResponse('Server error while deleting user.'));
  }
};

// Add property to favorites
exports.addToFavorites = async (req, res) => {
  try {
    // Get user from the protect middleware
    const user = req.user;
    const propertyId = req.params.propertyId;

    // Validate property ID format
    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return res.status(400).json(errorResponse('Invalid property ID format.', 400));
    }

    // Check if property exists and get its project
    const project = await ProjectModel.findOne({ 'properties._id': propertyId });
    if (!project) {
      return res.status(404).json(errorResponse('Property not found.', 404));
    }

    // Convert string ID to ObjectId
    const propertyObjectId = new mongoose.Types.ObjectId(propertyId);

    // Check if property is already in favorites
    if (user.favourites.some(fav => fav.property.toString() === propertyId)) {
      return res.status(400).json(errorResponse('Property is already in favorites.', 400));
    }

    // Add property to favorites with both project and property IDs
    user.favourites.push({
      project: project._id,
      property: propertyObjectId
    });
    await user.save();

    // Populate project details
    await user.populate('favourites.project');

    return res.status(200).json(successResponse({
      message: 'Property added to favorites successfully.',
      favourites: user.favourites
    }));
  } catch (error) {
    console.error('Add to favorites error:', error);
    return res.status(500).json(errorResponse('Server error while adding to favorites.'));
  }
};

// Remove property from favorites
exports.removeFromFavorites = async (req, res) => {
  try {
    // Get user from the protect middleware
    const user = req.user;
    const propertyId = req.params.propertyId;

    // Validate property ID format
    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return res.status(400).json(errorResponse('Invalid property ID format.', 400));
    }

    // Check if property exists
    const project = await ProjectModel.findOne({ 'properties._id': propertyId });
    if (!project) {
      return res.status(404).json(errorResponse('Property not found.', 404));
    }

    // Find the favorite entry
    const favoriteIndex = user.favourites.findIndex(fav => 
      fav.property && fav.property.toString() === propertyId
    );

    if (favoriteIndex === -1) {
      return res.status(404).json(errorResponse('Property is not in favorites.', 404));
    }

    // Remove the property from favorites
    user.favourites.splice(favoriteIndex, 1);
    await user.save();

    // Populate remaining favorites
    await user.populate('favourites.project');

    return res.status(200).json(successResponse({
      message: 'Property removed from favorites successfully.',
      favourites: user.favourites
    }));
  } catch (error) {
    console.error('Remove from favorites error:', error);
    return res.status(500).json(errorResponse('Server error while removing from favorites.'));
  }
};

exports.getUserFavorites = async (req, res) => {
  try {
    // Get user from the protect middleware
    const user = req.user;

    // Get all projects that contain the favorite properties
    const projectIds = user.favourites.map(fav => fav.project);
    const propertyIds = user.favourites.map(fav => fav.property);

    // Find all projects that contain the favorite properties
    const projects = await ProjectModel.find({
      _id: { $in: projectIds }
    });

    // Create a map of properties from all projects
    const allProperties = projects.reduce((acc, project) => {
      return [...acc, ...project.properties];
    }, []);

    // Filter only the favorite properties
    const favoriteProperties = allProperties.filter(property => 
      propertyIds.some(id => id.toString() === property._id.toString())
    );

    return res.status(200).json(successResponse({
      message: 'Favorite properties retrieved successfully.',
      properties: favoriteProperties
    }));
  } catch (error) {
    console.error('Get user favorites error:', error);
    return res.status(500).json(errorResponse('Server error while fetching favorite properties.'));
  }
};

