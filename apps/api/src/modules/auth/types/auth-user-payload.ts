export type AuthMembershipPayload = {
  membershipId: string;
  organizationId: string;
  clientCompanyId: string | null;
  scopeType: string;
  roleCode: string;
};

export type AuthUserPayload = {
  sub: string;
  email: string;
  memberships: AuthMembershipPayload[];
};

export const LUMERA_OPERATOR_ROLES = ['LUMERA_ADMIN', 'LUMERA_OPERACIONAL'] as const;
