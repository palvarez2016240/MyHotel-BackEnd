'use strict'

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var hotelSchema = Schema({
    nombre: String,
    direccion: String,
    imagen: String,
    calificacion: String,
    descripcion: String,
    solicitudes: Number,
    administrador: {type: Schema.ObjectId, ref: 'usuario'}
});

module.exports = mongoose.model('hotel', hotelSchema);