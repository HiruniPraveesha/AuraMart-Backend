import mongoose from "mongoose";
import bcrypt from "bcrypt";
import validator from "validator";

const Schema = mongoose.Schema

const adminSchema = new Schema({
    firstName: {
        type: String,
    },
    lastName: {
        type: String,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    mobile: {
        type: String,
        unique: true,
    },
    address: {
        type: String,
    },
    password: {
        type: String,
        required: true
    },

})

// static signup method
adminSchema.statics.signup = async function (firstName, lastName, email, mobile, address, password) {

    // validation
    if (!email || !password) {
        throw Error('Email and Password must be filled')
    }
    if (!validator.isEmail(email)) {
        throw Error('Email not valid')
    }
    if (!validator.isMobilePhone(mobile)) {
        throw Error('Mobile Number not valid')
    }
    if (!validator.isStrongPassword(password)) {
        throw Error('Password not strong enough')
    }
    const exists = await this.findOne({ email })

    if (exists) {
        throw Error('Email already in use')
    }

    // convert the password to a hash code
    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)

    // add seller to database
    const admin = await this.create({ firstName, lastName, email, mobile, address, password: hash })

    return admin
}

// static login method
adminSchema.statics.login = async function (email, password) {

    // validation
    if (!email || !password) {
        throw Error('All fields must be filled')
    }

    const admin = await this.findOne({ email })
    if (!admin) {
        throw Error('Incorrect email')
    }

    // compare password
    const match = await bcrypt.compare(password, admin.password)
    if (!match) {
        throw Error('Incorrect password')
    }

    return admin
}

//Export the model
const admin = mongoose.model('Admin', adminSchema);
export default admin;