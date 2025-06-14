const { ProjectModel } = require("../models/project.Model");
const { successResponse, errorResponse } = require('../utils/helpers');

exports.getAllProjects = async (req, res) => {
  try {
    const { query } = req.query;
    let filter = {};
    
    // If query parameter exists and is not empty, add name filter
    if (query && query.trim() !== '') {
      filter.name = { $regex: query, $options: 'i' }; // Case-insensitive search
    }

    const projects = await ProjectModel.find(filter).populate('properties');
    return res.status(200).json(successResponse(projects));
  } catch (error) {
    console.error('Get projects error:', error);
    return res.status(500).json(errorResponse('Server error while fetching projects.'));
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const project = await ProjectModel.findById(req.params.id).populate('properties');
    
    if (!project) {
      return res.status(404).json(errorResponse('Project not found.', 404));
    }
    return res.status(200).json(successResponse(project));
  } catch (error) {
    console.error('Get project error:', error);
    return res.status(500).json(errorResponse('Server error while fetching project.'));
  }
};

exports.getPropertyById = async (req, res) => {
  try {
    const propertyId = req.params.id;
    
    // Find all projects and search for the property
    const projects = await ProjectModel.find({}).populate('properties');
    let foundProperty = null;
    let projectId = null;
    
    // Search through all projects to find the property
    for (const project of projects) {
      const property = project.properties.find(p => p._id.toString() === propertyId);
      if (property) {
        foundProperty = property;
        projectId = project._id;
        break;
      }
    }
    
    if (!foundProperty) {
      return res.status(404).json(errorResponse('Property not found.', 404));
    }
    
    // Add projectId to the property data
    const propertyWithProjectId = {
      ...foundProperty.toObject(),
      projectId
    };
    
    return res.status(200).json(successResponse(propertyWithProjectId));
  } catch (error) {
    console.error('Get property error:', error);
    return res.status(500).json(errorResponse('Server error while fetching property.'));
  }
};

exports.createProject = async (req, res) => {
  try {
    const { name, description, developer, properties, image } = req.body;
    
  

    // Validate properties if provided
    if (properties && Array.isArray(properties)) {
      for (const property of properties) {
        if (!property.bedrooms || !property.bathrooms) {
          return res.status(400).json(errorResponse('Bedrooms and bathrooms are required for each property.'));
        }
        if (property.bedrooms < 1 || property.bathrooms < 1) {
          return res.status(400).json(errorResponse('Bedrooms and bathrooms must be at least 1.'));
        }
      }
    }

    const project = new ProjectModel({
      name,
      description,
      image,
      developer,
      properties: properties || []
    });

    await project.save();
    
    return res.status(201).json(successResponse({
      message: 'Project created successfully.',
      project
    }));
  } catch (error) {
    console.error('Create project error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json(errorResponse(error.message));
    }
    return res.status(500).json(errorResponse('Server error while creating project.'));
  }
};

exports.updateProject = async (req, res) => {
  try {
    const { name, description, developer, properties, image } = req.body;
    const projectId = req.params.id;

    const project = await ProjectModel.findById(projectId);
    if (!project) {
      return res.status(404).json(errorResponse('Project not found.', 404));
    }

    // Validate properties if provided
    if (properties && Array.isArray(properties)) {
      for (const property of properties) {
        if (!property.bedrooms || !property.bathrooms) {
          return res.status(400).json(errorResponse('Bedrooms and bathrooms are required for each property.'));
        }
        if (property.bedrooms < 1 || property.bathrooms < 1) {
          return res.status(400).json(errorResponse('Bedrooms and bathrooms must be at least 1.'));
        }
      }
    }

    // Update project fields
    if (name) project.name = name;
    if (description !== undefined) project.description = description;
   
    if (developer !== undefined) project.developer = developer;
    if (properties !== undefined) project.properties = properties;
    if (image !== undefined) project.image = image;
    await project.save();
    
    return res.status(200).json(successResponse({
      message: 'Project updated successfully.',
      project
    }));
  } catch (error) {
    console.error('Update project error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json(errorResponse(error.message));
    }
    return res.status(500).json(errorResponse('Server error while updating project.'));
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const project = await ProjectModel.findByIdAndDelete(projectId);
    
    if (!project) {
      return res.status(404).json(errorResponse('Project not found.', 404));
    }

    return res.status(200).json(successResponse({
      message: 'Project deleted successfully.'
    }));
  } catch (error) {
    console.error('Delete project error:', error);
    return res.status(500).json(errorResponse('Server error while deleting project.'));
  }
};

