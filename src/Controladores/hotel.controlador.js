'use strict'

const eventosModel = require('../Modelos/eventos.model');
var hotel = require('../Modelos/hotel.model');
var usuario = require('../Modelos/usuario.model');
var evento = require('../Modelos/eventos.model');
var servicio = require('../Modelos/servicios.model');
var habitacion = require('../Modelos/habitacion.model');
var reservacion = require('../Modelos/reservaciones.model');
var jwt = require("../Servicios/jwt");

function registrarHotel(req, res) {
    var hotelModel = new hotel();
    var params = req.body;
    var idAdmin;
    var rol;

    if (params.nombre && params.direccion && params.calificacion && params.descripcion && params.administrador) {
        usuario.findOne({ correo: params.administrador }).exec((err, hotelEncontrado) => {
            if (err) return res.status(500).send({ mensaje: 'Error en la peticion, talvez no existe el administrador' });
            if (!hotelEncontrado) return res.status(500).send({ mensaje: 'Error, talvez el administrador no existe' })
            if (hotelEncontrado && hotelEncontrado.length === 0) return res.status(500).send({ mensaje: 'El administrador  no existe' });
            idAdmin = hotelEncontrado.id;
            rol = hotelEncontrado.rol;

            if (rol != "ADMIN_HOTEL") {
                return res.status(500).send({ mensaje: "El usuario no es apto para ser administrado de un hotel" })
            }

            if (params.calificacion > 5 || params.calificacion < 0) {
                return res.status(500).send({ mensaje: "La puntuacion deber ser de 0 a 5" })
            }

            hotelModel.nombre = params.nombre;
            hotelModel.direccion = params.direccion;
            hotelModel.imagen = null;
            hotelModel.calificacion = params.calificacion;
            hotelModel.descripcion = params.descripcion;
            hotelModel.solicitudes = 0;
            hotelModel.administrador = idAdmin;

            hotel.find({ nombre: params.nombre }).exec((err, hotelEncontrado) => {
                if (err) return res.status(500).send({ mensaje: 'Error en la peticion' })
                if (hotelEncontrado.length >= 1) {
                    return res.status(500).send({ mensaje: 'El hotel ya existe' })
                } else {

                    hotel.find({ administrador: idAdmin }).exec((err, administradorEncontrado) => {
                        if (err) return res.status(500).send({ mensaje: 'Error en la peticion' })
                        if (administradorEncontrado.length >= 1) {
                            return res.status(500).send({ mensaje: "El administrador ya administra otro hotel" })
                        } else {

                            hotelModel.save((err, hotelGuardado) => {
                                if (err) return res.status(500).send({ mensaje: "Error en la peticion del Hotel" });
                                if (hotelGuardado) {
                                    res.status(200).send({ mensaje: "Hotel agregado" })
                                } else {
                                    res.status(500).send({ mensaje: "No se a podido guardar el hotel" })
                                }
                            })
                        }
                    })
                }
            })
        }
        )
    }
}

function buscarHoteles(req, res) {
    hotel.find().exec((err, hotelEncontrado) => {
        if (err) return res.status(500).send({ mensaje: 'Error en la peticion de obtener hoteles' });
        if (!hotelEncontrado) return res.status(500).send({ mensaje: 'Error en la consulta de hoteles o no hay hoteles' });
        return res.status(200).send({ hotelEncontrado });
    })
}

function editarHotel(req, res) {
    var idHotel = req.params.idCliente;
    var params = req.body;

    if (!params.nombre && !params.direccion && !params.calificacion && !params.descripcion) {
        return res.status(500).send({ mensaje: 'No hay ningun parametro correcto para editar' });
    }

    hotel.findOne({ _id: idHotel }).exec((err, encontrado) => {
        if (err) return res.status(500).send({ mensaje: "Error en la peticion" });
        if (!encontrado) return res.status(500).send({ mensaje: "El hotel no eciste" });
        var nombreH = encontrado.nombre;

        if (nombreH != params.nombre) {
            hotel.find({
                $or: [
                    { nombre: params.nombre },
                ]
            }).exec((err, encontrados) => {
                if (err) return res.status(500).send({ mensaje: "Error en la peticion" });
                if (encontrados && encontrados.length >= 1) {
                    return res.status(500).send({ mensaje: "El nombre del hotel ya existe" });
                }
            })
        } else {

            if (params.calificacion > 5 || params.calificacion < 0) {
                return res.status(500).send({ mensaje: "La puntuacion deber ser de 0 a 5" })
            }

            hotel.findByIdAndUpdate(idHotel, params, { new: true }, (err, hotelActualizado) => {
                if (err) return res.status(500).send({ mensaje: "Error en la peticion" })
                if (!hotelActualizado) return res.status(500).send({ mensaje: "No se ha podido editar el hotel" });
                if (hotelActualizado) {
                    return res.status(200).send({ hotelActualizado });
                }
            }
            )
        }
    })
}

