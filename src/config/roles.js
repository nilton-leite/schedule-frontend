// Perfis de acesso (iguais aos da API: users.role).
export const ROLES = {
  ADMIN: 'admin',
  RECEPCAO: 'recepcao',
  MEDICO: 'medico'
};

export const ROLE_LABELS = {
  admin: 'Administrador',
  recepcao: 'Recepção',
  medico: 'Médico'
};

export const isAdmin = (user) => Boolean(user) && user.role === ROLES.ADMIN;

// Remove do menu os itens com "roles" que não incluem o perfil do usuário (recursivo para grupos e submenus).
export const filterMenuByRole = (items, user) =>
  items
    .filter((item) => !item.roles || (Boolean(user) && item.roles.includes(user.role)))
    .map((item) => (item.children ? { ...item, children: filterMenuByRole(item.children, user) } : item));
