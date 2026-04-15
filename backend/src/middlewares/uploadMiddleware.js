const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'uploads/';
    if (req.baseUrl.includes('clientes')) folder += 'clientes/';
    else if (req.baseUrl.includes('vehiculos')) folder += 'vehiculos/';
    else if (req.baseUrl.includes('usuarios')) folder += 'usuarios/';
    
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const originalName = path.parse(file.originalname).name.replace(/\s+/g, '-');
    const now = new Date();
    const time = `${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}`;
    const ext = path.extname(file.originalname);
    cb(null, `${originalName}-${time}${ext}`);
  }
});

const upload = multer({ storage });
module.exports = upload;