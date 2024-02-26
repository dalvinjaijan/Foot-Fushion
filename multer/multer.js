const multer=require('multer')
const path=require('path')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/product-images/');
    },
    filename: function (req, file, cb) {
      const fileName = Date.now() + path.extname(file.originalname);
      cb(null, fileName);
    }
  });

  module.exports = {
    // upload: multer({ storage: storage }).array("file",3),
    upload :multer({ storage: storage }).array("file[]"),
    update: multer({ storage: storage }).fields([
      { name: 'file1', maxCount: 1 }, 
      { name: 'file2', maxCount: 1 },
      { name: 'file3', maxCount: 1 }, 

  ])
  
  }