'use strict'

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var facturaSchema = Schema({
    cliente: {type: Schema.ObjectId, ref: 'usuario'},
    hotel: {type: Schema.ObjectId, ref: 'hotel'},
    habitacion: {type: Schema.ObjectId, ref: 'habitacion'},
    precioHabitacion: Number,
    fechaLlegada: Date,
    fechaSalida: Date,
    servicios: [{
        idServicio: {type: Schema.Types.ObjectId, ref: 'servicio'},
        nombreServicio: String,
        precio: Number
    }],
    total: Number
});

module.exports = mongoose.model('factura', facturaSchema);