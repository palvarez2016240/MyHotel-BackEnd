'use strict'

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var habitacionSchema = Schema({
    nombre: String,
    precio: Number,
    fechaDisponible: Date,
    descripcion: String,
    imagen: String,
    disponible: Boolean,
    hotel: {type: Schema.ObjectId, ref: 'hotel'},
    reservaciones: Number
});

module.exports = mongoose.model('habitacion', habitacionSchema);