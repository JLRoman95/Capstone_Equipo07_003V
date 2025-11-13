const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Sistema APT - API Optimizada',
    version: '2.0.0',
    description: 'API del Sistema APT (Análisis y Planificación de Alimentos) - Versión optimizada con 9 tablas esenciales para gestión de inventario, producción y control de calidad.',
    contact: {
      name: 'Sistema APT',
      email: 'admin@sistemaAPT.com'
    }
  },
  servers: [
    {
      url: 'http://localhost:4000',
      description: 'Servidor local de desarrollo',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Mensaje de error'
          },
          code: {
            type: 'string',
            description: 'Código de error'
          }
        }
      },
      Usuario: {
        type: 'object',
        properties: {
          id_usuario: {
            type: 'integer',
            description: 'ID único del usuario'
          },
          nombre: {
            type: 'string',
            description: 'Nombre completo del usuario'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Correo electrónico único'
          },
          rol: {
            type: 'string',
            enum: ['admin', 'cocinero', 'auditor'],
            description: 'Rol del usuario en el sistema'
          },
          activo: {
            type: 'boolean',
            description: 'Estado del usuario (activo/inactivo)'
          }
        }
      },
      Proveedor: {
        type: 'object',
        properties: {
          id_proveedor: {
            type: 'integer',
            description: 'ID único del proveedor'
          },
          nombre: {
            type: 'string',
            description: 'Nombre del proveedor'
          },
          contacto: {
            type: 'string',
            description: 'Persona de contacto'
          },
          telefono: {
            type: 'string',
            description: 'Teléfono de contacto'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Correo electrónico'
          }
        }
      },
      Producto: {
        type: 'object',
        properties: {
          id_producto: {
            type: 'integer',
            description: 'ID único del producto'
          },
          nombre: {
            type: 'string',
            description: 'Nombre del producto'
          },
          codigo: {
            type: 'string',
            description: 'Código único del producto'
          },
          categoria: {
            type: 'string',
            description: 'Categoría del producto (Carnes, Verduras, Lacteos)'
          },
          unidad_medida: {
            type: 'string',
            description: 'Unidad de medida (kg, litros, unidades)'
          },
          stock_actual: {
            type: 'number',
            description: 'Stock actual disponible'
          },
          stock_minimo: {
            type: 'number',
            description: 'Stock mínimo requerido'
          }
        }
      },
      Inventario: {
        type: 'object',
        properties: {
          id_inventario: {
            type: 'integer',
            description: 'ID único del lote'
          },
          id_producto: {
            type: 'integer',
            description: 'ID del producto asociado'
          },
          stock_actual: {
            type: 'number',
            description: 'Cantidad disponible en el lote'
          },
          fecha_ingreso: {
            type: 'string',
            format: 'date-time',
            description: 'Fecha de ingreso del lote'
          },
          fecha_caducidad: {
            type: 'string',
            format: 'date',
            description: 'Fecha de caducidad del lote'
          }
        }
      },
      Checklist: {
        type: 'object',
        properties: {
          id_checklist: {
            type: 'integer',
            description: 'ID único del checklist'
          },
          fecha: {
            type: 'string',
            format: 'date',
            description: 'Fecha del checklist'
          },
          turno: {
            type: 'string',
            enum: ['Mañana', 'Tarde', 'Noche'],
            description: 'Turno de trabajo'
          },
          estado: {
            type: 'string',
            enum: ['pendiente', 'completo'],
            description: 'Estado del checklist'
          }
        }
      },
      ProduccionAlimentos: {
        type: 'object',
        properties: {
          id_produccion: {
            type: 'integer',
            description: 'ID único de la producción'
          },
          fecha: {
            type: 'string',
            format: 'date',
            description: 'Fecha de producción'
          },
          responsable: {
            type: 'string',
            description: 'Responsable de la producción'
          },
          turno: {
            type: 'string',
            enum: ['Mañana', 'Tarde', 'Noche'],
            description: 'Turno de trabajo'
          }
        }
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ]
};

export default swaggerDefinition;
