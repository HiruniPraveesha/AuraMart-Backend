import mongoose from "mongoose";
import bcrypt from "bcrypt";

const Schema = mongoose.Schema

const sellerSchema = new Schema({
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

// static login method
sellerSchema.statics.login = async function (email, password) {

    // validation
    if (!email || !password) {
        throw Error('All fields must be filled')
    }

    const seller = await this.findOne({ email })
    if (!seller) {
        throw Error('Incorrect email')
    }

    // compare password
    const match = await bcrypt.compare(password, seller.password)
    if (!match) {
        throw Error('Incorrect password')
    }

    return seller
}

//Export the model
const seller = mongoose.model('Seller', sellerSchema);
export default seller;