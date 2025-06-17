const multer = require('multer');
const sharp = require('sharp');
const acceptedTypes = ['property', 'project', 'user'];
const multerStorage = multer.memoryStorage();
const { deleteImagesfromServer } = require('../utils/helpers');

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        const error = new Error('Only image files are allowed!');
        error.statusCode = 400;
        cb(error, false);
    }
}

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
})

exports.uploadImage = upload.fields([
    { name: 'images', maxCount: 8 },
])

exports.resizeImages = async (req, res, next) => {
    const type = req.body?.type;
    if (!type) throw new Error('type must be specified');
    const validType = acceptedTypes.filter(t => t === type);
    if (!validType) throw new Error('invalid type');
    const width = req.body?.width * 1 || 2000;
    const height = req.body?.height * 1 || 1333;
    try {
        if (req.files?.images?.length === 1) {
            const ImageFileName = `${validType}-${Date.now()}-image`;
            await sharp(req.files.images[0].buffer)
                .resize(width, height)
                .toFormat('jpeg')
                .jpeg({ quality: 100 })
                .toFile(`public/images/${validType}/${ImageFileName}.jpg`);
            req.body.images = `http://${process.env.HOSTING_URL}/images/${validType}/${ImageFileName}.jpg`;
        }
        else {
            req.body.images = [];
            await Promise.all(
                req.files.images.map(async (img, i) => {
                    const imageFileName = `${validType}-${Date.now()}-${i}`;
                    await sharp(req.files.images[i].buffer)
                        .resize(width, height)
                        .toFormat('jpeg')
                        .jpeg({ quality: 100 })
                        .toFile(`public/images/${validType}/${imageFileName}.jpg`);
                    req.body.images.push(`http://${process.env.HOSTING_URL}/images/${validType}/${imageFileName}.jpg`)
                })
            )
        }
        next();
    } catch (err) {
        res.status(400).json({ status: "fail", message: err.message });
        console.log(err);
    }
}

exports.addImages = async (req, res) => {
    try {
        const images = req.body.images;
        if (!images) throw new Error("there was an error uploading images")
        res.status(200).json({
            status: 'success',
            images
        })
    } catch (err) {
        res.status(400).json({
            status: 'failed',
            message: err.message
        })
    }
}

exports.deleteImages = async (req, res) => {
    try {
        const filesPath = req.body.filesPath;
        await deleteImagesfromServer(filesPath);
        
        res.status(200).json({
            message: "Deleted",
            statusCode: 200
        })
    } catch (err) {
        res.status(400).json({
            status: 'failed',
            message: err.message
        })
    }
} 