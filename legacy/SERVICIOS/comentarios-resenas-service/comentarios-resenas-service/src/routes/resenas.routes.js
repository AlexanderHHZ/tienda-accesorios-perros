const express = require('express');
const router = express.Router();

const pool = require('../database');

// Obtener todas las reseñas
router.get('/', async (req, res) => {
    try {
        const [resenas] = await pool.query(
            'SELECT * FROM resenas ORDER BY fecha DESC'
        );

        res.json(resenas);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Error al obtener las reseñas'
        });
    }
});


// Obtener una reseña por ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [resenas] = await pool.query(
            'SELECT * FROM resenas WHERE id = ?',
            [id]
        );

        if (resenas.length === 0) {
            return res.status(404).json({
                error: 'Reseña no encontrada'
            });
        }

        res.json(resenas[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Error al obtener la reseña'
        });
    }
});


// Crear una reseña
router.post('/', async (req, res) => {
    try {
        const {
            id_producto,
            id_cliente,
            calificacion,
            comentario
        } = req.body;

        if (
            !id_producto ||
            !id_cliente ||
            !calificacion ||
            !comentario
        ) {
            return res.status(400).json({
                error: 'Todos los campos son obligatorios'
            });
        }

        if (calificacion < 1 || calificacion > 5) {
            return res.status(400).json({
                error: 'La calificación debe estar entre 1 y 5'
            });
        }

        const [resultado] = await pool.query(
            `INSERT INTO resenas
            (id_producto, id_cliente, calificacion, comentario)
            VALUES (?, ?, ?, ?)`,
            [
                id_producto,
                id_cliente,
                calificacion,
                comentario
            ]
        );

        res.status(201).json({
            mensaje: 'Reseña creada correctamente',
            id: resultado.insertId
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Error al crear la reseña'
        });
    }
});


// Actualizar una reseña
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const {
            calificacion,
            comentario
        } = req.body;

        if (!calificacion || !comentario) {
            return res.status(400).json({
                error: 'La calificación y el comentario son obligatorios'
            });
        }

        if (calificacion < 1 || calificacion > 5) {
            return res.status(400).json({
                error: 'La calificación debe estar entre 1 y 5'
            });
        }

        const [resultado] = await pool.query(
            `UPDATE resenas
             SET calificacion = ?, comentario = ?
             WHERE id = ?`,
            [
                calificacion,
                comentario,
                id
            ]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                error: 'Reseña no encontrada'
            });
        }

        res.json({
            mensaje: 'Reseña actualizada correctamente'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Error al actualizar la reseña'
        });
    }
});


// Eliminar una reseña
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [resultado] = await pool.query(
            'DELETE FROM resenas WHERE id = ?',
            [id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                error: 'Reseña no encontrada'
            });
        }

        res.json({
            mensaje: 'Reseña eliminada correctamente'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Error al eliminar la reseña'
        });
    }
});


module.exports = router;