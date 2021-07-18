'use strict'

var usuario = require("../Modelos/usuario.model");
var hotel = require("../Modelos/hotel.model");
var habitacion = require("../Modelos/habitacion.model")
var servicio = require("../Modelos/servicios.model")
var reservacion = require("../Modelos/reservaciones.model");
const moment = require("moment");
var idReservacion;
var solicitudesHotel;
var idHabitacion;
var servicioId;
var servicioNombre;
var costo;
var totalSolicitudes = 0;
var totalReseravciones = 0;
var dispo;
var idHotel;

function reservar(req, res) {
    var idHabitacion = req.params.idHabitacion;
    var idCliente = req.user.sub;
    var idHotel;
    var reservacionModel = new reservacion();
    var params = req.body;

    if (params.fechaLlegada && params.fechaSalida) {
        params.servicio = 'Basico (Predeterminado)'
        habitacion.findOne({ _id: idHabitacion }).exec((err, habitacionEncontrada) => {
            if (err) return res.status(500).send({ mensaje: 'Error en la peticion2' });
            if (!habitacionEncontrada) return res.status(500).send({ mensaje: 'La habitacion no existe' });
            dispo = habitacionEncontrada.disponible;
            idHotel = habitacionEncontrada.hotel;
            parseInt(totalReseravciones = habitacionEncontrada.reservaciones)

            servicio.findOne({ nombre: params.servicio }).exec((err, servicioEncontrado) => {
                if (err) return res.status(500).send({ mensaje: "Error en la peticion3" });
                if (!servicioEncontrado) return res.status(500).send({ mensaje: "El servicio no existe" });
                servicioId = servicioEncontrado._id;
                servicioNombre = servicioEncontrado.nombre;
                costo = servicioEncontrado.precio;

                hotel.findOne({ _id: idHotel }).exec((err, hotelEncontrado) => {
                    if (err) return res.status(500).send({ mensaje: 'Error en la peticion4' });
                    if (!hotelEncontrado) return res.status(500).send({ mensaje: 'El hotel no existe' });
                    parseInt(solicitudesHotel = hotelEncontrado.solicitudes)

                    if (dispo === false) {
                        return res.status(500).send({ mensaje: "El hotel no esta disponible" })
                    }

                    reservacionModel.cliente = idCliente,
                        reservacionModel.hotel = idHotel,
                        reservacionModel.habitacion = idHabitacion,
                        reservacionModel.fechaLlegada = params.fechaLlegada,
                        reservacionModel.fechaSalida = params.fechaSalida,
                        reservacionModel.servicios = {
                            idServicio: servicioId,
                            nombreServicio: servicioNombre,
                            precio: costo
                        },
                        reservacionModel.facturada = false

                    if (reservacionModel.fechaLlegada <= moment()) {
                        return res.status(500).send({ mensaje: "La fecha de llegada es incorrecta" })
                    }

                    if (reservacionModel.fechaLlegada >= reservacionModel.fechaSalida) {
                        return res.status(500).send({ mensaje: "La fecha de salida es incorrecta" })
                    }

                    reservacionModel.save((err, reservacionGuardada) => {
                        if (err) return res.status(500).send({ mensaje: 'Error en la peticion5' });
                        if (!reservacionGuardada) return res.status(500).send({ mensaje: 'Error al guardar la reservacion' });
                        idReservacion = reservacionGuardada._id;

                        totalReseravciones = totalReseravciones + 1;
                        habitacion.update({ _id: idHabitacion }, {
                            $set: {
                                disponible: false,
                                fechaDisponible: params.fechaSalida,
                                reservaciones: totalReseravciones
                            }
                        }, { new: true }, (err, habitacionActualizada) => {
                            if (err) return res.status(500).send({ mensaje: 'Error al actualizar la habitacion' });
                            if (!habitacionActualizada) return res.status(500).send({ mensaje: 'La habitacion no existe' });

                            totalSolicitudes = parseInt(solicitudesHotel) + 1;
                            hotel.update({ _id: idHotel }, {
                                $set: {
                                    solicitudes: totalSolicitudes
                                }
                            }, { new: true }, (err, hotelActualizado) => {
                                if (err) return res.status(500).send({ mensaje: 'Error al actualizar el hotel' });
                                if (!hotelActualizado) return res.status(500).send({ mensaje: 'El hotel no existe' });
                                if (reservacionGuardada) return res.status(200).send({ mensaje: 'Reservacion hecha', reservacionGuardada })
                            })
                        })
                    })
                })
            })
        })
    } else {
        return res.status(500).send({ mensaje: 'Parametro incorrectos o incompletos' });
    }
}

