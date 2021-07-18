'use strict'

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var historialSchema = Schema({
    cliente: {type: Schema.ObjectId, ref: 'usuario'},
    hotel: String,
    servicios: [{
        idServicio: {type: Schema.Types.ObjectId, ref: 'servicio'},
        nombreServicio: String,
        precio: Number
    }],
    fechaLlegada: Date,
    fechaSalida: Date
});

module.exports = mongoose.model('historial', historialSchema);