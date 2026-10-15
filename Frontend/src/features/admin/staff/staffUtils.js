import { ROLES } from "../../../utils/constants";

// Roles an admin can give from the Staff page (most common first)
export const STAFF_ROLE_OPTIONS = [
    { value: ROLES.MANAGER, label: "Manager", hint: "Runs operations. Access is set on Roles & Permissions." },
    { value: ROLES.KITCHEN, label: "Kitchen Staff", hint: "Kitchen display only." },
    { value: ROLES.ADMIN, label: "Admin", hint: "Full access, including staff and permissions." },
];

export const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
export const PHONE_PATTERN = /^\d{10}$/;

export const roleHint = (role) => STAFF_ROLE_OPTIONS.find((option) => option.value === role)?.hint;

export const matchesStaffSearch = (member, term) => {
    const query = term.trim().toLowerCase();
    if (!query) return true;

    return [member.name, member.email, member.phone]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));
};
