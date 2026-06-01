const { ZodError } = require('zod');

const validateSchema = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos.',
        details: err.issues ? err.issues.map(e => e.message) : [err.message],
      });
    }
    return res.status(500).json({ error: 'Erro interno de validação.' });
  }
};

module.exports = { validateSchema };
