const multer = require('multer');
const imageFolder = '/public/image/';
const fs = require('promise-fs');



const uploadFile = (path) => {
    return multer.diskStorage({
      destination: (req, file, cb) => {
        console.log(file, 'check out this object for image alt tag')
        cb(null, process.cwd() + path)
      },
      filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '')}.${file.mimetype.split('/')[1]}`)
      },
      
    });
  };

  const customImageUpload = async(req, folder) => {
    const images = req.body.images;
    if(images && images.length > 0) {
      const files = [];
      for(const i of images) {
        console.log(i.b_64.length, 'stringl ength')
        const base64 = i.b_64, type = i.type, key = i.key;
        // console.log(base64, 'this is base 64 string')
      let b64 = base64.split(';base64,').pop();
    const random = Math.floor(Math.random() * 10000000), timestamp = new Date().getTime().toString();
    const name = `${random}-${timestamp}.${type}`;
    const path = process.cwd() + `/public/${folder}/` + name;
    const short_path = `/public/${folder}/` + name;
    const resp = await fs.writeFile(`${path}`, b64, { encoding: 'base64' });
    files.push({
      resp, short_path, key
    })
      }
      req.files = files;
    }
    return true;
}

  const imageUpload = multer({ storage: uploadFile(imageFolder) });

  const customUpload = async (req, res, next) => {
    console.log(new Date().toISOString(), 'start order');
    await customImageUpload(req, 'image')
    next()
  }

  module.exports = {
      imageUpload, folders: [
          imageFolder
      ], imageFolder, customUpload
  }