function cancelarReservacion(req, res) {
    var idReservacion = req.params.id;
    var idCliente;
    var fechaLlegada;


    reservacion.findOne({ _id: idReservacion }).exec((err, reservacionEncontrado) => {
        if (err) return res.status(500).send({ mensaje: "Error en la peticion de la reservacion" });
        if (reservacionEncontrado) {
            fechaLlegada = reservacionEncontrado.fechaLlegada;
            idCliente = reservacionEncontrado.cliente;
            idHotel = reservacionEncontrado.hotel;
            idHabitacion = reservacionEncontrado.habitacion
        }
        if (!reservacionEncontrado) {
            return res.status(500).send({ mensaje: "La reservacion no existe" });
        } else {

            habitacion.findOne({ _id: idHabitacion }).exec((err, habitacionEncontrada) => {
                if (err) return res.status(500).send({ mensaje: "Error en la peticion de la habitacion" });
                if (habitacionEncontrada) {
                    totalReseravciones = habitacionEncontrada.reservaciones
                }
                if (!habitacionEncontrada) {
                    return res.status(500).send({ mensaje: "El hotel no existe" });
                } else {

                    hotel.findOne({ _id: idHotel }).exec((err, hotelEncontrado) => {
                        if (err) return res.status(500).send({ mensaje: "Error en la peticion del hotel" });
                        if (hotelEncontrado) {
                            solicitudesHotel = hotelEncontrado.solicitudes
                        }
                        if (!hotelEncontrado) {
                            return res.status(500).send({ mensaje: "El hotel no existe" });
                        } else {

                            if (fechaLlegada <= moment()) {
                                return res.status(500).send({ mensaje: "Es muy tarde para cancelar tu reservacion" })
                            } else {

                                reservacion.findByIdAndDelete(idReservacion, (err, reservacionEliminada) => {
                                    if (err) return res.status(500).send({ mensaje: "Error en la peticion de cancelar reservacion" })
                                    if (!reservacionEliminada) return res.status(500).send({ mensaje: "No se ha podido cancelar la reservacion" });

                                    totalReseravciones = totalReseravciones - 1;
                                    habitacion.update({ _id: idHabitacion }, {
                                        $set: {
                                            disponible: true,
                                            fechaDisponible: moment(),
                                            reservaciones: totalReseravciones
                                        }
                                    }, { new: true }, (err, habitacionActualizada) => {
                                        if (err) return res.status(500).send({ mensaje: 'Error al actualizar la habitacion' });
                                        if (!habitacionActualizada) return res.status(500).send({ mensaje: 'La habitacion no existe' });

                                        totalSolicitudes = parseInt(solicitudesHotel) - 1;
                                        hotel.update({ _id: idHotel }, {
                                            $set: {
                                                solicitudes: totalSolicitudes
                                            }
                                        }, { new: true }, (err, hotelActualizado) => {
                                            if (err) return res.status(500).send({ mensaje: 'Error al actualizar el hotel' });
                                            if (!hotelActualizado) return res.status(500).send({ mensaje: 'El hotel no existe' });
                                            if (hotelActualizado) return res.status(200).send({ mensaje: 'Reservacion cancelada', reservacionEliminada })
                                        })
                                    })
                                })
                            }

                        }
                    })
                }
            })
        }
    })
}

function agregarServicios(req, res) {
    var idReservacion = req.params.idReservacion;
    var idCliente;
    var params = req.body;
    var costo = 0;
    var fechaSalida;

    if (params.nombre) {
        reservacion.findOne({ _id: idReservacion }).exec((err, reservacionEncontrado) => {
            if (err) return res.status(500).send({ mensaje: "Error en la peticion de la reservacion" });
            if (reservacionEncontrado) {
                fechaSalida = reservacionEncontrado.fechaSalida;
                idCliente = reservacionEncontrado.cliente;
            }
            if (!reservacionEncontrado) {
                return res.status(500).send({ mensaje: "La reservacion no existe" }), console.log(idReservacion)
            } else {

                servicio.findOne({ nombre: params.nombre }).exec((err, servicioEncontrado) => {
                    if (err) return res.status(500).send({ mensaje: "Error en la peticion del hotel" });
                    if (servicioEncontrado) {
                        servicioId = servicioEncontrado._id;
                        servicioNombre = servicioEncontrado.nombre;
                        costo = servicioEncontrado.precio;
                    }
                    if (!servicioEncontrado) {
                        return res.status(500).send({ mensaje: "El servicio no existe" });
                    } else {

                        if (fechaSalida < moment()) {
                            return res.status(500).send({ mensaje: "No puedes agregar otro servicio, porque se acabo tu reservacion" })
                        } else {

                            reservacion.findByIdAndUpdate(idReservacion, {
                                $push: {
                                    servicios: {
                                        idServicio: servicioId,
                                        nombreServicio: servicioNombre,
                                        precio: costo
                                    }
                                }
                            }, { new: true }, (err, ServicioAgregado) => {
                                if (err) return res.status(500).send({ mensaje: 'Error en al peticion' });
                                if (!ServicioAgregado) return res.status(500).send({ mensaje: 'Error al agregar el servicio' });
                                return res.status(200).send({ mensaje: 'Servicio agregado ', ServicioAgregado });
                            })
                        }

                    }
                })
            }
        })
    } else {
        console.log(idReservacion)
        return res.status(500).send({ mensaje: 'Parametro incorrectos o incompletos' });
    }
}

