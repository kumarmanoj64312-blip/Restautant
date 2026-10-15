import api from "./client";

// Backend: /api/settings

export const getSettings = async () => {
    const { data } = await api.get("/settings");
    return data;
};

export const updateSettings = async (settingsData) => {
    const { data } = await api.put("/settings", settingsData);
    return data;
};

// Resets settings to defaults
export const resetSettings = async () => {
    const { data } = await api.delete("/settings");
    return data;
};
