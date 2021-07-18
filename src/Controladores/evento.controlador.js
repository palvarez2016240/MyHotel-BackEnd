'use strict'

var evento = require('../Modelos/eventos.model');
var hotel = require('../Modelos/hotel.model');
var ahora = new Date();

function registrarEvento(req, res) {
    var eventoModel = new evento();
    var params = req.body;
    var idHotel = req.params.idHotel;

    if (params.nombre && params.fecha && params.tipoEvento) {

        eventoModel.nombre = params.nombre;
        eventoModel.fecha = params.fecha;
        eventoModel.tipoEvento = params.tipoEvento;
        eventoModel.imagen = null;
        eventoModel.hotel = idHotel;

        evento.find({ nombre: params.nombre, hotel: idHotel, fecha: params.fecha }).exec((err, eventoEncontrado) => {
            if (err) return res.status(500).send({ mensaje: 'Error en la peticion' })
            if (eventoEncontrado.length >= 1) {
                return res.status(500).send({ mensaje: 'El evento ya existe en la misma fecha y en el mismo hotel' })
            } else {

                eventoModel.save((err, eventoGuardada) => {
                    if (err) return res.status(500).send({ mensaje: "Error en la peticion del evento" });
                    if (eventoGuardada) {
                        res.status(200).send({ mensaje: "Evento guardado" })
                    } else {
                        res.status(404).send({ mensaje: "No se a podido guardar el evento" })
                    }
                })
            }
        })
    } else {
        return res.status(500).send({ mensaje: 'Error datos incorrectos o incompletos' });
    }
}

function buscarEvento(req, res) {
    var idHotel = req.params.idHotel;

    evento.find({ hotel: idHotel }).exec((err, eventoEncontrado) => {
        if (err) return res.status(500).send({ mensaje: 'Error en la peticion de obtener la habitacion' });
        if (eventoEncontrado.length === 0) return res.status(500).send({ mensaje: "No hay eventos en este hotel" });
        if (!eventoEncontrado) return res.status(500).send({ mensaje: 'No hay eventos en este hotel' });
        return res.status(200).send({ eventoEncontrado });
    })
}

function editarEvento(req, res) {
    var idEvento = req.params.id;
    var params = req.body;
    var idHotel;
    var idAdministrador;

    if (!params.nombre && !params.tipoEvento && !params.fecha && !params.imagen) {
        return res.status(500).send({ mensaje: 'No hay ningun parametro correcto para editar' });
    }

    if (req.user.rol != "ADMIN_HOTEL") {
        return res.status(500).send({ mensaje: "Solo el ADMIN del hotel puede editar el evento" })
    }

    evento.findOne({ _id: idEvento }).exec((err, eventoEncontrado) => {
        if (err) return res.status(500).send({ mensaje: "Error en la peticion del evento" });
        if (eventoEncontrado) {
            idHotel = eventoEncontrado.hotel;
        }
        if (!eventoEncontrado) {
            return res.status(500).send({ mensaje: "El evento no existe" });
        } else {

            hotel.findOne({ _id: idHotel }).exec((err, hotelEncontrado) => {
                if (err) return res.status(500).send({ mensaje: "error en la peticion del evento" });
                if (hotelEncontrado) {
                    idAdministrador = hotelEncontrado.administrador;
                }
                if (!hotelEncontrado) {
                    return res.status(500).send({ mensaje: "El hotel no existe" });
                } else {

                    if (idAdministrador != req.user.sub) {
                        return res.status(500).send({ mensaje: "No eres administrador de este hotel" })
                    } else {

                        evento.find({ nombre: params.nombre, hotel: idHotel, fecha: params.fecha }).exec((err, eventoEncontrado) => {
                            if (err) return res.status(500).send({ mensaje: 'Error en la peticion' })
                            if (eventoEncontrado.length >= 1) {
                                return res.status(500).send({ mensaje: 'El evento ya existe en este hotel' })
                            } else {

                                evento.findByIdAndUpdate(idEvento, params, { new: true }, (err, eventoActualizado) => {
                                    if (err) return res.status(500).send({ mensaje: "Error en la peticion" })
                                    if (!eventoActualizado) return res.status(500).send({ mensaje: "No se ha podido editar el evento" });
                                    if (eventoActualizado) {
                                        return res.status(200).send({ mensaje: "El evento fue actualizado" });
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

function eliminarEvento(req, res) {
    var idEvento = req.params.id;
    var idHotel;
    var idAdministrador;

    if (req.user.rol != "ADMIN_HOTEL")
        return res.status(500).send({ mensaje: "Solo un administrador de hoteles puede eliminar una habitacion" })

    evento.findOne({ _id: idEvento }).exec((err, eventoEncontrado) => {
        if (err) return res.status(500).send({ mensaje: "error en la peticion del evento" });
        if (eventoEncontrado) {
            idHotel = eventoEncontrado.hotel;
        }
        if (!eventoEncontrado) {
            return res.status(500).send({ mensaje: "El evento no existe" });
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

                        evento.findByIdAndDelete(idEvento, (err, eventoEliminado) => {
                            if (err) return res.status(500).send({ mensaje: "Error en la peticion" })
                            if (!eventoEliminado) return res.status(500).send({ mensaje: "No se ha podido eliminar el evento" });
                            if (eventoEliminado) {
                                return res.status(200).send({ mensaje: "La habitacion se ha elimado" });
                            }
                        })
                    }
                }
            })
        }
    })
}

module.exports = {
    registrarEvento,
    buscarEvento,
    editarEvento,
    eliminarEvento
}