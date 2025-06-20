const express = require('express');
const cors = require('cors');
const { json } = require('body-parser');
const jwt = require('jsonwebtoken');
const { createDatabase } = require('./db')

const JWT_SECRET = 'secreto-autos';

const app = express();

let db = null;

app.use(cors());
app.use(json());

// Cache
app.use((req, res, next) => {
  const cacheTime = 60*2; // 60 segundos * 2 minutos = 120 segundos
  res.set({
    'Cache-Control': `max-age=${cacheTime}`
  });
  next();
});

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }

    req.user = user;

    next();
  });
};

app.post('/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(500).json({
      error: 'email y/o contraseña no presentes',
    });
  }

  try {
    await db.run("INSERT INTO users (email, password, is_admin) VALUES (?, ?, ?)", [email, password, 0]);
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      return res.status(500).json({
        error: 'El email ya está en uso',
      });
    }

    return res.status(500).json({
      error: 'Error al registrar el usuario',
    });
  }

  return res.status(200).json({
    message: 'registrado correctamente',
  });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(500).json({
      error: 'email o contraseña erronea',
    });
  }

  await db.all("SELECT * FROM users WHERE email = ? AND password = ?", [email, password], (err, users) => {
    if (err) {
      return res.status(500).json({
        error: 'email o contraseña erronea',
      });
    }

    const user = users[0];

    if (!user) {
      return res.status(500).json({
        error: 'email o contraseña erronea',
      });
    }

    const token = jwt.sign({ id: user.id, email: email, isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: '1h' });

    return res.status(200).send(token);
  });
});

app.get('/cars/all-cars', verifyToken, async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({
      error: 'No tienes permisos para ver todas los autos',
    });
  }

  db.all("SELECT * FROM cars", (err, cars) => {
    if (err) {
      return res.status(500).json({
        error: 'Error al buscar los autos',
      });
    }

    return res.status(200).json({
      cars: cars,
    });
  });
});

app.get('/cars/my-cars', verifyToken, (req, res) => {
  db.all("SELECT * FROM cars WHERE user_id = ?", [req.user.id], (err, cars) => {
    if (err) {
      return res.status(500).json({
        error: 'Error al buscar mis autos',
      });
    }

    return res.status(200).json({
      cars: cars,
    });
  });
});

app.post('/cars/create', verifyToken, (req, res) => {
  const { brand, model, description } = req.body;

  if (!brand || !brand || !description) {
    return res.status(500).json({
      error: 'Faltan datos',
    });
  }

  db.run("INSERT INTO cars (user_id, brand, model, description) VALUES (?, ?, ?, ?)", [req.user.id, brand, model, description]);

  return res.status(200).json({
    message: 'Auto creado correctamente',
  });
});

app.get('/cars/by-id/:id', verifyToken, (req, res) => {
  db.get("SELECT * FROM cars WHERE id = ?", [req.params.id], (err, movie) => {
    if (err) {
      return res.status(500).json({
        error: 'Error al buscar el auto',
      });
    }

    if (!movie) {
      return res.status(404).json({
        error: 'Auto no encontrada',
      });
    }

    return res.status(200).json({
      movie: movie,
    });
  });
});

app.put('/cars/by-id/:id', verifyToken, (req, res) => {
  db.run("UPDATE cars SET brand = ?, model = ?, description = ? WHERE id = ?", [req.body.brand, req.body.model, req.body.description, req.params.id], function(err) {
    if (err) {
      return res.status(500).json({
        error: 'Error al actualizar el auto',
      });
    }

    if (this.changes === 0) {
      return res.status(404).json({
        error: 'Auto no encontrada',
      });
    }

    return res.status(200).json({
      message: 'Auto actualizada correctamente',
    });
  });
});

app.delete('/cars/by-id/:id', verifyToken, (req, res) => {
  db.run("SELECT * FROM users WHERE user_id = ? AND is_admin = 1", [req.user.id], (err, users) => {
    if (err) {
      return res.status(500).json({
        error: 'Error al verificar permisos',
      });
    }

    if (users.length === 0) {
      return res.status(403).json({
        error: 'No tienes permisos para eliminar esta auto',
      });
    }

    db.run("DELETE FROM cars WHERE id = ?", [req.params.id], function(err) {
      if (err) {
        return res.status(500).json({
          error: 'Error al eliminar el auto',
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          error: 'Auto no encontrada',
        });
      }

      return res.status(200).json({
        message: 'Auto eliminado correctamente',
      });
    });
  });
});

const main = () => {
  const database = createDatabase();

  db = database;

  app.listen(3000);
}

main();