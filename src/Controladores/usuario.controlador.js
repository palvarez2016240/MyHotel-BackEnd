'use strict'

var usuario = require('../Modelos/usuario.model');
var bcrypt = require('bcrypt-nodejs');
var jwt = require("../Servicios/jwt");
var historials = require("../Modelos/historial.model")

function registrarUsuario(req, res) {
    var usuarioModel = new usuario();
    var params = req.body;

    if (params.nombre && params.password && params.correo && params.telefono) {
        usuarioModel.nombre = params.nombre;
        usuarioModel.password = params.password,
            usuarioModel.correo = params.correo,
            usuarioModel.telefono = params.telefono,
            usuarioModel.rol = 'CLIENTE',

            usuario.find({
                $or: [
                    { correo: usuarioModel.correo },
                ]
            }).exec((err, usuarioEncontrado) => {
                if (err) return res.status(500).send({ mensaje: "Error en la peticion del usuario" });
                if (usuarioEncontrado && usuarioEncontrado.length >= 1) {
                    return res.status(500).send({ mensaje: "El correo ya es utilizado por otro usuario" });
                } else {
                    bcrypt.hash(params.password, null, null, (err, passwordEncriptada) => {
                        usuarioModel.password = passwordEncriptada;

                        usuarioModel.save((err, usuarioGuardado) => {
                            if (err) return res.status(500).send({ mensaje: "Error, posiblente el numero de telefono es incorrecto" });
                            if (usuarioGuardado) {
                                res.status(200).send({ mensaje: "Cuenta creada, bienvenido" })
                            } else {
                                res.status(404).send({ mensaje: "No se a podido guardar el usuario" })
                            }
                        })
                    })
                }
            })
    } else {
        return res.status(500).send({ mensaje: 'Error datos incorrectos o incompletos' });
    }
}

function loginUsuario(req, res) {
    var params = req.body;

    if (params.correo && params.password) {
        usuario.findOne({ correo: params.correo }, (err, usuarioEncontrado) => {
            if (err) return res.status(500).send({ mensaje: 'Error en la peticion' });
            if (!usuarioEncontrado) return res.status(500).send({ mensaje: 'El usuario no existe' })
            if (usuarioEncontrado) {
                bcrypt.compare(params.password, usuarioEncontrado.password, (err, passVerificada) => {
                    if (passVerificada) {
                        if (params.getToken === 'true') {
                            return res.status(200).send({
                                token: jwt.createToken(usuarioEncontrado)
                            })
                        } else {
                            usuarioEncontrado.password = undefined;
                            return res.status(200).send(usuarioEncontrado);
                        }
                    } else {
                        return res.status(500).send({ mensaje: 'El cliente no se ha podido identificar, posiblemte contraseña incorrecta' });
                    }
                })
            } else {
                return res.status(500).send({ mensaje: 'Error al buscar el cliente no existe' });
            }
        })
    } else {
        return res.status(500).send({ mensaje: 'Parametro incompletos o incorrectos' });
    }
}

function admin(res) {
    var usuarioModel = new usuario();

    usuario.findOne({ nombre: 'ADMIN' }).exec((err, adminEncontrado) => {
        if (!adminEncontrado) {
            usuarioModel.nombre = 'ADMIN';
            usuarioModel.password = '123456';
            usuarioModel.rol = 'ADMIN';
            usuarioModel.correo = 'ADMIN@royal.gt',
                usuarioModel.telefono = 50914824

            bcrypt.hash('123456', null, null, (err, passwordEncriptada) => {
                usuarioModel.password = passwordEncriptada;

                usuarioModel.save((err, usuarioGuardado) => {
                    if (err) return res.status(500).send({ mensaje: 'Error en la peticion de guardar admin' });
                    if (usuarioGuardado) {
                    } else {
                        res.status(404).send({ mensaje: 'No se ha podido registrar el admin' })
                    }
                })
            })
        }
    })

}

function editarUsuario(req, res) {
    var idCliente = req.params.idCliente;
    var params = req.body;
    var usuarioModel = usuario();


    if (!params.nombre && !params.correo && !params.telefono) {
        return res.status(500).send({ mensaje: 'No hay ningun parametro correcto para editar' });
    }

    if (req.user.sub != idCliente) {
        if (req.user.rol != "ADMIN")
            return res.status(500).send({ mensaje: "Solo el ADMIN o la misma se puede modificar" })
    }

    usuario.findOne({ correo: params.correo })
        .exec((err, usuarioEncontrado) => {
            if (err) {return res.status(500).send({ mensaje: "error en la peticion de usuario" });}
            if (usuarioEncontrado && usuarioEncontrado.length >= 1) {
                return res.status(500).send({ mensaje: "El correo ya es usado en otro usuario" });
            } else {
                usuario.findOne({ _id: idCliente }).exec((err, usuarioEncontrado) => {
                    if (err) return res.status(500).send({ mensaje: "Error en la peticion obtener la usuario, talvez no existe la usuario" });
                    if (!usuarioEncontrado) return res.status(500).send({ mensaje: "Error en la peticion, no existe el usuario" });
                    if (usuarioEncontrado.rol === 'ADMIN') return res.status(500).send({ mensaje: 'El usuario no se puede editar porque es un ADMIN' })
                    usuario.findByIdAndUpdate(idCliente, params, { new: true }, (err, usuarioactualizada) => {
                        if (err) return res.status(500).send({ mensaje: "Error en la peticion" })
                        if (!usuarioactualizada) return res.status(500).send({ mensaje: "No se ha podido editar  la usuario" });
                        if (usuarioactualizada) {
                            return res.status(200).send({usuarioactualizada});
                        }
                    }
                    )
                }
                )
            }
        })
}

