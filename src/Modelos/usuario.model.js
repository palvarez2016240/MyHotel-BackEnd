'use strict'

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var usuarioSchema = Schema({
    nombre: String,
    correo: String,
    password: String,
    telefono: String,
    rol: String
});

module.exports = mongoose.model('usuario', usuarioSchema);