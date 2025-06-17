const path = require('path');
const fs = require('fs');
const deleteFile = async (deleteFilPath)=>{
    fs.access(deleteFilPath, fs.F_OK, async (err, ac) => {
            await fs.unlink(deleteFilPath, (ferr, fc) => {
                    return true;
            });
        
    });
}


const deleteImagesfromServer = async (filesPath)=>{
  if(!filesPath.length || (!Array.isArray(filesPath))) throw new Error("you must provide an array of files path");
  const publicDir = path.join(__dirname, '..', 'public');
  filesPath.forEach(element => {
      const splitedPath = element.split('/');
      const deleteFilPath = `${publicDir}/images/${splitedPath[splitedPath.length-2]}/${splitedPath[splitedPath.length-1]}`;
      deleteFile(deleteFilPath);
  });   
}




const successResponse = (data, statusCode = 200) => ({
  success: true,
  data
});

const errorResponse = (message, statusCode = 500) => ({
  success: false,
  error: {
    message,
    statusCode
  }
});

module.exports = {
  successResponse,
  errorResponse,
  deleteImagesfromServer
};