function eliminarUsuario(req, res) {
    var idUsuario = req.params.idCliente;
    
    usuario.findOne({ _id: idUsuario }).exec((err, usuarioEncontrado) => {
        if (err)
            return res.status(500).send({ mensaje: "Error en la peticion de elimnar la usuario, posiblemte datos incorrectos" });
        if (!usuarioEncontrado)
            return res.status(500).send({ mensaje: "Error en la perticion, el usuario no existe" });
        if (usuarioEncontrado.rol === 'ADMIN') return res.status(500).send({ mensaje: 'El usuario no se puede eliminar porque es un ADMIN' })

        usuario.findByIdAndDelete(idUsuario, (err, usuarioEliminado) => {
            if (err) return res.status(500).send({ mensaje: "Error en la peticion" })
            if (!usuarioEliminado) return res.status(500).send({ mensaje: "No se ha podido eliminar el usuario" });
            if (usuarioEliminado) {
                return res.status(200).send({ mensaje: "El usuario ha sido eliminado" });
            }
        }
        )
    })
}

function perfil(req, res) {
    var idCliente = req.params.id;

    usuario.findOne({ _id: idCliente}, (err, usuarioEncontrado) => {
        if (err) return res.status(500).send({ mensaje: 'Error en la peticion' });
        if (!usuarioEncontrado) return res.status(500).send({ mensaje: 'El usuario no existe' })
        if (usuarioEncontrado) {
            usuarioEncontrado.password = undefined;
            return res.status(200).send({ usuarioEncontrado });
        } else {
            return res.status(500).send({ mensaje: 'Error al buscar el cliente no existe' });
        }
    })
}

function usuariosRegistrados(req, res) {
    usuario.find({ rol: "CLIENTE" }).exec((err, usuarioEncontradoS) => {
        if (err) return res.status(500).send({ mensaje: 'No hay usuario' });
        if (!usuarioEncontradoS) return res.status(500).send({ mensaje: 'No hay usuario ingresados' });
        return res.status(200).send({ usuarioEncontradoS })
    })
}

function usuariosRegistradosA(req, res) {
    usuario.find({ rol: "ADMIN_HOTEL" }).exec((err, usuarioEncontrado) => {
        if (err) return res.status(500).send({ mensaje: 'No hay usuario' });
        if (!usuarioEncontrado) return res.status(500).send({ mensaje: 'No hay usuario ingresados' });
        return res.status(200).send({ usuarioEncontrado })
    })
}

function editarRol(req, res) {
    var idUsuario = req.params.idCliente;
    var params = req.body;

    params.rol = 'ADMIN_HOTEL'

    usuario.findOne({ _id: idUsuario }).exec((err, usuarioEncontrado) => {
        if (err) return res.status(500).send({ mensaje: "Error en la peticion obtener la usuario, talvez no existe la usuario" });
        if (!usuarioEncontrado) return res.status(500).send({ mensaje: "Error en la peticion, no existe el usuario" });
        if (usuarioEncontrado.rol != 'CLIENTE') return res.status(500).send({ mensaje: 'Solo el cliente cambia de rol' })

        usuario.findByIdAndUpdate(idUsuario, params, { new: true }, (err, usuarioactualizada) => {
            if (err) return res.status(500).send({ mensaje: "Error en la peticion" })
            if (!usuarioactualizada) return res.status(500).send({ mensaje: "No se ha podido editar el rol del usuario" });
            if (usuarioactualizada) {
                return res.status(200).send({usuarioactualizada});
            }
        }
        )
    }
    )
}

function historial(req, res) {
    var idCliente = req.params.idCliente;

    historials.find({ cliente: idCliente }, { _id: 0, __v: 0 }).exec((err, usuarioEncontradoS) => {
        if (err) return res.status(500).send({ mensaje: 'No hay usuario' });
        if (!usuarioEncontradoS) return res.status(500).send({ mensaje: 'No hay usuario ingresados' });
        if (usuarioEncontradoS) {
            return res.status(200).send({ usuarioEncontradoS })
        }
    })
}

module.exports = {
    registrarUsuario,
    loginUsuario,
    admin,
    editarUsuario,
    eliminarUsuario,
    perfil,
    usuariosRegistrados,
    editarRol,
    historial,
    usuariosRegistradosA
}