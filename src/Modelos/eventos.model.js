'use strict'

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var eventoSchema = Schema({
    nombre: String,
    tipoEvento: String,
    fecha: Date,
    imagen: String,
    hotel: {type: Schema.ObjectId, ref: 'hotel'}
});

module.exports = mongoose.model('evento', eventoSchema);