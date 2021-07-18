'use strict'

var hotel = require('../Modelos/hotel.model');
var habitacion = require('../Modelos/habitacion.model');

function registrarHabitacion(req, res) {
    var habitacionModel = new habitacion();
    var params = req.body;
    var idHotel = req.params.idHotel;

    if (params.nombre && params.precio && params.descripcion) {

        habitacionModel.nombre = params.nombre;
        habitacionModel.precio = params.precio;
        habitacionModel.fechaDisponible = Date.now();
        habitacionModel.imagen = null;
        habitacionModel.descripcion = params.descripcion;
        habitacionModel.disponible = true;
        habitacionModel.hotel = idHotel;
        habitacionModel.reservaciones = 0;

        habitacion.find({ nombre: params.nombre, hotel: idHotel }).exec((err, habitacionEncontrada) => {
            if (err) return res.status(500).send({ mensaje: 'Error en la peticion' })
            if (habitacionEncontrada.length >= 1) {
                return res.status(500).send({ mensaje: 'Ya existe la habitacion en este hotel' })
            } else {

                habitacionModel.save((err, habitacionGuardada) => {
                    if (err) return res.status(500).send({ mensaje: "Error en la peticion de la habitacion" });
                    if (habitacionGuardada) {
                        res.status(200).send({ mensaje: "Habitacion agregada" })
                    } else {
                        res.status(404).send({ mensaje: "No se a podido guardar la habitacion" })
                    }
                })
            }
        })
    } else {
        return res.status(500).send({ mensaje: 'Error datos incorrectos o incompletos' });
    }
}

function buscarHabitacion(req, res) {
    var idHotel = req.params.idHotel;

    habitacion.find({ hotel: idHotel }).exec((err, habitacionEncontrada) => {
        if (err) return res.status(500).send({ mensaje: 'Error en la peticion de obtener la habitacion' });
        if (!habitacionEncontrada) return res.status(500).send({ mensaje: 'No hay habitaciones en este hotel' });
        return res.status(200).send({ habitacionEncontrada });
    })
}

function editarHabitacion(req, res) {
    var idHabitacion = req.params.id;
    var params = req.body;
    var idHotel;
    var idAdministrador;

    if (!params.nombre && !params.precio && !params.descripcion && !params.imagen) {
        return res.status(500).send({ mensaje: 'No hay ningun parametro correcto para editar' });
    }

    if (req.user.rol != "ADMIN_HOTEL") {
        return res.status(500).send({ mensaje: "Solo el ADMIN del hotel puede editar la habitacion" })
    }

    habitacion.findOne({ _id: idHabitacion }).exec((err, habitacionEncontrada) => {
        if (err) return res.status(500).send({ mensaje: "error en la peticion de la habitacion" });
        if (habitacionEncontrada) {
            idHotel = habitacionEncontrada.hotel;
        }
        if (!habitacionEncontrada) {
            return res.status(500).send({ mensaje: "La habitacion no existe" });
        } else {

            hotel.findOne({ _id: idHotel }).exec((err, hotelEncontrado) => {
                if (err) return res.status(500).send({ mensaje: "error en la peticion de la habitacion" });
                if (hotelEncontrado) {
                    idAdministrador = hotelEncontrado.administrador;
                }
                if (!hotelEncontrado) {
                    return res.status(500).send({ mensaje: "El hotel no existe" });
                } else {

                    if (idAdministrador != req.user.sub) {
                        return res.status(500).send({ mensaje: "No eres administrador de este hotel" })
                    } else {

                        habitacion.find({ nombre: params.nombre, hotel: idHotel }).exec((err, habitacionEncontrada) => {
                            if (err) return res.status(500).send({ mensaje: 'Error en la peticion' })
                            if (habitacionEncontrada.length >= 1) {
                                return res.status(500).send({ mensaje: 'Ya existe la habitacion en este hotel' })
                            } else {

                                habitacion.findByIdAndUpdate(idHabitacion, params, { new: true }, (err, habitacionActualizado) => {
                                    if (err) return res.status(500).send({ mensaje: "Error en la peticion" })
                                    if (!habitacionActualizado) return res.status(500).send({ mensaje: "No se ha podido editar  la usuario" });
                                    if (habitacionActualizado) {
                                        return res.status(200).send({ mensaje: "La habitacion fue actualizada" });
                                    }
                                })
                            }
                        })
                    }
                }
            })
        }
    })
}

