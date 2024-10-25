export const ALL_USERS = 'public';
export var Role;
(function (Role) {
    Role["Admin"] = "Admin";
    Role["Owner"] = "Owner";
    Role["Public"] = "Public";
    Role["Unknown"] = "Unknown";
})(Role || (Role = {}));
export const defaultRole = {
    public: Role.Public
};
