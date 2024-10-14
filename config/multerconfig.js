const multer=require('multer')
const path=require('path')
const crypto=require("crypto")

//setup diskstorage

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/uploads')    //yaha par file ka path aayga jaha par image upload hogi
  },
  filename: function (req, file, cb) {
    crypto.randomBytes(12,function(err,name)     //name ek random name generate karke dega which is in buffer 
    {
        const fn=name.toString("hex")+path.extname(file.originalname)
         cb(null, fn)

    })
   
  }
})

const upload = multer({ storage: storage })

//export upload variable

module.exports=upload