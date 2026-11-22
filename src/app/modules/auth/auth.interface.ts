export type TRegister = {
  name: string;
  email: string;
  password: string;
  interests?: string[];
};

export type TLogin = {
  email: string;
  password: string;
};

export type TChangePassword = {
  oldPassword: string;
  newPassword: string;
};
