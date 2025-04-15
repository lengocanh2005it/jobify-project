import * as fs from 'fs';
import * as path from 'path';

interface Permission {
  name: string;
  description: string;
  module: string;
}

const permissionsDir = path.join(
  process.cwd(),
  'libs/common',
  'resources',
  'permissions',
);

const permissionFiles = fs
  .readdirSync(permissionsDir)
  .filter((file) => file.endsWith('.permission.ts') && file !== 'index.ts');

let permissionsData: Permission[] = [];

const loadPermissions = async () => {
  for (const file of permissionFiles) {
    const permissionModule: { [key: string]: Permission[] } = await import(
      path.join(permissionsDir, file)
    );

    const values = Object.values(permissionModule);

    values.forEach((val) => {
      if (Array.isArray(val)) {
        permissionsData = [...permissionsData, ...val];
      }
    });
  }
  return permissionsData;
};

loadPermissions().catch((err) => {
  console.error(err);
});

export { permissionsData };
