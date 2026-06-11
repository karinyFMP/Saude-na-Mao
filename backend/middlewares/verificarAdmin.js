const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'saude_na_mao_admin_secret_2024';

const verificarAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autorização não fornecido.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== 'servidor') {
      return res.status(403).json({ error: 'Acesso negado. Permissão insuficiente.' });
    }

    req.servidor = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
};

module.exports = { verificarAdmin, JWT_SECRET };