exports.searchForProperties = async (req, res) => {
  try {
    const { type, areaRange, priceRange, key } = req.body;

    // Find all projects and get their properties
    const projects = await ProjectModel.find({}).populate('properties');
    let matchingProperties = projects.reduce((acc, project) => {
      return [...acc, ...project.properties];
    }, []);

    // Apply filters only if they are provided
    if (type) {
      const validTypes = ['chalet', 'apartment', 'twin_villa', 'standalone_villa'];
      if (!validTypes.includes(type)) {
        return res.status(400).json(errorResponse('Invalid property type.'));
      }
      matchingProperties = matchingProperties.filter(property => 
        property.type === type
      );
    }

    if (areaRange) {
      const validAreaRanges = ['less_than_100', '100_to_150', '150_to_200', 'over_200'];
      if (!validAreaRanges.includes(areaRange)) {
        return res.status(400).json(errorResponse('Invalid area range.'));
      }
      matchingProperties = matchingProperties.filter(property => 
        property.areaRange === areaRange
      );
    }

    if (priceRange) {
      const validPriceRanges = ['2_to_3_million', '3_to_4_million', '4_to_5_million', 'over_5_million'];
      if (!validPriceRanges.includes(priceRange)) {
        return res.status(400).json(errorResponse('Invalid price range.'));
      }
      matchingProperties = matchingProperties.filter(property => 
        property.priceRange === priceRange
      );
    }

    // Apply key search if provided
    if (key) {
      const searchKey = key.toLowerCase();
      matchingProperties = matchingProperties.filter(property => 
        property.title.toLowerCase().includes(searchKey)
      );
    }

    return res.status(200).json(successResponse({
      count: matchingProperties.length,
      properties: matchingProperties
    }));
  } catch (error) {
    console.error('Search properties error:', error);
    return res.status(500).json(errorResponse('Server error while searching properties.'));
  }
};

exports.deleteProperty = async (req, res) => {
  try {
    const propertyId = req.params.id;
    
    // Find the project containing the property
    const project = await ProjectModel.findOne({ 'properties._id': propertyId });
    
    if (!project) {
      return res.status(404).json(errorResponse('Property not found.', 404));
    }

    // Remove the property from the project's properties array
    project.properties = project.properties.filter(
      property => property._id.toString() !== propertyId
    );

    // Save the updated project
    await project.save();

    return res.status(200).json(successResponse({
      message: 'Property deleted successfully.'
    }));
  } catch (error) {
    console.error('Delete property error:', error);
    return res.status(500).json(errorResponse('Server error while deleting property.'));
  }
};

exports.addPropertyToProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const propertyData = req.body;

    // Validate required property fields
    if (!propertyData.title || !propertyData.description || !propertyData.type || 
        !propertyData.areaRange || !propertyData.priceRange || !propertyData.bedrooms || 
        !propertyData.bathrooms) {
      return res.status(400).json(errorResponse('Missing required property fields.'));
    }

    // Validate property type
    const validTypes = ['chalet', 'apartment', 'twin_villa', 'standalone_villa'];
    if (!validTypes.includes(propertyData.type)) {
      return res.status(400).json(errorResponse('Invalid property type.'));
    }

    // Validate area range
    const validAreaRanges = ['less_than_100', '100_to_150', '150_to_200', 'over_200'];
    if (!validAreaRanges.includes(propertyData.areaRange)) {
      return res.status(400).json(errorResponse('Invalid area range.'));
    }

    // Validate price range
    const validPriceRanges = ['2_to_3_million', '3_to_4_million', '4_to_5_million', 'over_5_million'];
    if (!validPriceRanges.includes(propertyData.priceRange)) {
      return res.status(400).json(errorResponse('Invalid price range.'));
    }

    // Validate bedrooms and bathrooms
    if (propertyData.bedrooms < 1 || propertyData.bathrooms < 1) {
      return res.status(400).json(errorResponse('Bedrooms and bathrooms must be at least 1.'));
    }

    // Find the project
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      return res.status(404).json(errorResponse('Project not found.', 404));
    }

    // Add the property to the project's properties array
    project.properties.push(propertyData);
    await project.save();

    return res.status(200).json(successResponse({
      message: 'Property added successfully.',
      project
    }));
  } catch (error) {
    console.error('Add property error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json(errorResponse(error.message));
    }
    return res.status(500).json(errorResponse('Server error while adding property.'));
  }
};

exports.updatePropertyById = async (req, res) => {
  try {
    const propertyId = req.params.id;
    const updatedData = req.body;

    // Find all projects and search for the property
    const projects = await ProjectModel.find({}).populate('properties');
    let foundProperty = null;
    let projectId = null;
    let projectIndex = -1;
    let propertyIndex = -1;

    // Search through all projects to find the property
    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];
      const index = project.properties.findIndex(p => p._id.toString() === propertyId);
      if (index !== -1) {
        foundProperty = project.properties[index];
        projectId = project._id;
        projectIndex = i;
        propertyIndex = index;
        break;
      }
    }

    if (!foundProperty) {
      return res.status(404).json(errorResponse('Property not found.', 404));
    }

    // Update the property with new data
    const updatedProperty = {
      ...foundProperty.toObject(),
      ...updatedData,
      _id: propertyId // Preserve the original ID
    };

    // Update the property in the project
    const project = projects[projectIndex];
    project.properties[propertyIndex] = updatedProperty;
    await project.save();

    return res.status(200).json(successResponse(updatedProperty));
  } catch (error) {
    console.error('Update property error:', error);
    return res.status(500).json(errorResponse('Server error while updating property.'));
  }
};