function eliminarHotel(req, res) {
    var idHotel = req.params.id;
    var idAdmin;

    reservacion.find({
        $or: [
            { hotel: idHotel },
        ]
    }).exec((err, encontrados) => {
        if (err) return res.status(500).send({ mensaje: "Error en la peticion" });
        if (encontrados && encontrados.length >= 1) {
            return res.status(500).send({ mensaje: "No puedes eleminar el hotel, todavia hay reservaciones en curso" });
        }

        evento.deleteMany({ hotel: idHotel }, { multi: true }, (err, eventoEliminado) => {
            if (err) return res.status(500).send({ mensaje: 'Error eventos' });
            if (!eventoEliminado) return res.status(500).send({ mensaje: 'Error no hay datos eventos' });

            servicio.deleteMany({ hotel: idHotel }, { multi: true }, (err, servicioEliminado) => {
                if (err) return res.status(500).send({ mensaje: 'Error servicios' });
                if (!servicioEliminado) return res.status(500).send({ mensaje: 'Error no hay datos servicios' });

                habitacion.deleteMany({ hotel: idHotel }, { multi: true }, (err, habitacionElminada) => {
                    if (err) return res.status(500).send({ mensaje: 'Error servicios' });
                    if (!habitacionElminada) return res.status(500).send({ mensaje: 'Error no hay datos servicios' });

                    hotel.findOne({ _id: idHotel }).exec((err, hotelEncontrado) => {
                        if (err) return res.status(500).send({ mensaje: 'Error admin' });
                        if (!hotelEncontrado) return res.status(500).send({ mensaje: 'Error no hay datos admin' });
                        idAdmin = hotelEncontrado.administrador;

                        usuario.updateMany({ _id: idAdmin }, { $set: { rol: 'CLIENTE' } }, { multi: true }, (err, usuarioActualizado) => {
                            if (err) return res.status(500).send({ mensaje: 'Error actualizar Admin' });
                            if (!usuarioActualizado) return res.status(500).send({ mensaje: 'No hay datos actualizar admin' });

                            hotel.findByIdAndDelete(idHotel, (err, hotelEliminado) => {
                                if (err) return res.status(500).send({ mensaje: "Error en la peticion de eliminar el hotel" })
                                if (!hotelEliminado) return res.status(500).send({ mensaje: "No se ha podido eliminar el hotel" });
                                return res.status(200).send({ mensaje: "Hotel Eliminado" })
                            })
                        })
                    })
                })
            })
        })
    })
}

function buscarHotelNombre(req, res) {
    var params = req.body;

    if (!params.nombre) {
        return res.status(500).send({ mensaje: 'Parametros incorrectoa' });
    }

    hotel.findOne({ nombre: params.nombre }, { _id: 0, __v: 0, administrador: 0 }).exec((err, encontrados) => {
        if (err) return res.status(500).send({ mensaje: "Error en la peticion obtener el hotel, talvez no existe el hotel" });
        if (!encontrados) return res.status(500).send({ mensaje: 'Error, no existe el hotel' });
        return res.status(200).send(encontrados);
    })
}

function buscarHotelDireccion(req, res) {
    var params = req.body;

    if (!params.direccion) {
        return res.status(500).send({ mensaje: 'Parametros incorrectoa' });
    }

    hotel.findOne({ direccion: params.direccion }, { _id: 0, __v: 0, administrador: 0 }).exec((err, encontrados) => {
        if (err) return res.status(500).send({ mensaje: "Error en la peticion obtener hoteles cerca" });
        if (!encontrados) return res.status(500).send({ mensaje: 'No hay hoteles por esta direccion' });
        return res.status(200).send(encontrados);
    })
}

function hotelesSolicitados(req, res) {
    hotel.find({ solicitudes: { $gt: 0 } }).sort({ solicitudes: -1 }).limit(10).exec((err, hotelEncontrado) => {
        if (err) return res.status(500).send({ mensaje: 'Erro en buscar los hoteles' });
        if (!hotelEncontrado) return res.status(500).send({ mensaje: 'No hay reservaciones' });
        if (hotelEncontrado && hotelEncontrado.length === 0) return res.status(500).send({ mensaje: 'No hay reservaciones sufucientes' })
        return res.status(200).send({ hotelEncontrado });
    })
}

function buscarHotelId(req, res) {
    var idAdmin = req.params.idAdmin;

    hotel.findOne({ administrador: idAdmin }).exec((err, hotelEncontrado) => {
        if (err) return res.status(500).send({ mensaje: 'Error en la peticion de obtener hoteles' });
        if (!hotelEncontrado) return res.status(500).send({ mensaje: 'Error en la consulta de hoteles o no hay hoteles' });
        return res.status(200).send({ hotelEncontrado });
    })
}

module.exports = {
    registrarHotel,
    buscarHoteles,
    editarHotel,
    eliminarHotel,
    buscarHotelNombre,
    buscarHotelDireccion,
    hotelesSolicitados,
    buscarHotelId
}