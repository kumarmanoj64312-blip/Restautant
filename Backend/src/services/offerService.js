import Offer from "../models/Offer.js";

export const getAllOffers = async () => {
    return await Offer.find({ isActive: true }).sort({
        createdAt: -1,
    });
};

export const getOfferById = async (id) => {
    return await Offer.findById(id);
};

export const createOffer = async (offerData) => {
    return await Offer.create(offerData);
};

export const updateOffer = async (id, offerData) => {
    return await Offer.findByIdAndUpdate(id, offerData, {
        new: true,
        runValidators: true,
    });
};

export const deleteOffer = async (id) => {
    return await Offer.findByIdAndDelete(id);
};