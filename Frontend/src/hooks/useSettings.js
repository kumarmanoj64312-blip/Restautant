import { useEffect, useState } from "react";
import { getSettings } from "../api/settingsApi";

// Shared across components so settings are fetched once per page load
let cache = null;
let pending = null;

const DEFAULTS = { deliveryCharge: 0, tax: 0 };

const loadSettings = () => {
    if (!pending) {
        pending = getSettings()
            .then((response) => {
                cache = { ...DEFAULTS, ...(response?.data || {}) };
                return cache;
            })
            .catch(() => {
                pending = null; // allow a retry next time
                return DEFAULTS;
            });
    }

    return pending;
};

/**
 * Public restaurant settings (delivery charge, tax %, contact details).
 * Returns defaults until loaded.
 */
const useSettings = () => {
    const [settings, setSettings] = useState(cache || DEFAULTS);

    useEffect(() => {
        let active = true;

        loadSettings().then((loaded) => {
            if (active) setSettings(loaded);
        });

        return () => {
            active = false;
        };
    }, []);

    return settings;
};

// Same maths as Backend orderService.calculateCharges
export const calculateCharges = (subtotal, settings, { includeDelivery = true } = {}) => {
    const taxRate = Math.min(Math.max(Number(settings?.tax) || 0, 0), 100);
    const deliveryCharge = includeDelivery ? Math.max(Number(settings?.deliveryCharge) || 0, 0) : 0;
    const tax = Math.round(subtotal * taxRate) / 100;

    return {
        taxRate,
        deliveryCharge,
        tax,
        total: subtotal + deliveryCharge + tax,
    };
};

export default useSettings;
