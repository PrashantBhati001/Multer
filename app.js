const express=require('express')
const app=express()
const userModel=require('./models/user')
const postModel=require('./models/post')
const path=require('path')
const cookieParser=require('cookie-parser')
const jwt=require('jsonwebtoken')
const bcrypt=require('bcrypt')
const upload=require("./config/multerconfig")


app.set("view engine","ejs")
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(express.static(path.join(__dirname,'public')))
app.use(cookieParser())


app.get("/",(req,res)=>{

    res.render("index")

})

app.get("/profile/upload",(req,res)=>{

    res.render("profileupload")

})

app.post("/upload",isLoggedIn,upload.single("image"), async (req,res)=>{

    //res.file will contain the details of the file that is uploaded
    const user=await userModel.findOne({email:req.user.email})
    user.profile=req.file.filename
    await user.save()
    res.redirect("/profile")

})

app.get("/login",(req,res)=>{

    res.render("login")

})

app.post("/login", async (req,res)=>{

    let {email,password}=req.body
    let user=await userModel.findOne({email})
    if(!user) res.send("User does not exist ,please register first")

    bcrypt.compare(password,user.password,(err,result)=>{

        if(result)
        {
            const token=jwt.sign({email,userid:user._id},"aaaaa")
            res.cookie("token",token)
            res.redirect("/profile")
        }
        else{
            res.redirect("/login")
        }

    })
    
    
})

app.post("/register", async (req,res)=>{

    let {name,email,age,username,password}=req.body
    let user=await userModel.findOne({email})
    if(user) res.send("User already exists")

     bcrypt.genSalt(10,(err,salt)=>{
        bcrypt.hash(password,salt,async (err,hash)=>{
            let newuser=await userModel.create({
                name,
                email,
                age,
                username,
                password:hash
            })


               const token=jwt.sign({email,userid:newuser._id},"aaaaa")
               res.cookie("token",token)
               res.redirect("/login")
        })
     })
    
    
})

app.get("/logout",(req,res)=>{

    res.cookie("token","")
    res.redirect("/login")

})


function isLoggedIn (req,res,next)
{
    if(req.cookies.token=== "")
    {
        res.redirect("/login")
    }
    else
    {
        let data=jwt.verify(req.cookies.token,'aaaaa')
        req.user=data
        next()
    }
    

}

app.get("/profile",isLoggedIn,async (req,res)=>{

    const user=await userModel.findOne({email:req.user.email}).populate("posts")
    res.render("profile",{user})

})


app.post("/post",isLoggedIn,async (req,res)=>{

    const user=await userModel.findOne({email:req.user.email})
    let {textcontent}=req.body
    const post=await  postModel.create({
        user:user._id,
        content:textcontent
    })

    user.posts.push(post._id)
    await user.save()
    res.redirect("/profile")

})

app.get("/like/:id",isLoggedIn,async (req,res)=>{

    const post=await postModel.findOne({_id:req.params.id}).populate("user")
    if(post.likes.indexOf(req.user.userid) == -1)
    {
        post.likes.push(req.user.userid)
    }
    else{
        
        post.likes.splice(post.likes.indexOf(req.user.userid),1)
    }
    
    await post.save()
    res.redirect("/profile")

})

app.get("/edit/:id",isLoggedIn,async (req,res)=>{

    const post=await postModel.findOne({_id:req.params.id}).populate("user")
    res.render("editpost",{post})
   
})

app.post("/update/:id",isLoggedIn,async (req,res)=>{

    const post=await postModel.findOneAndUpdate({_id:req.params.id},{content:req.body.textcontent})
    res.redirect("/profile")
   
})








app.listen(3000)