function eliminarHabitacion(req, res) {
    var idHabitacion = req.params.id;
    var idHotel;
    var idAdministrador;

    if (req.user.rol != "ADMIN_HOTEL")
        return res.status(500).send({ mensaje: "Solo un administrador de hoteles puede eliminar una habitacion" })

    habitacion.findOne({ _id: idHabitacion }).exec((err, habitacionEncontrada) => {
        if (err) return res.status(500).send({ mensaje: "error en la peticion de la habitacion" });
        if (habitacionEncontrada) {
            idHotel = habitacionEncontrada.hotel;
        }
        if (!habitacionEncontrada) {
            return res.status(500).send({ mensaje: "La habitacion no existe" });
        } else {

            hotel.findOne({ _id: idHotel }).exec((err, hotelEncontrado) => {
                if (err) return res.status(500).send({ mensaje: "error en la peticion de la habitacion" });
                if (hotelEncontrado) {
                    idAdministrador = hotelEncontrado.administrador;
                }
                if (!hotelEncontrado) {
                    return res.status(500).send({ mensaje: "El hotel no existe" });
                } else {

                    if (idAdministrador != req.user.sub) {
                        return res.status(500).send({ mensaje: "No eres administrador de este hotel" })
                    } else {

                        habitacion.findByIdAndDelete(idHabitacion, (err, habitacionEliminada) => {
                            if (err) return res.status(500).send({ mensaje: "Error en la peticion" })
                            if (!habitacionEliminada) return res.status(500).send({ mensaje: "No se ha podido eliminar la habitacion" });
                            if (habitacionEliminada) {
                                return res.status(200).send({ mensaje: "La habitacion se ha elimado" });
                            }
                        })
                    }
                }
            })
        }
    })
}

function habitacionesDisponibles(req, res) {
    var params = req.body;
    var idHotel;
    var total;

    if (!params.hotel) {
        return res.status(500).send({ mensaje: 'Parametros incorrectos' });
    }

    hotel.findOne({ nombre: params.hotel }).exec((err, encontrados) => {
        if (err) return res.status(500).send({ mensaje: "Error en la peticion de buscar habitaciones" });
        if (!encontrados) return res.status(500).send({ mensaje: 'El hotel no existe' });
        if (encontrados) {
            idHotel = encontrados._id;
        }

        habitacion.find({ hotel: idHotel, disponible: true }, { _id: 0, __v: 0 }).exec((err, habitacionEncontrada) => {
            if (err) return res.status(500).send({ mensaje: 'Error en la peticion de obtener la habitacion' });
            if (!habitacionEncontrada) return res.status(500).send({ mensaje: 'No hay habitaciones disponibles en este hotel' });
            total = (habitacionEncontrada.length);
            return res.status(200).send({ total, habitacionEncontrada });
        })
    })
}

function habitacionesSolicitadas(req, res) {
    var idHotel = req.params.id;

    habitacion.find({ hotel: idHotel, reservaciones: { $gt: 0 } },
        { _id: 0, __v: 0 }).sort({ reservaciones: -1 }).limit(3).exec((err, habitacionEncontrada) => {
            if (err) return res.status(500).send({ mensaje: 'Error en buscar las habitaciones' });
            if (!habitacionEncontrada) return res.status(500).send({ mensaje: 'No hay reservaciones' });
            if (habitacionEncontrada && habitacionEncontrada.length === 0) return res.status(500).send({ mensaje: 'No hay reservaciones sufucientes' })
            return res.status(200).send({ habitacionEncontrada });
        })
}

module.exports = {
    registrarHabitacion,
    buscarHabitacion,
    editarHabitacion,
    eliminarHabitacion,
    habitacionesDisponibles,
    habitacionesSolicitadas
}