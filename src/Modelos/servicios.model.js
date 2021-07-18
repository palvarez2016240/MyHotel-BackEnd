'use strict'

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var servicioSchema = Schema({
    nombre: String,
    descripcion: String,
    precio: Number,
    imagen: String,
    hotel: {type: Schema.ObjectId, ref: 'hotel'}
});

module.exports = mongoose.model('servicio', servicioSchema);