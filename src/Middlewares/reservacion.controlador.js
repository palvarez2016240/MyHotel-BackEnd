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
var dispo;
var idHotel;

function reservar(req, res) {
    var idCliente = req.user.sub;
    var reservacionModel = new reservacion();
    var params = req.body;

    if (req.user.rol != 'CLIENTE') {
        return res.status(500).send({ mensaje: 'Solo el cliente puede hacer una reservacion' });
    }

    if (params.hotel && params.habitacion && params.fechaLlegada && params.fechaSalida && params.servicio) {
        habitacion.findOne({ nombre: params.habitacion }).exec((err, habitacionEncontrada) => {
            if (err) return res.status(500).send({ mensaje: 'Error en la peticion2' });
            if (!habitacionEncontrada) return res.status(500).send({ mensaje: 'La habitacion no existe' });
            dispo = habitacionEncontrada.disponible;
            idHabitacion = habitacionEncontrada._id;

            servicio.findOne({ nombre: params.servicio }).exec((err, servicioEncontrado) => {
                if (err) return res.status(500).send({ mensaje: "Error en la peticion3" });
                if (!servicioEncontrado) return res.status(500).send({ mensaje: "El servicio no existe" });
                servicioId = servicioEncontrado._id;
                servicioNombre = servicioEncontrado.nombre;
                costo = servicioEncontrado.precio;

                hotel.findOne({ nombre: params.hotel }).exec((err, hotelEncontrado) => {
                    if (err) return res.status(500).send({ mensaje: 'Error en la peticion4' });
                    if (!hotelEncontrado) return res.status(500).send({ mensaje: 'El hotel no existe' });
                    idHotel = hotelEncontrado._id;
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
                        }

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

                        habitacion.update({ _id: idHabitacion }, {
                            $set: {
                                disponible: false,
                                fechaDisponible: params.fechaSalida
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

    if (req.user.rol != "CLIENTE")
        return res.status(500).send({ mensaje: "Solo el cliente puede cancelar su reservacion" })

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

            hotel.findOne({ _id: idHotel }).exec((err, hotelEncontrado) => {
                if (err) return res.status(500).send({ mensaje: "Error en la peticion del hotel" });
                if (hotelEncontrado) {
                    solicitudesHotel = hotelEncontrado.solicitudes
                }
                if (!hotelEncontrado) {
                    return res.status(500).send({ mensaje: "El hotel no existe" });
                } else {

                    if (idCliente != req.user.sub) {
                        return res.status(500).send({ mensaje: "No eres dueño de esta reservacion" })
                    } else {

                        if (fechaLlegada <= moment()) {
                            return res.status(500).send({ mensaje: "Es muy tarde para cancelar tu reservacion" })
                        } else {

                            reservacion.findByIdAndDelete(idReservacion, (err, reservacionEliminada) => {
                                if (err) return res.status(500).send({ mensaje: "Error en la peticion de cancelar reservacion" })
                                if (!reservacionEliminada) return res.status(500).send({ mensaje: "No se ha podido cancelar la reservacion" });

                                habitacion.update({ _id: idHabitacion }, {
                                    $set: {
                                        disponible: true,
                                        fechaDisponible: moment()
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
                }
            })
        }
    })
}

function agregarServicios(req, res) {
    var idReservacion = req.params.id;
    var idCliente;
    var params = req.body;
    var costo = 0;
    var fechaSalida;

    if (req.user.rol != "CLIENTE")
        return res.status(500).send({ mensaje: "Solo el cliente puede agregar servicios" })

    if (params.servicio) {

        reservacion.findOne({ _id: idReservacion }).exec((err, reservacionEncontrado) => {
            if (err) return res.status(500).send({ mensaje: "Error en la peticion de la reservacion" });
            if (reservacionEncontrado) {
                fechaSalida = reservacionEncontrado.fechaSalida;
                idCliente = reservacionEncontrado.cliente;
            }
            if (!reservacionEncontrado) {
                return res.status(500).send({ mensaje: "La reservacion no existe" }), console.log(idReservacion)
            } else {

                servicio.findOne({ nombre: params.servicio }).exec((err, servicioEncontrado) => {
                    if (err) return res.status(500).send({ mensaje: "Error en la peticion del hotel" });
                    if (servicioEncontrado) {
                        servicioId = servicioEncontrado._id;
                        servicioNombre = servicioEncontrado.nombre;
                        costo = servicioEncontrado.precio;
                    }
                    if (!servicioEncontrado) {
                        return res.status(500).send({ mensaje: "El servicio no existe" });
                    } else {

                        if (idCliente != req.user.sub) {
                            return res.status(500).send({ mensaje: "No eres dueño de esta reservacion" })
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
                    }
                })
            }
        })
    } else {
        return res.status(500).send({ mensaje: 'Parametro incorrectos o incompletos' });
    }
}

function finilizarReservacion(req, res) {

}

function usuarioHospedado(req, res) {
    var idHotel = req.params.id;
    var fechaSArreglo;
    var fechaLArreglo;
    var idUsuario;
    var params = req.body;


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

            reservacion.find({ cliente: idUsuario, hotel: idHotel }).exec((err, reservacionEncontrado) => {
                if (err) return res.status(500).send({ mensaje: "Error en la peticion de la reservacion" });
                if (reservacionEncontrado) {
                    var reser = reservacionEncontrado;

                    reser.forEach(function (elemento) {
                        fechaSArreglo = elemento.fechaSalida;
                        fechaLArreglo = elemento.fechaLlegada;
                    })
                }
                if (!reservacionEncontrado) {
                    return res.status(500).send({ mensaje: "El usuario no esta hospedado en este hotel" }), console.log(idReservacion)
                }

                reservacion.find({fechaSalida: fechaSArreglo <= moment(), fechaLlegada: fechaLArreglo >= moment()}).exec((err, reserva)=>{
                    if(err) return res.status(500).send({ mensaje: "Error en la peticion de la reservacion" });
                    if (!reserva) return res.status(500).send({ mensaje: "No esta hospedado ahorita" });
                    return res.status(200).send({ mensaje: "Esta son sus reservaciones", reserva})
                })
            })
        }
    })
}

function reservacaionesHechas(req, res) {
    var idHotel = req.params.id;
    var idAdministrador;

    if (req.user.rol != "ADMIN_HOTEL") {
        return res.status(500).send({ mensaje: "Solo el ADMIN del hotel puede ver esto" })
    }

    hotel.findOne({ _id: idHotel }).exec((err, usuarioEncontrado) => {
        if (err) return res.status(500).send({ mensaje: 'Error en la peticion' });
        if (!usuarioEncontrado) return res.status(500).send({ mensaje: "El administrador no existe" });
        idAdministrador = usuarioEncontrado.administrador;

        if (idAdministrador != req.user.sub) {
            return res.status(500).send({ mensaje: "No eres el administrador de este hotel" })
        } else {
            reservacion.find({ hotel: idHotel }, { _id: 0, __v: 0 }).exec((err, reservacionEncontrada) => {
                if (err) return res.status(500).send({ mensaje: 'Error en la peticion de obtener la reservacion' });
                if (reservacionEncontrada.length === 0) return res.status(500).send({ mensaje: "No hay reservaciones en este hotel" });
                if (!reservacionEncontrada) return res.status(500).send({ mensaje: 'No hay reservaciones en este hotel' });
                return res.status(200).send({ reservacionEncontrada });
            })
        }
    })
}

module.exports = {
    reservar,
    cancelarReservacion,
    agregarServicios,
    usuarioHospedado,
    reservacaionesHechas
}