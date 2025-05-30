const multer = require("multer");
const fs = require('fs');

const csvFilter = (req, file, cb) => {
  if (file.mimetype.includes("csv")) {
    cb(null, true);
  } else {
    cb("Please upload only csv file.", false);
  }
};

var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdir('../uploads/',(err)=>{
      cb(null, '../uploads/');
   });
  },
  filename: (req, file, cb) => {
    console.log(file.originalname);
    cb(null, file.originalname);
  },
});

var uploadCSV = multer({ storage: storage, fileFilter: csvFilter });

module.exports = uploadCSV;