'use strict'

var usuario = require("../Modelos/usuario.model");
var historial = require("../Modelos/historial.model");
var hotel = require("../Modelos/hotel.model");
var habitacion = require("../Modelos/habitacion.model")
var servicio = require("../Modelos/servicios.model")
var reservacion = require("../Modelos/reservaciones.model");
var factura = require("../Modelos/factura.model");
const { STATES } = require("mongoose");

function facturar(req, res) {
    var idReservacion = req.params.idReservacion;
    var facturaModel = new factura();
    var historialModel = new historial();
    var idCliente;
    var idHotel;
    var idHabitacion;
    var costo;
    var Llegada;
    var Salida;
    var suma = 0;
    var servicios;
    var idAdministrador;
    var totalP;
    var ahora = new Date();

    reservacion.findOne({ _id: idReservacion }).exec((err, reservacionEncontrada) => {
        if (err) return res.status(500).send({ mensaje: 'Error en la peticion de obtener la reservacion' });
        if (!reservacionEncontrada) return res.status(500).send({ mensaje: "Error, la reservacion no existe" });
        if (reservacionEncontrada) {

            idCliente = reservacionEncontrada.cliente;
            idHotel = reservacionEncontrada.hotel;
            idHabitacion = reservacionEncontrada.habitacion;
            Llegada = reservacionEncontrada.fechaLlegada;
            Salida = reservacionEncontrada.fechaSalida;
            var fact = reservacionEncontrada.facturada;
            servicios = reservacionEncontrada.servicios;

        }
        if (!reservacionEncontrada) {
            return res.status(500).send({ mensaje: 'La reservacion no existe' });
        } else {

            servicios.forEach(function (elemento) {
                suma += parseInt(elemento.precio);
            })

            habitacion.findById(idHabitacion).exec((err, habitacionEncontrada) => {
                if (err) return res.status(500).send({ mensaje: 'Error en la peticion de obtener la habitacion' });
                if (habitacionEncontrada) {
                    costo = habitacionEncontrada.precio;
                }
                if (!habitacionEncontrada) {
                    return res.status(500).send({ mensaje: 'La habitacion no existe' });
                } else {

                    hotel.findById(idHotel).exec((err, hotelEncontrado) => {
                        if (err) return res.status(500).send({ mensaje: 'Error en la peticion de obtener el hotel' });
                        if (hotelEncontrado) {
                            idAdministrador = hotelEncontrado.administrador;
                            var nombreHotel = hotelEncontrado.nombre
                        }
                        if (!hotelEncontrado) {
                            return res.status(500).send({ mensaje: 'El hotel no existe' });
                        } else {

                            if (Salida > ahora) {
                                return res.status(500).send({ mensaje: 'No puedes facturar, ya que la reservacion no se acabado' });
                            }

                            if (fact != false) {
                                return res.status(500).send({ mensaje: 'La reservacion ya se facturo' });
                            }

                            var fechaL = new Date(Llegada);
                            var fechaS = new Date(Salida);
                            var resta = fechaS.getTime() - fechaL.getTime();
                            var dias = Math.round(resta / (1000 * 60 * 60 * 24));
                            totalP = (dias * costo) + suma;

                            facturaModel.cliente = idCliente;
                            facturaModel.hotel = idHotel;
                            facturaModel.habitacion = idHabitacion;
                            facturaModel.precioHabitacion = costo;
                            facturaModel.fechaLlegada = Llegada;
                            facturaModel.fechaSalida = Salida;
                            facturaModel.servicios = servicios;
                            facturaModel.total = totalP;

                            facturaModel.save((err, facturaGuardada) => {
                                if (err) return res.status(500).send({ mensaje: "Error en la peticion de la factura" });
                                if (!facturaGuardada) return res.status(500).send({ mensaje: "No se guardo la factura" });
                                if (facturaGuardada) {

                                    habitacion.update({ _id: idHabitacion }, {
                                        $set: {
                                            disponible: true,
                                            fechaDisponible: ahora
                                        }
                                    }, { new: true }, (err, habitacionActualizada) => {
                                        if (err) return res.status(500).send({ mensaje: 'Error al actualizar la habitacion' });
                                        if (!habitacionActualizada) return res.status(500).send({ mensaje: 'La habitacion no existe' });

                                        historialModel.cliente = idCliente;
                                        historialModel.hotel = nombreHotel;
                                        historialModel.servicios = servicios;
                                        historialModel.fechaLlegada = Llegada;
                                        historialModel.fechaSalida = Salida;

                                        historialModel.save((err, historialRegistrado) => {
                                            if (err) return res.status(500).send({ mensaje: "Error en la peticion del historial" });
                                            if (!historialRegistrado) {
                                                return res.status(500).send({ mensaje: "No se guardo el historial" });
                                            } else {

                                                reservacion.findByIdAndDelete(idReservacion, (err, reservacionEliminada) => {
                                                    if (err) return res.status(500).send({ mensaje: "Error en la peticion de cancelar reservacion" })
                                                    if (!reservacionEliminada) return res.status(500).send({ mensaje: "No se ha podido cancelar la reservacion" });

                                                    reservacion.update({ _id: idReservacion }, {
                                                        $set: {
                                                            facturada: true
                                                        }
                                                    }, { new: true }, (err, reservacionActualizada) => {
                                                        if (err) return res.status(500).send({ mensaje: 'Error al actualizar la habitacion' });
                                                        if (!reservacionActualizada) return res.status(500).send({ mensaje: 'La habitacion no existe' });
                                                        return res.status(200).send({ mensaje: "Factura creada:", facturaGuardada });
                                                    })
                                                }
                                                )
                                            }
                                        })
                                    })
                                }
                            })
                        }
                    })
                }
            })
        }
    })
}

function facturaHecha(req, res) {
    var idHotel = req.params.idHotel;

    factura.find({hotel: idHotel}).exec((err, facturaEncontrada)=>{
        if(err) return res.status(500).send({mensaje: 'Error'})
        if(!facturaEncontrada) return res.status(500).send({mensaje: 'No hay facturas'})
        return res.status(200).send({facturaEncontrada})
    })
}

module.exports = {
    facturar,
    facturaHecha
}