export type SpiritualStatus = {
  baptisSelam: boolean;
  baptisRohKudus: boolean;
  msj1: boolean;
  msj2: boolean;
  msj3: boolean;
  cgt1: boolean;
  cgt2: boolean;
  cgt3: boolean;
};

export type Member = {
  id: string;
  fullName: string;
  role: string;
  cgGroupId: string | null;
  nij: string | null;
  address: string | null;
  birthPlace: string | null;
  birthDate: string | null;
  email: string | null;
  phone: string | null;
  isBendahara: boolean;
  mustChangePassword: boolean;
  spiritualStatus: SpiritualStatus;
  pelayanan: string | null;
};
