const { ProjectModel } = require('../models/project.Model');
const { userModel } = require('../models/user.Model');
const { AppointmentModel } = require('../models/appointment.Model');

// @desc    Get system status and statistics
// @route   GET /api/status
// @access  Private
const getStatus = async (req, res) => {
  try {
    // Get all projects with their properties
    const projects = await ProjectModel.find().populate('properties');
    
    // Flatten all properties from all projects
    const allProperties = projects.flatMap(project => 
      project.properties.map(property => ({
        ...property.toObject(),
        projectName: project.name,
        createdAt: property.createdAt || project.createdAt
      }))
    );

    // Get counts from database
    const [
      totalUsers,
      buyersCount,
      brokersCount,
      totalAppointments,
      completedAppointments
    ] = await Promise.all([
      // Total users
      userModel.countDocuments(),
      // Buyers count
      userModel.countDocuments({ role: 'buyer' }),
      // Brokers count
      userModel.countDocuments({ role: 'broker' }),
      // Total appointments
      AppointmentModel.countDocuments(),
      // Completed appointments
      AppointmentModel.countDocuments({ status: 'completed' })
    ]);

    // Calculate property statistics
    const totalProperties = allProperties.length;
    const availableProperties = allProperties.filter(p => p.status === 'available').length;
    const reservedProperties = allProperties.filter(p => p.status === 'reserved').length;
    const soldProperties = allProperties.filter(p => p.status === 'sold').length;
    
    // Get latest 5 properties
    const latestProperties = [...allProperties]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(({ _id, title, status, price, projectName, createdAt }) => ({
        _id,
        title,
        status,
        price,
        projectName,
        createdAt
      }));

    // Calculate percentages
    const calculatePercentage = (value, total) => {
      return total > 0 ? Math.round((value / total) * 100) : 0;
    };

    // Prepare response
    const statusData = {
      properties: {
        total: totalProperties,
        available: {
          count: availableProperties,
          percentage: calculatePercentage(availableProperties, totalProperties)
        },
        reserved: {
          count: reservedProperties,
          percentage: calculatePercentage(reservedProperties, totalProperties)
        },
        sold: {
          count: soldProperties,
          percentage: calculatePercentage(soldProperties, totalProperties)
        },
        latest: latestProperties
      },
      users: {
        total: totalUsers,
        buyers: {
          count: buyersCount,
          percentage: calculatePercentage(buyersCount, totalUsers)
        },
        brokers: {
          count: brokersCount,
          percentage: calculatePercentage(brokersCount, totalUsers)
        }
      },
      appointments: {
        total: totalAppointments,
        completed: {
          count: completedAppointments,
          percentage: calculatePercentage(completedAppointments, totalAppointments)
        }
      }
    };

    res.json(statusData);
  } catch (error) {
    console.error('Error fetching status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getStatus
};
