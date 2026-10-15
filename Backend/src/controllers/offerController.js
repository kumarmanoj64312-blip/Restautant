import * as offerService from "../services/offerService.js";

export const getOffers = async (req, res) => {
    try {
        const offers = await offerService.getAllOffers();

        res.status(200).json({
            success: true,
            count: offers.length,
            data: offers,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const getOfferById = async (req, res) => {
    try {
        const offer = await offerService.getOfferById(req.params.id);

        if (!offer) {
            return res.status(404).json({
                success: false,
                message: "Offer not found",
            });
        }

        res.status(200).json({
            success: true,
            data: offer,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const createOffer = async (req, res) => {
    try {
        const offer = await offerService.createOffer(req.body);

        res.status(201).json({
            success: true,
            message: "Offer created successfully",
            data: offer,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const updateOffer = async (req, res) => {
    try {
        const offer = await offerService.updateOffer(
            req.params.id,
            req.body
        );

        if (!offer) {
            return res.status(404).json({
                success: false,
                message: "Offer not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Offer updated successfully",
            data: offer,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const deleteOffer = async (req, res) => {
    try {
        const offer = await offerService.deleteOffer(req.params.id);

        if (!offer) {
            return res.status(404).json({
                success: false,
                message: "Offer not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Offer deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};