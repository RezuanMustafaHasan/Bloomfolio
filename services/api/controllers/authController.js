const User = require("../models/User");
const { createSecretToken } = require("../util/SecretToken");
const bcrypt = require("bcryptjs");

module.exports.Signup = async (req, res, next) => {
  try {
    const { email, password, name, createdAt } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success:false,message: "User already exists" });
    }
    const user = await User.create({ email, password, name, createdAt });
    const token = createSecretToken(user._id);
    res.cookie("token", token, {
      withCredentials: true,
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
    });
    res
      .status(201)
      .json({ message: "User signed in successfully", success: true, user: {id:user._id,name:user.name,email:user.email} });
    next();
  } catch (error) {
    res.status(400).json({success:false,message:"Unable to complete authentication. Check the supplied fields."});
  }
};

module.exports.Login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if(!email || !password ){
      return res.status(400).json({success:false,message:'All fields are required'})
    }
    const user = await User.findOne({ email });
    if(!user){
      return res.status(401).json({success:false,message:'Incorrect password or email' })
    }
    const auth = await bcrypt.compare(password,user.password)
    if (!auth) {
      return res.status(401).json({success:false,message:'Incorrect password or email' })
    }
     const token = createSecretToken(user._id);
     res.cookie("token", token, {
       withCredentials: true,
       httpOnly: false,
       sameSite: 'lax',
       path: '/',
     });
     res.status(201).json({ message: "User logged in successfully", success: true });
     next()
  } catch (error) {
    res.status(400).json({success:false,message:"Unable to complete authentication. Check the supplied fields."});
  }
}
