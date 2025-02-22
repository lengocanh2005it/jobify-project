import * as bcrypt from 'bcrypt';

export const handleEncodedPassword = (password: string): string => {
  const salt = bcrypt.genSaltSync(10);

  return bcrypt.hashSync(password, salt);
};
