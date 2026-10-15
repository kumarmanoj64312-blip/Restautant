// Rounded % saved when a dish has a valid discount price
export const getDiscountPercent = (menu) => {
    const price = Number(menu?.price) || 0;
    const discountPrice = Number(menu?.discountPrice) || 0;

    if (price <= 0 || discountPrice <= 0 || discountPrice >= price) return 0;

    return Math.round((1 - discountPrice / price) * 100);
};

// Category id of a menu item whether it is populated or not
export const getCategoryId = (menu) =>
    menu?.category && typeof menu.category === "object" ? menu.category._id : menu?.category;

// Active categories in the admin-defined order
export const sortCategories = (list) =>
    [...list]
        .filter((category) => category?.isActive !== false)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || String(a.name).localeCompare(String(b.name)));
