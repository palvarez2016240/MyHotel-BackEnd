'use strict'

var express = require("express");
var md_autorizacion = require("../Middlewares/authenticated");
var usuarioControlador = require("../Controladores/usuario.controlador");
var hotelControlador = require("../Controladores/hotel.controlador");
var habitacionControlador = require("../Controladores/habitacion.controlador");
var eventoControlador = require("../Controladores/evento.controlador");
var servicioControlador = require("../Controladores/servicio.controlador");
var reservacionControlador = require("../Controladores/reservacion.controlador");
var facturaControlador = require("../Controladores/factura.controlador");

//RUTAS
var api = express.Router();
api.post('/registrarUsuario', usuarioControlador.registrarUsuario);
api.post('/loginUsuario', usuarioControlador.loginUsuario);
api.put('/editarUsuario/:idCliente', md_autorizacion.ensureAuth, usuarioControlador.editarUsuario);
api.put('/eliminarUsuario/:idCliente', usuarioControlador.eliminarUsuario);
api.get('/perfil/:id', usuarioControlador.perfil);
api.get('/usuariosRegistrados', usuarioControlador.usuariosRegistrados);
api.put('/editarRol/:idCliente', usuarioControlador.editarRol);
api.post('/registrarHotel',hotelControlador.registrarHotel);
api.get('/buscarHotel', hotelControlador.buscarHoteles),
api.put('/editarHotel/:idCliente', hotelControlador.editarHotel);
api.put('/eliminarHotel/:id',hotelControlador.eliminarHotel);
api.get('/buscarHotelNombre', hotelControlador.buscarHotelNombre);
api.get('/buscarHotelDireccion', hotelControlador.buscarHotelDireccion);
api.post('/registrarHabitacion/:idHotel', habitacionControlador.registrarHabitacion);
api.get('/buscarHabitacion/:idHotel', habitacionControlador.buscarHabitacion);
api.put('/editarHabitacion/:idHotel', md_autorizacion.ensureAuth, habitacionControlador.editarHabitacion);
api.put('/eliminarHabitacion/:id', md_autorizacion.ensureAuth, habitacionControlador.eliminarHabitacion);
api.get('/habitacionDisponible', habitacionControlador.habitacionesDisponibles);
api.post('/registrarEvento/:idHotel',eventoControlador.registrarEvento);
api.get('/buscarEvento/:idHotel', eventoControlador.buscarEvento);
api.put('/editarEvento/:id', md_autorizacion.ensureAuth, eventoControlador.editarEvento);
api.put('/eliminarEvento/:id', eventoControlador.eliminarEvento);
api.post('/registrarServicio/:idHotel', servicioControlador.registrarServicio)
api.get('/buscarServicio/:idHotel', servicioControlador.buscarServicios);
api.put('/editarServicio/:id', md_autorizacion.ensureAuth, servicioControlador.editarServicio);
api.put('/eliminarServicio/:id', md_autorizacion.ensureAuth, servicioControlador.eliminarServicio);
api.post('/reservar/:idHabitacion', md_autorizacion.ensureAuth, reservacionControlador.reservar);
api.put('/cancelarReservacion/:id', reservacionControlador.cancelarReservacion);
api.put('/agregarServicio/:idReservacion', reservacionControlador.agregarServicios);
api.get('/usariosHospedados/:id', md_autorizacion.ensureAuth, reservacionControlador.usuarioHospedado);
api.get('/reservacionesHechas/:idHotel', reservacionControlador.reservacaionesHechas);
api.post('/facturar/:idReservacion', facturaControlador.facturar);
api.get('/hotelesSolicitados', hotelControlador.hotelesSolicitados);
api.get('/historial/:idCliente',usuarioControlador.historial);
api.get('/habitacionesSolicitadas/:id', habitacionControlador.habitacionesSolicitadas)
api.get('/usuariosRegistradosA', usuarioControlador.usuariosRegistradosA);
api.get('/buscarHotelId/:idAdmin', hotelControlador.buscarHotelId);
api.get('/facturaHecha/:idHotel', facturaControlador.facturaHecha);
api.get('/reservacaionesUsuario/:idCliente', reservacionControlador.reservacaionesUsuario);
api.get('/reservacionId/:idReservacion', reservacionControlador.reservacionId);

module.exports = api;