function usuarioHospedado(req, res) {
    var idHotel = req.params.id;
    var fechaLlegada;
    var fechaSalida;
    var idUsuario;
    var params = req.body;
    var rol;

    if (req.user.rol != "ADMIN_HOTEL") {
        return res.status(500).send({ mensaje: "Solo el ADMIN del hotel puede ver esto" })
    }

    usuario.findOne({ correo: params.correo }).exec((err, encontrados) => {
        if (err) return res.status(500).send({ mensaje: "Error en la peticion obtener los usarios" });
        if (encontrados) {
            idUsuario = encontrados._id;
        }
        if (!encontrados) {
            return res.status(500).send({ mensaje: 'El usuario no existe' });
        } else {

            reservacion.findOne({ cliente: idUsuario, hotel: idHotel }).exec((err, reservacionEncontrado) => {
                if (err) return res.status(500).send({ mensaje: "Error en la peticion de la reservacion" });
                if (reservacionEncontrado) {
                    fechaSalida = reservacionEncontrado.fechaSalida;
                    fechaLlegada = reservacionEncontrado.fechaLlegada;
                    if (fechaLlegada <= moment() && fechaSalida >= moment()) {
                        return res.status(200).send({ mensaje: "Esta es su reservacion", reservacionEncontrado })
                    } else {
                        return res.status(500).send({ mensaje: "Ya no se encuentra hospedado en este hotel", fechaSalida, fechaLlegada })
                    }
                }
                if (!reservacionEncontrado) {
                    return res.status(500).send({ mensaje: "El usuario no esta hospedado en este hotel" }), console.log(idReservacion)
                }
            })
        }
    })
}

function reservacaionesHechas(req, res) {
    var idHotel = req.params.idHotel;

    reservacion.find({ hotel: idHotel }).exec((err, reservacionEncontrada) => {
        if (err) return res.status(500).send({ mensaje: 'Error en la peticion de obtener la reservacion' });
        if (reservacionEncontrada.length === 0) return res.status(500).send({ mensaje: "No hay reservaciones en este hotel" });
        if (!reservacionEncontrada) return res.status(500).send({ mensaje: 'No hay reservaciones en este hotel' });
        return res.status(200).send({ reservacionEncontrada });
    })
}

function reservacaionesUsuario(req, res) {
    var idCliente = req.params.idCliente;

    reservacion.find({ cliente: idCliente }).exec((err, reservacionEncontrada) => {
        if (err) return res.status(500).send({ mensaje: 'Error en la peticion de obtener la reservacion' });
        if (reservacionEncontrada.length === 0) return res.status(500).send({ mensaje: "No hay reservaciones en este hotel" });
        if (!reservacionEncontrada) return res.status(500).send({ mensaje: 'No hay reservaciones en este hotel' });
        return res.status(200).send({ reservacionEncontrada });
    })
}

function reservacionId(req, res) {
    var idReservacion = req.params.idReservacion

    reservacion.findOne({ _id: idReservacion }).exec((err, reservacionEncontrada) => {
        if (err) return res.status(500).send({ mensaje: 'Error en la peticion de obtener la reservacion' });
        if (!reservacionEncontrada) {
            return res.status(500).send({ mensaje: 'No hay existe la reservacion' }), console.log(idReservacion)
        }
        return res.status(200).send({ reservacionEncontrada });
    })
}

module.exports = {
    reservar,
    cancelarReservacion,
    agregarServicios,
    usuarioHospedado,
    reservacaionesHechas,
    reservacaionesUsuario,
    reservacionId
}