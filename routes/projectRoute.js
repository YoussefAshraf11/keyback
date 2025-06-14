const express = require('express');
const router = express.Router();
const projectController = require("../controllers/projectController.js");

// Project routes
router.get("/", projectController.getAllProjects);
router.get("/:id", projectController.getProjectById);
router.get("/property/:id", projectController.getPropertyById);
router.put("/property/:id", projectController.updatePropertyById);
router.post("/", projectController.createProject);
router.put("/:id", projectController.updateProject);
router.delete("/:id", projectController.deleteProject);
router.post("/list-properties", projectController.searchForProperties);
router.delete("/property/:id", projectController.deleteProperty);
router.post("/:id/property", projectController.addPropertyToProject);

module.exports = router;
