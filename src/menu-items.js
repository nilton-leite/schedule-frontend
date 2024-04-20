const menuItems = {
  items: [
    {
      id: 'navigation',
      title: 'Menu',
      type: 'group',
      icon: 'icon-navigation',
      children: [
        {
          id: 'agenda',
          title: 'Agenda',
          type: 'item',
          url: '/agenda',
          classes: 'nav-item',
          icon: 'feather icon-calendar'
        },
        {
          id: 'consultas',
          title: 'Consultas',
          type: 'item',
          url: '/consultas',
          classes: 'nav-item',
          icon: 'feather icon-clipboard'
        },
        {
          id: 'pacientes',
          title: 'Pacientes',
          type: 'item',
          url: '/pacientes',
          classes: 'nav-item',
          icon: 'feather icon-users'
        },
        {
          id: 'medicos',
          title: 'Médicos',
          type: 'item',
          url: '/medicos',
          classes: 'nav-item',
          icon: 'feather icon-activity'
        },
        {
          id: 'params',
          title: 'Parâmetros',
          type: 'collapse',
          icon: 'feather icon-sliders',
          children: [
            {
              id: 'planossaude',
              title: 'Planos de Saúde',
              type: 'item',
              url: '/parametros/planos'
            },
            {
              id: 'especialidades',
              title: 'Especialidades',
              type: 'item',
              url: '/parametros/especialidades'
            },
            {
              id: 'usuarios',
              title: 'Usuários',
              type: 'item',
              url: '/parametros/usuarios'
            }
          ]
        }
      ]
    }
  ]
};

export default menuItems;
