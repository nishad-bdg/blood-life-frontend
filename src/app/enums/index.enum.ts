export enum RoleEnum {
  ADMIN = 'admin',
  CO_ADMIN = 'co-admin',
  MODERATOR = 'moderator',
  USER = 'donar',   // (kept as-is if your API returns "donar")
}


export enum UserStatusEnum {
  ACTIVE = 'Active',
  BLOCKED = 'Blocked',
  DELETED = 'Deleted',
}

export enum BloodGroupEnum {
  A_POS = 'A+',
  A_NEG = 'A-',
  B_POS = 'B+',
  B_NEG = 'B-',
  O_POS = 'O+',
  O_NEG = 'O-',
  AB_POS = 'AB+',
  AB_NEG = 'AB-',
}

