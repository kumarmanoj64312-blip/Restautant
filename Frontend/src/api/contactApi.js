import api from "./client";

// Backend: /api/contact

export const sendContactMessage = async (contactData) => {
    const { data } = await api.post("/contact", contactData);
    return data;
};
