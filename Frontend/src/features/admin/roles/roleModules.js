import {
    BadgePercent,
    ChefHat,
    CreditCard,
    Image,
    LayoutDashboard,
    Monitor,
    Receipt,
    Settings,
    Tags,
    UtensilsCrossed,
} from "lucide-react";
import { getRoles } from "../../../api/roleApi";

// Icon for each backend permission module (Backend/src/constants/permissions.js)
export const MODULE_ICONS = {
    dashboard: LayoutDashboard,
    orders: Receipt,
    payments: CreditCard,
    menu: UtensilsCrossed,
    categories: Tags,
    banners: Image,
    offers: BadgePercent,
    settings: Settings,
    pos: Monitor,
    kitchen: ChefHat,
};

export const permissionKey = (module, action) => `${module.key}.${action.key}`;

export const fetchRoles = async () => (await getRoles())?.data;
