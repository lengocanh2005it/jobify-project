import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { Permission, Role } from 'apps/users/src/entities';
import { IDynamicStorageRbac, IStorageRbac } from 'nestjs-rbac';
import { DataSource } from 'typeorm';

@Injectable()
export class RbacStorageProvider implements IDynamicStorageRbac {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async getRbac(): Promise<IStorageRbac> {
    const roles = await this.dataSource.getRepository(Role).find({
      relations: ['permissions'],
    });

    const allPermissions = await this.dataSource
      .getRepository(Permission)
      .find();

    const permissionObj: Record<string, string[]> = {};

    for (const permission of allPermissions) {
      const [perm, action] = permission.name.split('@');

      if (!permissionObj[perm]) permissionObj[perm] = [];

      if (action && !permissionObj[perm].includes(action))
        permissionObj[perm].push(action);
    }

    const grants: Record<string, string[]> = {};

    for (const role of roles) {
      grants[role.name] = [];

      for (const permission of role.permissions)
        grants[role.name].push(permission.name);
    }

    return {
      roles: roles.map((r) => r.name),
      permissions: permissionObj,
      grants,
      filters: {},
    };
  }
}
