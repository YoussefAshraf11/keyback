const express = require('express');
const router = express.Router();
const imagesController = require('../controllers/imageController');


router.route('/')
.post(  imagesController.uploadImage,
        imagesController.resizeImages,
        imagesController.addImages)
.patch(imagesController.deleteImages);




module.exports = router;