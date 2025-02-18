const express= require('express');
const router=express.Router()
const User= require('../models/user');
const { jwtauthMiddleware, generateJWT } = require('../jwt');
const bcrypt= require('bcrypt')

router.post('/signup', async (req, res) => {
    try {
        const data = req.body;
        const checkRole = data.role;

        if (checkRole == 'admin') {
            const user = await User.findOne({ role: 'admin' });

            if (user) {
                return res.status(403).json({ message: 'Admin already exists' });
            }
        }
        console.log("CHP1");

        // Check if the Aadhar card number already exists
        const exist = await User.findOne({ aadharCardNumber: data.aadharCardNumber });
        console.log("CHP2");

        if (exist) {
            return res.status(401).json({ message: 'User already exists' });
        }

        console.log("CHP3");

        // Log the data being saved to the database
        console.log("Saving user:", data);

        // Create a new user instance
        const newUser = new User(data);
        console.log("CHP4");

        // Attempt to save the user
        const response = await newUser.save();
        console.log("CHP5");

        // Ensure the response is not null or undefined
        if (!response) {
            console.log("Failed to save the user.");
            return res.status(500).json({ message: 'Failed to save the user' });
        }

        const payload = { id: response.id };
        const token = generateJWT(payload);

        res.status(200).json({
            response: response,
            token: token
        });

    } catch (error) {
        console.error("Error during signup:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});




router.post('/login', async(req,res)=>{

    try {

        const { aadharCardNumber,password }= req.body;
        const user= await User.findOne({aadharCardNumber:aadharCardNumber});
        if(!user){
            return res.status(401).json({message: 'User not found'});
        }
        if(!await user.comparePassword(password)){
            return res.status(401).json({message:'Incorrect password'});
        }
        const payload={
            id:user.id
        }
        const token= generateJWT(payload);  

        res.status(200).json({message:"User logged in",token:token});

    } catch (error) {

      res.status(500).json({message:'Internal server error'});
        
    }

})


router.get('/profile', jwtauthMiddleware, async(req,res)=>{

    try {
        const userData= req.user;
        const userId= userData.id;
        const data= await User.findById(userId);
    
        return res.status(201).json({data});

    } catch (error) {
        return res.status(500).json({error:'Internal server error'});
    }
})


router.put('/profile/password', jwtauthMiddleware, async(req,res)=>{

    try {
        const userData= req.user;
        const userId= userData.id;
        const { currentPassword, newPassword } = req.body; 


        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Both currentPassword and newPassword are required' });
        }


        const user= await User.findById(userId);


        if (!user) {
            return res.status(401).json({ error: 'Invalid user' });
        }
        if(!await user.comparePassword(currentPassword)){
            return res.status(401).json({ error: 'Invalid password' });
        }


        user.password = newPassword;
        await user.save();

        console.log('password updated');
        res.status(200).json({ message: 'Password updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})


module.exports= router;