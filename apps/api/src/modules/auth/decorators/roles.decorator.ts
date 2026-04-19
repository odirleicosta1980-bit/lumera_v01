import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from '../constants/roles-key.js';

export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
