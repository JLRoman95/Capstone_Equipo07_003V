const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'API APT',
    version: '1.0.0',
    description: 'Documentación de la API del proyecto APT (Backend)',
  },
  servers: [
    {
      url: 'http://localhost:4000',
      description: 'Servidor local',
    },
  ],
};

export default swaggerDefinition;
