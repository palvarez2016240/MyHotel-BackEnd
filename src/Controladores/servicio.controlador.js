'use strict'

var hotel = require('../Modelos/hotel.model');
var servicio = require('../Modelos/servicios.model');

function registrarServicio(req, res) {
    var servicioModel = new servicio();
    var params = req.body;
    var idHotel = req.params.idHotel;

    if (params.nombre && params.precio && params.descripcion) {
        servicioModel.nombre = params.nombre;
        servicioModel.precio = params.precio;
        servicioModel.imagen = null;
        servicioModel.descripcion = params.descripcion;
        servicioModel.hotel = idHotel;

        servicio.find({ nombre: params.nombre, hotel: idHotel }).exec((err, servicioEncontrado) => {
            if (err) return res.status(500).send({ mensaje: 'Error en la peticion' })
            if (servicioEncontrado.length >= 1) {
                return res.status(500).send({ mensaje: 'Ya existe el servicio en este hotel' })
            } else {

                servicioModel.save((err, servicioGuardado) => {
                    if (err) return res.status(500).send({ mensaje: "Error en la peticion del servicio" });
                    if (servicioGuardado) {
                        res.status(200).send({ mensaje: "Servicio agregado" })
                    } else {
                        res.status(404).send({ mensaje: "No se a podido guardar el servicio" })
                    }
                })
            }
        })
    } else {
        return res.status(500).send({ mensaje: 'Error datos incorrectos o incompletos' });
    }
}

function buscarServicios(req, res) {
    var idHotel = req.params.idHotel;

    servicio.find({ hotel: idHotel }).exec((err, servicioEncontrado) => {
        if (err) return res.status(500).send({ mensaje: 'Error en la peticion de obtener el servicio' });
        if (servicioEncontrado.length === 0) return res.status(500).send({ mensaje: "No hay servicios en este hotel" });
        if (!servicioEncontrado) return res.status(500).send({ mensaje: 'No hay servicios en este hotel' });
        return res.status(200).send({ servicioEncontrado });
    })
}

function editarServicio(req, res) {
    var idServicio = req.params.id;
    var params = req.body;
    var idHotel;
    var idAdministrador;

    if (!params.nombre && !params.precio && !params.descripcion && !params.imagen) {
        return res.status(500).send({ mensaje: 'No hay ningun parametro correcto para editar' });
    }

    if (req.user.rol != "ADMIN_HOTEL") {
        return res.status(500).send({ mensaje: "Solo el ADMIN del hotel puede editar el servicio" })
    }

    servicio.findOne({ _id: idServicio }).exec((err, servicioEncontrado) => {
        if (err) return res.status(500).send({ mensaje: "Error en la peticion del servicio" });
        if (servicioEncontrado) {
            idHotel = servicioEncontrado.hotel;
        }
        if (!servicioEncontrado) {
            return res.status(500).send({ mensaje: "El servicio no existe" });
        } else {

            hotel.findOne({ _id: idHotel }).exec((err, hotelEncontrado) => {
                if (err) return res.status(500).send({ mensaje: "error en la peticion del servicio" });
                if (hotelEncontrado) {
                    idAdministrador = hotelEncontrado.administrador;
                }
                if (!hotelEncontrado) {
                    return res.status(500).send({ mensaje: "El hotel no existe" });
                } else {

                    if (idAdministrador != req.user.sub) {
                        return res.status(500).send({ mensaje: "No eres administrador de este hotel" })
                    } else {

                        servicio.find({ nombre: params.nombre, hotel: idHotel }).exec((err, servicioEncontrado) => {
                            if (err) return res.status(500).send({ mensaje: 'Error en la peticion' })
                            if (servicioEncontrado.length >= 1) {
                                return res.status(500).send({ mensaje: 'El servicio ya existe en el hotel' })
                            } else {

                                servicio.findByIdAndUpdate(idServicio, params, { new: true }, (err, servicioActualizado) => {
                                    if (err) return res.status(500).send({ mensaje: "Error en la peticion" })
                                    if (!servicioActualizado) return res.status(500).send({ mensaje: "No se ha podido editar el servicio" });
                                    if (servicioActualizado) {
                                        return res.status(200).send({ mensaje: "El servicio fue actualizado" });
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

function eliminarServicio(req, res) {
    var idServicio = req.params.id;
    var idHotel;
    var idAdministrador;

    if (req.user.rol != "ADMIN_HOTEL")
        return res.status(500).send({ mensaje: "Solo un administrador de hoteles puede eliminar una habitacion" })

    servicio.findOne({ _id: idServicio }).exec((err, servicioEncontrado) => {
        if (err) return res.status(500).send({ mensaje: "Error en la peticion del servicio" });
        if (servicioEncontrado) {
            idHotel = servicioEncontrado.hotel;
        }
        if (!servicioEncontrado) {
            return res.status(500).send({ mensaje: "El servicio no existe" });
        } else {

            hotel.findOne({ _id: idHotel }).exec((err, hotelEncontrado) => {
                if (err) return res.status(500).send({ mensaje: "error en la peticion del servicio" });
                if (hotelEncontrado) {
                    idAdministrador = hotelEncontrado.administrador;
                }
                if (!hotelEncontrado) {
                    return res.status(500).send({ mensaje: "El hotel no existe" });
                } else {

                    if (idAdministrador != req.user.sub) {
                        return res.status(500).send({ mensaje: "No eres administrador de este hotel" })
                    } else {

                        servicio.findByIdAndDelete(idServicio, (err, servicioEliminado) => {
                            if (err) return res.status(500).send({ mensaje: "Error en la peticion" })
                            if (!servicioEliminado) return res.status(500).send({ mensaje: "No se ha podido eliminar el servicio" });
                            if (servicioEliminado) {
                                return res.status(200).send({ mensaje: "El servicio se ha elimado" });
                            }
                        })
                    }
                }
            })
        }
    })
}

function servicioDefault(req, res) {
    var servicioModel = new servicio();
    servicio.findOne({nombre: 'Basico (Predeterminado)'}).exec((err, servicioEncontrado)=>{
        if(!servicioEncontrado){
            servicioModel.nombre = 'Basico (Predeterminado)';
            servicioModel.descripcion = 'SKY, WiFi, agua caliente y limpieza';
            servicioModel.precio = 1;
            servicioModel.imagen = null,
            servicioModel.hotel = null

            servicioModel.save((err, servicioGuardado)=>{
                if (err) return res.status(500).send({ mensaje: 'Error en la peticion de guardar el servicio' });
                if (servicioGuardado) {
                } else {
                    res.status(404).send({ mensaje: 'No se ha podido registrar el servicio' })
                }
            })
        }
    })
}

module.exports = {
    registrarServicio,
    buscarServicios,
    editarServicio,
    eliminarServicio,
    servicioDefault
}