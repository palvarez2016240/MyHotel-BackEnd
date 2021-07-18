'use strict'

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var reservacionSchema = Schema({
    cliente: {type: Schema.ObjectId, ref: 'usuario'},
    hotel: {type: Schema.ObjectId, ref: 'hotel'},
    habitacion: {type: Schema.ObjectId, ref: 'habitacion'},
    fechaLlegada: Date,
    fechaSalida: Date,
    servicios: [{
        idServicio: {type: Schema.Types.ObjectId, ref: 'servicio'},
        nombreServicio: String,
        precio: Number
    }],
    facturada: Boolean
});

module.exports = mongoose.model('reservacion', reservacionSchema);